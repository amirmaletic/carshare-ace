// Periodically called (or invoked manually) to deliver pending webhooks
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const MAX_ATTEMPTS = 5;
const BATCH_SIZE = 25;

async function hmacSha256Hex(secret: string, body: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(body));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  // Optional: caller can request a specific delivery
  let onlyId: string | null = null;
  if (req.method === "POST") {
    const body = await req.json().catch(() => ({}));
    if (body?.delivery_id) onlyId = body.delivery_id;
  }

  let q = admin.from("webhook_deliveries")
    .select("id, endpoint_id, organisatie_id, event, payload, attempts")
    .eq("status", "pending")
    .lte("next_attempt_at", new Date().toISOString())
    .lt("attempts", MAX_ATTEMPTS)
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);
  if (onlyId) q = q.eq("id", onlyId);

  const { data: pending, error } = await q;
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const results = [];
  for (const d of pending || []) {
    const { data: ep } = await admin.from("webhook_endpoints")
      .select("url, secret, actief").eq("id", d.endpoint_id).maybeSingle();

    if (!ep || !ep.actief) {
      await admin.from("webhook_deliveries").update({
        status: "failed", response_body: "Endpoint inactive or removed",
        attempts: d.attempts + 1, delivered_at: new Date().toISOString(),
      }).eq("id", d.id);
      results.push({ id: d.id, skipped: true });
      continue;
    }

    const body = JSON.stringify(d.payload);
    const ts = Math.floor(Date.now() / 1000).toString();
    const sig = await hmacSha256Hex(ep.secret, `${ts}.${body}`);

    let httpStatus = 0;
    let respBody = "";
    try {
      const r = await fetch(ep.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-FleeFlo-Event": d.event,
          "X-FleeFlo-Signature": `t=${ts},v1=${sig}`,
          "X-FleeFlo-Delivery": d.id,
        },
        body,
        signal: AbortSignal.timeout(10000),
      });
      httpStatus = r.status;
      respBody = (await r.text()).slice(0, 2000);
    } catch (e) {
      respBody = e instanceof Error ? e.message : String(e);
    }

    const success = httpStatus >= 200 && httpStatus < 300;
    const newAttempts = d.attempts + 1;
    const next = new Date(Date.now() + Math.pow(2, newAttempts) * 60000).toISOString(); // 2,4,8,16,32 min

    await admin.from("webhook_deliveries").update({
      status: success ? "success" : (newAttempts >= MAX_ATTEMPTS ? "failed" : "pending"),
      http_status: httpStatus || null,
      response_body: respBody,
      attempts: newAttempts,
      next_attempt_at: success ? null : next,
      delivered_at: success ? new Date().toISOString() : null,
    }).eq("id", d.id);

    results.push({ id: d.id, status: httpStatus, success });
  }

  return new Response(JSON.stringify({ processed: results.length, results }), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});