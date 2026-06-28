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
  // Only fetching verified trip organizers
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('is_trip_organizer_verified', true)
    .order('rating', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching people:', error);
    return [];
  }
  return data as Profile[];
};
