import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!GOOGLE_MAPS_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GOOGLE_MAPS_API_KEY is niet geconfigureerd" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { origin, destination } = await req.json();
    if (!origin || !destination) {
      return new Response(
        JSON.stringify({ error: "origin en destination zijn verplicht" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL("https://maps.googleapis.com/maps/api/directions/json");
    url.searchParams.set("origin", origin);
    url.searchParams.set("destination", destination);
    url.searchParams.set("key", GOOGLE_MAPS_API_KEY);
    url.searchParams.set("language", "nl");
    url.searchParams.set("units", "metric");

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== "OK" || !data.routes?.length) {
      return new Response(
        JSON.stringify({ error: `Google Maps fout: ${data.status}`, details: data.error_message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const route = data.routes[0];
    const leg = route.legs[0];

    return new Response(
      JSON.stringify({
        distance_km: Math.round(leg.distance.value / 100) / 10,
        distance_text: leg.distance.text,
        duration_minutes: Math.round(leg.duration.value / 60),
        duration_text: leg.duration.text,
        start_address: leg.start_address,
        end_address: leg.end_address,
        overview_polyline: route.overview_polyline?.points,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Onbekende fout";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
