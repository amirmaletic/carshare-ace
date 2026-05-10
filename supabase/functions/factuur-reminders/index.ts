const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Cron function: stuurt reminders voor openstaande facturen.
 * Reminder-momenten: 7, 14 en 30 dagen na vervaldatum.
 * Gebruikt service role om over alle organisaties te scannen.
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

  // Haal openstaande facturen waarvan vervaldatum voorbij is
  const today = new Date().toISOString().slice(0, 10);
  const url = `${SUPABASE_URL}/rest/v1/invoices?select=id,bedrag,datum,vervaldatum,aantal_reminders,laatste_reminder_op,organisatie_id,contract_id,omschrijving&status=eq.openstaand&vervaldatum=lte.${today}&aantal_reminders=lt.3`;
  const res = await fetch(url, { headers });
  const facturen = await res.json();

  if (!Array.isArray(facturen)) {
    return new Response(JSON.stringify({ error: "fetch failed", facturen }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let verstuurd = 0;
  let overgeslagen = 0;
  const nu = new Date();

  for (const f of facturen) {
    const verval = new Date(f.vervaldatum);
    const dagenOver = Math.floor((nu.getTime() - verval.getTime()) / 86400000);
    const expectedReminders =
      dagenOver >= 30 ? 3 : dagenOver >= 14 ? 2 : dagenOver >= 7 ? 1 : 0;

    if (expectedReminders <= (f.aantal_reminders ?? 0)) {
      overgeslagen++;
      continue;
    }

    // Haal contract + klant
    const cRes = await fetch(
      `${SUPABASE_URL}/rest/v1/contracts?select=klant_email,klant_naam,contract_nummer&id=eq.${f.contract_id}`,
      { headers },
    );
    const [contract] = await cRes.json();
    if (!contract?.klant_email) {
      overgeslagen++;
      continue;
    }

    // Maak in-app notificatie aan
    await fetch(`${SUPABASE_URL}/rest/v1/notificaties`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        organisatie_id: f.organisatie_id,
        titel: `Herinnering ${expectedReminders} verstuurd`,
        bericht: `Factuur van € ${Number(f.bedrag).toFixed(2)} aan ${contract.klant_naam} is ${dagenOver} dagen te laat`,
        type: "waarschuwing",
        categorie: "factuur",
        entiteit_type: "invoice",
        entiteit_id: f.id,
        link_url: "/contracten",
      }),
    });

    // Stuur email via send-transactional-email
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/send-transactional-email`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          template: "factuur_herinnering",
          to: contract.klant_email,
          data: {
            klant_naam: contract.klant_naam,
            contract_nummer: contract.contract_nummer,
            bedrag: Number(f.bedrag).toFixed(2),
            dagen_over: dagenOver,
            herinnering_nummer: expectedReminders,
            omschrijving: f.omschrijving ?? "",
          },
        }),
      });
    } catch (_e) {
      // email-fout mag niet de loop breken
    }

    // Markeer factuur
    await fetch(`${SUPABASE_URL}/rest/v1/invoices?id=eq.${f.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        aantal_reminders: expectedReminders,
        laatste_reminder_op: new Date().toISOString(),
      }),
    });

    verstuurd++;
  }

  return new Response(JSON.stringify({ verstuurd, overgeslagen, totaal: facturen.length }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});