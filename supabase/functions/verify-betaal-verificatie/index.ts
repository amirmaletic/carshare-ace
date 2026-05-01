import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Polling endpoint: klant landt na betaling op /betaal-verificatie/:token
// We checken Stripe op session status, en updaten de DB. Geen webhook nodig.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { token } = await req.json();
    if (!token) return new Response(JSON.stringify({ error: "token verplicht" }), { status: 400, headers: corsHeaders });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: verificatie } = await supabase
      .from("betaal_verificaties")
      .select("id, status, stripe_session_id")
      .eq("upload_token", token)
      .maybeSingle();

    if (!verificatie) return new Response(JSON.stringify({ error: "Niet gevonden" }), { status: 404, headers: corsHeaders });
    if (verificatie.status === "betaald") {
      return new Response(JSON.stringify({ status: "betaald" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!verificatie.stripe_session_id) {
      return new Response(JSON.stringify({ status: verificatie.status }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-06-20" });
    const session = await stripe.checkout.sessions.retrieve(verificatie.stripe_session_id, {
      expand: ["payment_intent", "payment_intent.payment_method"],
    });

    if (session.payment_status === "paid") {
      const pi: any = session.payment_intent;
      const pm: any = pi?.payment_method;
      const ideal = pm?.ideal;
      const billing = pm?.billing_details;
      const iban = ideal?.iban_last4 ? `**** ${ideal.iban_last4}` : null;

      await supabase.rpc("markeer_betaal_verificatie_betaald", {
        _session_id: session.id,
        _payment_intent_id: pi?.id ?? null,
        _iban: iban,
        _naam: billing?.name ?? null,
      });
      return new Response(JSON.stringify({ status: "betaald" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ status: "in_afwachting" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("verify-betaal-verificatie error:", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});