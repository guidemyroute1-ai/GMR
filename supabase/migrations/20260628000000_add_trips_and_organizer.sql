-- ── 0. is_trip_organizer_verified column on users ────────────────────────────
alter table public.users
  add column if not exists is_trip_organizer_verified boolean not null default false;

-- ── 1. trips table ────────────────────────────────────────────────────────────
create table if not exists public.trips (
  id               uuid primary key default gen_random_uuid(),
  organizer_id     uuid references public.users(id) on delete set null,
  title            text not null,
  subtitle         text,
  description      text,
  trip_type        text not null default 'community',
  -- 'official' | 'community' | 'last_minute'
  category         text,
  interests        text[] default array[]::text[],
  trip_date        timestamptz,
  price            numeric not null default 0,
  original_price   numeric,
  capacity         integer not null default 20,
  joined_count     integer not null default 0,
  city             text,
  location_text    text,
  images           text[] not null default array[]::text[],
  is_active        boolean not null default true,
  is_featured      boolean not null default false,
  date_badge_color text,
  includes         text,
  rating           numeric,
  review_count     integer default 0,
  chat_room_id     text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.trips enable row level security;

do $$ begin
  create policy "Anyone reads active trips"
    on public.trips for select using (is_active = true or organizer_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Verified organizers create trips"
    on public.trips for insert
    with check (
      auth.role() = 'authenticated'
      and organizer_id = auth.uid()
      and exists (
        select 1 from public.users
        where id = auth.uid() and is_trip_organizer_verified = true
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Organizers update own trips"
    on public.trips for update
    using (organizer_id = auth.uid() or public.current_user_role() = 'admin');
exception when duplicate_object then null; end $$;

create index if not exists trips_city_idx         on public.trips(city);
create index if not exists trips_type_active_idx  on public.trips(trip_type, is_active);
create index if not exists trips_date_idx         on public.trips(trip_date);
create index if not exists trips_featured_idx     on public.trips(is_featured) where is_featured;

-- ── 2. trip_participants join table ──────────────────────────────────────────
create table if not exists public.trip_participants (
  id        uuid primary key default gen_random_uuid(),
  trip_id   uuid not null references public.trips(id) on delete cascade,
  user_id   uuid not null references public.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique(trip_id, user_id)
);

alter table public.trip_participants enable row level security;

do $$ begin
  create policy "Users see own participation"
    on public.trip_participants for select using (user_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users join trips"
    on public.trip_participants for insert with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;

-- Auto-increment joined_count
create or replace function public.update_trip_joined_count()
returns trigger language plpgsql security definer as $$
begin
  if (TG_OP = 'INSERT') then
    update public.trips set joined_count = joined_count + 1 where id = NEW.trip_id;
  elsif (TG_OP = 'DELETE') then
    update public.trips set joined_count = greatest(joined_count - 1, 0) where id = OLD.trip_id;
  end if;
  return null;
end;
$$;

do $$ begin
  create trigger trg_trip_participants_count
  after insert or delete on public.trip_participants
  for each row execute function public.update_trip_joined_count();
exception when duplicate_object then null; end $$;

-- ── 4. trip_organizer_applications table ─────────────────────────────────────
create table if not exists public.trip_organizer_applications (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.users(id) on delete cascade,
  payment_id     text,
  amount_paid    numeric not null default 499,
  status         text not null default 'pending',
  -- 'pending' | 'approved' | 'rejected'
  reviewed_by    uuid references public.users(id),
  reviewed_at    timestamptz,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique(user_id)
  -- one application per user
);

alter table public.trip_organizer_applications enable row level security;

do $$ begin
  create policy "Users see own application"
    on public.trip_organizer_applications for select using (user_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users create own application"
    on public.trip_organizer_applications for insert with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Admins manage applications"
    on public.trip_organizer_applications for all
    using (public.current_user_role() = 'admin');
exception when duplicate_object then null; end $$;

-- Realtime
DO $$ BEGIN 
  alter publication supabase_realtime add table public.trips; 
EXCEPTION WHEN DUPLICATE_OBJECT THEN NULL; END $$;

DO $$ BEGIN 
  alter publication supabase_realtime add table public.trip_organizer_applications; 
EXCEPTION WHEN DUPLICATE_OBJECT THEN NULL; END $$;
notify pgrst, 'reload schema';


