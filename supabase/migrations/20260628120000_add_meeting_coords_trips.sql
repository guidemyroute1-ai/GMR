alter table public.trips 
add column if not exists meeting_lat double precision,
add column if not exists meeting_lng double precision;
