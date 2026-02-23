-- DETAILED GUIDE: How Password Authentication Works in Taskdesk
-- This explains the separation of concerns between auth.users and public.users

/*
┌─────────────────────────────────────────────────────────────┐
│ AUTHENTICATION FLOW                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 1. User enters email/password on login page                 │
│ 2. Supabase Auth checks auth.users.encrypted_password       │
│ 3. If valid → Returns JWT token                             │
│ 4. App queries public.users for user profile using JWT      │
│ 5. RLS policies ensure users only see their own org         │
│                                                             │
└─────────────────────────────────────────────────────────────┘

TWO SEPARATE TABLES WITH ONE ID:

┌────────────────────────────────┐
│      auth.users (System)       │  ← PASSWORDS HERE
├────────────────────────────────┤
│ id: UUID                       │
│ email: text                    │
│ encrypted_password: text hash  │ 🔐 Bcrypt hashed
│ email_confirmed_at: timestamp  │
│ created_at: timestamp          │
└────────────────────────────────┘
         ↓ Same ID ↓
┌────────────────────────────────┐
│      public.users (App)        │  ← PROFILE DATA ONLY
├────────────────────────────────┤
│ id: UUID (FK → auth.users)     │
│ org_id: UUID (FK → org)        │
│ name: text                     │
│ email: text (display)          │
│ role: user_role enum           │
│ expo_push_token: text          │
│ created_at: timestamp          │
└────────────────────────────────┘
*/

-- STEP 1: CREATE AUTH USER (with password)
-- This is where the encrypted_password lives
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,        -- 🔐 PASSWORD HASHED HERE with bcrypt
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  '20000000-0000-0000-0000-000000000001',  -- This ID
  'authenticated',
  'authenticated',
  'ava.founder@taskdesk.dev',
  crypt('password123', gen_salt('bf')),   -- Password hashed with bcrypt
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"name":"Ava Founder"}'::jsonb,
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

-- STEP 2: CREATE PUBLIC USER (profile only, NO PASSWORD)
-- Links to auth user with same ID
INSERT INTO public.users (
  id,               -- SAME ID as auth.users above
  org_id,
  name,
  email,            -- For display only (not for auth)
  role,
  created_at
)
VALUES (
  '20000000-0000-0000-0000-000000000001',  -- Links to auth.users
  '10000000-0000-0000-0000-000000000001',  -- The org
  'Ava Founder',
  'ava.founder@taskdesk.dev',
  'founder',
  '2026-01-01T09:00:00Z'
)
ON CONFLICT (id) DO NOTHING;

-- STEP 3: VERIFY SETUP
-- Run these queries to verify passwords are stored correctly:

-- Check auth user exists
SELECT id, email, encrypted_password IS NOT NULL as has_password_hash, email_confirmed_at 
FROM auth.users 
WHERE email = 'ava.founder@taskdesk.dev';

-- Check public user exists
SELECT id, email, role, org_id 
FROM public.users 
WHERE email = 'ava.founder@taskdesk.dev';

-- Test that they link correctly
SELECT 
  au.email,
  au.encrypted_password IS NOT NULL as password_encrypted,
  pu.name,
  pu.role
FROM auth.users au
INNER JOIN public.users pu ON pu.id = au.id
WHERE au.email = 'ava.founder@taskdesk.dev';

/*
SECURITY GUARANTEES:

✅ PASSWORDS NEVER VISIBLE:
   - stored as bcrypt hash in auth.users
   - cannot be queried or accessed by app code
   - Supabase handles hashing/salting

✅ DATA SEPARATION:
   - auth.users: Authentication only
   - public.users: User profiles and roles
   - RLS prevents cross-org visibility

✅ LOGIN FLOW:
   1. Client sends email/password to Supabase Auth endpoint
   2. Supabase verifies against auth.users.encrypted_password
   3. Returns JWT containing user ID
   4. App uses JWT to query public.users (subject to RLS)
   5. User can only see their org's data

❌ DO NOT:
   - Add password_field to public.users
   - Store plaintext passwords anywhere
   - Query auth.users from your app
   - Expose encrypted_password in responses
*/