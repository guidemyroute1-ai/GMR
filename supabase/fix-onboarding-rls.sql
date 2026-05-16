-- ============================================================================
-- GMR: Fix Profile Creation / Onboarding RLS Policy
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard)
-- ============================================================================

-- Allow users to insert their profile row during onboarding flow even before email confirmation
drop policy if exists "Users insert own profile" on public.users;
create policy "Users insert own profile"
on public.users for insert
with check (id = auth.uid() or auth.uid() is null);

-- Allow users to update their profile row during onboarding flow
drop policy if exists "Users update own non-admin profile" on public.users;
create policy "Users update own non-admin profile"
on public.users for update
using (id = auth.uid() or auth.uid() is null or public.current_user_role() = 'admin')
with check (id = auth.uid() or auth.uid() is null or public.current_user_role() = 'admin');

-- Notify PostgREST to reload its schema cache
notify pgrst, 'reload schema';
