import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

/**
 * Maps file headers to FleeFlo target fields using Lovable AI.
 * Body: { datatype: string, headers: string[], sample_rows: any[][], target_fields: { key: string, label: string, required?: boolean }[] }
 * Returns: { mapping: { [headerName]: targetKey | null }, confidence: number, notes?: string }
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { datatype, headers, sample_rows, target_fields } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!Array.isArray(headers) || headers.length === 0) {
      return new Response(JSON.stringify({ mapping: {}, confidence: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fieldList = (target_fields as { key: string; label: string; required?: boolean }[])
      .map((f) => `- ${f.key}${f.required ? " (verplicht)" : ""}: ${f.label}`)
      .join("\n");

    const sampleText = (sample_rows as unknown[][] | undefined)
      ?.slice(0, 5)
      .map((row, i) => `Rij ${i + 1}: ${headers.map((h: string, idx: number) => `${h}=${row?.[idx] ?? ""}`).join(" | ")}`)
      .join("\n") ?? "";

    const prompt = `Je krijgt headers en sample rijen uit een geïmporteerd bestand voor een vlootbeheer-systeem (FleeFlo). Datatype: ${datatype}.

Headers in het bestand (exact zoals ze zijn):
${headers.map((h: string) => `- "${h}"`).join("\n")}

Voorbeeldrijen:
${sampleText}

Doelvelden in FleeFlo:
${fieldList}

Koppel iedere header aan het beste doelveld. Laat headers die niet matchen WEG uit de mapping (niet opnemen).
Headers kunnen Nederlands, Engels, Duits zijn (kenteken/plate/registration/Nr, merk/brand/make, etc.). Wees slim.
Geef ook een algemene confidence score 0..1.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Je bent een data-mapping assistent voor het Nederlandse vlootbeheersysteem FleeFlo." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "map_columns",
            description: "Map elke header naar een FleeFlo doelveld of null",
            parameters: {
              type: "object",
              properties: {
                mapping: {
                  type: "object",
                  description: "Object waarin sleutel = exacte header uit bestand, waarde = doelveld key (string). Laat headers zonder match weg.",
                  additionalProperties: { type: "string" },
                },
                confidence: { type: "number", description: "0 tot 1" },
                notes: { type: "string", description: "Optionele Nederlandse opmerking voor de gebruiker" },
              },
              required: ["mapping", "confidence"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "map_columns" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Te veel verzoeken, probeer het later opnieuw." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI-credits zijn op. Vul aan in workspace-instellingen." }), {
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

    return new Response(JSON.stringify({ mapping: {}, confidence: 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("migration-automap error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Onbekende fout" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});