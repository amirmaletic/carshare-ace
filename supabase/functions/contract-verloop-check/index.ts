const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Dagelijkse cron: stuurt herinneringen voor contracten die binnenkort aflopen.
 * Per organisatie wordt het aantal dagen vooraf gehaald uit organisatie_voorkeuren
 * (default 60 dagen). Stuurt 1 herinnering per (contract, milestone).
 * Milestones: configureerbare hoofdwaarschuwing + extra reminders op 30, 14 en 7 dagen.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const headers = {
    apikey: SERVICE_ROLE,
    Authorization: `Bearer ${SERVICE_ROLE}`,
    "Content-Type": "application/json",
  };

  // Haal alle voorkeuren
  const voorkeurenRes = await fetch(
    `${SUPABASE_URL}/rest/v1/organisatie_voorkeuren?select=organisatie_id,contract_dagen_vooraf,contract_verloop`,
    { headers },
  );
  const voorkeuren: Array<{ organisatie_id: string; contract_dagen_vooraf: number; contract_verloop: boolean }> =
    await voorkeurenRes.json();
  const voorkeurenMap = new Map(voorkeuren.map((v) => [v.organisatie_id, v]));

  // Haal actieve contracten waarvan eind_datum tussen nu en max(120) dagen ligt
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const max = new Date(today); max.setUTCDate(max.getUTCDate() + 120);
  const maxStr = max.toISOString().slice(0, 10);

  const cRes = await fetch(
    `${SUPABASE_URL}/rest/v1/contracts?select=id,organisatie_id,contract_nummer,klant_email,klant_naam,voertuig_id,start_datum,eind_datum,verlengbaar,status&status=eq.actief&eind_datum=gte.${todayStr}&eind_datum=lte.${maxStr}`,
    { headers },
  );
  const contracts = await cRes.json();
  if (!Array.isArray(contracts)) {
    return new Response(JSON.stringify({ error: "fetch failed", contracts }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let verstuurd = 0;
  let overgeslagen = 0;

  for (const c of contracts) {
    const v = voorkeurenMap.get(c.organisatie_id);
    // Default: aan, 60 dagen
    if (v && v.contract_verloop === false) { overgeslagen++; continue; }
    const hoofdDagen = v?.contract_dagen_vooraf ?? 60;

    const eind = new Date(c.eind_datum);
    const dagenResterend = Math.ceil((eind.getTime() - today.getTime()) / 86400000);

    // Mijlpalen: hoofd + 30, 14, 7
    const milestones = Array.from(new Set([hoofdDagen, 30, 14, 7])).filter((m) => m > 0);
    const milestone = milestones.find((m) => dagenResterend === m);
    if (!milestone) { overgeslagen++; continue; }

    // Idempotentie: log via activiteiten_log key
    const checkKey = `contract_verloop_${c.id}_${milestone}`;
    const checkUrl = `${SUPABASE_URL}/rest/v1/activiteiten_log?select=id&actie=eq.contract_verloop_herinnering&entiteit_id=eq.${c.id}&metadata->>milestone=eq.${milestone}`;
    const checkRes = await fetch(checkUrl, { headers });
    const bestaand = await checkRes.json();
    if (Array.isArray(bestaand) && bestaand.length > 0) { overgeslagen++; continue; }

    // Voertuig info ophalen
    let voertuigLabel = "";
    if (c.voertuig_id) {
      try {
        const vRes = await fetch(
          `${SUPABASE_URL}/rest/v1/voertuigen?select=merk,model,kenteken&id=eq.${c.voertuig_id}`,
          { headers },
        );
        const [vt] = await vRes.json();
        if (vt) voertuigLabel = `${vt.merk} ${vt.model} (${vt.kenteken})`;
      } catch (_e) { /* */ }
    }

    // In-app notificatie voor org
    await fetch(`${SUPABASE_URL}/rest/v1/notificaties`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        organisatie_id: c.organisatie_id,
        titel: `Contract verloopt over ${milestone} dagen`,
        bericht: `Contract ${c.contract_nummer} (${c.klant_naam}) loopt af op ${c.eind_datum}`,
        type: "waarschuwing",
        categorie: "contract",
        entiteit_type: "contract",
        entiteit_id: c.id,
        link_url: "/contracten",
      }),
    });

    // Email naar klant
    if (c.klant_email) {
      try {
        await fetch(`${SUPABASE_URL}/functions/v1/send-transactional-email`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            templateName: "contract-verloopt",
            recipientEmail: c.klant_email,
            idempotencyKey: checkKey,
            templateData: {
              klant_naam: c.klant_naam,
              contract_nummer: c.contract_nummer,
              voertuig: voertuigLabel,
              eind_datum: c.eind_datum,
              dagen_resterend: milestone,
              verlengbaar: !!c.verlengbaar,
            },
          }),
        });
      } catch (_e) { /* niet fataal */ }
    }

    // Audit log (ook idempotentie-marker)
    await fetch(`${SUPABASE_URL}/rest/v1/activiteiten_log`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        user_id: "00000000-0000-0000-0000-000000000000",
        organisatie_id: c.organisatie_id,
        actie: "contract_verloop_herinnering",
        beschrijving: `Herinnering verstuurd voor contract ${c.contract_nummer} (${milestone} dagen voor einde)`,
        entiteit_type: "contract",
        entiteit_id: c.id,
        metadata: { milestone, eind_datum: c.eind_datum },
      }),
    });

    verstuurd++;
  }

  return new Response(
    JSON.stringify({ verstuurd, overgeslagen, totaal: contracts.length }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});