const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Test een Mollie API key door de profielinformatie op te halen.
 * Body: { apiKey: string }
 * Response: { ok: boolean, profile?: { id, name, mode }, error?: string }
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { apiKey } = await req.json();
    if (!apiKey || typeof apiKey !== "string" || !/^(test|live)_/.test(apiKey)) {
      return new Response(
        JSON.stringify({ ok: false, error: "Ongeldige API key. Moet beginnen met test_ of live_." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const res = await fetch("https://api.mollie.com/v2/profiles/me", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const data = await res.json();

    if (!res.ok) {
      return new Response(
        JSON.stringify({ ok: false, error: data?.detail ?? "Onbekende fout van Mollie" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        profile: { id: data.id, name: data.name, mode: data.mode, website: data.website },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});