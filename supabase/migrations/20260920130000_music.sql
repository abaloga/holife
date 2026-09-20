-- ============================================================================
-- HoLife :: music collection
-- ----------------------------------------------------------------------------
-- Physical music you own. `format` is the one field the app insists on, since
-- a CD and a cassette of the same album are two different things to own.
-- ============================================================================

create type public.music_format as enum ('cd', 'cassette');

create table public.music_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  artist text check (artist is null or char_length(btrim(artist)) between 1 and 200),
  format public.music_format not null,
  release_year smallint check (release_year is null or release_year between 1877 and 2100),
  notes text check (notes is null or char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.music_items.release_year is
  'Lower bound is 1877, the year of the phonograph, so reissues of old recordings fit.';

-- The collection is listed by artist then title, which is also how anyone
-- shelves one.
create index music_items_user_sort_idx on public.music_items (user_id, artist, title);

create trigger set_updated_at before update on public.music_items
  for each row execute function public.set_updated_at();

alter table public.music_items enable row level security;

create policy "music_items are self-readable"
  on public.music_items for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "music_items are self-insertable"
  on public.music_items for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "music_items are self-updatable"
  on public.music_items for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "music_items are self-deletable"
  on public.music_items for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Stated outright rather than relying on the default privileges set in
-- 20260920120000_grants.sql, so this table is reachable even if these
-- migrations are applied out of order.
grant select, insert, update, delete on public.music_items to authenticated;
