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
alter table public.invitations enable row level security;

-- Policies
create policy "invitations_select_same_org"
on public.invitations
for select
to authenticated
using (org_id = public.get_user_org_id(auth.uid()));

create policy "invitations_insert_founder_manager"
on public.invitations
for insert
to authenticated
with check (
  org_id = public.get_user_org_id(auth.uid())
  and public.get_user_role(auth.uid()) in ('founder', 'manager')
);

create policy "invitations_delete_founder_manager"
on public.invitations
for delete
to authenticated
using (
  org_id = public.get_user_org_id(auth.uid())
  and public.get_user_role(auth.uid()) in ('founder', 'manager')
);

-- Index for performance
create index if not exists invitations_org_id_idx on public.invitations(org_id);
create index if not exists invitations_email_idx on public.invitations(email);
