const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Push een factuur naar Moneybird als sales-invoice (concept).
 * Body: { invoice_id: string }
 * Verwacht een ingelogde gebruiker (gebruiker zit dan in een org met boekhoud_koppelingen rij).
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
  const headers = {
    apikey: SERVICE_ROLE,
    Authorization: `Bearer ${SERVICE_ROLE}`,
    "Content-Type": "application/json",
  };

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) {
      return new Response(JSON.stringify({ error: "Niet ingelogd" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Bepaal de user en zijn org via auth.getUser
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: ANON, Authorization: auth },
    });
    const user = await userRes.json();
    if (!user?.id) {
      return new Response(JSON.stringify({ error: "Ongeldige sessie" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { invoice_id } = await req.json();
    if (!invoice_id) {
      return new Response(JSON.stringify({ error: "invoice_id ontbreekt" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Haal factuur + contract + klant
    const fRes = await fetch(
      `${SUPABASE_URL}/rest/v1/invoices?select=*,contracts(klant_naam,klant_email,bedrijf,kvk_nummer,bedrijf_adres,contract_nummer)&id=eq.${invoice_id}`,
      { headers },
    );
    const [factuur] = await fRes.json();
    if (!factuur) {
      return new Response(JSON.stringify({ error: "Factuur niet gevonden" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Haal koppeling
    const kRes = await fetch(
      `${SUPABASE_URL}/rest/v1/boekhoud_koppelingen?select=*&organisatie_id=eq.${factuur.organisatie_id}&provider=eq.moneybird`,
      { headers },
    );
    const [koppeling] = await kRes.json();
    if (!koppeling?.access_token || !koppeling?.administration_id) {
      return new Response(JSON.stringify({ error: "Moneybird niet geconfigureerd" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const c = factuur.contracts;
    const klantNaam = c?.bedrijf || c?.klant_naam || "Klant";
    // Maak contact in Moneybird (of zoek bestaand op naam)
    const contactBody = {
      contact: {
        company_name: c?.bedrijf || null,
        firstname: c?.bedrijf ? null : (c?.klant_naam ?? "").split(" ")[0],
        lastname: c?.bedrijf ? null : (c?.klant_naam ?? "").split(" ").slice(1).join(" "),
        send_invoices_to_email: c?.klant_email ?? "",
        chamber_of_commerce: c?.kvk_nummer ?? null,
        address1: c?.bedrijf_adres ?? null,
      },
    };
    const contactRes = await fetch(
      `https://moneybird.com/api/v2/${koppeling.administration_id}/contacts.json`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${koppeling.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify(contactBody),
      },
    );
    const contact = await contactRes.json();
    if (!contactRes.ok) {
      return new Response(JSON.stringify({ error: "Moneybird contact aanmaken faalde", details: contact }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sales invoice aanmaken
    const invBody = {
      sales_invoice: {
        contact_id: contact.id,
        reference: c?.contract_nummer ?? `Factuur ${invoice_id.slice(0, 8)}`,
        invoice_date: factuur.datum,
        details_attributes: [
          {
            description: factuur.omschrijving || `Factuur ${factuur.type ?? ""}`,
            price: Number(factuur.bedrag).toFixed(2),
            amount: "1",
          },
        ],
      },
    };
    const invRes = await fetch(
      `https://moneybird.com/api/v2/${koppeling.administration_id}/sales_invoices.json`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${koppeling.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify(invBody),
      },
    );
    const inv = await invRes.json();
    if (!invRes.ok) {
      return new Response(JSON.stringify({ error: "Moneybird factuur aanmaken faalde", details: inv }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark invoice as synced
    await fetch(`${SUPABASE_URL}/rest/v1/invoices?id=eq.${invoice_id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        extern_id: inv.id,
        extern_provider: "moneybird",
        extern_synced_op: new Date().toISOString(),
      }),
    });

    return new Response(JSON.stringify({ ok: true, moneybird_id: inv.id, url: inv.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});