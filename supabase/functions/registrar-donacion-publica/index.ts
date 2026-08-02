import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": Deno.env.get("PUBLIC_DONATION_ALLOWED_ORIGIN") ?? "*",
  "Content-Type": "application/json",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

async function hashOrigin(origin: string) {
  const salt = Deno.env.get("PUBLIC_DONATION_RATE_LIMIT_SALT");
  if (!salt) throw new Error("PUBLIC_DONATION_RATE_LIMIT_SALT is not configured");

  const bytes = new TextEncoder().encode(`${salt}:${origin}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const payload = await request.json();
    const origin = request.headers.get("cf-connecting-ip")
      ?? request.headers.get("x-real-ip")
      ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? "unknown";
    const ipHash = await hashOrigin(origin);

    const { data, error } = await supabase.rpc("registrar_donacion_publica", {
      p_ip_hash: ipHash,
      p_payload: payload,
    });

    if (error) {
      if (error.message.includes("Límite temporal")) {
        return jsonResponse({ error: "Too many requests" }, 429);
      }
      console.error("Public donation rejected:", error.message);
      return jsonResponse({ error: "Invalid donation request" }, 400);
    }

    return jsonResponse({ ok: true, id: data }, 201);
  } catch (error) {
    console.error("Public donation error:", error);
    return jsonResponse({ error: "Invalid request" }, 400);
  }
});
