-- SQL script to create the popular_destinations table
-- Run this in your Supabase SQL Editor

CREATE TABLE popular_destinations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  image_url TEXT NOT NULL,
  is_popular BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up Row Level Security (RLS)
ALTER TABLE popular_destinations ENABLE ROW LEVEL SECURITY;

-- Allow public read access to popular destinations
CREATE POLICY "Allow public read access on popular_destinations"
  ON popular_destinations
  FOR SELECT
  TO public
  USING (true);

-- Insert some dummy data to test
INSERT INTO popular_destinations (name, state, image_url, is_popular)
VALUES 
  ('Rishikesh', 'Uttarakhand', 'https://images.unsplash.com/photo-1605640840605-14ac1855827b?q=80&w=600&auto=format&fit=crop', true),
  ('Goa', 'Goa', 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=600&auto=format&fit=crop', true),
  ('Agra', 'Uttar Pradesh', 'https://images.unsplash.com/photo-1564507592333-c60657eea523?q=80&w=600&auto=format&fit=crop', true),
  ('Jaipur', 'Rajasthan', 'https://images.unsplash.com/photo-1477587458883-47145ed94245?q=80&w=600&auto=format&fit=crop', true);
