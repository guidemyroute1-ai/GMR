import { supabase } from '../utils/supabase';
import { ChatMessage, DirectMessage } from '../types/community';

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

// ─── Direct Messages ─────────────────────────────────────────────────────────

export const getDirectMessages = async (otherUserId: string): Promise<DirectMessage[]> => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return [];
  const currentUserId = userData.user.id;

  const { data, error } = await supabase
    .from('direct_messages')
    .select('*, sender:sender_id(*), receiver:receiver_id(*)')
    .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching direct messages:', error);
    return [];
  }
  
  return data as DirectMessage[];
};

export const sendDirectMessage = async (receiverId: string, message: string): Promise<boolean> => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return false;

  const { error } = await supabase
    .from('direct_messages')
    .insert({
      sender_id: userData.user.id,
      receiver_id: receiverId,
      message,
    });

  if (error) {
    console.error('Error sending direct message:', error);
    return false;
  }
  return true;
};

export const subscribeToDirectMessages = (otherUserId: string, callback: (message: DirectMessage) => void) => {
  return supabase.auth.getUser().then(({ data: userData }) => {
    if (!userData?.user) return null;
    const currentUserId = userData.user.id;

    return supabase
      .channel(`public:direct_messages:users=${currentUserId}_${otherUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `sender_id=eq.${otherUserId}`, // Only listen to incoming messages from the other user
        },
        async (payload) => {
          const newMessage = payload.new as DirectMessage;
          
          // Fetch the profile for the new message
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newMessage.sender_id)
            .single();
            
          if (profileData) {
            newMessage.sender = profileData;
          }
          
          callback(newMessage);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `sender_id=eq.${currentUserId}`, // Listen to messages we just sent (so they appear on other devices too)
        },
        async (payload) => {
          const newMessage = payload.new as DirectMessage;
          
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newMessage.sender_id)
            .single();
            
          if (profileData) {
            newMessage.sender = profileData;
          }
          
          callback(newMessage);
        }
      )
      .subscribe();
  });
};
