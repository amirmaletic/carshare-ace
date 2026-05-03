// Vergelijkt schade-punten + foto's tussen ophaal en terugmelden via Lovable AI.
// Slaat resultaat op in schade_vergelijkingen.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DamagePoint {
  id: string;
  x: number;
  y: number;
  label: string;
  ernst: "licht" | "middel" | "zwaar";
  grootte?: "klein" | "middel" | "groot";
  fotos?: string[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Niet ingelogd" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } }
    );

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return json({ error: "Niet ingelogd" }, 401);

    const { terugmelding_id } = await req.json();
    if (!terugmelding_id) return json({ error: "terugmelding_id vereist" }, 400);

    // Haal terugmelding op
    const { data: terug, error: tErr } = await supabase
      .from("terugmeldingen")
      .select("*")
      .eq("id", terugmelding_id)
      .single();
    if (tErr || !terug) return json({ error: "Terugmelding niet gevonden" }, 404);

    // Zoek meest recente ophaal-overdracht voor dit voertuig (ondertekend, voor de terugmeld-datum)
    const { data: overdrachten } = await supabase
      .from("overdrachten")
      .select("*")
      .eq("voertuig_id", terug.voertuig_id)
      .eq("type", "ophalen")
      .eq("status", "ondertekend")
      .lte("datum", terug.datum)
      .order("datum", { ascending: false })
      .limit(1);

    const ophaal = overdrachten?.[0] ?? null;
    const ophaalPunten: DamagePoint[] = (ophaal?.schade_punten as DamagePoint[]) ?? [];
    const terugPunten: DamagePoint[] = (terug.schade_punten as DamagePoint[]) ?? [];

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "LOVABLE_API_KEY ontbreekt" }, 500);

    // Bouw multimodale prompt
    const userParts: any[] = [
      { type: "text", text: buildPrompt(ophaalPunten, terugPunten) },
    ];

    // Voeg ophaal-foto's toe (gelabeld)
    for (const p of ophaalPunten) {
      for (const url of p.fotos ?? []) {
        userParts.push({ type: "text", text: `[OPHAAL punt "${p.label}" @ ${Math.round(p.x)},${Math.round(p.y)}]` });
        userParts.push({ type: "image_url", image_url: { url } });
      }
    }
    for (const p of terugPunten) {
      for (const url of p.fotos ?? []) {
        userParts.push({ type: "text", text: `[INLEVER punt "${p.label}" @ ${Math.round(p.x)},${Math.round(p.y)}]` });
        userParts.push({ type: "image_url", image_url: { url } });
      }
    }

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: "Je bent een expert voertuigschade-inspecteur. Je vergelijkt schade voor en na verhuur en bepaalt welke schade NIEUW is. Wees voorzichtig en eerlijk: alleen markeren als nieuw als je het echt ziet of als de positie significant verschilt. Negeer verschillen in licht, vuil of cameraperspectief.", },
          { role: "user", content: userParts },
        ],
        tools: [{
          type: "function",
          function: {
            name: "rapporteer_vergelijking",
            description: "Geef de vergelijkingsuitkomst",
            parameters: {
              type: "object",
              properties: {
                samenvatting: { type: "string", description: "Korte conclusie in 1 zin" },
                nieuwe_schades: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      terugmeld_punt_id: { type: "string", description: "ID van het inlever-punt dat nieuw is, of leeg als alleen op foto" },
                      locatie: { type: "string", description: "Bijv 'voorbumper rechts'" },
                      type: { type: "string", enum: ["kras", "deuk", "barst", "afgebroken", "anders"] },
                      ernst: { type: "string", enum: ["licht", "middel", "zwaar"] },
                      confidence: { type: "number", description: "0 tot 1" },
                      uitleg: { type: "string", description: "Waarom dit als nieuw wordt gezien" },
                    },
                    required: ["locatie", "type", "ernst", "confidence", "uitleg"],
                  },
                },
                reeds_bestaande: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      terugmeld_punt_id: { type: "string" },
                      uitleg: { type: "string" },
                    },
                    required: ["uitleg"],
                  },
                },
              },
              required: ["samenvatting", "nieuwe_schades", "reeds_bestaande"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "rapporteer_vergelijking" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) return json({ error: "AI is even druk, probeer zo opnieuw." }, 429);
      if (aiResp.status === 402) return json({ error: "AI-credits op, voeg credits toe in Workspace." }, 402);
      const t = await aiResp.text();
      console.error("AI error", aiResp.status, t);
      return json({ error: "AI gateway fout" }, 500);
    }

    const aiJson = await aiResp.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    let resultaat: any = { samenvatting: "Geen analyse beschikbaar", nieuwe_schades: [], reeds_bestaande: [] };
    if (toolCall?.function?.arguments) {
      try { resultaat = JSON.parse(toolCall.function.arguments); } catch { /* */ }
    }

    // Sla op
    const { data: vergelijking, error: insErr } = await supabase
      .from("schade_vergelijkingen")
      .insert({
        organisatie_id: terug.organisatie_id,
        user_id: user.id,
        terugmelding_id: terug.id,
        ophaal_overdracht_id: ophaal?.id ?? null,
        voertuig_id: terug.voertuig_id,
        ai_resultaat: resultaat,
        ai_model: "google/gemini-2.5-pro",
        status: "in_review",
      })
      .select()
      .single();

    if (insErr) {
      console.error("Insert error", insErr);
      return json({ error: insErr.message }, 500);
    }

    return json({ vergelijking, ophaal_aanwezig: !!ophaal });
  } catch (e: any) {
    console.error("vergelijk-schade error", e);
    return json({ error: e.message ?? "Onbekende fout" }, 500);
  }
});

function buildPrompt(ophaal: DamagePoint[], terug: DamagePoint[]): string {
  const fmt = (p: DamagePoint, prefix: string) =>
    `- ${prefix} #${p.id.slice(0, 6)} @ (${Math.round(p.x)}%, ${Math.round(p.y)}%) ernst=${p.ernst}, beschrijving: "${p.label}", foto's: ${p.fotos?.length ?? 0}`;
  return [
    "Vergelijk de schade-inspectie van OPHALEN met die van INLEVEREN. Bepaal welke schades NIEUW zijn ontstaan tijdens deze verhuurperiode.",
    "",
    "OPHALEN-punten (begin van verhuur):",
    ophaal.length === 0 ? "(geen schade gemarkeerd bij ophalen)" : ophaal.map(p => fmt(p, "ophaal")).join("\n"),
    "",
    "INLEVEREN-punten (eind van verhuur):",
    terug.length === 0 ? "(geen schade gemarkeerd bij inleveren)" : terug.map(p => fmt(p, "inlever")).join("\n"),
    "",
    "Gebruik de coördinaten en de foto's hieronder om te bepalen of een inlever-punt overeenkomt met een ophaal-punt (= reeds bestaand) of nieuw is. Als een inlever-punt op vergelijkbare positie ligt (binnen ~10% afwijking) als een ophaal-punt en de foto's tonen vergelijkbare schade, beschouw het als reeds bestaand.",
    "Roep daarna de tool rapporteer_vergelijking aan met je conclusie.",
  ].join("\n");
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
