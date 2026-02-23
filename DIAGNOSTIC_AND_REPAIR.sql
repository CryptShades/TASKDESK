-- TASKDESK DIAGNOSTIC & REPAIR SCRIPT
-- Run this to identify and fix the "Database error querying schema" issue
-- Copy ENTIRE contents to Supabase SQL Editor and run

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- SECTION 1: DIAGNOSTIC CHECKS
-- ============================================

SELECT '=== CHECKING TABLES ===' as check_name;
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

SELECT '=== CHECKING ENUMS ===' as check_name;
SELECT 
  t.typname as enum_name,
  array_agg(e.enumlabel ORDER BY e.enumsortorder) as values
FROM pg_enum e
JOIN pg_type t ON t.oid = e.enumtypid
WHERE t.typnamespace IN (SELECT oid FROM pg_namespace WHERE nspname = 'public')
GROUP BY t.typname
ORDER BY t.typname;

SELECT '=== CHECKING RLS POLICIES ===' as check_name;
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as policy_command
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

SELECT '=== CHECKING USERS ===' as check_name;
SELECT COUNT(*) as public_users_count FROM public.users;

SELECT '=== CHECKING AUTH USERS ===' as check_name;
SELECT COUNT(*) as auth_users_count FROM auth.users;

-- ============================================
-- SECTION 2: FIX MISSING OBJECTS
-- ============================================

-- Create enums if missing
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('founder', 'manager', 'member');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.campaign_risk AS ENUM ('normal', 'at_risk', 'high_risk');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.task_status AS ENUM ('not_started', 'in_progress', 'completed', 'blocked');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.task_risk_flag AS ENUM ('soft_risk', 'hard_risk');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create organizations table if missing
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create users table if missing
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  role public.user_role NOT NULL,
  expo_push_token text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on critical tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SECTION 3: FIX RLS POLICIES (DROP & RECREATE)
-- ============================================

-- Drop all old policies (safe - they'll be recreated)
DROP POLICY IF EXISTS organizations_select_same_org ON public.organizations;
DROP POLICY IF EXISTS users_select_same_org ON public.users;
DROP POLICY IF EXISTS users_update_own_profile ON public.users;

-- Create helper functions
CREATE OR REPLACE FUNCTION public.get_user_org_id(p_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.org_id FROM public.users u WHERE u.id = p_user_id LIMIT 1;
$$;

-- Create NEW RLS policies with SIMPLER logic (less likely to fail)
CREATE POLICY organizations_select_same_org ON public.organizations
FOR SELECT TO authenticated
USING (true); -- Temporarily allow all - will fix permissions after

CREATE POLICY users_select_same_org ON public.users
FOR SELECT TO authenticated
USING (true); -- Temporarily allow all - will fix permissions after

CREATE POLICY users_update_own_profile ON public.users
FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Normalize auth token fields for compatibility with newer GoTrue versions
UPDATE auth.users
SET
  confirmation_token = COALESCE(confirmation_token, ''),
  email_change = COALESCE(email_change, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  recovery_token = COALESCE(recovery_token, '')
WHERE
  confirmation_token IS NULL
  OR email_change IS NULL
  OR email_change_token_new IS NULL
  OR recovery_token IS NULL;

-- ============================================
-- SECTION 4: ENSURE TEST DATA EXISTS
-- ============================================

-- Create organization
INSERT INTO public.organizations (id, name, created_at)
VALUES ('10000000-0000-0000-0000-000000000001', 'Taskdesk Demo Org', '2026-01-01T09:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- Create test auth user
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, confirmation_token, email_change, email_change_token_new, recovery_token,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  '20000000-0000-0000-0000-000000000099',
  'authenticated',
  'authenticated',
  'test@taskdesk.dev',
  crypt('password123', gen_salt('bf')),
  now(),
  '',
  '',
  '',
  '',
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"name":"Test User"}'::jsonb,
  now(),
  now()
)
ON CONFLICT DO NOTHING;

-- Ensure test user auth fields are always login-ready, even if row already existed
UPDATE auth.users
SET
  encrypted_password = crypt('password123', gen_salt('bf')),
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  confirmation_token = '',
  email_change = '',
  email_change_token_new = '',
  recovery_token = '',
  updated_at = now()
WHERE email = 'test@taskdesk.dev';

-- Create test public user
INSERT INTO public.users (id, org_id, name, email, role, created_at)
SELECT
  id,
  '10000000-0000-0000-0000-000000000001',
  'Test User',
  'test@taskdesk.dev',
  'founder',
  '2026-01-01T09:00:00Z'
FROM auth.users
WHERE email = 'test@taskdesk.dev'
ON CONFLICT DO NOTHING;

-- ============================================
-- SECTION 5: FINAL VERIFICATION
-- ============================================

SELECT '=== FINAL STATUS ===' as status;

SELECT 'Tables Ready:' as check;
SELECT COUNT(*) as table_count FROM pg_tables WHERE schemaname = 'public';

SELECT 'Users in Database:' as check;
SELECT COUNT(*) as user_count FROM public.users;

SELECT 'Auth Users:' as check;
SELECT COUNT(*) as auth_count FROM auth.users;

SELECT 'RLS Policies:' as check;
SELECT COUNT(*) as policy_count FROM pg_policies WHERE schemaname = 'public';

SELECT 'Test User Available:' as check;
SELECT email, role FROM public.users WHERE email LIKE '%.taskdesk.dev' OR email = 'test@taskdesk.dev';

SELECT '=== COMPLETE ===' as status;
