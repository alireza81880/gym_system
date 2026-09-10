-- Gym OS Production Licensing Database Schema Upgrade
-- Migration: 20260910_license_management_upgrade.sql
-- Non-breaking enhancement supporting manual license creation, customer names,
-- duration options (Trial, Yearly, Multi-Year, Lifetime, Custom Months),
-- max_devices limits, and recovery codes.

-- 1. Add new fields to public.licenses
ALTER TABLE public.licenses
    ADD COLUMN IF NOT EXISTS license_key TEXT,
    ADD COLUMN IF NOT EXISTS customer_name TEXT,
    ADD COLUMN IF NOT EXISTS duration_months INT,
    ADD COLUMN IF NOT EXISTS license_type TEXT DEFAULT 'YEARLY',
    ADD COLUMN IF NOT EXISTS max_devices INT NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS recovery_code TEXT,
    ADD COLUMN IF NOT EXISTS recovery_code_hash TEXT;

-- 2. Backfill existing records seamlessly
UPDATE public.licenses
SET license_key = display_key
WHERE license_key IS NULL AND display_key IS NOT NULL;

UPDATE public.licenses
SET customer_name = gym_name
WHERE customer_name IS NULL AND gym_name IS NOT NULL;

UPDATE public.licenses
SET license_type = CASE
    WHEN expires_at IS NULL THEN 'LIFETIME'
    WHEN plan = 'Trial' THEN 'TRIAL'
    ELSE 'YEARLY'
END
WHERE license_type IS NULL;

-- 3. Optimization Indices
CREATE INDEX IF NOT EXISTS idx_licenses_license_key ON public.licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_licenses_customer_name ON public.licenses(customer_name);
CREATE INDEX IF NOT EXISTS idx_licenses_type ON public.licenses(license_type);
CREATE INDEX IF NOT EXISTS idx_licenses_recovery_code_hash ON public.licenses(recovery_code_hash);
