-- Gym OS Production Licensing Database Schema
-- Version: 1.0.0

-- 1. Licenses Table
CREATE TABLE IF NOT EXISTS public.licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_key_hash TEXT NOT NULL UNIQUE,
    display_key TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('UNUSED', 'ACTIVE', 'REVOKED', 'EXPIRED')),
    gym_name TEXT,
    plan TEXT NOT NULL DEFAULT 'Professional',
    max_members INT NOT NULL DEFAULT 5000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    activated_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    notes TEXT
);

-- 2. License Activations Table (Hardware Binding)
CREATE TABLE IF NOT EXISTS public.license_activations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_id UUID NOT NULL REFERENCES public.licenses(id) ON DELETE CASCADE,
    hardware_fingerprint_hash TEXT NOT NULL,
    device_name TEXT,
    activation_type TEXT NOT NULL DEFAULT 'ONLINE' CHECK (activation_type IN ('ONLINE', 'OFFLINE_EMERGENCY')),
    activated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    recovery_status TEXT
);

-- 3. Recovery Requests Table (Hardware Migration)
CREATE TABLE IF NOT EXISTS public.recovery_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_id UUID NOT NULL REFERENCES public.licenses(id) ON DELETE CASCADE,
    old_hardware_fingerprint_hash TEXT,
    new_hardware_fingerprint_hash TEXT NOT NULL,
    recovery_code_hash TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'COMPLETED', 'REJECTED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);

-- Performance Indices
CREATE INDEX IF NOT EXISTS idx_licenses_hash ON public.licenses(license_key_hash);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON public.licenses(status);
CREATE INDEX IF NOT EXISTS idx_activations_license ON public.license_activations(license_id);
CREATE INDEX IF NOT EXISTS idx_activations_hw ON public.license_activations(hardware_fingerprint_hash);
CREATE INDEX IF NOT EXISTS idx_recovery_license ON public.recovery_requests(license_id);

-- RLS Security Policies:
-- Disallow all direct anonymous table mutations; access is strictly brokered through Edge Functions
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recovery_requests ENABLE ROW LEVEL SECURITY;

-- Allow service_role full control
CREATE POLICY "Service role full access on licenses" ON public.licenses
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on activations" ON public.license_activations
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on recovery" ON public.recovery_requests
    FOR ALL TO service_role USING (true) WITH CHECK (true);
