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
