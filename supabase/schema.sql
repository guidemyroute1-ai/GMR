create extension if not exists pgcrypto;

do $$ begin
  create type public.app_role as enum ('admin', 'user', 'guide', 'hotel', 'rental');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.booking_status as enum ('pending', 'confirmed', 'completed', 'cancelled');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  phone text,
  role public.app_role not null default 'user',
  is_approved boolean not null default false,
  is_onboarded boolean not null default false,
  has_uploaded_docs boolean not null default false,
  is_online boolean not null default false,
  city text,
  rating numeric not null default 0,
  reviews integer not null default 0,
  profile_data jsonb not null default '{}'::jsonb,
  documents text[] not null default array[]::text[],
  kyc_video_url text,
  photo_url text,
  fcm_tokens text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.users(id) on delete cascade,
  type public.app_role not null,
  title text not null,
  description text,
  price numeric not null default 0,
  location text,
  images text[] not null default array[]::text[],
  details jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint listings_partner_type check (type in ('guide', 'hotel', 'rental'))
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  partner_id uuid references public.users(id) on delete set null,
  listing_id uuid references public.listings(id) on delete set null,
  booking_type text,
  type text,
  item_id text,
  item_name text,
  user_name text,
  user_email text,
  guest_name text,
  date date default current_date,
  days integer not null default 1,
  amount numeric not null default 0,
  price numeric not null default 0,
  payment_id text,
  razorpay_order_id text,
  razorpay_signature text,
  payment_provider text not null default 'razorpay',
  payment_verified_at timestamptz,
  payment_status text,
  status public.booking_status not null default 'pending',
  note text,
  pickup_location text,
  vehicle_number text,
  vehicle_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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



create index if not exists users_role_idx on public.users(role);
create index if not exists listings_partner_id_idx on public.listings(partner_id);
create index if not exists listings_type_active_idx on public.listings(type, is_active);
create index if not exists bookings_user_id_idx on public.bookings(user_id);
create index if not exists bookings_partner_id_idx on public.bookings(partner_id);
create index if not exists bookings_payment_id_unique_idx on public.bookings(payment_id) where payment_id is not null and payment_id <> '';
create index if not exists reviews_item_id_idx on public.reviews(item_id);
create index if not exists reviews_user_id_idx on public.reviews(user_id);
create index if not exists reviews_booking_id_idx on public.reviews(booking_id);

alter table public.users enable row level security;
alter table public.listings enable row level security;
alter table public.bookings enable row level security;
alter table public.reviews enable row level security;


create or replace function public.current_user_role()
returns public.app_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.users where id = auth.uid()
$$;

drop policy if exists "Users read own profile and approved partners" on public.users;
create policy "Users read own profile and approved partners"
on public.users for select
using (
  id = auth.uid()
  or is_approved = true
  or public.current_user_role() = 'admin'
);

drop policy if exists "Users insert own profile" on public.users;
create policy "Users insert own profile"
on public.users for insert
with check (id = auth.uid() or auth.uid() is null);

drop policy if exists "Users update own non-admin profile" on public.users;
create policy "Users update own non-admin profile"
on public.users for update
using (id = auth.uid() or auth.uid() is null or public.current_user_role() = 'admin')
with check (id = auth.uid() or auth.uid() is null or public.current_user_role() = 'admin');

drop policy if exists "Read active listings" on public.listings;
create policy "Read active listings"
on public.listings for select
using (
  is_active = true
  or partner_id = auth.uid()
  or public.current_user_role() = 'admin'
);

drop policy if exists "Partners insert own listings" on public.listings;
create policy "Partners insert own listings"
on public.listings for insert
with check (
  auth.role() = 'authenticated'
  and partner_id = auth.uid()
);

drop policy if exists "Partners update own listings" on public.listings;
create policy "Partners update own listings"
on public.listings for update
using (partner_id = auth.uid() or public.current_user_role() = 'admin')
with check (partner_id = auth.uid() or public.current_user_role() = 'admin');

drop policy if exists "Partners delete own listings" on public.listings;
create policy "Partners delete own listings"
on public.listings for delete
using (partner_id = auth.uid() or public.current_user_role() = 'admin');

drop policy if exists "Users and partners read their bookings" on public.bookings;
create policy "Users and partners read their bookings"
on public.bookings for select
using (
  user_id = auth.uid()
  or partner_id = auth.uid()
  or public.current_user_role() = 'admin'
);

drop policy if exists "Users create own bookings" on public.bookings;
create policy "Users create own bookings"
on public.bookings for insert
with check (user_id = auth.uid());

drop policy if exists "Users and partners update relevant bookings" on public.bookings;
create policy "Users and partners update relevant bookings"
on public.bookings for update
using (
  user_id = auth.uid()
  or partner_id = auth.uid()
  or public.current_user_role() = 'admin'
)
with check (
  user_id = auth.uid()
  or partner_id = auth.uid()
  or public.current_user_role() = 'admin'
);



insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('partner-documents', 'partner-documents', false),
  ('listing-images', 'listing-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Authenticated users upload avatars" on storage.objects;
create policy "Authenticated users upload avatars"
on storage.objects for insert
with check (bucket_id in ('avatars', 'partner-documents', 'listing-images') and auth.role() = 'authenticated');

drop policy if exists "Authenticated users update own uploads" on storage.objects;
create policy "Authenticated users update own uploads"
on storage.objects for update
using (bucket_id in ('avatars', 'partner-documents', 'listing-images') and auth.role() = 'authenticated');

drop policy if exists "Public read app storage" on storage.objects;
create policy "Public read app storage"
on storage.objects for select
using (bucket_id in ('avatars', 'listing-images'));

drop policy if exists "Auth users read partner documents" on storage.objects;
create policy "Auth users read partner documents"
on storage.objects for select
using (bucket_id = 'partner-documents' and auth.role() = 'authenticated');

create table if not exists public.app_settings (
  id integer primary key default 1,
  service_fee_percentage numeric not null default 5,
  available_cities text[] not null default array['Rishikesh', 'Manali', 'Delhi']::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint one_row check (id = 1)
);

alter table public.app_settings
  add column if not exists available_cities text[] not null default array['Rishikesh', 'Manali', 'Delhi']::text[];

update public.app_settings
set available_cities = array['Rishikesh', 'Manali', 'Delhi']::text[]
where available_cities is null or cardinality(available_cities) = 0;

insert into public.app_settings (id, service_fee_percentage, available_cities)
values (1, 5, array['Rishikesh', 'Manali', 'Delhi']::text[])
on conflict (id) do nothing;

DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN 
    CREATE PUBLICATION supabase_realtime; 
  END IF; 
END $$;
DO $$
BEGIN
  alter publication supabase_realtime add table public.app_settings;
EXCEPTION
  WHEN duplicate_object OR undefined_object THEN NULL;
END $$;

alter table public.app_settings enable row level security;

grant select on public.app_settings to anon, authenticated;

-- Everyone can read
drop policy if exists "Anyone can read app_settings" on public.app_settings;
create policy "Anyone can read app_settings"
on public.app_settings for select
using (true);

-- Only admins can update
drop policy if exists "Admins can update app_settings" on public.app_settings;
create policy "Admins can update app_settings"
on public.app_settings for update
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

-- Add trigger for updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_app_settings_updated_at on public.app_settings;
create trigger set_app_settings_updated_at
before update on public.app_settings
for each row
execute procedure public.handle_updated_at();

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

-- Reviews RLS
drop policy if exists "Anyone can read reviews" on public.reviews;
create policy "Anyone can read reviews"
on public.reviews for select
using (true);

drop policy if exists "Users insert own reviews" on public.reviews;
create policy "Users insert own reviews"
on public.reviews for insert
with check (user_id = auth.uid());

drop policy if exists "Users update own reviews" on public.reviews;
create policy "Users update own reviews"
on public.reviews for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

grant select, insert on public.reviews to authenticated;
