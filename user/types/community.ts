export interface Community {
  id: string;
  name: string;
  description: string | null;
  tags: string | null;
  image_url: string | null;
  icon_name: string;
  icon_color: string;
  member_count: number;
  created_at: string;
}

export interface CommunityStory {
  id: string;
  community_id: string;
  user_id: string;
  title: string | null;
  image_url: string;
  ring_color: string;
  is_live: boolean;
  created_at: string;
  expires_at: string;
}

export interface CommunityDiscussion {
  id: string;
  community_id: string;
  user_id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  replies_count: number;
  created_at: string;
  community?: Community; // For joined queries
}

export interface CommunityEvent {
  id: string;
  community_id: string;
  title: string;
  description: string | null;
  location: string | null;
  event_date: string;
  image_url: string | null;
  going_count: number;
  created_at: string;
  community?: Community; // For joined queries
}

export interface ChatMessage {
  id: string;
  community_id: string;
  user_id: string;
  message: string;
  created_at: string;
  profiles?: Profile; // Joined
}

export interface Profile {
  id: string;
  name: string | null;
  avatar_url: string | null;
  location: string | null;
  tag: string | null;
  tag_icon: string | null;
  is_verified: boolean;
  is_trip_organizer_verified: boolean;
  trips_count: number;
  rating: number;
}

export interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
  sender?: Profile; // Joined
  receiver?: Profile; // Joined
}

export interface TripChatMessage {
  id: string;
  trip_id: string;
  user_id: string;
  message: string;
  created_at: string;
  profiles?: Profile; // Joined for avatar and name
}
