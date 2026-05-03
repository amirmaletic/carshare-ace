// Analyseert een tankbon foto via Lovable AI (Gemini 2.5 Flash) en haalt
// liters, brandstof en bedrag eruit. Verwacht { image_url } in body.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `Je analyseert een tankbon of brandstofbon. Geef ALLEEN geldige JSON terug, geen uitleg.
Velden:
- liters (number of null): aantal getankte liters. Op bonnen kan dit ook "Volume", "Vol", "L", "Ltr", "Liter" of "Aantal" heten - tel die altijd mee als liters.
- brandstof (string of null): genormaliseerd, één van: "Benzine", "Diesel", "LPG", "Elektrisch", "AdBlue", "Onbekend". Herken ook synoniemen zoals "Euro 95", "E10", "E5", "Super", "Premium" als Benzine en "Gasoil" als Diesel.
- bedrag (number of null): totaalbedrag in EUR (incl. BTW)
- btw (number of null): BTW-bedrag in EUR (zoek naar "BTW", "VAT", "21%", "BTW 21")
- btw_percentage (number of null): meestal 21
- prijs_per_liter (number of null)
- station (string of null): naam tankstation indien zichtbaar
- datum (string of null): YYYY-MM-DD indien leesbaar
- confidence (number 0-1): hoe zeker je bent

Gebruik . als decimaal scheidingsteken. Geef bedragen als numerieke waarden zonder valutateken of duizendtal-scheidingen. Als iets niet leesbaar is, gebruik null.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { image_url, image_base64 } = await req.json();
    if (!image_url && !image_base64) {
      return json({ error: "image_url of image_base64 vereist" }, 400);
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "LOVABLE_API_KEY ontbreekt" }, 500);

    const imageContent = image_base64
      ? { type: "image_url", image_url: { url: `data:image/jpeg;base64,${image_base64}` } }
      : { type: "image_url", image_url: { url: image_url } };

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyseer deze bon en geef de JSON terug." },
              imageContent,
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      if (aiRes.status === 429) return json({ error: "AI rate limit, probeer opnieuw" }, 429);
      if (aiRes.status === 402) return json({ error: "AI credits op" }, 402);
      return json({ error: `AI fout: ${txt}` }, 500);
    }

    const data = await aiRes.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    let parsed: any = {};
    try { parsed = JSON.parse(content); } catch { parsed = { raw: content }; }

    return json({ ok: true, result: parsed });
  } catch (err: any) {
    return json({ error: err.message || "Onbekende fout" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}