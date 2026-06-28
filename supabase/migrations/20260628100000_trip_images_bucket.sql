-- Create Supabase Storage bucket for trip images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'trip-images',
  'trip-images',
  true,
  5242880,  -- 5 MB per file
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do nothing;

-- ── RLS policies ──────────────────────────────────────────────────────────

-- Allow verified trip organizers to upload images to their own folder
create policy "Organizers can upload trip images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'trip-images'
    and (storage.foldername(name))[1] = 'trips'
    and (storage.foldername(name))[2] = auth.uid()::text
    and exists (
      select 1 from public.users
      where id = auth.uid() and is_trip_organizer_verified = true
    )
  );

-- Allow organizers to delete their own images
create policy "Organizers can delete their own trip images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'trip-images'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

-- Allow anyone to read (bucket is public, but this covers SELECT on objects)
create policy "Trip images are publicly readable"
  on storage.objects for select
  to public
  using (bucket_id = 'trip-images');
