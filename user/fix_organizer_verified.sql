-- ─────────────────────────────────────────────────────────────────────────────
-- Step 1: Add the column if it doesn't exist yet
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_trip_organizer_verified boolean NOT NULL DEFAULT false;

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 2: Make sure the 3 mock users are NOT marked as verified organizers
-- (they were test data inserted with is_verified=true, not real organizers)
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE public.profiles
SET is_trip_organizer_verified = false
WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 3: (Optional) Verify the column state
-- ─────────────────────────────────────────────────────────────────────────────
SELECT id, name, is_verified, is_trip_organizer_verified
FROM public.profiles
ORDER BY is_trip_organizer_verified DESC, name;
