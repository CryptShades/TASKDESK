-- Complete User Setup Script for Taskdesk
-- This script creates both auth users (with passwords) and public users (profiles)
-- Run this in Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS pgcrypto;

BEGIN;

-- Step 1: Ensure organization exists
INSERT INTO public.organizations (id, name, created_at)
VALUES ('10000000-0000-0000-0000-000000000001', 'Taskdesk Demo Org', '2026-01-01T09:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- Step 2: Create auth users with passwords (these enable login)
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, confirmation_token, email_change, email_change_token_new, recovery_token,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
VALUES
  -- Founder user: password = password123
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated',
   'ava.founder@taskdesk.dev', crypt('password123', gen_salt('bf')), now(), '', '', '', '',
   '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Ava Founder"}'::jsonb, now(), now()),
  
  -- Manager user: password = password123
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated',
   'mason.manager@taskdesk.dev', crypt('password123', gen_salt('bf')), now(), '', '', '', '',
   '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Mason Manager"}'::jsonb, now(), now()),
  
  -- Member user: password = password123
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated',
   'jordan.member@taskdesk.dev', crypt('password123', gen_salt('bf')), now(), '', '', '', '',
   '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Jordan Member"}'::jsonb, now(), now())
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

-- Step 3: Create public user profiles (links to auth users)
INSERT INTO public.users (id, org_id, name, email, role, created_at)
VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Ava Founder', 'ava.founder@taskdesk.dev', 'founder', '2026-01-01T09:00:00Z'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Mason Manager', 'mason.manager@taskdesk.dev', 'manager', '2026-01-01T09:00:00Z'),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'Jordan Member', 'jordan.member@taskdesk.dev', 'member', '2026-01-01T09:00:00Z')
ON CONFLICT (id) DO UPDATE SET
  org_id = EXCLUDED.org_id,
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role;

COMMIT;

-- VERIFICATION QUERIES (run these to confirm setup)
-- ================================================

-- Check auth users have passwords
SELECT email, encrypted_password IS NOT NULL as has_password_hash, email_confirmed_at
FROM auth.users
WHERE email LIKE '%.taskdesk.dev'
ORDER BY email;

-- Check public users exist
SELECT email, name, role, org_id
FROM public.users
WHERE email LIKE '%.taskdesk.dev'
ORDER BY email;

-- Check the link between auth and public users
SELECT 
  au.email,
  au.encrypted_password IS NOT NULL as password_hashed,
  pu.name,
  pu.role,
  pu.org_id
FROM auth.users au
INNER JOIN public.users pu ON pu.id = au.id
WHERE au.email LIKE '%.taskdesk.dev'
ORDER BY au.email;

-- Count total users
SELECT 
  (SELECT COUNT(*) FROM auth.users) as auth_users_count,
  (SELECT COUNT(*) FROM public.users) as public_users_count;
