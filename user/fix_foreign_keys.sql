-- Run this script in your Supabase SQL Editor to fix the foreign key relationships

-- Add foreign key constraint to chat_messages
ALTER TABLE public.chat_messages
ADD CONSTRAINT chat_messages_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign key constraint to community_members
ALTER TABLE public.community_members
ADD CONSTRAINT community_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign key constraint to community_stories
ALTER TABLE public.community_stories
ADD CONSTRAINT community_stories_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign key constraint to community_discussions
ALTER TABLE public.community_discussions
ADD CONSTRAINT community_discussions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Refresh the schema cache for PostgREST
NOTIFY pgrst, 'reload schema';
