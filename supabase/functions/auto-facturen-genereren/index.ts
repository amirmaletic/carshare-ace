const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Maandelijkse cron: genereert per actief contract een factuur voor de huidige maand
 * (op basis van `maandprijs`), tenzij er voor die periode al een huurfactuur bestaat.
 * Stuurt klant een transactionele e-mail en maakt in-app notificatie aan.
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

  const nu = new Date();
  const jaar = nu.getUTCFullYear();
  const maand = nu.getUTCMonth() + 1; // 1-12
  const periodeLabel = `${jaar}-${String(maand).padStart(2, "0")}`;
  const periodeMarker = `[auto:${periodeLabel}]`;
  const factuurDatum = `${jaar}-${String(maand).padStart(2, "0")}-01`;
  // Vervaldatum 14 dagen
  const vervalDate = new Date(Date.UTC(jaar, maand - 1, 15));
  const vervaldatum = vervalDate.toISOString().slice(0, 10);

  const today = nu.toISOString().slice(0, 10);
  const url = `${SUPABASE_URL}/rest/v1/contracts?select=id,user_id,organisatie_id,contract_nummer,klant_email,klant_naam,maandprijs,start_datum,eind_datum,verlengbaar&status=eq.actief&start_datum=lte.${today}&eind_datum=gte.${today}`;
  const res = await fetch(url, { headers });
  const contracts = await res.json();
  if (!Array.isArray(contracts)) {
    return new Response(JSON.stringify({ error: "fetch failed", contracts }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let aangemaakt = 0;
  let overgeslagen = 0;
  const errors: any[] = [];

  for (const c of contracts) {
    if (!c.maandprijs || Number(c.maandprijs) <= 0) { overgeslagen++; continue; }

    // Check of er voor dit contract al een factuur is met de periode-marker
    const checkUrl = `${SUPABASE_URL}/rest/v1/invoices?select=id&contract_id=eq.${c.id}&type=eq.huur&omschrijving=ilike.*${encodeURIComponent(periodeMarker)}*`;
    const checkRes = await fetch(checkUrl, { headers });
    const bestaande = await checkRes.json();
    if (Array.isArray(bestaande) && bestaande.length > 0) { overgeslagen++; continue; }

    // Maak factuur
    const omschrijving = `Maandtermijn ${periodeLabel} | contract ${c.contract_nummer} ${periodeMarker}`;
    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/invoices`, {
      method: "POST",
      headers: { ...headers, Prefer: "return=representation" },
      body: JSON.stringify({
        contract_id: c.id,
        user_id: c.user_id,
        organisatie_id: c.organisatie_id,
        datum: factuurDatum,
        vervaldatum,
        bedrag: Number(c.maandprijs),
        status: "openstaand",
        omschrijving,
        type: "huur",
      }),
    });
    if (!insertRes.ok) {
      errors.push({ contract: c.id, error: await insertRes.text() });
      continue;
    }

    aangemaakt++;

    // Email naar klant
    if (c.klant_email) {
      try {
        await fetch(`${SUPABASE_URL}/functions/v1/send-transactional-email`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            templateName: "factuur-aangemaakt",
            recipientEmail: c.klant_email,
            idempotencyKey: `auto-factuur-${c.id}-${periodeLabel}`,
            templateData: {
              klant_naam: c.klant_naam,
              contract_nummer: c.contract_nummer,
              bedrag: Number(c.maandprijs).toFixed(2).replace(".", ","),
              periode: periodeLabel,
              vervaldatum,
              omschrijving: `Maandtermijn ${periodeLabel}`,
            },
          }),
        });
      } catch (_e) { /* niet fataal */ }
    }
  }

  return new Response(
    JSON.stringify({ aangemaakt, overgeslagen, totaal: contracts.length, periode: periodeLabel, errors }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});