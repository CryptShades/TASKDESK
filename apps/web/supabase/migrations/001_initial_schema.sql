-- Taskdesk initial production schema
-- Designed for Supabase SQL Editor

create extension if not exists pgcrypto;

-- STEP 1: Enums
create type public.user_role as enum ('founder', 'manager', 'member');
create type public.campaign_risk as enum ('normal', 'at_risk', 'high_risk');
create type public.task_status as enum ('not_started', 'in_progress', 'completed', 'blocked');
create type public.task_risk_flag as enum ('soft_risk', 'hard_risk');

-- STEP 2: Tables (dependency order)
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid not null references public.organizations(id),
  name text not null,
  email text not null unique,
  role public.user_role not null,
  expo_push_token text,
  created_at timestamptz not null default now()
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.campaigns (
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

create table public.tasks (
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

create table public.task_events (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  org_id uuid not null references public.organizations(id),
  actor_id uuid not null references public.users(id),
  event_type text not null,
  old_value text,
  new_value text,
  created_at timestamptz not null default now()
);

create table public.notifications (
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
create index campaigns_org_id_risk_status_idx on public.campaigns (org_id, risk_status);
create index campaigns_client_id_idx on public.campaigns (client_id);
create index campaigns_launch_date_idx on public.campaigns (launch_date);

create index tasks_campaign_id_status_idx on public.tasks (campaign_id, status);
create index tasks_owner_id_due_date_idx on public.tasks (owner_id, due_date);
create index tasks_org_id_status_due_date_idx on public.tasks (org_id, status, due_date);
create index tasks_dependency_id_idx on public.tasks (dependency_id);

create index task_events_task_id_created_at_desc_idx on public.task_events (task_id, created_at desc);
create index task_events_org_id_created_at_desc_idx on public.task_events (org_id, created_at desc);

create index notifications_user_id_read_created_at_desc_idx on public.notifications (user_id, read, created_at desc);
create index notifications_org_id_idx on public.notifications (org_id);

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

create trigger tasks_set_updated_at
before update on public.tasks
for each row
execute function public.set_updated_at();

create trigger campaigns_set_updated_at
before update on public.campaigns
for each row
execute function public.set_updated_at();

-- STEP 5: Row Level Security
alter table public.organizations enable row level security;
alter table public.users enable row level security;
alter table public.clients enable row level security;
alter table public.campaigns enable row level security;
alter table public.tasks enable row level security;
alter table public.task_events enable row level security;
alter table public.notifications enable row level security;

-- organizations
create policy organizations_select_same_org
on public.organizations
for select
to authenticated
using (id = public.get_user_org_id(auth.uid()));
-- no insert policy: handled by service role

-- users
create policy users_select_same_org
on public.users
for select
to authenticated
using (org_id = public.get_user_org_id(auth.uid()));

create policy users_update_own_profile
on public.users
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- clients
create policy clients_all_same_org
on public.clients
for all
to authenticated
using (org_id = public.get_user_org_id(auth.uid()))
with check (org_id = public.get_user_org_id(auth.uid()));

-- campaigns
create policy campaigns_select_same_org
on public.campaigns
for select
to authenticated
using (org_id = public.get_user_org_id(auth.uid()));

create policy campaigns_insert_manager_or_founder
on public.campaigns
for insert
to authenticated
with check (
  org_id = public.get_user_org_id(auth.uid())
  and public.get_user_role(auth.uid()) in ('founder', 'manager')
);

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

create policy campaigns_delete_founder_only
on public.campaigns
for delete
to authenticated
using (
  org_id = public.get_user_org_id(auth.uid())
  and public.get_user_role(auth.uid()) = 'founder'
);

-- tasks
create policy tasks_select_same_org
on public.tasks
for select
to authenticated
using (org_id = public.get_user_org_id(auth.uid()));

create policy tasks_insert_manager_or_founder
on public.tasks
for insert
to authenticated
with check (
  org_id = public.get_user_org_id(auth.uid())
  and public.get_user_role(auth.uid()) in ('founder', 'manager')
);

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

create policy tasks_delete_manager_or_founder
on public.tasks
for delete
to authenticated
using (
  org_id = public.get_user_org_id(auth.uid())
  and public.get_user_role(auth.uid()) in ('founder', 'manager')
);

-- task_events (append-only)
create policy task_events_select_same_org
on public.task_events
for select
to authenticated
using (org_id = public.get_user_org_id(auth.uid()));

create policy task_events_insert_same_org
on public.task_events
for insert
to authenticated
with check (org_id = public.get_user_org_id(auth.uid()));
-- no update/delete policy: append-only

-- notifications
create policy notifications_select_own
on public.notifications
for select
to authenticated
using (user_id = auth.uid());

create policy notifications_update_own
on public.notifications
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
-- no insert policy: handled by service role
