const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Verstuur een set concept-facturen in 1 batch:
 *  - zet status van 'concept' naar 'openstaand'
 *  - stuurt klant een transactionele e-mail (factuur-aangemaakt)
 *
 * Body: { factuur_ids?: string[] }  (leeg = ALLE concepten van de organisatie)
 * Vereist een ingelogde gebruiker (Authorization header).
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "auth vereist" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Identificeer gebruiker en haal organisatie_id op
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: ANON, Authorization: auth },
  });
  if (!userRes.ok) {
    return new Response(JSON.stringify({ error: "ongeldige sessie" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const user = await userRes.json();
  const userId = user?.id as string | undefined;
  if (!userId) {
    return new Response(JSON.stringify({ error: "geen user" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const svcHeaders = {
    apikey: SERVICE_ROLE,
    Authorization: `Bearer ${SERVICE_ROLE}`,
    "Content-Type": "application/json",
  };

  const orgRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_user_organisatie_id`, {
    method: "POST",
    headers: svcHeaders,
    body: JSON.stringify({ _user_id: userId }),
  });
  const organisatieId = (await orgRes.json()) as string | null;
  if (!organisatieId) {
    return new Response(JSON.stringify({ error: "geen organisatie" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let factuurIds: string[] = [];
  try {
    const body = await req.json();
    if (Array.isArray(body?.factuur_ids)) factuurIds = body.factuur_ids;
  } catch (_e) { /* geen body */ }

  // Haal de concept-facturen op (gefilterd op organisatie + optioneel op ids)
  let listUrl = `${SUPABASE_URL}/rest/v1/invoices?select=id,contract_id,bedrag,vervaldatum,omschrijving,organisatie_id&status=eq.concept&organisatie_id=eq.${organisatieId}`;
  if (factuurIds.length > 0) {
    const inList = factuurIds.map((id) => `"${id}"`).join(",");
    listUrl += `&id=in.(${inList})`;
  }
  const listRes = await fetch(listUrl, { headers: svcHeaders });
  const concepten = await listRes.json();
  if (!Array.isArray(concepten)) {
    return new Response(JSON.stringify({ error: "kon facturen niet ophalen", concepten }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let verstuurd = 0;
  const errors: any[] = [];

  for (const f of concepten) {
    // Update status naar openstaand
    const upd = await fetch(`${SUPABASE_URL}/rest/v1/invoices?id=eq.${f.id}`, {
      method: "PATCH",
      headers: { ...svcHeaders, Prefer: "return=minimal" },
      body: JSON.stringify({ status: "openstaand" }),
    });
    if (!upd.ok) {
      errors.push({ factuur: f.id, error: await upd.text() });
      continue;
    }

    // Haal contract-info op voor klantgegevens
    let klantEmail: string | null = null;
    let klantNaam: string | null = null;
    let contractNummer: string | null = null;
    if (f.contract_id) {
      const cRes = await fetch(
        `${SUPABASE_URL}/rest/v1/contracts?select=klant_email,klant_naam,contract_nummer&id=eq.${f.contract_id}`,
        { headers: svcHeaders },
      );
      const arr = await cRes.json();
      if (Array.isArray(arr) && arr[0]) {
        klantEmail = arr[0].klant_email ?? null;
        klantNaam = arr[0].klant_naam ?? null;
        contractNummer = arr[0].contract_nummer ?? null;
      }
    }

    if (klantEmail) {
      try {
        await fetch(`${SUPABASE_URL}/functions/v1/send-transactional-email`, {
          method: "POST",
          headers: svcHeaders,
          body: JSON.stringify({
            templateName: "factuur-aangemaakt",
            recipientEmail: klantEmail,
            idempotencyKey: `factuur-batch-${f.id}`,
            templateData: {
              klant_naam: klantNaam,
              contract_nummer: contractNummer,
              bedrag: Number(f.bedrag).toFixed(2).replace(".", ","),
              vervaldatum: f.vervaldatum,
              omschrijving: f.omschrijving,
            },
          }),
        });
      } catch (_e) { /* niet fataal */ }
    }

    verstuurd++;
  }

  return new Response(
    JSON.stringify({ verstuurd, totaal: concepten.length, errors }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});