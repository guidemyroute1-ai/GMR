-- Run this script in your Supabase SQL Editor after running the create tables script.

-- 1. Create some mock profiles (Verified users for "People You May Know")
-- Using fixed UUIDs so we can reference them easily
DO $$
DECLARE
    user1 UUID := '11111111-1111-1111-1111-111111111111';
    user2 UUID := '22222222-2222-2222-2222-222222222222';
    user3 UUID := '33333333-3333-3333-3333-333333333333';
    
    comm1 UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    comm2 UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    comm3 UUID := 'cccccccc-cccc-cccc-cccc-cccccccccccc';
BEGIN
    -- Insert Profiles
    INSERT INTO public.profiles (id, name, avatar_url, location, tag, tag_icon, is_verified, trips_count, rating)
    VALUES 
        (user1, 'Ananya Singh', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80', 'Faridabad, Haryana', 'Solo Traveler', 'person', true, 12, 4.7),
        (user2, 'Rohit Sharma', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80', 'Gurugram, Haryana', 'Adventure Lover', 'walk', true, 18, 4.8),
        (user3, 'Mehak Arora', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80', 'Delhi, India', 'Cafe Explorer', 'cafe', true, 9, 4.6)
    ON CONFLICT (id) DO NOTHING;

    -- 2. Insert Communities
    INSERT INTO public.communities (id, name, description, tags, image_url, icon_name, icon_color, member_count)
    VALUES 
        (comm1, 'Delhi Backpackers', 'A group for budget travelers from Delhi.', 'Backpacking | Budget Travel', 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=400&q=80', 'people', '#0ea5e9', 4800),
        (comm2, 'Trekking India', 'Adventure awaits in the mountains.', 'Treks | Mountains | Adventure', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80', 'walk', '#f97316', 6200),
        (comm3, 'Cafe Hoppers', 'Finding the best coffee spots.', 'Cafes | Conversations | Chill', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80', 'cafe', '#8b5cf6', 3100)
    ON CONFLICT (id) DO NOTHING;

    -- 3. Insert Community Members
    INSERT INTO public.community_members (community_id, user_id, role)
    VALUES 
        (comm1, user1, 'admin'),
        (comm1, user2, 'member'),
        (comm2, user2, 'admin'),
        (comm2, user3, 'member'),
        (comm3, user3, 'admin')
    ON CONFLICT (community_id, user_id) DO NOTHING;

    -- 4. Insert Community Stories (Set expires_at to tomorrow)
    INSERT INTO public.community_stories (community_id, user_id, title, image_url, ring_color, is_live, expires_at)
    VALUES 
        (comm1, user1, 'Delhi Backpackers', 'https://images.unsplash.com/photo-1516908205727-40af10b427b3?auto=format&fit=crop&w=150&q=80', '#ec4899', true, now() + interval '1 day'),
        (comm2, user2, 'Solo Travelers', 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=150&q=80', '#3b82f6', false, now() + interval '1 day'),
        (comm3, user3, 'Weekend Explorers', 'https://images.unsplash.com/photo-1533692328991-08159ff19fca?auto=format&fit=crop&w=150&q=80', '#22c55e', false, now() + interval '1 day');

    -- 5. Insert Community Discussions
    INSERT INTO public.community_discussions (community_id, user_id, title, image_url, replies_count)
    VALUES 
        (comm2, user2, 'Best treks near Delhi for this weekend?', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=100&q=80', 28),
        (comm3, user3, 'Hidden cafes in Delhi that you love ☕', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=100&q=80', 16),
        (comm1, user1, 'Spiti valley road trip in July - good idea?', 'https://images.unsplash.com/photo-1533692328991-08159ff19fca?auto=format&fit=crop&w=100&q=80', 35);

    -- 7. Insert Chat Messages
    INSERT INTO public.chat_messages (community_id, user_id, message)
    VALUES 
        (comm1, user1, 'Hey everyone, ready for the weekend trip?'),
        (comm1, user2, 'Absolutely! Have we finalized the itinerary?'),
        (comm1, user3, 'I can bring some snacks for the road.'),
        
        (comm2, user2, 'Does anyone know if the trails are open this weekend?'),
        (comm2, user3, 'Yes, they opened up last Tuesday!');
        
END $$;
