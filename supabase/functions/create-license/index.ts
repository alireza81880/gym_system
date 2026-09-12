// Supabase Edge Function: create-license
// Authoritative creation, duration calculation, and signing gateway for Gym OS licenses.
// Strictly runs in Supabase cloud environment with access to service_role and Ed25519 signing key.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import * as crypto from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

interface CreateLicensePayload {
  action?: "create" | "list" | "revoke";
  customer_name?: string;
  plan?: string;
  license_type?: "TRIAL" | "YEARLY" | "MULTI_YEAR" | "LIFETIME" | "CUSTOM";
  duration_months?: number | null;
  max_devices?: number;
  custom_license_key?: string;
  notes?: string;
  license_key?: string;
}

function hashString(str: string): string {
  return crypto.createHash("sha256").update(str.trim().toUpperCase()).digest("hex");
}

function generateLicenseKey(prefix = "GYM"): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  function segment(len: number): string {
    let res = "";
    const rand = crypto.randomBytes(len);
    for (let i = 0; i < len; i++) {
      res += chars.charAt(rand[i] % chars.length);
    }
    return res;
  }
  return `${prefix}-${segment(4)}-${segment(4)}-${segment(4)}-${segment(4)}`;
}

function generateRecoveryCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  function segment(len: number): string {
    let res = "";
    const rand = crypto.randomBytes(len);
    for (let i = 0; i < len; i++) {
      res += chars.charAt(rand[i] % chars.length);
    }
    return res;
  }
  return `REC-${segment(4)}-${segment(6)}`;
}

/**
 * Calculates accurate ISO expiry timestamp from created_at + duration_months
 */
function calculateExpiry(createdDate: Date, durationMonths: number | null): string | null {
  if (durationMonths === null || durationMonths === undefined || durationMonths <= 0) {
    return null; // Lifetime license (no expiration)
  }
  const expiry = new Date(createdDate.getTime());
  expiry.setMonth(expiry.getMonth() + durationMonths);
  return expiry.toISOString();
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Supabase service configuration missing" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let body: CreateLicensePayload = {};
    if (req.method === "POST") {
      try {
        body = await req.json();
      } catch {
        body = {};
      }
    }

    const action = body.action || (req.method === "GET" ? "list" : "create");

    // 1. LIST LICENSES
    if (action === "list") {
      const { data: licenses, error: listErr } = await supabase
        .from("licenses")
        .select(`
          id,
          license_key,
          display_key,
          customer_name,
          gym_name,
          plan,
          license_type,
          duration_months,
          max_devices,
          recovery_code,
          status,
          created_at,
          activated_at,
          expires_at,
          notes,
          license_activations (
            id,
            revoked_at
          )
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (listErr) {
        throw new Error("Failed to list licenses: " + listErr.message);
      }

      // Format clean list with active device counts
      const formatted = (licenses || []).map((lic: any) => {
        const activations = Array.isArray(lic.license_activations) ? lic.license_activations : [];
        const activeDevicesCount = activations.filter((a: any) => !a.revoked_at).length;

        return {
          id: lic.id,
          license_key: lic.license_key || lic.display_key,
          customer_name: lic.customer_name || lic.gym_name || "نامشخص",
          plan: lic.plan || "Professional",
          license_type: lic.license_type || (lic.expires_at ? "YEARLY" : "LIFETIME"),
          duration_months: lic.duration_months !== undefined ? lic.duration_months : null,
          max_devices: lic.max_devices || 1,
          active_devices_count: activeDevicesCount,
          recovery_code: lic.recovery_code || "---",
          status: lic.status,
          created_at: lic.created_at,
          activated_at: lic.activated_at,
          expires_at: lic.expires_at,
          notes: lic.notes,
        };
      });

      return new Response(
        JSON.stringify({ success: true, licenses: formatted }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. REVOKE LICENSE (Soft-status update only; never physically deletes row or history)
    if (action === "revoke") {
      const targetKey = (body.license_key || "").trim().toUpperCase();
      if (!targetKey) {
        return new Response(
          JSON.stringify({ error: "license_key is required to revoke" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const keyHash = hashString(targetKey);
      const { error: revErr } = await supabase
        .from("licenses")
        .update({ status: "REVOKED" })
        .or(`license_key_hash.eq.${keyHash},license_key.eq.${targetKey}`);

      if (revErr) {
        throw new Error("Failed to revoke license: " + revErr.message);
      }

      return new Response(
        JSON.stringify({ success: true, message: `لایسنس ${targetKey} با موفقیت غیرفعال (Revoked) شد.` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2B. RESTORE / UNREVOKE LICENSE (Admin capability to reverse accidental revocation)
    if (action === "unrevoke" || action === "restore") {
      const targetKey = (body.license_key || "").trim().toUpperCase();
      if (!targetKey) {
        return new Response(
          JSON.stringify({ error: "license_key is required to restore" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const keyHash = hashString(targetKey);
      // Determine restored status based on whether it was ever activated
      const { data: licRecord } = await supabase
        .from("licenses")
        .select("activated_at")
        .or(`license_key_hash.eq.${keyHash},license_key.eq.${targetKey}`)
        .single();

      const restoredStatus = licRecord?.activated_at ? "ACTIVE" : "UNUSED";

      const { error: restErr } = await supabase
        .from("licenses")
        .update({ status: restoredStatus })
        .or(`license_key_hash.eq.${keyHash},license_key.eq.${targetKey}`);

      if (restErr) {
        throw new Error("Failed to restore license: " + restErr.message);
      }

      return new Response(
        JSON.stringify({
          success: true,
          status: restoredStatus,
          message: `لایسنس ${targetKey} با موفقیت به وضعیت ${restoredStatus === "ACTIVE" ? "فعال" : "استفاده‌نشده"} بازگردانی شد.`,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. CREATE LICENSE MANUALLY
    const customerName = (body.customer_name || "").trim();
    if (!customerName) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "نام خریدار / باشگاه (customer_name) الزامی است.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const plan = body.plan || "Professional";
    let licenseType = body.license_type || "YEARLY";
    let durationMonths: number | null = null;

    // Determine duration based on options
    if (licenseType === "LIFETIME") {
      durationMonths = null;
    } else if (licenseType === "TRIAL") {
      durationMonths = body.duration_months && body.duration_months > 0 ? body.duration_months : 1; // 1 month trial
    } else if (licenseType === "YEARLY") {
      durationMonths = 12; // 1 year = 12 months
    } else if (licenseType === "MULTI_YEAR") {
      durationMonths = body.duration_months && body.duration_months > 0 ? body.duration_months : 24; // 24 or 36 months
    } else {
      // CUSTOM or explicit duration_months
      if (body.duration_months === null || body.duration_months === undefined || body.duration_months <= 0) {
        licenseType = "LIFETIME";
        durationMonths = null;
      } else {
        durationMonths = Number(body.duration_months);
      }
    }

    const maxDevices = Math.max(1, Number(body.max_devices) || 1);
    const now = new Date();
    const createdAt = now.toISOString();
    const expiresAt = calculateExpiry(now, durationMonths);

    const licenseKey = (body.custom_license_key || "").trim().toUpperCase() || generateLicenseKey();
    const licenseKeyHash = hashString(licenseKey);

    const recoveryCode = generateRecoveryCode();
    const recoveryCodeHash = hashString(recoveryCode);

    // Insert into database
    const { data: newLicense, error: insErr } = await supabase
      .from("licenses")
      .insert({
        license_key: licenseKey,
        display_key: licenseKey,
        customer_name: customerName,
        gym_name: customerName,
        plan: plan,
        license_type: licenseType,
        duration_months: durationMonths,
        max_devices: maxDevices,
        license_key_hash: licenseKeyHash,
        recovery_code: recoveryCode,
        recovery_code_hash: recoveryCodeHash,
        status: "UNUSED",
        created_at: createdAt,
        expires_at: expiresAt,
        notes: body.notes || null,
      })
      .select()
      .single();

    if (insErr || !newLicense) {
      throw new Error("Failed to insert license: " + insErr?.message);
    }

    // Also register in recovery_requests for migration audit
    await supabase.from("recovery_requests").insert({
      license_id: newLicense.id,
      recovery_code_hash: recoveryCodeHash,
      new_hardware_fingerprint_hash: "PENDING_INITIAL_ACTIVATION",
      status: "PENDING",
      created_at: createdAt,
    });

    const responseLicense = {
      id: newLicense.id,
      license_key: licenseKey,
      customer_name: customerName,
      plan: plan,
      license_type: licenseType,
      duration_months: durationMonths,
      created_at: createdAt,
      expires_at: expiresAt,
      max_devices: maxDevices,
      recovery_code: recoveryCode,
      status: "UNUSED",
      notes: body.notes || null,
    };

    return new Response(
      JSON.stringify({
        success: true,
        message: "لایسنس با موفقیت در سامانه ابری صادر و ذخیره گردید.",
        license: responseLicense,
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
