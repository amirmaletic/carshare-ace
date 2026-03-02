import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return new Response(JSON.stringify({ error: "Zoekterm te kort" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("KVK_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "KVK API key niet geconfigureerd" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const params = new URLSearchParams({
      naam: query.trim(),
      pagina: "1",
      resultatenPerPagina: "5",
    });

    const res = await fetch(`https://api.kvk.nl/api/v1/zoeken?${params}`, {
      headers: { apikey: apiKey },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("KVK API error:", res.status, text);
      return new Response(JSON.stringify({ error: "KVK API fout", details: text }), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const resultaten = (data.resultaten || []).map((r: any) => ({
      kvkNummer: r.kvkNummer,
      naam: r.handelsnaam || r.naam,
      adres: r.adres
        ? `${r.adres.binnenlandsAdres?.straatnaam || ""} ${r.adres.binnenlandsAdres?.huisnummer || ""}, ${r.adres.binnenlandsAdres?.postcode || ""} ${r.adres.binnenlandsAdres?.plaats || ""}`
        : null,
      type: r.type || null,
    }));

    return new Response(JSON.stringify({ resultaten }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("KVK search error:", err);
    return new Response(JSON.stringify({ error: "Interne fout" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
