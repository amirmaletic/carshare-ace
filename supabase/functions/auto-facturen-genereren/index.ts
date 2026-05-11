const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Maandelijkse cron + handmatige trigger: genereert per actief contract een
 * CONCEPT-factuur voor de huidige maand (op basis van `maandprijs`), tenzij er
 * voor die periode al een huurfactuur bestaat. Verstuurt nog GEEN e-mail.
 * De gebruiker controleert de concepten en verstuurt ze daarna in batch via
 * de edge function `facturen-verstuur-batch`.
 *
 * Optionele body: { organisatie_id?: string } om alleen voor 1 org te draaien
 * (gebruikt bij handmatig "Genereer nu" vanuit de UI).
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

  let alleenOrg: string | null = null;
  if (req.method === "POST") {
    try {
      const body = await req.json();
      if (body && typeof body.organisatie_id === "string") alleenOrg = body.organisatie_id;
    } catch (_e) { /* geen body */ }
  }

  // Haal voorkeuren per organisatie op (auto_facturatie aan/uit)
  const vRes = await fetch(
    `${SUPABASE_URL}/rest/v1/organisatie_voorkeuren?select=organisatie_id,auto_facturatie`,
    { headers },
  );
  const voorkeuren = await vRes.json();
  const autoUit = new Set<string>(
    Array.isArray(voorkeuren)
      ? voorkeuren.filter((v: any) => v.auto_facturatie === false).map((v: any) => v.organisatie_id)
      : [],
  );

  const today = nu.toISOString().slice(0, 10);
  let url = `${SUPABASE_URL}/rest/v1/contracts?select=id,user_id,organisatie_id,contract_nummer,klant_email,klant_naam,maandprijs,start_datum,eind_datum,verlengbaar&status=eq.actief&start_datum=lte.${today}&eind_datum=gte.${today}`;
  if (alleenOrg) url += `&organisatie_id=eq.${alleenOrg}`;
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
    // Sla over als organisatie auto_facturatie heeft uitgezet (handmatige trigger met expliciete org wint)
    if (!alleenOrg && autoUit.has(c.organisatie_id)) { overgeslagen++; continue; }
    if (!c.maandprijs || Number(c.maandprijs) <= 0) { overgeslagen++; continue; }

    // Check of er voor dit contract al een factuur is met de periode-marker
    const checkUrl = `${SUPABASE_URL}/rest/v1/invoices?select=id&contract_id=eq.${c.id}&type=eq.huur&omschrijving=ilike.*${encodeURIComponent(periodeMarker)}*`;
    const checkRes = await fetch(checkUrl, { headers });
    const bestaande = await checkRes.json();
    if (Array.isArray(bestaande) && bestaande.length > 0) { overgeslagen++; continue; }

    // Maak conceptfactuur
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
        status: "concept",
        omschrijving,
        type: "huur",
      }),
    });
    if (!insertRes.ok) {
      errors.push({ contract: c.id, error: await insertRes.text() });
      continue;
    }

    aangemaakt++;
  }

  return new Response(
    JSON.stringify({ aangemaakt, overgeslagen, totaal: contracts.length, periode: periodeLabel, errors }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});