-- Taskdesk initial production schema
-- Designed for Supabase SQL Editor

create extension if not exists pgcrypto;

-- STEP 1: Enums
do $$ begin
  create type public.user_role as enum ('founder', 'manager', 'member');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.campaign_risk as enum ('normal', 'at_risk', 'high_risk');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.task_status as enum ('not_started', 'in_progress', 'completed', 'blocked');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.task_risk_flag as enum ('soft_risk', 'hard_risk');
exception
  when duplicate_object then null;
end $$;

-- STEP 2: Tables (dependency order)
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid not null references public.organizations(id),
  name text not null,
  email text not null unique,
  role public.user_role not null,
  expo_push_token text,
  created_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id),
  name text not null,
  launch_date timestamptz not null,
  risk_status public.campaign_risk not null default 'normal',
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  org_id uuid not null references public.organizations(id),
  title text not null,
  owner_id uuid not null references public.users(id),
  due_date timestamptz not null,
  dependency_id uuid references public.tasks(id),
  status public.task_status not null default 'not_started',
  risk_flag public.task_risk_flag,
  assigned_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint no_self_dependency check (id <> dependency_id)
);

create table if not exists public.task_events (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  org_id uuid not null references public.organizations(id),
  actor_id uuid not null references public.users(id),
  event_type text not null,
  old_value text,
  new_value text,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id),
  user_id uuid not null references public.users(id),
  task_id uuid references public.tasks(id),
  campaign_id uuid references public.campaigns(id),
  type text not null,
  message text not null,
  read boolean not null default false,
  delivered_push boolean not null default false,
  created_at timestamptz not null default now()
);

-- STEP 3: Indexes
create index if not exists campaigns_org_id_risk_status_idx on public.campaigns (org_id, risk_status);
create index if not exists campaigns_client_id_idx on public.campaigns (client_id);
create index if not exists campaigns_launch_date_idx on public.campaigns (launch_date);

create index if not exists tasks_campaign_id_status_idx on public.tasks (campaign_id, status);
create index if not exists tasks_owner_id_due_date_idx on public.tasks (owner_id, due_date);
create index if not exists tasks_org_id_status_due_date_idx on public.tasks (org_id, status, due_date);
create index if not exists tasks_dependency_id_idx on public.tasks (dependency_id);

create index if not exists task_events_task_id_created_at_desc_idx on public.task_events (task_id, created_at desc);
create index if not exists task_events_org_id_created_at_desc_idx on public.task_events (org_id, created_at desc);

create index if not exists notifications_user_id_read_created_at_desc_idx on public.notifications (user_id, read, created_at desc);
create index if not exists notifications_org_id_idx on public.notifications (org_id);

-- STEP 6: Helper functions (created before policies so policies can reference them)
create or replace function public.get_user_org_id(p_user_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select u.org_id
  from public.users u
  where u.id = p_user_id
  limit 1;
$$;

create or replace function public.get_user_role(p_user_id uuid)
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select u.role
  from public.users u
  where u.id = p_user_id
  limit 1;
$$;

-- STEP 4: Triggers
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Create triggers conditionally
do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'tasks_set_updated_at') then
    create trigger tasks_set_updated_at
    before update on public.tasks
    for each row
    execute function public.set_updated_at();
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'campaigns_set_updated_at') then
    create trigger campaigns_set_updated_at
    before update on public.campaigns
    for each row
    execute function public.set_updated_at();
  end if;
end $$;

-- STEP 5: Row Level Security
do $$ begin
  if not exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace where c.relname = 'organizations' and n.nspname = 'public' and c.relrowsecurity = true) then
    alter table public.organizations enable row level security;
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace where c.relname = 'users' and n.nspname = 'public' and c.relrowsecurity = true) then
    alter table public.users enable row level security;
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace where c.relname = 'clients' and n.nspname = 'public' and c.relrowsecurity = true) then
    alter table public.clients enable row level security;
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace where c.relname = 'campaigns' and n.nspname = 'public' and c.relrowsecurity = true) then
    alter table public.campaigns enable row level security;
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace where c.relname = 'tasks' and n.nspname = 'public' and c.relrowsecurity = true) then
    alter table public.tasks enable row level security;
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace where c.relname = 'task_events' and n.nspname = 'public' and c.relrowsecurity = true) then
    alter table public.task_events enable row level security;
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace where c.relname = 'notifications' and n.nspname = 'public' and c.relrowsecurity = true) then
    alter table public.notifications enable row level security;
  end if;
end $$;

-- organizations
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'organizations' and policyname = 'organizations_select_same_org') then
    create policy organizations_select_same_org
    on public.organizations
    for select
    to authenticated
    using (id = public.get_user_org_id(auth.uid()));
  end if;
end $$;
-- no insert policy: handled by service role

-- users
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'users' and policyname = 'users_select_same_org') then
    create policy users_select_same_org
    on public.users
    for select
    to authenticated
    using (org_id = public.get_user_org_id(auth.uid()));
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'users' and policyname = 'users_update_own_profile') then
    create policy users_update_own_profile
    on public.users
    for update
    to authenticated
    using (id = auth.uid())
    with check (id = auth.uid());
  end if;
end $$;

-- clients
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'clients' and policyname = 'clients_all_same_org') then
    create policy clients_all_same_org
    on public.clients
    for all
    to authenticated
    using (org_id = public.get_user_org_id(auth.uid()))
    with check (org_id = public.get_user_org_id(auth.uid()));
  end if;
end $$;

-- campaigns
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'campaigns' and policyname = 'campaigns_select_same_org') then
    create policy campaigns_select_same_org
    on public.campaigns
    for select
    to authenticated
    using (org_id = public.get_user_org_id(auth.uid()));
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'campaigns' and policyname = 'campaigns_insert_manager_or_founder') then
    create policy campaigns_insert_manager_or_founder
    on public.campaigns
    for insert
    to authenticated
    with check (
      org_id = public.get_user_org_id(auth.uid())
      and public.get_user_role(auth.uid()) in ('founder', 'manager')
    );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'campaigns' and policyname = 'campaigns_update_manager_or_founder') then
    create policy campaigns_update_manager_or_founder
    on public.campaigns
    for update
    to authenticated
    using (
      org_id = public.get_user_org_id(auth.uid())
      and public.get_user_role(auth.uid()) in ('founder', 'manager')
    )
    with check (
      org_id = public.get_user_org_id(auth.uid())
      and public.get_user_role(auth.uid()) in ('founder', 'manager')
    );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'campaigns' and policyname = 'campaigns_delete_founder_only') then
    create policy campaigns_delete_founder_only
    on public.campaigns
    for delete
    to authenticated
    using (
      org_id = public.get_user_org_id(auth.uid())
      and public.get_user_role(auth.uid()) = 'founder'
    );
  end if;
end $$;

-- tasks
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'tasks' and policyname = 'tasks_select_same_org') then
    create policy tasks_select_same_org
    on public.tasks
    for select
    to authenticated
    using (org_id = public.get_user_org_id(auth.uid()));
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'tasks' and policyname = 'tasks_insert_manager_or_founder') then
    create policy tasks_insert_manager_or_founder
    on public.tasks
    for insert
    to authenticated
    with check (
      org_id = public.get_user_org_id(auth.uid())
      and public.get_user_role(auth.uid()) in ('founder', 'manager')
    );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'tasks' and policyname = 'tasks_update_manager_or_owner') then
    create policy tasks_update_manager_or_owner
    on public.tasks
    for update
    to authenticated
    using (
      org_id = public.get_user_org_id(auth.uid())
      and (
        public.get_user_role(auth.uid()) in ('founder', 'manager')
        or owner_id = auth.uid()
      )
    )
    with check (
      org_id = public.get_user_org_id(auth.uid())
      and (
        public.get_user_role(auth.uid()) in ('founder', 'manager')
        or owner_id = auth.uid()
      )
    );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'tasks' and policyname = 'tasks_delete_manager_or_founder') then
    create policy tasks_delete_manager_or_founder
    on public.tasks
    for delete
    to authenticated
    using (
      org_id = public.get_user_org_id(auth.uid())
      and public.get_user_role(auth.uid()) in ('founder', 'manager')
    );
  end if;
end $$;

-- task_events (append-only)
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'task_events' and policyname = 'task_events_select_same_org') then
    create policy task_events_select_same_org
    on public.task_events
    for select
    to authenticated
    using (org_id = public.get_user_org_id(auth.uid()));
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'task_events' and policyname = 'task_events_insert_same_org') then
    create policy task_events_insert_same_org
    on public.task_events
    for insert
    to authenticated
    with check (org_id = public.get_user_org_id(auth.uid()));
  end if;
end $$;
-- no update/delete policy: append-only

-- notifications
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'notifications' and policyname = 'notifications_select_own') then
    create policy notifications_select_own
    on public.notifications
    for select
    to authenticated
    using (user_id = auth.uid());
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'notifications' and policyname = 'notifications_update_own') then
    create policy notifications_update_own
    on public.notifications
    for update
    to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());
  end if;
end $$;
-- no insert policy: handled by service role
-- Create invitations table for team management
create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  role public.user_role not null default 'member',
  invited_by uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(org_id, email)
);

-- Enable RLS
do $$ begin
  if not exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace where c.relname = 'invitations' and n.nspname = 'public' and c.relrowsecurity = true) then
    alter table public.invitations enable row level security;
  end if;
end $$;

-- Policies
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'invitations' and policyname = 'invitations_select_same_org') then
    create policy "invitations_select_same_org"
    on public.invitations
    for select
    to authenticated
    using (org_id = public.get_user_org_id(auth.uid()));
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'invitations' and policyname = 'invitations_insert_founder_manager') then
    create policy "invitations_insert_founder_manager"
    on public.invitations
    for insert
    to authenticated
    with check (
      org_id = public.get_user_org_id(auth.uid())
      and public.get_user_role(auth.uid()) in ('founder', 'manager')
    );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'invitations' and policyname = 'invitations_delete_founder_manager') then
    create policy "invitations_delete_founder_manager"
    on public.invitations
    for delete
    to authenticated
    using (
      org_id = public.get_user_org_id(auth.uid())
      and public.get_user_role(auth.uid()) in ('founder', 'manager')
    );
  end if;
end $$;

-- Index for performance
create index if not exists invitations_org_id_idx on public.invitations(org_id);
create index if not exists invitations_email_idx on public.invitations(email);
-- Worker distributed lock table.
-- Prevents concurrent execution of cron workers when multiple Vercel
-- invocations overlap (e.g., slow run from previous hour still in flight).
-- Locks are acquired with INSERT ... ON CONFLICT DO NOTHING.
-- Expired locks (expires_at < NOW()) are treated as available for acquisition.

CREATE TABLE IF NOT EXISTS worker_locks (
  id          text        PRIMARY KEY,
  locked_at   timestamptz NOT NULL DEFAULT NOW(),
  expires_at  timestamptz NOT NULL
);

-- Service-role only: workers run with the service-role key via the cron routes.
-- No public read/write needed.
do $$ begin
  if not exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace where c.relname = 'worker_locks' and n.nspname = 'public' and c.relrowsecurity = true) then
    ALTER TABLE worker_locks ENABLE ROW LEVEL SECURITY;
  end if;
end $$;

-- No RLS policies — all access is via the service role which bypasses RLS.
-- Regular authenticated users cannot read or write this table.
-- Add composite indexes on task_events table for efficient querying
-- These indexes support common query patterns used throughout the application

-- Index for queries like: SELECT * FROM task_events WHERE task_id = $1 ORDER BY created_at DESC
-- Optimizes single-task event history lookups
CREATE INDEX IF NOT EXISTS idx_task_events_task_created ON task_events(task_id, created_at DESC);

-- Index for queries like: SELECT * FROM task_events WHERE org_id = $1 AND event_type = $2 ORDER BY created_at DESC
-- Optimizes org-level event filtering by type (e.g., fetching all escalation events for an org)
CREATE INDEX IF NOT EXISTS idx_task_events_org_type_created ON task_events(org_id, event_type, created_at DESC);
-- Add cursor tracking columns to worker_locks table for pagination support.
-- Enables background workers to process large datasets in batches without
-- exceeding Vercel's 60-second function timeout.

ALTER TABLE worker_locks
ADD COLUMN IF NOT EXISTS last_processed_org_id uuid,
ADD COLUMN IF NOT EXISTS page_size integer DEFAULT 10;

-- last_processed_org_id: cursor for org pagination. NULL means start from beginning.
-- page_size: number of orgs to process per invocation. Default 10 is safe for
--           most deployments. Can be adjusted based on task volume and performance.
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
