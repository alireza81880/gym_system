// Supabase Edge Function: recover-license
// Production Gym OS Licensing Engine - Hardware Migration Gateway
// Authorizes hardware migration using single-use recovery code.
// Deactivates previous machine, re-binds license to new hardware, invalidates old recovery code,
// and issues a freshly signed Ed25519 token.
// Strictly runs in Supabase cloud: accesses SUPABASE_SERVICE_ROLE_KEY and ED25519_PRIVATE_KEY secret.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import * as crypto from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface RecoveryRequest {
  licenseKey: string;
  recoveryCode: string;
  newHardwareFingerprint: string;
  oldHardwareFingerprint?: string;
  deviceName?: string;
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
  if (key.includes("\\n")) {
    key = key.replace(/\\n/g, "\n");
  }
  return key;
}

function generateRecoveryCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const rand = crypto.randomBytes(10);
  let seg1 = "";
  let seg2 = "";
  for (let i = 0; i < 4; i++) {
    seg1 += chars.charAt(rand[i] % chars.length);
  }
  for (let i = 4; i < 10; i++) {
    seg2 += chars.charAt(rand[i] % chars.length);
  }
  return `REC-${seg1}-${seg2}`;
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
          error: "Supabase service configuration missing.",
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

    let body: RecoveryRequest;
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

    const { licenseKey, recoveryCode, newHardwareFingerprint, oldHardwareFingerprint, deviceName } = body;

    // 1. Validate required inputs
    if (!licenseKey || typeof licenseKey !== "string" || !licenseKey.trim()) {
      return new Response(
        JSON.stringify({
          success: false,
          code: "INVALID_LICENSE",
          error: "ورود کد لایسنس الزامی است.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!recoveryCode || typeof recoveryCode !== "string" || !recoveryCode.trim()) {
      return new Response(
        JSON.stringify({
          success: false,
          code: "INVALID_RECOVERY_CODE",
          error: "کد بازیابی الزامی است.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!newHardwareFingerprint || typeof newHardwareFingerprint !== "string" || !newHardwareFingerprint.trim()) {
      return new Response(
        JSON.stringify({
          success: false,
          code: "DEVICE_MISMATCH",
          error: "شناسه سخت‌افزاری دستگاه جدید نامعتبر یا خالی است.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanKey = licenseKey.trim().toUpperCase();
    const cleanRecoveryCode = recoveryCode.trim().toUpperCase();
    const cleanNewFp = newHardwareFingerprint.trim();
    const licenseKeyHash = hashString(cleanKey);
    const recoveryCodeHash = hashString(cleanRecoveryCode);
    const newHwHash = hashString(cleanNewFp);

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
          error: "لایسنس با این مشخصات یافت نشد.",
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
          error: "این لایسنس مسدود یا باطل شده است و امکان بازیابی آن وجود ندارد.",
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Status checks: EXPIRED_LICENSE
    const isPastExpiry = Boolean(
      license.expires_at && new Date(license.expires_at).getTime() <= Date.now()
    );
    if (license.status === "EXPIRED" || isPastExpiry) {
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
          error: "مدت زمان اعتبار این لایسنس به پایان رسیده است.",
          expiresAt: license.expires_at,
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Validate recovery code
    const isDirectMatch =
      license.recovery_code_hash === recoveryCodeHash ||
      (license.recovery_code && license.recovery_code.trim().toUpperCase() === cleanRecoveryCode);

    let pendingRequest: any = null;
    if (!isDirectMatch) {
      const { data: recReq } = await supabase
        .from("recovery_requests")
        .select("*")
        .eq("license_id", license.id)
        .eq("recovery_code_hash", recoveryCodeHash)
        .eq("status", "PENDING")
        .single();
      pendingRequest = recReq;
    }

    if (!isDirectMatch && !pendingRequest) {
      return new Response(
        JSON.stringify({
          success: false,
          code: "INVALID_RECOVERY_CODE",
          error: "کد بازیابی سخت‌افزار نامعتبر است یا قبلاً استفاده شده است.",
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Query existing active activations
    const { data: activeActivations } = await supabase
      .from("license_activations")
      .select("*")
      .eq("license_id", license.id)
      .is("revoked_at", null)
      .order("activated_at", { ascending: false });

    // Optional: if oldHardwareFingerprint provided, verify it
    if (oldHardwareFingerprint && typeof oldHardwareFingerprint === "string" && oldHardwareFingerprint.trim()) {
      const oldHwHash = hashString(oldHardwareFingerprint.trim());
      const hasOldMatch = (activeActivations || []).some(
        (a: any) => a.hardware_fingerprint_hash === oldHwHash
      );
      if (!hasOldMatch && (activeActivations || []).length > 0) {
        return new Response(
          JSON.stringify({
            success: false,
            code: "DEVICE_MISMATCH",
            error: "شناسه سخت‌افزاری مبدأ با دستگاه‌های فعال لایسنس مطابقت ندارد.",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const now = new Date().toISOString();

    // 7. Migration: Revoke previous activations
    await supabase
      .from("license_activations")
      .update({
        revoked_at: now,
        recovery_status: "MIGRATED",
      })
      .eq("license_id", license.id)
      .is("revoked_at", null);

    // 8. Register new activation bound to new hardware
    const { data: newActivation, error: actErr } = await supabase
      .from("license_activations")
      .insert({
        license_id: license.id,
        hardware_fingerprint_hash: newHwHash,
        device_name: deviceName || "Migrated Workstation",
        activation_type: "ONLINE",
        activated_at: now,
        last_seen_at: now,
      })
      .select()
      .single();

    if (actErr || !newActivation) {
      throw new Error("Failed to record new activation: " + actErr?.message);
    }

    // 9. Single-Use Security: Generate fresh recovery code for subsequent migrations
    const nextRecoveryCode = generateRecoveryCode();
    const nextRecoveryCodeHash = hashString(nextRecoveryCode);

    await supabase
      .from("licenses")
      .update({
        status: "ACTIVE",
        recovery_code: nextRecoveryCode,
        recovery_code_hash: nextRecoveryCodeHash,
        activated_at: license.activated_at || now,
      })
      .eq("id", license.id);

    // 10. Record recovery request audit log
    if (pendingRequest) {
      await supabase
        .from("recovery_requests")
        .update({
          status: "COMPLETED",
          completed_at: now,
          new_hardware_fingerprint_hash: newHwHash,
        })
        .eq("id", pendingRequest.id);
    } else {
      await supabase
        .from("recovery_requests")
        .insert({
          license_id: license.id,
          old_hardware_fingerprint_hash:
            activeActivations && activeActivations[0]
              ? activeActivations[0].hardware_fingerprint_hash
              : null,
          new_hardware_fingerprint_hash: newHwHash,
          recovery_code_hash: recoveryCodeHash,
          status: "COMPLETED",
          created_at: now,
          completed_at: now,
        });
    }

    // 11. Create and sign new Ed25519 token
    const customerDisplayName = license.customer_name || license.gym_name || "Gym OS";
    const licenseType = license.license_type || (license.expires_at ? "YEARLY" : "LIFETIME");
    const maxDevices = Math.max(1, Number(license.max_devices) || 1);

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
      deviceFingerprint: cleanNewFp,
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
        newRecoveryCode: nextRecoveryCode,
        message: "لایسنس با موفقیت بازیابی و به سیستم جدید متصل شد.",
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
        error: err.message || "Internal server error during recovery",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
