import { supabase } from '../utils/supabase';
import { ChatMessage } from '../types/community';

export const getMessages = async (communityId: string): Promise<ChatMessage[]> => {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*, profiles(*)')
    .eq('community_id', communityId)
    .order('created_at', { ascending: false }) // latest first for FlatList inverted
    .limit(50);

  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
  
  return data as ChatMessage[];
};

export const sendMessage = async (communityId: string, message: string): Promise<boolean> => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return false;

  const { error } = await supabase
    .from('chat_messages')
    .insert({
      community_id: communityId,
      user_id: userData.user.id,
      message,
    });

  if (error) {
    console.error('Error sending message:', error);
    return false;
  }
  return true;
};

export const subscribeToMessages = (communityId: string, callback: (message: ChatMessage) => void) => {
  return supabase
    .channel(`public:chat_messages:community_id=eq.${communityId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `community_id=eq.${communityId}`,
      },
      async (payload) => {
        const newMessage = payload.new as ChatMessage;
        
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

export const unsubscribeFromMessages = (channel: any) => {
  if (channel) {
    supabase.removeChannel(channel);
  }
};
