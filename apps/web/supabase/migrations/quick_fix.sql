-- Quick diagnostic and fix script
-- Run this in Supabase SQL Editor

-- 1. Check current state
SELECT 'Current tables:' as info;
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

SELECT 'Current types:' as info;
SELECT typname FROM pg_type WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') AND typtype = 'e' ORDER BY typname;

-- 2. Create missing types (safe)
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

-- 3. Create essential tables (safe)
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  role public.user_role NOT NULL,
  expo_push_token text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 5. Create essential policies
DROP POLICY IF EXISTS users_select_same_org ON public.users;
CREATE POLICY users_select_same_org ON public.users
FOR SELECT TO authenticated
USING (org_id = (SELECT org_id FROM public.users WHERE id = auth.uid()));

-- 6. Create helper function
CREATE OR REPLACE FUNCTION public.get_user_org_id(p_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.org_id FROM public.users u WHERE u.id = p_user_id LIMIT 1;
$$;

-- 7. Check if we have users
SELECT 'Users in database:' as info, COUNT(*) as count FROM public.users;