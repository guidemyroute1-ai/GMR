-- Run this in Supabase SQL Editor to fix:
-- "new row violates row-level security policy for table listings"
--
-- Root cause: The INSERT policy required the user's `users.role` to be one of
-- ('guide', 'hotel', 'rental').  If the profile row was created with the default
-- role 'user' (e.g. Google Sign-In before onboarding finished) or if the profile
-- update and the listing insert are separate API calls, the EXISTS check fails.
--
-- Fix: Remove the role sub-query from the RLS policy. The application already
-- validates the role before inserting, and `partner_id = auth.uid()` is
-- sufficient to ensure ownership. A separate CHECK constraint on the table
-- already enforces that `type` is one of ('guide','hotel','rental').

-- ─── 1. Relaxed INSERT policy ──────────────────────────────────────────────────
drop policy if exists "Partners insert own listings" on public.listings;

create policy "Partners insert own listings"
on public.listings for insert
with check (
  auth.role() = 'authenticated'
  and partner_id = auth.uid()
);

-- ─── 2. UPDATE policy (unchanged — keep admin override) ────────────────────────
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

-- ─── 3. DELETE policy (unchanged) ──────────────────────────────────────────────
drop policy if exists "Partners delete own listings" on public.listings;

create policy "Partners delete own listings"
on public.listings for delete
using (partner_id = auth.uid() or public.current_user_role() = 'admin');

-- ─── 4. Repair any partner rows whose role is still 'user' ────────────────────
-- This fixes partners who signed up (Google or email) but whose users.role
-- was never updated from the default.  Uncomment and run if needed:

-- UPDATE public.users
-- SET role = 'guide', updated_at = now()
-- WHERE id = auth.uid()
--   AND role = 'user';
