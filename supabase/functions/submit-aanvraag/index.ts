import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

/**
 * Publieke endpoint waarmee een bezoeker van het klantportaal (zonder account)
 * een aanvraag kan indienen voor een type voertuig. De aanvraag wordt toegewezen
 * aan de organisatie van de portaal-eigenaar en verschijnt in "Aanvragen planning"
 * waar de beheerder hem in 1 klik kan koppelen aan een beschikbare auto.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const {
      organisatie_id,
      klant_naam,
      klant_email,
      klant_telefoon,
      gewenst_type,
      gewenste_categorie,
      gewenste_brandstof,
      gewenste_periode_start,
      gewenste_periode_eind,
      budget_max,
      notitie,
    } = body ?? {};

    if (!organisatie_id || !klant_naam) {
      return new Response(
        JSON.stringify({ error: "organisatie_id en klant_naam zijn verplicht" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    // Verifieer dat de organisatie bestaat en het portaal actief is
    const { data: org, error: orgErr } = await admin
      .from("organisaties")
      .select("id, portaal_actief")
      .eq("id", organisatie_id)
      .maybeSingle();
    if (orgErr) throw orgErr;
    if (!org || !org.portaal_actief) {
      return new Response(
        JSON.stringify({ error: "Portaal niet beschikbaar" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data, error } = await admin
      .from("aanvragen")
      .insert({
        organisatie_id,
        klant_naam,
        klant_email: klant_email || null,
        klant_telefoon: klant_telefoon || null,
        gewenst_type: gewenst_type || null,
        gewenste_categorie: gewenste_categorie || null,
        gewenste_brandstof: gewenste_brandstof || null,
        gewenste_periode_start: gewenste_periode_start || null,
        gewenste_periode_eind: gewenste_periode_eind || null,
        budget_max: budget_max ?? null,
        notitie: notitie || null,
        status: "nieuw",
      })
      .select("id")
      .single();
    if (error) throw error;

    return new Response(JSON.stringify({ id: data.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("submit-aanvraag error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});