alter table public.users
add column if not exists documents text[] not null default array[]::text[];

alter table public.users
add column if not exists kyc_video_url text;

