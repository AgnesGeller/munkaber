create table if not exists public.munkaber_app_state (
  id text primary key check (id = 'main'),
  data jsonb not null default '{}'::jsonb,
  version bigint not null default 1 check (version > 0),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

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
