-- ============================================================================
-- HoLife :: storage
-- ----------------------------------------------------------------------------
-- A single private bucket for meal photos. Object names are always
--   <user_id>/<uuid>.<ext>
-- which is what every policy below keys on.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'meal-images',
  'meal-images',
  false,
  8388608, -- 8 MiB
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "meal images are self-readable"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'meal-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "meal images are self-insertable"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'meal-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "meal images are self-updatable"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'meal-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'meal-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "meal images are self-deletable"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'meal-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
