import { supabase } from '../utils/supabase';
import { Community, CommunityStory, CommunityDiscussion, CommunityEvent, Profile } from '../types/community';

export const getCommunities = async (): Promise<Community[]> => {
  const { data, error } = await supabase
    .from('communities')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching communities:', error);
    return [];
  }
  return data as Community[];
};

export const getStories = async (): Promise<CommunityStory[]> => {
  const { data, error } = await supabase
    .from('community_stories')
    .select('*')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching stories:', error);
    return [];
  }
  return data as CommunityStory[];
};

export const getDiscussions = async (): Promise<CommunityDiscussion[]> => {
  const { data, error } = await supabase
    .from('community_discussions')
    .select('*, community:communities(*)')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching discussions:', error);
    return [];
  }
  return data as CommunityDiscussion[];
};

export const getEvents = async (): Promise<CommunityEvent[]> => {
  const { data, error } = await supabase
    .from('community_events')
    .select('*, community:communities(*)')
    .gte('event_date', new Date().toISOString())
    .order('event_date', { ascending: true })
    .limit(10);

  if (error) {
    console.error('Error fetching events:', error);
    return [];
  }
  return data as CommunityEvent[];
};

export const getPeopleYouMayKnow = async (): Promise<Profile[]> => {
  // Query the `users` table — this is where the admin panel sets is_trip_organizer_verified
  const { data, error } = await supabase
    .from('users')
    .select('id, name, photo_url, city, is_trip_organizer_verified, rating, profile_data')
    .eq('is_trip_organizer_verified', true)
    .order('rating', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching verified organizers:', error);
    return [];
  }

  // Map users table fields to the Profile interface
  return (data || []).map((u: any) => ({
    id: u.id,
    name: u.name || 'Organizer',
    avatar_url: u.photo_url || null,
    location: u.city || u.profile_data?.city || null,
    tag: 'Verified Organizer',
    tag_icon: 'shield-checkmark',
    is_verified: true,
    is_trip_organizer_verified: true,
    trips_count: u.profile_data?.trips_count || 0,
    rating: u.rating || 4.5,
  })) as Profile[];
};

export const getProfileById = async (id: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  
  return data as Profile;
};
