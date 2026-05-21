-- ============================================================
-- Migration: Add reviews table + updated_at triggers
-- Run this against your Supabase SQL editor
-- ============================================================

-- ── Reviews Table ──────────────────────────────────────────────
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  item_id text,
  user_id uuid not null references public.users(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint unique_review_per_booking unique (booking_id, user_id)
);

create index if not exists reviews_item_id_idx on public.reviews(item_id);
create index if not exists reviews_user_id_idx on public.reviews(user_id);
create index if not exists reviews_booking_id_idx on public.reviews(booking_id);

-- Enable RLS
alter table public.reviews enable row level security;

-- Users can read all reviews
drop policy if exists "Anyone can read reviews" on public.reviews;
create policy "Anyone can read reviews"
on public.reviews for select
using (true);

-- Users can insert own reviews
drop policy if exists "Users insert own reviews" on public.reviews;
create policy "Users insert own reviews"
on public.reviews for insert
with check (user_id = auth.uid());

-- Users can update own reviews
drop policy if exists "Users update own reviews" on public.reviews;
create policy "Users update own reviews"
on public.reviews for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- ── updated_at triggers for core tables ────────────────────────
-- The handle_updated_at function already exists from schema.sql

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at
before update on public.users
for each row
execute procedure public.handle_updated_at();

drop trigger if exists set_bookings_updated_at on public.bookings;
create trigger set_bookings_updated_at
before update on public.bookings
for each row
execute procedure public.handle_updated_at();

drop trigger if exists set_listings_updated_at on public.listings;
create trigger set_listings_updated_at
before update on public.listings
for each row
execute procedure public.handle_updated_at();

drop trigger if exists set_reviews_updated_at on public.reviews;
create trigger set_reviews_updated_at
before update on public.reviews
for each row
execute procedure public.handle_updated_at();

-- ── Fix partner-documents bucket: make private ─────────────────
update storage.buckets
set public = false
where id = 'partner-documents';

-- Update storage policies: partner-documents requires auth to read
drop policy if exists "Public read app storage" on storage.objects;
create policy "Public read app storage"
on storage.objects for select
using (bucket_id in ('avatars', 'listing-images'));

-- Authenticated users can read partner documents
drop policy if exists "Auth users read partner documents" on storage.objects;
create policy "Auth users read partner documents"
on storage.objects for select
using (bucket_id = 'partner-documents' and auth.role() = 'authenticated');

-- Grant access
grant select, insert on public.reviews to authenticated;
