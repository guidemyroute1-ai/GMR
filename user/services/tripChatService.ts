import { supabase } from '../utils/supabase';
import { TripChatMessage } from '../types/community';

export const getTripMessages = async (tripId: string): Promise<TripChatMessage[]> => {
  const { data, error } = await supabase
    .from('trip_chat_messages')
    .select('*, profiles(*)')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: false }) // latest first for FlatList inverted
    .limit(50);

  if (error) {
    console.error('Error fetching trip messages:', error);
    return [];
  }
  
  return data as TripChatMessage[];
};

export const sendTripMessage = async (tripId: string, message: string): Promise<boolean> => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return false;

  const { error } = await supabase
    .from('trip_chat_messages')
    .insert({
      trip_id: tripId,
      user_id: userData.user.id,
      message,
    });

  if (error) {
    console.error('Error sending trip message:', error);
    return false;
  }
  return true;
};

export const subscribeToTripMessages = (tripId: string, callback: (message: TripChatMessage) => void) => {
  return supabase
    .channel(`public:trip_chat_messages:trip_id=eq.${tripId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'trip_chat_messages',
        filter: `trip_id=eq.${tripId}`,
      },
      async (payload) => {
        const newMessage = payload.new as TripChatMessage;
        
        // Fetch the profile for the new message since the realtime payload doesn't include joined tables
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', newMessage.user_id)
          .single();
          
        if (profileData) {
          newMessage.profiles = profileData;
        }
        
        callback(newMessage);
      }
    )
    .subscribe();
};

export const unsubscribeFromTripMessages = (channel: any) => {
  if (channel) {
    supabase.removeChannel(channel);
  }
};
