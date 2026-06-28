-- Run this script in the Supabase SQL Editor

-- 1. Create communities table
CREATE TABLE IF NOT EXISTS public.communities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  tags TEXT,
  image_url TEXT,
  icon_name TEXT DEFAULT 'people',
  icon_color TEXT DEFAULT '#0ea5e9',
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 2. Create community_members table
CREATE TABLE IF NOT EXISTS public.community_members (
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, -- references auth.users(id) or public.profiles(id)
  role TEXT DEFAULT 'member', -- 'member', 'admin'
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
  PRIMARY KEY (community_id, user_id)
);

-- 3. Create community_stories table
CREATE TABLE IF NOT EXISTS public.community_stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT,
  image_url TEXT NOT NULL,
  ring_color TEXT DEFAULT '#3b82f6',
  is_live BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) + INTERVAL '24 hours'
);

-- 4. Create community_discussions table
CREATE TABLE IF NOT EXISTS public.community_discussions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  image_url TEXT,
  replies_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 5. Create community_events table
CREATE TABLE IF NOT EXISTS public.community_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  image_url TEXT,
  going_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 6. Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- Create profiles table if it doesn't exist to fetch user details (assuming it exists, but adding for completeness)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY, -- matches auth.users id
  name TEXT,
  avatar_url TEXT,
  location TEXT,
  tag TEXT,
  tag_icon TEXT,
  is_verified BOOLEAN DEFAULT false, -- For the "People You May Know"
  trips_count INTEGER DEFAULT 0,
  rating NUMERIC DEFAULT 0
);

-- Add Row Level Security (RLS) policies
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Communities: Everyone can read
CREATE POLICY "Communities are viewable by everyone." 
  ON public.communities FOR SELECT USING (true);

-- Members: Everyone can read, users can insert themselves
CREATE POLICY "Community members viewable by everyone." 
  ON public.community_members FOR SELECT USING (true);
CREATE POLICY "Users can join communities." 
  ON public.community_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave communities." 
  ON public.community_members FOR DELETE USING (auth.uid() = user_id);

-- Stories: Everyone can read
CREATE POLICY "Stories are viewable by everyone." 
  ON public.community_stories FOR SELECT USING (true);
CREATE POLICY "Users can insert their own stories." 
  ON public.community_stories FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Discussions: Everyone can read
CREATE POLICY "Discussions are viewable by everyone." 
  ON public.community_discussions FOR SELECT USING (true);
CREATE POLICY "Users can create discussions." 
  ON public.community_discussions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Events: Everyone can read
CREATE POLICY "Events are viewable by everyone." 
  ON public.community_events FOR SELECT USING (true);

-- Chat messages: Members can read and insert
CREATE POLICY "Chat messages are viewable by everyone." 
  ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY "Users can send chat messages." 
  ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Profiles: Everyone can read
CREATE POLICY "Profiles are viewable by everyone." 
  ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile." 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Function to handle Realtime
-- Go to Supabase Dashboard -> Database -> Replication -> Enable for chat_messages table
