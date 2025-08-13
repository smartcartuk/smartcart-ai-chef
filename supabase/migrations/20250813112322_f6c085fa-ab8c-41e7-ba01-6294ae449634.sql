-- Function to auto-update updated_at
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  address jsonb,
  dietary_preferences text[] default '{}',
  allergies text[] default '{}',
  household_size integer default 1 check (household_size > 0),
  weekly_budget numeric(10,2) default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy if not exists "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy if not exists "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy if not exists "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

create policy if not exists "profiles_delete_own"
  on public.profiles for delete
  to authenticated
  using (auth.uid() = id);

create trigger profiles_updated_at
before update on public.profiles
for each row execute function public.update_updated_at();

-- Connected stores
create table if not exists public.connected_stores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  has_loyalty_card boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, name)
);

alter table public.connected_stores enable row level security;

create policy if not exists "stores_select_own"
  on public.connected_stores for select
  to authenticated
  using (auth.uid() = user_id);

create policy if not exists "stores_insert_own"
  on public.connected_stores for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy if not exists "stores_update_own"
  on public.connected_stores for update
  to authenticated
  using (auth.uid() = user_id);

create policy if not exists "stores_delete_own"
  on public.connected_stores for delete
  to authenticated
  using (auth.uid() = user_id);

create trigger connected_stores_updated_at
before update on public.connected_stores
for each row execute function public.update_updated_at();

-- Meal plans
create table if not exists public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, week_start)
);

alter table public.meal_plans enable row level security;

create policy if not exists "plans_select_own"
  on public.meal_plans for select
  to authenticated
  using (auth.uid() = user_id);

create policy if not exists "plans_insert_own"
  on public.meal_plans for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy if not exists "plans_update_own"
  on public.meal_plans for update
  to authenticated
  using (auth.uid() = user_id);

create policy if not exists "plans_delete_own"
  on public.meal_plans for delete
  to authenticated
  using (auth.uid() = user_id);

create trigger meal_plans_updated_at
before update on public.meal_plans
for each row execute function public.update_updated_at();

-- Shopping lists
create table if not exists public.shopping_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  items jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, week_start)
);

alter table public.shopping_lists enable row level security;

create policy if not exists "lists_select_own"
  on public.shopping_lists for select
  to authenticated
  using (auth.uid() = user_id);

create policy if not exists "lists_insert_own"
  on public.shopping_lists for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy if not exists "lists_update_own"
  on public.shopping_lists for update
  to authenticated
  using (auth.uid() = user_id);

create policy if not exists "lists_delete_own"
  on public.shopping_lists for delete
  to authenticated
  using (auth.uid() = user_id);

create trigger shopping_lists_updated_at
before update on public.shopping_lists
for each row execute function public.update_updated_at();