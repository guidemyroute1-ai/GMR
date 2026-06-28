-- Run this script in the Supabase SQL Editor
-- This will create a profile for any authenticated user that doesn't have one

INSERT INTO public.profiles (id, name, avatar_url, is_verified)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1), 'User'), 
  COALESCE(raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'),
  false
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);
