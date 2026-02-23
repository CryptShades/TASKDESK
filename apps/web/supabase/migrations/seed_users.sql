-- Seed data for testing login
-- Run this AFTER the quick_fix.sql script

BEGIN;

-- Create test organization
INSERT INTO public.organizations (id, name, created_at)
VALUES (
  '10000000-0000-0000-0000-000000000001',
  'Taskdesk Demo Org',
  '2026-01-01T09:00:00Z'
)
ON CONFLICT (id) DO NOTHING;

-- Create auth users (these must exist in auth.users first)
-- Note: These will only work if the auth users exist
-- You may need to create them manually in Supabase Auth

-- Insert public users (link to auth users)
INSERT INTO public.users (id, org_id, name, email, role, created_at)
VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Ava Founder', 'ava.founder@taskdesk.dev', 'founder', '2026-01-01T09:00:00Z'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Mason Manager', 'mason.manager@taskdesk.dev', 'manager', '2026-01-01T09:00:00Z'),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'Jordan Member', 'jordan.member@taskdesk.dev', 'member', '2026-01-01T09:00:00Z')
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- Check results
SELECT 'Final user count:' as info, COUNT(*) as count FROM public.users;
SELECT email, role FROM public.users ORDER BY email;