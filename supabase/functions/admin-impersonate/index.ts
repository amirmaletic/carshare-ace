import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Niet geautoriseerd" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is platform admin
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Niet ingelogd" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "platform_admin");

    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: "Geen platform-admin rechten" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const targetUserId: string | undefined = body.target_user_id;
    if (!targetUserId) {
      return new Response(JSON.stringify({ error: "target_user_id vereist" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get target user email
    const { data: targetData, error: targetErr } = await admin.auth.admin.getUserById(targetUserId);
    if (targetErr || !targetData.user?.email) {
      return new Response(JSON.stringify({ error: "Doelgebruiker niet gevonden" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const redirectTo: string = body.redirect_to || `${new URL(req.url).origin}/dashboard`;

    // Generate magic link
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: targetData.user.email,
      options: { redirectTo },
    });

    if (linkErr || !linkData.properties?.action_link) {
      return new Response(JSON.stringify({ error: linkErr?.message || "Magic link aanmaken mislukt" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Audit log
    await admin.from("activiteiten_log").insert({
      user_id: userData.user.id,
      organisatie_id: null,
      actie: "admin_impersonate",
      beschrijving: `Platform admin heeft ingelogd als ${targetData.user.email}`,
      entiteit_type: "user",
      entiteit_id: targetUserId,
      metadata: { target_email: targetData.user.email },
    });

    return new Response(
      JSON.stringify({ action_link: linkData.properties.action_link, email: targetData.user.email }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});