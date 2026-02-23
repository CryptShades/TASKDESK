-- Add security lifecycle columns to invitations table
--
-- expires_at:     72-hour window from creation; checked before verifyOtp
-- token_hash:     stores Supabase hashed_token for pre-flight DB lookup
-- attempt_count:  tracks failed accept attempts; invite is auto-revoked at 3
-- revoked_at:     soft-revocation timestamp (null = active)
-- accepted_at:    set on successful accept to prevent token replay

alter table public.invitations
  add column if not exists expires_at    timestamptz not null default (now() + interval '72 hours'),
  add column if not exists token_hash    text unique,
  add column if not exists attempt_count integer not null default 0,
  add column if not exists revoked_at    timestamptz,
  add column if not exists accepted_at   timestamptz;

-- Fast lookup by token_hash during invite acceptance
create index if not exists invitations_token_hash_idx on public.invitations(token_hash)
  where token_hash is not null;

-- Fast filter for pending invites (not revoked, not accepted)
create index if not exists invitations_pending_idx on public.invitations(org_id, created_at desc)
  where revoked_at is null and accepted_at is null;
