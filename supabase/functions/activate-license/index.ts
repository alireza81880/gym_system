// Supabase Edge Function: activate-license
// Validates single-use license key, binds to hardware fingerprint, and returns an Ed25519 signed token.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import * as crypto from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ActivationRequest {
  licenseKey: string;
  hardwareFingerprint: string;
  deviceName?: string;
}

function hashString(str: string): string {
  return crypto.createHash("sha256").update(str.trim().toUpperCase()).digest("hex");
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ed25519PrivateKeyPem = Deno.env.get("ED25519_PRIVATE_KEY")!;

    if (!ed25519PrivateKeyPem) {
      return new Response(
        JSON.stringify({ error: "Server signing configuration missing" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body: ActivationRequest = await req.json();

    const { licenseKey, hardwareFingerprint, deviceName } = body;

    if (!licenseKey || !hardwareFingerprint) {
      return new Response(
        JSON.stringify({ error: "License key and hardware fingerprint are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const licenseKeyHash = hashString(licenseKey);
    const hwHash = hashString(hardwareFingerprint);

    // 1. Fetch license
    const { data: license, error: licErr } = await supabase
      .from("licenses")
      .select("*")
      .eq("license_key_hash", licenseKeyHash)
      .single();

    if (licErr || !license) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "کد لایسنس نامعتبر است یا در سامانه یافت نشد.",
          code: "INVALID_LICENSE",
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (license.status === "REVOKED") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "این لایسنس توسط پشتیبانی غیرفعال (Revoked) شده است.",
          code: "REVOKED",
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (license.status === "EXPIRED" || (license.expires_at && new Date(license.expires_at) < new Date())) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "تاریخ اعتبار این لایسنس به پایان رسیده است.",
          code: "EXPIRED",
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Check if already ACTIVE
    if (license.status === "ACTIVE") {
      // Find existing activation
      const { data: activation } = await supabase
        .from("license_activations")
        .select("*")
        .eq("license_id", license.id)
        .order("activated_at", { ascending: false })
        .limit(1)
        .single();

      if (activation) {
        if (activation.hardware_fingerprint_hash === hwHash) {
          // Idempotent: Same PC re-activating / restoring
          const payload = {
            licenseId: license.display_key,
            gymId: license.id,
            gymName: license.gym_name || "Gym OS",
            product: "GymOS-Desktop",
            plan: license.plan,
            deviceFingerprint: hardwareFingerprint,
            activatedAt: activation.activated_at,
            expiresAt: license.expires_at,
            tokenVersion: 1,
            activationType: activation.activation_type || "ONLINE",
          };

          const dataToSign = Buffer.from(JSON.stringify(payload));
          const signature = crypto.sign(null, dataToSign, ed25519PrivateKeyPem).toString("base64");

          return new Response(
            JSON.stringify({
              success: true,
              status: "ACTIVE",
              token: { payload, signature },
              licenseInfo: {
                licenseId: license.display_key,
                gymName: license.gym_name,
                plan: license.plan,
                activatedAt: activation.activated_at,
                expiresAt: license.expires_at,
              },
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } else {
          // Different PC attempting to use an already bound license
          return new Response(
            JSON.stringify({
              success: false,
              error: "این لایسنس قبلاً بر روی دستگاه دیگری فعال شده است و امکان استفاده مجدد ندارد.",
              code: "DEVICE_MISMATCH",
            }),
            { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // 3. UNUSED: Activate and bind to this hardware
    if (license.status === "UNUSED") {
      const now = new Date().toISOString();

      // Create activation record
      const { data: newActivation, error: actErr } = await supabase
        .from("license_activations")
        .insert({
          license_id: license.id,
          hardware_fingerprint_hash: hwHash,
          device_name: deviceName || "Windows Workstation",
          activation_type: "ONLINE",
          activated_at: now,
        })
        .select()
        .single();

      if (actErr || !newActivation) {
        throw new Error("Failed to record activation: " + actErr?.message);
      }

      // Update license status to ACTIVE
      await supabase
        .from("licenses")
        .update({
          status: "ACTIVE",
          activated_at: now,
          activation_id: newActivation.id,
        })
        .eq("id", license.id);

      const payload = {
        licenseId: license.display_key,
        gymId: license.id,
        gymName: license.gym_name || "Gym OS",
        product: "GymOS-Desktop",
        plan: license.plan,
        deviceFingerprint: hardwareFingerprint,
        activatedAt: now,
        expiresAt: license.expires_at,
        tokenVersion: 1,
        activationType: "ONLINE",
      };

      const dataToSign = Buffer.from(JSON.stringify(payload));
      const signature = crypto.sign(null, dataToSign, ed25519PrivateKeyPem).toString("base64");

      return new Response(
        JSON.stringify({
          success: true,
          status: "ACTIVE",
          token: { payload, signature },
          licenseInfo: {
            licenseId: license.display_key,
            gymName: license.gym_name,
            plan: license.plan,
            activatedAt: now,
            expiresAt: license.expires_at,
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: "وضعیت لایسنس نامعتبر است: " + license.status,
        code: "INVALID_STATUS",
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
