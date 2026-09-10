create table if not exists public.munkaber_app_state (
  id text primary key check (id = 'main'),
  data jsonb not null default '{}'::jsonb,
  version bigint not null default 1 check (version > 0),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create index if not exists munkaber_app_state_updated_by_idx
on public.munkaber_app_state (updated_by);

alter table public.munkaber_app_state enable row level security;

revoke all on table public.munkaber_app_state from anon;
grant select, insert, update on table public.munkaber_app_state to authenticated;

drop policy if exists "munkaber_managers_read" on public.munkaber_app_state;
create policy "munkaber_managers_read"
on public.munkaber_app_state for select
to authenticated
using ((select public.is_manager()));

drop policy if exists "munkaber_managers_insert" on public.munkaber_app_state;
create policy "munkaber_managers_insert"
on public.munkaber_app_state for insert
to authenticated
with check ((select public.is_manager()) and updated_by = (select auth.uid()));

drop policy if exists "munkaber_managers_update" on public.munkaber_app_state;
create policy "munkaber_managers_update"
on public.munkaber_app_state for update
to authenticated
using ((select public.is_manager()))
with check ((select public.is_manager()) and updated_by = (select auth.uid()));

create or replace function public.touch_munkaber_app_state()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  new.version = old.version + 1;
  return new;
end;
$$;

revoke all on function public.touch_munkaber_app_state() from public, anon, authenticated;

drop trigger if exists munkaber_app_state_touch on public.munkaber_app_state;
create trigger munkaber_app_state_touch
before update on public.munkaber_app_state
for each row execute function public.touch_munkaber_app_state();

create table if not exists public.munkaber_devices (
  token_hash text primary key,
  manager_name text not null check (manager_name in ('Tamás', 'Ági')),
  created_at timestamptz not null default now(),
  last_used_at timestamptz not null default now(),
  revoked boolean not null default false
);

alter table public.munkaber_devices enable row level security;
revoke all on table public.munkaber_devices from anon, authenticated;
revoke all on table public.munkaber_app_state from anon, authenticated;

create index if not exists munkaber_devices_active_idx
on public.munkaber_devices (revoked, last_used_at);

create table if not exists public.munkaber_login_attempts (
  client_hash text primary key,
  attempts integer not null default 0,
  window_started_at timestamptz not null default now(),
  locked_until timestamptz
);

alter table public.munkaber_login_attempts enable row level security;
revoke all on table public.munkaber_login_attempts from anon, authenticated;

create table if not exists public.munkaber_records (
  kind text not null check (kind in ('meta', 'employee', 'week', 'event', 'fund')),
  record_key text not null,
  data jsonb not null default '{}'::jsonb,
  deleted boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (kind, record_key)
);

alter table public.munkaber_records enable row level security;
revoke all on table public.munkaber_records from anon, authenticated;

create index if not exists munkaber_records_updated_at_idx
on public.munkaber_records (updated_at);
