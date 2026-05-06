-- ============================================================================
-- GMR: One-shot fix for ALL pending database issues
-- Run this ONCE in the Supabase SQL Editor (https://supabase.com/dashboard)
-- ============================================================================

-- ─── 1. Add missing columns to public.users ────────────────────────────────
-- The PGRST204 error means these columns don't exist in the live DB yet.
-- "if not exists" / "add column if not exists" ensures this is idempotent.
-- ────────────────────────────────────────────────────────────────────────────

alter table public.users
  add column if not exists has_uploaded_docs boolean not null default false;

alter table public.users
  add column if not exists documents text[] not null default array[]::text[];

alter table public.users
  add column if not exists kyc_video_url text;

alter table public.users
  add column if not exists is_online boolean not null default false;

alter table public.users
  add column if not exists rating numeric not null default 0;

alter table public.users
  add column if not exists reviews integer not null default 0;

alter table public.users
  add column if not exists photo_url text;

alter table public.users
  add column if not exists fcm_tokens text[] not null default array[]::text[];

-- ─── 2. Fix listings RLS: Remove the over-restrictive role sub-query ───────
-- The old policy checked users.role via a sub-query, which fails during
-- onboarding when role may still be 'user' (the default).
-- ────────────────────────────────────────────────────────────────────────────

drop policy if exists "Partners insert own listings" on public.listings;

create policy "Partners insert own listings"
on public.listings for insert
with check (
  auth.role() = 'authenticated'
  and partner_id = auth.uid()
);

-- ─── 3. Keep UPDATE & DELETE policies consistent ───────────────────────────

drop policy if exists "Partners update own listings" on public.listings;

create policy "Partners update own listings"
on public.listings for update
using (
  partner_id = auth.uid()
  or public.current_user_role() = 'admin'
)
with check (
  partner_id = auth.uid()
  or public.current_user_role() = 'admin'
);

drop policy if exists "Partners delete own listings" on public.listings;

create policy "Partners delete own listings"
on public.listings for delete
using (partner_id = auth.uid() or public.current_user_role() = 'admin');

-- ─── 4. Ensure storage buckets exist ───────────────────────────────────────

insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('partner-documents', 'partner-documents', true),
  ('listing-images', 'listing-images', true)
on conflict (id) do update set public = excluded.public;

-- ─── 5. Notify PostgREST to reload its schema cache ───────────────────────

notify pgrst, 'reload schema';

-- ─── Done! ─────────────────────────────────────────────────────────────────
-- After running this:
--   • The "hasUploadedDocs column not found" error will be fixed
--   • The "RLS violation on listings" error will be fixed
--   • Storage buckets will be ready
-- You may need to restart the Expo dev server to clear any client-side caches.
