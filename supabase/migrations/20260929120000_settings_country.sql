-- ============================================================================
-- HoLife :: settings country
-- ----------------------------------------------------------------------------
-- Which country's national holidays the Today widget looks up. Defaults to US
-- so a new account needs no extra choice at signup; changing it lives in
-- Settings like every other preference.
-- ============================================================================

alter table public.user_settings
  add column country text not null default 'US' check (country ~ '^[A-Z]{2}$');

comment on column public.user_settings.country is
  'ISO 3166-1 alpha-2 country code, e.g. US, GB, CA. Drives the holidays widget.';
