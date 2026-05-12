import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

/**
 * Genereert via Lovable AI (Gemini Nano Banana) een professionele studio-foto
 * van een voertuig wanneer Imagin geen catalogus-match heeft. Slaat het
 * resultaat op in de publieke bucket `voertuig-afbeeldingen` en werkt
 * `voertuigen.image_url` permanent bij.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { voertuig_id, force } = await req.json();
    if (!voertuig_id) {
      return new Response(JSON.stringify({ error: "voertuig_id verplicht" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) throw new Error("LOVABLE_API_KEY is not configured");

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: voertuig, error: voertuigErr } = await admin
      .from("voertuigen")
      .select("id, merk, model, kleur, bouwjaar, image_url, organisatie_id")
      .eq("id", voertuig_id)
      .maybeSingle();
    if (voertuigErr) throw voertuigErr;
    if (!voertuigErr && !voertuig) {
      return new Response(JSON.stringify({ error: "Voertuig niet gevonden" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Skip als al een AI-afbeelding aanwezig (tenzij force=true)
    if (
      !force &&
      voertuig.image_url &&
      voertuig.image_url.includes("/voertuig-afbeeldingen/")
    ) {
      return new Response(JSON.stringify({ image_url: voertuig.image_url, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const kleur = voertuig.kleur ? `${voertuig.kleur} ` : "";
    const jaar = voertuig.bouwjaar ? `${voertuig.bouwjaar} ` : "";
    const prompt = `Professional studio photograph of a ${kleur}${jaar}${voertuig.merk} ${voertuig.model}, exterior side view at 3/4 angle, clean white seamless background, soft even lighting, full vehicle in frame, high resolution, photorealistic, no text, no watermark, no logos other than the original brand, no people.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "AI rate limit, probeer later opnieuw." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits op. Voeg tegoed toe in Lovable Cloud." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      throw new Error(`AI gateway error ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const dataUrl: string | undefined = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!dataUrl) throw new Error("AI heeft geen afbeelding teruggegeven");

    // data:image/png;base64,XXXX → bytes
    const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match) throw new Error("Onverwacht AI image formaat");
    const contentType = match[1];
    const base64 = match[2];
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const ext = contentType.split("/")[1] || "png";

    const path = `${voertuig.organisatie_id}/${voertuig.id}-${Date.now()}.${ext}`;
    const { error: uploadErr } = await admin.storage
      .from("voertuig-afbeeldingen")
      .upload(path, bytes, { contentType, upsert: true });
    if (uploadErr) throw uploadErr;

    const { data: publicData } = admin.storage.from("voertuig-afbeeldingen").getPublicUrl(path);
    const imageUrl = publicData.publicUrl;

    const { error: updateErr } = await admin
      .from("voertuigen")
      .update({ image_url: imageUrl })
      .eq("id", voertuig.id);
    if (updateErr) throw updateErr;

    return new Response(JSON.stringify({ image_url: imageUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("genereer-voertuig-afbeelding error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});