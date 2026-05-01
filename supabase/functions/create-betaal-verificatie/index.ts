import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "Niet ingelogd" }), { status: 401, headers: corsHeaders });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: auth } } }
    );
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return new Response(JSON.stringify({ error: "Niet ingelogd" }), { status: 401, headers: corsHeaders });

    const { contract_id } = await req.json();
    if (!contract_id) return new Response(JSON.stringify({ error: "contract_id verplicht" }), { status: 400, headers: corsHeaders });

    // Contract ophalen
    const { data: contract, error: cErr } = await supabase
      .from("contracts")
      .select("id, organisatie_id, klant_naam, klant_email, contract_nummer")
      .eq("id", contract_id)
      .maybeSingle();
    if (cErr || !contract) return new Response(JSON.stringify({ error: "Contract niet gevonden" }), { status: 404, headers: corsHeaders });

    // Klant zoeken
    const { data: klant } = await supabase
      .from("klanten")
      .select("id")
      .eq("organisatie_id", contract.organisatie_id)
      .ilike("email", contract.klant_email)
      .maybeSingle();

    // Verificatie record maken
    const { data: verificatie, error: vErr } = await supabase
      .from("betaal_verificaties")
      .insert({
        organisatie_id: contract.organisatie_id,
        contract_id: contract.id,
        klant_id: klant?.id ?? null,
        bedrag: 0.01,
      })
      .select()
      .single();
    if (vErr) return new Response(JSON.stringify({ error: vErr.message }), { status: 500, headers: corsHeaders });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-06-20" });
    const origin = req.headers.get("origin") || "https://fleeflo.nl";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["ideal"],
      currency: "eur",
      customer_email: contract.klant_email,
      line_items: [{
        price_data: {
          currency: "eur",
          product_data: { name: `Borg-verificatie contract ${contract.contract_nummer}` },
          unit_amount: 1,
        },
        quantity: 1,
      }],
      payment_intent_data: { setup_future_usage: "off_session" },
      success_url: `${origin}/betaal-verificatie/${verificatie.upload_token}?status=success`,
      cancel_url: `${origin}/betaal-verificatie/${verificatie.upload_token}?status=cancel`,
      metadata: { verificatie_id: verificatie.id, contract_id: contract.id },
    });

    await supabase
      .from("betaal_verificaties")
      .update({ stripe_session_id: session.id })
      .eq("id", verificatie.id);

    // Email versturen via bestaande transactional email functie
    const verzoekUrl = `${origin}/betaal-verificatie/${verificatie.upload_token}`;
    await supabase.functions.invoke("send-transactional-email", {
      body: {
        to: contract.klant_email,
        template: "borg-verificatie",
        data: {
          klant_naam: contract.klant_naam,
          contract_nummer: contract.contract_nummer,
          checkout_url: session.url,
          bedrag: "0,01",
        },
      },
    });

    return new Response(
      JSON.stringify({ success: true, checkout_url: session.url, verificatie_id: verificatie.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("create-betaal-verificatie error:", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});