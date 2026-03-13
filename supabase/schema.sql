create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.budget_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  opening_balance numeric(12, 2) not null default 0,
  opening_date date not null default current_date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.recurring_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  amount numeric(12, 2) not null,
  frequency text not null check (frequency in ('once', 'daily', 'weekly', 'biweekly', 'monthly', 'yearly')),
  start_date date not null,
  end_date date null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint recurring_events_end_after_start
    check (end_date is null or end_date >= start_date)
);

drop trigger if exists set_budget_profiles_updated_at on public.budget_profiles;
create trigger set_budget_profiles_updated_at
before update on public.budget_profiles
for each row
execute procedure public.set_updated_at();

drop trigger if exists set_recurring_events_updated_at on public.recurring_events;
create trigger set_recurring_events_updated_at
before update on public.recurring_events
for each row
execute procedure public.set_updated_at();

alter table public.budget_profiles enable row level security;
alter table public.recurring_events enable row level security;

drop policy if exists "budget_profiles_select_own" on public.budget_profiles;
create policy "budget_profiles_select_own"
on public.budget_profiles
for select
using (auth.uid() = user_id);

drop policy if exists "budget_profiles_insert_own" on public.budget_profiles;
create policy "budget_profiles_insert_own"
on public.budget_profiles
for insert
with check (auth.uid() = user_id);

drop policy if exists "budget_profiles_update_own" on public.budget_profiles;
create policy "budget_profiles_update_own"
on public.budget_profiles
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "recurring_events_select_own" on public.recurring_events;
create policy "recurring_events_select_own"
on public.recurring_events
for select
using (auth.uid() = user_id);

drop policy if exists "recurring_events_insert_own" on public.recurring_events;
create policy "recurring_events_insert_own"
on public.recurring_events
for insert
with check (auth.uid() = user_id);

drop policy if exists "recurring_events_update_own" on public.recurring_events;
create policy "recurring_events_update_own"
on public.recurring_events
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "recurring_events_delete_own" on public.recurring_events;
create policy "recurring_events_delete_own"
on public.recurring_events
for delete
using (auth.uid() = user_id);

create or replace function public.handle_new_budget_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.budget_profiles (user_id, opening_balance, opening_date)
  values (new.id, 0, current_date)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_budget_profile on auth.users;
create trigger on_auth_user_created_budget_profile
after insert on auth.users
for each row
execute procedure public.handle_new_budget_user();
