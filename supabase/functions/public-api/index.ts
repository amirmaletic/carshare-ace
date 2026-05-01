// Public REST API for FleeFlo - authenticated via API keys
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-api-key, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Resources that map directly to tables, scoped by organisatie_id
const RESOURCES: Record<string, { table: string; scope: string }> = {
  voertuigen: { table: "voertuigen", scope: "voertuigen" },
  contracten: { table: "contracts", scope: "contracten" },
  klanten: { table: "klanten", scope: "klanten" },
  ritten: { table: "ritten", scope: "ritten" },
  facturen: { table: "invoices", scope: "facturen" },
  schade: { table: "schade_rapporten", scope: "schade" },
  reserveringen: { table: "reserveringen", scope: "reserveringen" },
  chauffeurs: { table: "chauffeurs", scope: "chauffeurs" },
  locaties: { table: "locaties", scope: "locaties" },
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function hasScope(scopes: string[], action: "read" | "write", resource: string): boolean {
  if (scopes.includes("admin:all")) return true;
  if (action === "read" && (scopes.includes("read:all") || scopes.includes(`read:${resource}`))) return true;
  if (action === "write" && (scopes.includes("write:all") || scopes.includes(`write:${resource}`))) return true;
  return false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const start = Date.now();
  const url = new URL(req.url);
  // Path is /public-api/v1/<resource>[/<id>]
  const parts = url.pathname.replace(/^\/+/, "").split("/").filter(Boolean);
  // Strip function prefix if present
  const fnIdx = parts.indexOf("public-api");
  const apiParts = fnIdx >= 0 ? parts.slice(fnIdx + 1) : parts;
  // Expect: ["v1", resource, id?]
  const [version, resource, id] = apiParts;

  // API key from header or query
  const apiKey = req.headers.get("x-api-key") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";

  if (!apiKey) return json({ error: "Missing API key. Send via X-API-Key header or Authorization: Bearer <key>." }, 401);

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  // Verify key
  const { data: keyRows, error: keyErr } = await admin.rpc("verify_api_key", { _key: apiKey });
  if (keyErr || !keyRows || keyRows.length === 0) {
    return json({ error: "Invalid or revoked API key" }, 401);
  }
  const { api_key_id, organisatie_id, scopes } = keyRows[0];
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";

  // touch + log (fire and forget)
  admin.rpc("touch_api_key", { _id: api_key_id, _ip: ip }).then(() => {});

  const logRequest = async (status: number) => {
    await admin.from("api_request_log").insert({
      organisatie_id, api_key_id, method: req.method, path: url.pathname,
      status_code: status, duration_ms: Date.now() - start, ip,
      user_agent: req.headers.get("user-agent") || "",
    });
  };

  // Root: list resources
  if (!version) {
    const res = json({
      name: "FleeFlo Public API",
      version: "v1",
      docs: "https://www.fleeflo.nl/docs/api",
      resources: Object.keys(RESOURCES),
    });
    await logRequest(200);
    return res;
  }

  if (version !== "v1") {
    await logRequest(404);
    return json({ error: "Unknown API version" }, 404);
  }

  if (!resource || !RESOURCES[resource]) {
    await logRequest(404);
    return json({ error: "Unknown resource", available: Object.keys(RESOURCES) }, 404);
  }

  const { table, scope } = RESOURCES[resource];
  const isWrite = ["POST", "PATCH", "PUT", "DELETE"].includes(req.method);
  const required: "read" | "write" = isWrite ? "write" : "read";
  if (!hasScope(scopes, required, scope)) {
    await logRequest(403);
    return json({ error: `Missing scope: ${required}:${scope}` }, 403);
  }

  try {
    // GET list or single
    if (req.method === "GET") {
      if (id) {
        const { data, error } = await admin.from(table).select("*")
          .eq("organisatie_id", organisatie_id).eq("id", id).maybeSingle();
        if (error) throw error;
        if (!data) { await logRequest(404); return json({ error: "Not found" }, 404); }
        await logRequest(200);
        return json({ data });
      }
      // list with pagination + simple filters
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10), 200);
      const offset = parseInt(url.searchParams.get("offset") || "0", 10);
      let q = admin.from(table).select("*", { count: "exact" })
        .eq("organisatie_id", organisatie_id)
        .range(offset, offset + limit - 1)
        .order("created_at", { ascending: false });

      // Optional filter params: filter[column]=value
      url.searchParams.forEach((value, key) => {
        const m = key.match(/^filter\[(.+)\]$/);
        if (m) q = q.eq(m[1], value);
      });

      const { data, error, count } = await q;
      if (error) throw error;
      await logRequest(200);
      return json({ data, pagination: { limit, offset, total: count } });
    }

    // POST create
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const insert = { ...body, organisatie_id };
      const { data, error } = await admin.from(table).insert(insert).select().single();
      if (error) throw error;
      await logRequest(201);
      return json({ data }, 201);
    }

    // PATCH update
    if (req.method === "PATCH" || req.method === "PUT") {
      if (!id) { await logRequest(400); return json({ error: "ID required for update" }, 400); }
      const body = await req.json().catch(() => ({}));
      delete body.id; delete body.organisatie_id;
      const { data, error } = await admin.from(table).update(body)
        .eq("organisatie_id", organisatie_id).eq("id", id).select().single();
      if (error) throw error;
      await logRequest(200);
      return json({ data });
    }

    // DELETE
    if (req.method === "DELETE") {
      if (!id) { await logRequest(400); return json({ error: "ID required for delete" }, 400); }
      const { error } = await admin.from(table).delete()
        .eq("organisatie_id", organisatie_id).eq("id", id);
      if (error) throw error;
      await logRequest(204);
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    await logRequest(405);
    return json({ error: "Method not allowed" }, 405);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await logRequest(500);
    return json({ error: msg }, 500);
  }
});