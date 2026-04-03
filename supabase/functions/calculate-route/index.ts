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

    // Use the new Routes API instead of legacy Directions API
    const response = await fetch(
      "https://routes.googleapis.com/directions/v2:computeRoutes",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
          "X-Goog-FieldMask": "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline,routes.legs.startLocation,routes.legs.endLocation",
        },
        body: JSON.stringify({
          origin: { address: origin },
          destination: { address: destination },
          travelMode: "DRIVE",
          languageCode: "nl",
          units: "METRIC",
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.routes?.length) {
      const errMsg = data.error?.message || "Geen route gevonden";
      return new Response(
        JSON.stringify({ error: `Google Maps fout: ${errMsg}`, details: data.error?.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const route = data.routes[0];
    const distanceMeters = route.distanceMeters ?? 0;
    // duration comes as "123s" string
    const durationSeconds = parseInt(route.duration?.replace("s", "") ?? "0", 10);
    const distanceKm = Math.round(distanceMeters / 100) / 10;
    const durationMinutes = Math.round(durationSeconds / 60);

    return new Response(
      JSON.stringify({
        distance_km: distanceKm,
        distance_text: `${distanceKm} km`,
        duration_minutes: durationMinutes,
        duration_text: `${durationMinutes} min`,
        overview_polyline: route.polyline?.encodedPolyline ?? null,
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
