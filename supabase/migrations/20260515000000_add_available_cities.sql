alter table public.app_settings
  add column if not exists available_cities text[] not null default array['Rishikesh', 'Manali', 'Delhi']::text[];

update public.app_settings
set available_cities = array['Rishikesh', 'Manali', 'Delhi']::text[]
where available_cities is null or cardinality(available_cities) = 0;

grant select on public.app_settings to anon, authenticated;
