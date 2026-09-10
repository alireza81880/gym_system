// Supabase Edge Function: recover-license
// Allows authorized migration of a license from a damaged/old machine to a new one using a single-use recovery code.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import * as crypto from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RecoveryRequest {
  licenseKey: string;
  recoveryCode: string;
  newHardwareFingerprint: string;
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

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body: RecoveryRequest = await req.json();
    const { licenseKey, recoveryCode, newHardwareFingerprint } = body;

    if (!licenseKey || !recoveryCode || !newHardwareFingerprint) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const licenseKeyHash = hashString(licenseKey);
    const recoveryCodeHash = hashString(recoveryCode);
    const newHwHash = hashString(newHardwareFingerprint);

    // Fetch license
    const { data: license, error: licErr } = await supabase
      .from("licenses")
      .select("*")
      .eq("license_key_hash", licenseKeyHash)
      .single();

    if (licErr || !license) {
      return new Response(
        JSON.stringify({ success: false, error: "لایسنس یافت نشد.", code: "NOT_FOUND" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify recovery request
    const { data: recReq, error: recErr } = await supabase
      .from("recovery_requests")
      .select("*")
      .eq("license_id", license.id)
      .eq("recovery_code_hash", recoveryCodeHash)
      .eq("status", "PENDING")
      .single();

    if (recErr || !recReq) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "کد بازیابی نامعتبر است یا قبلاً منقضی شده است.",
          code: "INVALID_RECOVERY_CODE",
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Deactivate previous activations
    await supabase
      .from("license_activations")
      .update({ revoked_at: new Date().toISOString(), recovery_status: "MIGRATED" })
      .eq("license_id", license.id);

    // Create new activation
    const now = new Date().toISOString();
    const { data: newActivation } = await supabase
      .from("license_activations")
      .insert({
        license_id: license.id,
        hardware_fingerprint_hash: newHwHash,
        device_name: "Migrated Workstation",
        activation_type: "ONLINE",
        activated_at: now,
      })
      .select()
      .single();

    // Mark recovery completed
    await supabase
      .from("recovery_requests")
      .update({
        status: "COMPLETED",
        completed_at: now,
        new_hardware_fingerprint_hash: newHwHash,
      })
      .eq("id", recReq.id);

    const payload = {
      licenseId: license.display_key,
      gymId: license.id,
      gymName: license.gym_name || "Gym OS",
      product: "GymOS-Desktop",
      plan: license.plan,
      deviceFingerprint: newHardwareFingerprint,
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
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
