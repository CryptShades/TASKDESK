-- COMPLETE TASKDESK SETUP + TEST USERS WITH PASSWORDS
-- Run this ONCE in Supabase SQL Editor to get a working system
-- This combines schema creation with test user data

CREATE EXTENSION IF NOT EXISTS pgcrypto;

BEGIN;

-- ============================================
-- STEP 1: CREATE ENUMS
-- ============================================
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

-- ============================================
-- STEP 2: CREATE TABLES
-- ============================================
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

CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id),
  name text NOT NULL,
  launch_date timestamptz NOT NULL,
  risk_status public.campaign_risk NOT NULL DEFAULT 'normal',
  created_by uuid NOT NULL REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  title text NOT NULL,
  owner_id uuid NOT NULL REFERENCES public.users(id),
  due_date timestamptz NOT NULL,
  dependency_id uuid REFERENCES public.tasks(id),
  status public.task_status NOT NULL DEFAULT 'not_started',
  risk_flag public.task_risk_flag,
  assigned_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT no_self_dependency CHECK (id <> dependency_id)
);

CREATE TABLE IF NOT EXISTS public.task_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  actor_id uuid NOT NULL REFERENCES public.users(id),
  event_type text NOT NULL,
  old_value text,
  new_value text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  user_id uuid NOT NULL REFERENCES public.users(id),
  task_id uuid REFERENCES public.tasks(id),
  campaign_id uuid REFERENCES public.campaigns(id),
  type text NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  delivered_push boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- STEP 3: CREATE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS campaigns_org_id_risk_status_idx ON public.campaigns (org_id, risk_status);
CREATE INDEX IF NOT EXISTS campaigns_client_id_idx ON public.campaigns (client_id);
CREATE INDEX IF NOT EXISTS tasks_campaign_id_status_idx ON public.tasks (campaign_id, status);
CREATE INDEX IF NOT EXISTS tasks_owner_id_due_date_idx ON public.tasks (owner_id, due_date);
CREATE INDEX IF NOT EXISTS task_events_task_id_created_at_desc_idx ON public.task_events (task_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_user_id_read_created_at_desc_idx ON public.notifications (user_id, read, created_at DESC);

-- ============================================
-- STEP 4: CREATE HELPER FUNCTIONS
-- ============================================
CREATE OR REPLACE FUNCTION public.get_user_org_id(p_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.org_id FROM public.users u WHERE u.id = p_user_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id uuid)
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.role FROM public.users u WHERE u.id = p_user_id LIMIT 1;
$$;

-- ============================================
-- STEP 5: ENABLE RLS
-- ============================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 6: CREATE RLS POLICIES
-- ============================================
DROP POLICY IF EXISTS organizations_select_same_org ON public.organizations;
CREATE POLICY organizations_select_same_org ON public.organizations
FOR SELECT TO authenticated
USING (id = public.get_user_org_id(auth.uid()));

DROP POLICY IF EXISTS users_select_same_org ON public.users;
CREATE POLICY users_select_same_org ON public.users
FOR SELECT TO authenticated
USING (org_id = public.get_user_org_id(auth.uid()));

DROP POLICY IF EXISTS users_update_own_profile ON public.users;
CREATE POLICY users_update_own_profile ON public.users
FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS clients_all_same_org ON public.clients;
CREATE POLICY clients_all_same_org ON public.clients
FOR ALL TO authenticated
USING (org_id = public.get_user_org_id(auth.uid()))
WITH CHECK (org_id = public.get_user_org_id(auth.uid()));

DROP POLICY IF EXISTS campaigns_select_same_org ON public.campaigns;
CREATE POLICY campaigns_select_same_org ON public.campaigns
FOR SELECT TO authenticated
USING (org_id = public.get_user_org_id(auth.uid()));

DROP POLICY IF EXISTS tasks_select_same_org ON public.tasks;
CREATE POLICY tasks_select_same_org ON public.tasks
FOR SELECT TO authenticated
USING (org_id = public.get_user_org_id(auth.uid()));

DROP POLICY IF EXISTS task_events_select_same_org ON public.task_events;
CREATE POLICY task_events_select_same_org ON public.task_events
FOR SELECT TO authenticated
USING (org_id = public.get_user_org_id(auth.uid()));

DROP POLICY IF EXISTS notifications_select_own ON public.notifications;
CREATE POLICY notifications_select_own ON public.notifications
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- ============================================
-- STEP 7: CREATE TEST DATA
-- ============================================

-- Create organization
INSERT INTO public.organizations (id, name, created_at)
VALUES ('10000000-0000-0000-0000-000000000001', 'Taskdesk Demo Org', '2026-01-01T09:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- Create auth users with passwords (encrypted with bcrypt)
-- Password for all: password123
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, confirmation_token, email_change, email_change_token_new, recovery_token,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
VALUES
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000001',
   'authenticated', 'authenticated', 'ava.founder@taskdesk.dev',
   crypt('password123', gen_salt('bf')), now(), '', '', '', '',
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"name":"Ava Founder"}'::jsonb, now(), now()),
   
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000002',
   'authenticated', 'authenticated', 'mason.manager@taskdesk.dev',
   crypt('password123', gen_salt('bf')), now(), '', '', '', '',
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"name":"Mason Manager"}'::jsonb, now(), now()),
   
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000003',
   'authenticated', 'authenticated', 'jordan.member@taskdesk.dev',
   crypt('password123', gen_salt('bf')), now(), '', '', '', '',
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"name":"Jordan Member"}'::jsonb, now(), now())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  encrypted_password = EXCLUDED.encrypted_password,
  email_confirmed_at = EXCLUDED.email_confirmed_at,
  confirmation_token = EXCLUDED.confirmation_token,
  email_change = EXCLUDED.email_change,
  email_change_token_new = EXCLUDED.email_change_token_new,
  recovery_token = EXCLUDED.recovery_token,
  raw_app_meta_data = EXCLUDED.raw_app_meta_data,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  updated_at = EXCLUDED.updated_at;

-- Backfill nullable auth token columns on existing seeded rows
UPDATE auth.users
SET
  confirmation_token = COALESCE(confirmation_token, ''),
  email_change = COALESCE(email_change, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  recovery_token = COALESCE(recovery_token, '')
WHERE
  email LIKE '%.taskdesk.dev'
  AND (
    confirmation_token IS NULL
    OR email_change IS NULL
    OR email_change_token_new IS NULL
    OR recovery_token IS NULL
  );

-- Create public user profiles (links to auth users)
INSERT INTO public.users (id, org_id, name, email, role, created_at)
VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
   'Ava Founder', 'ava.founder@taskdesk.dev', 'founder', '2026-01-01T09:00:00Z'),
   
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001',
   'Mason Manager', 'mason.manager@taskdesk.dev', 'manager', '2026-01-01T09:00:00Z'),
   
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001',
   'Jordan Member', 'jordan.member@taskdesk.dev', 'member', '2026-01-01T09:00:00Z')
ON CONFLICT (id) DO UPDATE SET
  org_id = EXCLUDED.org_id,
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role;

COMMIT;

-- ============================================
-- VERIFICATION & TEST DATA
-- ============================================
-- Check all users are set up correctly
SELECT 'Auth Users Created:' as status;
SELECT email, encrypted_password IS NOT NULL as password_hash_exists
FROM auth.users WHERE email LIKE '%.taskdesk.dev' ORDER BY email;

SELECT 'Public User Profiles Created:' as status;
SELECT email, name, role FROM public.users WHERE email LIKE '%.taskdesk.dev' ORDER BY email;

SELECT 'Users Ready to Login:' as status;
SELECT 
  au.email,
  au.encrypted_password IS NOT NULL as password_configured,
  pu.name,
  pu.role
FROM auth.users au
INNER JOIN public.users pu ON pu.id = au.id
WHERE au.email LIKE '%.taskdesk.dev'
ORDER BY au.email;
