-- ============================================================================
-- HoLife :: Today dashboard widgets
-- ----------------------------------------------------------------------------
-- Which chart widgets a user has added to the Today dashboard, and in what
-- order. The catalogue of available widgets (what a widget_key means, what it
-- renders) lives in the app, not the database — this table only ever stores a
-- key and a position.
-- ============================================================================

create table public.dashboard_widgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  widget_key text not null check (char_length(widget_key) between 1 and 100),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, widget_key)
);

create index dashboard_widgets_user_sort_idx on public.dashboard_widgets (user_id, sort_order);

alter table public.dashboard_widgets enable row level security;

create policy "dashboard_widgets are self-readable"
  on public.dashboard_widgets for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "dashboard_widgets are self-insertable"
  on public.dashboard_widgets for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "dashboard_widgets are self-updatable"
  on public.dashboard_widgets for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "dashboard_widgets are self-deletable"
  on public.dashboard_widgets for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Stated outright rather than relying on the default privileges set in
-- 20260920120000_grants.sql, so this table is reachable even if these
-- migrations are applied out of order.
grant select, insert, update, delete on public.dashboard_widgets to authenticated;
