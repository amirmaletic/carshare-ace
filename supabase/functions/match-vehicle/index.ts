import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { aanvraag, beschikbare_voertuigen } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!beschikbare_voertuigen || beschikbare_voertuigen.length === 0) {
      return new Response(JSON.stringify({
        voertuig_id: null,
        motivatie: "Er zijn momenteel geen voertuigen beschikbaar in de vloot die aan de criteria voldoen.",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const voertuigenLijst = beschikbare_voertuigen.map((v: any) =>
      `- ID: ${v.id} | ${v.merk} ${v.model} | Kenteken: ${v.kenteken} | Categorie: ${v.categorie} | Brandstof: ${v.brandstof} | Kleur: ${v.kleur} | Bouwjaar: ${v.bouwjaar} | Dagprijs: €${v.dagprijs} | KM-stand: ${v.kilometerstand}`
    ).join("\n");

    const prompt = `Je bent een vlootbeheer-assistent. Een klant heeft een voertuig aangevraagd. Koppel het beste beschikbare voertuig aan de aanvraag.

KLANTAANVRAAG:
- Naam: ${aanvraag.klant_naam}
- Gewenst type/merk: ${aanvraag.gewenst_type || "Geen voorkeur"}
- Gewenste categorie: ${aanvraag.gewenste_categorie || "Geen voorkeur"}
- Gewenste brandstof: ${aanvraag.gewenste_brandstof || "Geen voorkeur"}
- Max budget per dag: ${aanvraag.budget_max ? `€${aanvraag.budget_max}` : "Geen limiet"}
- Notitie: ${aanvraag.notitie || "Geen"}

BESCHIKBARE VOERTUIGEN:
${voertuigenLijst}

Kies het beste voertuig en leg kort uit waarom. Houd rekening met categorie, brandstof, budget en klantvoorkeur.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Je bent een Nederlandse vlootbeheer-AI. Antwoord altijd in het Nederlands." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "koppel_voertuig",
            description: "Koppel het best passende voertuig aan de klantaanvraag",
            parameters: {
              type: "object",
              properties: {
                voertuig_id: { type: "string", description: "UUID van het gekozen voertuig" },
                motivatie: { type: "string", description: "Korte Nederlandse uitleg waarom dit voertuig het beste past" },
              },
              required: ["voertuig_id", "motivatie"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "koppel_voertuig" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Te veel verzoeken, probeer het later opnieuw." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI-credits zijn op. Vul credits aan in je workspace-instellingen." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];

    if (toolCall?.function?.arguments) {
      const args = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(args), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: pick first vehicle
    return new Response(JSON.stringify({
      voertuig_id: beschikbare_voertuigen[0].id,
      motivatie: result.choices?.[0]?.message?.content || "Automatisch gekoppeld aan het eerste beschikbare voertuig.",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("match-vehicle error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Onbekende fout" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
