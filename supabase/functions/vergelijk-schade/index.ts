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

    // Verzamel volledige schade-historie van het voertuig (alles vóór deze terugmelding)
    const [prevTerugRes, allOverRes, schadeRapRes] = await Promise.all([
      supabase
        .from("terugmeldingen")
        .select("id, datum, schade_punten")
        .eq("voertuig_id", terug.voertuig_id)
        .neq("id", terug.id)
        .lte("datum", terug.datum)
        .order("datum", { ascending: false })
        .limit(10),
      supabase
        .from("overdrachten")
        .select("id, type, datum, schade_punten")
        .eq("voertuig_id", terug.voertuig_id)
        .lte("datum", terug.datum)
        .order("datum", { ascending: false })
        .limit(10),
      supabase
        .from("schade_rapporten")
        .select("id, datum, omschrijving, schade_punten, ernst")
        .eq("voertuig_id", terug.voertuig_id)
        .lte("datum", terug.datum)
        .order("datum", { ascending: false })
        .limit(20),
    ]);

    type Hist = { bron: string; datum: string; punten: DamagePoint[] };
    const historie: Hist[] = [];
    (allOverRes.data ?? []).forEach((o: any) => {
      const pts = Array.isArray(o.schade_punten) ? o.schade_punten : [];
      if (pts.length) historie.push({ bron: `overdracht-${o.type}`, datum: o.datum, punten: pts });
    });
    (prevTerugRes.data ?? []).forEach((t: any) => {
      const pts = Array.isArray(t.schade_punten) ? t.schade_punten : [];
      if (pts.length) historie.push({ bron: "vorige-terugmelding", datum: t.datum, punten: pts });
    });
    (schadeRapRes.data ?? []).forEach((s: any) => {
      const pts = Array.isArray(s.schade_punten) ? s.schade_punten : [];
      if (pts.length) historie.push({ bron: `rapport: ${s.omschrijving ?? ""}`, datum: s.datum, punten: pts });
    });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "LOVABLE_API_KEY ontbreekt" }, 500);

    // Bouw multimodale prompt
    const userParts: any[] = [
      { type: "text", text: buildPrompt(ophaalPunten, terugPunten, historie) },
    ];

    // Voeg ophaal-foto's toe (gelabeld) — referentie voor begin verhuur
    for (const p of ophaalPunten) {
      for (const url of p.fotos ?? []) {
        userParts.push({ type: "text", text: `[OPHAAL punt "${p.label}" @ ${Math.round(p.x)},${Math.round(p.y)}]` });
        userParts.push({ type: "image_url", image_url: { url } });
      }
    }
    // Voeg historische schade-foto's toe (eerder bekend)
    for (const h of historie) {
      for (const p of h.punten) {
        for (const url of (p.fotos ?? []).slice(0, 2)) {
          userParts.push({ type: "text", text: `[HISTORIE ${h.bron} ${h.datum} punt "${p.label}" @ ${Math.round(p.x)},${Math.round(p.y)}]` });
          userParts.push({ type: "image_url", image_url: { url } });
        }
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
          { role: "system", content: "Je bent een senior voertuigschade-expert. Je vergelijkt de huidige inlever-inspectie met (1) de meest recente ophaal-inspectie en (2) de volledige schade-historie van het voertuig. Bepaal per inlever-punt of het NIEUW is of REEDS BESTAAND (zat al op een eerdere overdracht, terugmelding of schaderapport). Wees streng maar eerlijk: alleen NIEUW als positie/ernst duidelijk afwijkt of als er geen historisch equivalent is. Negeer licht-, vuil-, en perspectief-verschillen. Geef voor elk punt een korte uitleg met verwijzing naar de bron (bv. 'al gezien op overdracht 12-03').", },
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
                      uitleg: { type: "string", description: "Verwijs naar bron en datum" },
                      bron: { type: "string", description: "Bijv 'overdracht-ophalen 2024-03-12' of 'schaderapport'" },
                    },
                    required: ["uitleg"],
                  },
                },
                geschatte_herstelkosten: { type: "number", description: "Indicatie totale herstelkosten in euro voor alle nieuwe schade" },
                aanbeveling: { type: "string", description: "Korte actie-aanbeveling: borg inhouden, schaderapport opstellen, etc." },
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

function buildPrompt(ophaal: DamagePoint[], terug: DamagePoint[], historie: { bron: string; datum: string; punten: DamagePoint[] }[] = []): string {
  const fmt = (p: DamagePoint, prefix: string) =>
    `- ${prefix} #${p.id.slice(0, 6)} @ (${Math.round(p.x)}%, ${Math.round(p.y)}%) ernst=${p.ernst}, beschrijving: "${p.label}", foto's: ${p.fotos?.length ?? 0}`;
  return [
    "Vergelijk de INLEVER-inspectie met de OPHAAL-inspectie EN de volledige schade-historie van het voertuig. Bepaal per inlever-punt of het NIEUW is in deze verhuurperiode of REEDS BESTAAND (al ergens eerder vastgelegd).",
    "",
    "OPHALEN-punten (begin van verhuur):",
    ophaal.length === 0 ? "(geen schade gemarkeerd bij ophalen)" : ophaal.map(p => fmt(p, "ophaal")).join("\n"),
    "",
    "HISTORISCHE schade-punten (eerdere overdrachten, terugmeldingen, rapporten):",
    historie.length === 0
      ? "(geen historie beschikbaar)"
      : historie
          .map((h) => `[${h.bron} @ ${h.datum}]\n` + h.punten.map((p) => fmt(p, "hist")).join("\n"))
          .join("\n\n"),
    "",
    "INLEVEREN-punten (eind van verhuur):",
    terug.length === 0 ? "(geen schade gemarkeerd bij inleveren)" : terug.map(p => fmt(p, "inlever")).join("\n"),
    "",
    "Match-regels:",
    "1. Een inlever-punt = REEDS BESTAAND als positie binnen ~10% ligt van een ophaal- óf historisch punt en de schade visueel/qua type overeenkomt.",
    "2. NIEUW als geen enkel historisch of ophaal-punt overeenkomt, of als ernst aantoonbaar zwaarder is geworden (bv. licht→zwaar = nieuw onderdeel meenemen).",
    "3. Geef bij REEDS BESTAAND altijd de bron + datum aan in 'bron' en 'uitleg'.",
    "4. Schat realistische herstelkosten in EUR per nieuwe schade-categorie (kras licht ~150, deuk middel ~450, paneel zwaar ~900+).",
    "Roep daarna de tool rapporteer_vergelijking aan met je conclusie.",
  ].join("\n");
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
