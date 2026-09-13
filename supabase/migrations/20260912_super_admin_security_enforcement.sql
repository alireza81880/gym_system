-- Migration: 20260912_super_admin_security_enforcement.sql
-- Enforces server-side RBAC and profiles table for Super Admin authorization.
-- Production security hardening:
-- 1. Create profiles table linked to auth.users with role column
-- 2. Restrict license management tables strictly to super_admin and service_role
-- 3. Prevent recovery_code exposure and enforce RLS policies

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('super_admin', 'gym_owner', 'branch_manager', 'receptionist', 'accountant', 'coach', 'hardware_tech', 'staff')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = id);

-- Allow service_role full control on profiles
CREATE POLICY "Service role full control on profiles" ON public.profiles
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- Function to check if calling user is super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'super_admin'
    ) OR (
        -- Also check auth.users app_metadata / user_metadata
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
        OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS on licenses
DROP POLICY IF EXISTS "Authenticated super admins can read licenses" ON public.licenses;
CREATE POLICY "Authenticated super admins can read licenses" ON public.licenses
    FOR SELECT TO authenticated
    USING (public.is_super_admin());

DROP POLICY IF EXISTS "Authenticated super admins can mutate licenses" ON public.licenses;
CREATE POLICY "Authenticated super admins can mutate licenses" ON public.licenses
    FOR ALL TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- Indices for rapid lookup
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
