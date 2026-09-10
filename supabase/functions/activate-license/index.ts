// Supabase Edge Function: activate-license
// Production Gym OS Licensing Engine
// Validates single-use/multi-device license, binds to hardware fingerprint, and returns an Ed25519 signed token.
// Strictly runs in Supabase cloud: accesses SUPABASE_SERVICE_ROLE_KEY and ED25519_PRIVATE_KEY secret.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import * as crypto from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ActivationRequest {
  action?: "activate" | "verify";
  licenseKey: string;
  hardwareFingerprint: string;
  deviceName?: string;
  expectedFingerprint?: string;
}

function hashString(str: string): string {
  return crypto.createHash("sha256").update(str.trim().toUpperCase()).digest("hex");
}

function canonicalizePayload(payload: any): string {
  if (!payload || typeof payload !== "object") return "";
  const sortedKeys = Object.keys(payload).sort();
  const sortedObj: Record<string, any> = {};
  for (const key of sortedKeys) {
    sortedObj[key] = payload[key];
  }
  return JSON.stringify(sortedObj);
}

function formatPrivateKey(rawKey: string): string {
  if (!rawKey) return "";
  let key = rawKey.trim();
  // Normalize escaped newlines from environment variable injection
  if (key.includes("\\n")) {
    key = key.replace(/\\n/g, "\n");
  }
  return key;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const rawPrivateKey = Deno.env.get("ED25519_PRIVATE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({
          success: false,
          code: "SERVER_UNCONFIGURED",
          error: "Supabase service role configuration is missing.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ed25519PrivateKeyPem = formatPrivateKey(rawPrivateKey || "");
    if (!ed25519PrivateKeyPem) {
      return new Response(
        JSON.stringify({
          success: false,
          code: "SIGNING_CONFIG_MISSING",
          error: "Server Ed25519 private signing key secret is not configured.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let body: ActivationRequest;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({
          success: false,
          code: "INVALID_REQUEST",
          error: "Invalid JSON request payload.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { licenseKey, hardwareFingerprint, deviceName, action = "activate" } = body;

    // 1. Validate required inputs
    if (!licenseKey || typeof licenseKey !== "string" || !licenseKey.trim()) {
      return new Response(
        JSON.stringify({
          success: false,
          code: "INVALID_LICENSE",
          error: "کد لایسنس الزامی است.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!hardwareFingerprint || typeof hardwareFingerprint !== "string" || !hardwareFingerprint.trim()) {
      return new Response(
        JSON.stringify({
          success: false,
          code: "DEVICE_MISMATCH",
          error: "شناسه سخت‌افزاری معتبر برای ثبت سیستم یافت نشد.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanKey = licenseKey.trim().toUpperCase();
    const cleanHw = hardwareFingerprint.trim();
    const licenseKeyHash = hashString(cleanKey);
    const hwHash = hashString(cleanHw);

    // 2. Fetch authoritative license record
    const { data: license, error: licErr } = await supabase
      .from("licenses")
      .select("*")
      .or(`license_key_hash.eq.${licenseKeyHash},license_key.eq.${cleanKey}`)
      .single();

    if (licErr || !license) {
      return new Response(
        JSON.stringify({
          success: false,
          code: "INVALID_LICENSE",
          error: "کد لایسنس نامعتبر است یا در سامانه یافت نشد.",
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Status checks: REVOKED_LICENSE
    if (license.status === "REVOKED") {
      return new Response(
        JSON.stringify({
          success: false,
          code: "REVOKED_LICENSE",
          error: "این لایسنس توسط پشتیبانی غیرفعال (Revoked) شده است.",
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Status checks: EXPIRED_LICENSE
    const isPastExpiry = Boolean(
      license.expires_at && new Date(license.expires_at).getTime() <= Date.now()
    );
    if (license.status === "EXPIRED" || isPastExpiry) {
      // Synchronize database status if not already marked expired
      if (license.status !== "EXPIRED") {
        await supabase
          .from("licenses")
          .update({ status: "EXPIRED" })
          .eq("id", license.id);
      }

      return new Response(
        JSON.stringify({
          success: false,
          code: "EXPIRED_LICENSE",
          error: "تاریخ اعتبار این لایسنس به پایان رسیده است.",
          expiresAt: license.expires_at,
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const maxDevices = Math.max(1, Number(license.max_devices) || 1);
    const customerDisplayName = license.customer_name || license.gym_name || "Gym OS";
    const licenseType = license.license_type || (license.expires_at ? "YEARLY" : "LIFETIME");

    // 5. Query active activations bound to this license
    const { data: existingActivations, error: actListErr } = await supabase
      .from("license_activations")
      .select("*")
      .eq("license_id", license.id)
      .is("revoked_at", null)
      .order("activated_at", { ascending: false });

    if (actListErr) {
      throw new Error("Failed to query license activations: " + actListErr.message);
    }

    const activeList = existingActivations || [];
    const matchedActivation = activeList.find(
      (a: any) => a.hardware_fingerprint_hash === hwHash
    );

    // If verification-only requested
    if (action === "verify" && !matchedActivation) {
      return new Response(
        JSON.stringify({
          success: false,
          code: "DEVICE_MISMATCH",
          error: "این سیستم با دستگاه‌های ثبت‌شده لایسنس مطابقت ندارد.",
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Case A: Already active on this same hardware => Idempotent Success
    if (matchedActivation) {
      // Touch last_seen_at
      await supabase
        .from("license_activations")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", matchedActivation.id);

      const payload = {
        licenseId: license.license_key || license.display_key,
        gymId: license.id,
        gymName: customerDisplayName,
        customerName: customerDisplayName,
        product: "GymOS-Desktop",
        plan: license.plan,
        licenseType: licenseType,
        durationMonths: license.duration_months !== undefined ? license.duration_months : null,
        maxDevices: maxDevices,
        deviceFingerprint: cleanHw,
        activatedAt: matchedActivation.activated_at,
        expiresAt: license.expires_at,
        tokenVersion: 1,
        activationType: matchedActivation.activation_type || "ONLINE",
      };

      const canonicalString = canonicalizePayload(payload);
      const signature = crypto
        .sign(null, Buffer.from(canonicalString, "utf8"), ed25519PrivateKeyPem)
        .toString("base64");

      return new Response(
        JSON.stringify({
          success: true,
          status: "ACTIVE",
          token: { payload, signature },
          licenseInfo: {
            licenseId: license.license_key || license.display_key,
            gymName: customerDisplayName,
            customerName: customerDisplayName,
            plan: license.plan,
            licenseType: licenseType,
            durationMonths: license.duration_months,
            maxDevices: maxDevices,
            activatedAt: matchedActivation.activated_at,
            expiresAt: license.expires_at,
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. Case B: New hardware attempted, check device limit
    if (activeList.length >= maxDevices) {
      return new Response(
        JSON.stringify({
          success: false,
          code: "DEVICE_LIMIT_REACHED",
          error: `سقف مجاز فعالسازی این لایسنس (${maxDevices} دستگاه) تکمیل شده است. برای انتقال به دستگاه جدید از کد بازیابی استفاده کنید.`,
          maxDevices,
          activeDevicesCount: activeList.length,
        }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 8. Case C: New hardware within allowed max_devices limit => Register and Activate
    const now = new Date().toISOString();
    const { data: newActivation, error: insertErr } = await supabase
      .from("license_activations")
      .insert({
        license_id: license.id,
        hardware_fingerprint_hash: hwHash,
        device_name: deviceName || "Windows Workstation",
        activation_type: "ONLINE",
        activated_at: now,
        last_seen_at: now,
      })
      .select()
      .single();

    if (insertErr || !newActivation) {
      throw new Error("Failed to record device activation: " + insertErr?.message);
    }

    // Update license status to ACTIVE if UNUSED
    if (license.status === "UNUSED") {
      await supabase
        .from("licenses")
        .update({
          status: "ACTIVE",
          activated_at: now,
        })
        .eq("id", license.id);
    }

    // 9. Sign token with Ed25519
    const payload = {
      licenseId: license.license_key || license.display_key,
      gymId: license.id,
      gymName: customerDisplayName,
      customerName: customerDisplayName,
      product: "GymOS-Desktop",
      plan: license.plan,
      licenseType: licenseType,
      durationMonths: license.duration_months !== undefined ? license.duration_months : null,
      maxDevices: maxDevices,
      deviceFingerprint: cleanHw,
      activatedAt: now,
      expiresAt: license.expires_at,
      tokenVersion: 1,
      activationType: "ONLINE",
    };

    const canonicalString = canonicalizePayload(payload);
    const signature = crypto
      .sign(null, Buffer.from(canonicalString, "utf8"), ed25519PrivateKeyPem)
      .toString("base64");

    return new Response(
      JSON.stringify({
        success: true,
        status: "ACTIVE",
        token: { payload, signature },
        licenseInfo: {
          licenseId: license.license_key || license.display_key,
          gymName: customerDisplayName,
          customerName: customerDisplayName,
          plan: license.plan,
          licenseType: licenseType,
          durationMonths: license.duration_months,
          maxDevices: maxDevices,
          activatedAt: now,
          expiresAt: license.expires_at,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        code: "INTERNAL_ERROR",
        error: err.message || "Internal server error during activation",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
