-- ============================================================================
-- HoLife :: table privileges
-- ----------------------------------------------------------------------------
-- Row level security decides WHICH ROWS a role may touch. It does not let the
-- role touch the table at all. Without a GRANT, PostgREST rejects every request
-- with 42501 "permission denied for table ..." before a single policy is
-- consulted, which looks exactly like a broken app: every screen fails to load
-- even though the schema and the policies are correct.
--
-- Supabase normally issues these grants through default privileges on the
-- public schema. That does not happen on every project, so this migration
-- states them outright.
--
-- Only `authenticated` is granted. Every policy in the initial schema targets
-- that role, and nothing in this app is readable while signed out.
-- ============================================================================

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete
  on all tables in schema public
  to authenticated;

-- So that a table added by a later migration is not silently unreachable in the
-- same way these were.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
