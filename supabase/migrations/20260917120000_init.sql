-- ============================================================================
-- HoLife :: initial schema
-- ----------------------------------------------------------------------------
-- Conventions used by every user-owned table in this application:
--   * uuid primary key, default gen_random_uuid()
--   * user_id uuid not null references auth.users(id) on delete cascade
--   * created_at / updated_at timestamptz, updated_at maintained by trigger
--   * row level security enabled, with owner-only policies
--   * an instant (timestamptz) is the source of truth for *when* something
--     happened; a companion `local_date` column stores the calendar date the
--     user intended it to belong to, so "today" survives travel and DST.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enumerated domains
-- ---------------------------------------------------------------------------
create type public.unit_system as enum ('metric', 'imperial');
create type public.weight_unit as enum ('kg', 'lb', 'st');
create type public.theme_preference as enum ('system', 'light', 'dark');
create type public.meal_slot as enum ('breakfast', 'lunch', 'dinner', 'snack');
create type public.macro_source as enum ('manual', 'ai_estimate');
create type public.estimate_confidence as enum ('low', 'medium', 'high');
create type public.habit_frequency as enum ('daily', 'days_of_week');
create type public.goal_status as enum ('active', 'achieved', 'paused', 'archived');

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Guards client-supplied local_date values: a calendar date can never be more
-- than one day away from the UTC date of the instant it belongs to.
create or replace function public.local_date_matches(p_local_date date, p_instant timestamptz)
returns boolean
language sql
immutable
as $$
  select p_local_date between (p_instant at time zone 'UTC')::date - 1
                          and (p_instant at time zone 'UTC')::date + 1;
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (display_name is null or char_length(btrim(display_name)) between 1 and 60),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Public-facing profile for an authenticated user. One row per auth user.';

-- ---------------------------------------------------------------------------
-- user_settings
-- ---------------------------------------------------------------------------
create table public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  unit_system public.unit_system not null default 'metric',
  weight_unit public.weight_unit not null default 'kg',
  theme public.theme_preference not null default 'system',
  timezone text not null default 'UTC',
  week_start_day smallint not null default 1 check (week_start_day between 0 and 6),
  goal_weight_kg numeric(6, 2) check (goal_weight_kg is null or goal_weight_kg between 20 and 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.user_settings.week_start_day is '0 = Sunday .. 6 = Saturday';
comment on column public.user_settings.timezone is 'IANA timezone name; drives every "today" boundary in the app.';

-- ---------------------------------------------------------------------------
-- weight_entries
-- ---------------------------------------------------------------------------
create table public.weight_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  measured_at timestamptz not null default now(),
  local_date date not null,
  weight_kg numeric(6, 3) not null check (weight_kg between 20 and 500),
  note text check (note is null or char_length(note) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint weight_entries_local_date_sane check (public.local_date_matches(local_date, measured_at))
);

comment on column public.weight_entries.weight_kg is 'Canonical storage unit is always kilograms; display units are a user setting.';

create index weight_entries_user_date_idx on public.weight_entries (user_id, local_date desc);

-- ---------------------------------------------------------------------------
-- nutrition_targets
-- ---------------------------------------------------------------------------
-- One active target set per user. If per-period history is needed later, add an
-- `effective_from date` column and widen the unique constraint to include it.
create table public.nutrition_targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  calories integer not null default 2000 check (calories between 500 and 15000),
  protein_g integer not null default 150 check (protein_g between 0 and 1000),
  carbs_g integer not null default 200 check (carbs_g between 0 and 2000),
  fat_g integer not null default 65 check (fat_g between 0 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- meal_entries
-- ---------------------------------------------------------------------------
create table public.meal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  eaten_at timestamptz not null default now(),
  local_date date not null,
  name text not null check (char_length(btrim(name)) between 1 and 160),
  slot public.meal_slot,
  calories numeric(7, 1) not null default 0 check (calories between 0 and 20000),
  protein_g numeric(6, 1) not null default 0 check (protein_g between 0 and 2000),
  carbs_g numeric(6, 1) not null default 0 check (carbs_g between 0 and 2000),
  fat_g numeric(6, 1) not null default 0 check (fat_g between 0 and 2000),
  notes text check (notes is null or char_length(notes) <= 1000),
  image_path text,
  source public.macro_source not null default 'manual',
  estimate_confidence public.estimate_confidence,
  estimate_assumptions text[],
  estimate_model text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint meal_entries_local_date_sane check (public.local_date_matches(local_date, eaten_at)),
  -- Estimate metadata only makes sense on entries that actually came from one.
  constraint meal_entries_estimate_metadata check (
    source = 'ai_estimate' or (estimate_confidence is null and estimate_assumptions is null)
  )
);

comment on column public.meal_entries.source is
  'manual = user typed the numbers. ai_estimate = seeded from an estimate the user reviewed before saving.';
comment on column public.meal_entries.image_path is
  'Object path inside the private `meal-images` storage bucket, always prefixed with the owner user id.';

create index meal_entries_user_date_idx on public.meal_entries (user_id, local_date desc);

-- ---------------------------------------------------------------------------
-- habits
-- ---------------------------------------------------------------------------
create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  description text check (description is null or char_length(description) <= 500),
  icon text not null default 'sparkles',
  frequency public.habit_frequency not null default 'daily',
  days_of_week smallint[] not null default '{}',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- A day-of-week habit must name at least one day; a daily habit names none.
  constraint habits_days_of_week_valid check (
    case
      when frequency = 'days_of_week' then
        array_length(days_of_week, 1) between 1 and 7
        and days_of_week <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]
      else days_of_week = '{}'
    end
  )
);

comment on column public.habits.days_of_week is '0 = Sunday .. 6 = Saturday. Empty for daily habits.';

create index habits_user_active_idx on public.habits (user_id, is_active, sort_order);

-- ---------------------------------------------------------------------------
-- habit_completions
-- ---------------------------------------------------------------------------
create table public.habit_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  habit_id uuid not null references public.habits (id) on delete cascade,
  local_date date not null,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint habit_completions_once_per_day unique (habit_id, local_date)
);

create index habit_completions_user_date_idx on public.habit_completions (user_id, local_date desc);

-- ---------------------------------------------------------------------------
-- tasks
-- ---------------------------------------------------------------------------
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  notes text check (notes is null or char_length(notes) <= 2000),
  due_date date,
  due_time time,
  priority smallint not null default 0 check (priority between 0 and 3),
  is_completed boolean not null default false,
  completed_at timestamptz,
  -- Recurrence storage exists from day one so recurring tasks do not need a
  -- migration later; the first release only writes null here.
  recurrence jsonb,
  recurrence_parent_id uuid references public.tasks (id) on delete set null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasks_due_time_needs_date check (due_time is null or due_date is not null),
  constraint tasks_completed_at_consistent check (
    (is_completed and completed_at is not null) or (not is_completed and completed_at is null)
  )
);

comment on column public.tasks.priority is '0 = none, 1 = low, 2 = medium, 3 = high';

create index tasks_user_open_due_idx on public.tasks (user_id, due_date) where not is_completed;
create index tasks_user_completed_idx on public.tasks (user_id, completed_at desc) where is_completed;

-- ---------------------------------------------------------------------------
-- goals
-- ---------------------------------------------------------------------------
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 160),
  description text check (description is null or char_length(description) <= 2000),
  target_date date,
  status public.goal_status not null default 'active',
  start_value numeric(12, 3),
  target_value numeric(12, 3),
  current_value numeric(12, 3),
  unit text check (unit is null or char_length(unit) <= 24),
  -- Reserved hook for cross-module goals (e.g. 'weight_kg', 'habit:<uuid>').
  -- Nothing reads it yet; it exists so linked goals need no schema change.
  metric_key text check (metric_key is null or char_length(metric_key) <= 80),
  completed_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint goals_quantitative_pair check (
    (target_value is null) or (current_value is not null)
  )
);

create index goals_user_status_idx on public.goals (user_id, status, sort_order);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'user_settings', 'weight_entries', 'nutrition_targets',
    'meal_entries', 'habits', 'tasks', 'goals'
  ]
  loop
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at()', t
    );
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- New-user bootstrap: every auth user gets a profile and a settings row.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    nullif(btrim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), '')
  )
  on conflict (id) do nothing;

  insert into public.user_settings (user_id, timezone)
  values (
    new.id,
    coalesce(nullif(btrim(coalesce(new.raw_user_meta_data ->> 'timezone', '')), ''), 'UTC')
  )
  on conflict (user_id) do nothing;

  insert into public.nutrition_targets (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.weight_entries enable row level security;
alter table public.nutrition_targets enable row level security;
alter table public.meal_entries enable row level security;
alter table public.habits enable row level security;
alter table public.habit_completions enable row level security;
alter table public.tasks enable row level security;
alter table public.goals enable row level security;

-- profiles keys on `id` rather than `user_id`.
create policy "profiles are self-readable"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);
create policy "profiles are self-insertable"
  on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id);
create policy "profiles are self-updatable"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Owner-only CRUD for every table keyed on user_id.
do $$
declare
  t text;
begin
  foreach t in array array[
    'user_settings', 'weight_entries', 'nutrition_targets', 'meal_entries',
    'habits', 'habit_completions', 'tasks', 'goals'
  ]
  loop
    execute format(
      'create policy "%1$s are self-readable" on public.%1$I
         for select to authenticated using ((select auth.uid()) = user_id)', t
    );
    execute format(
      'create policy "%1$s are self-insertable" on public.%1$I
         for insert to authenticated with check ((select auth.uid()) = user_id)', t
    );
    execute format(
      'create policy "%1$s are self-updatable" on public.%1$I
         for update to authenticated using ((select auth.uid()) = user_id)
         with check ((select auth.uid()) = user_id)', t
    );
    execute format(
      'create policy "%1$s are self-deletable" on public.%1$I
         for delete to authenticated using ((select auth.uid()) = user_id)', t
    );
  end loop;
end;
$$;

-- A completion must point at a habit the same user owns.
create policy "habit completions reference own habits"
  on public.habit_completions as restrictive for all to authenticated
  using (
    exists (
      select 1 from public.habits h
      where h.id = habit_completions.habit_id
        and h.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.habits h
      where h.id = habit_completions.habit_id
        and h.user_id = (select auth.uid())
    )
  );
