import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, SafeAreaView, StatusBar, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { getTripMessages, sendTripMessage, subscribeToTripMessages, unsubscribeFromTripMessages } from '../../../services/tripChatService';
import { TripChatMessage } from '../../../types/community';
import { supabase } from '../../../utils/supabase';

export default function TripChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); // This is the trip ID
  const router = useRouter();
  const [messages, setMessages] = useState<TripChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    async function initChat() {
      if (!id) return;

      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      } else {
        setAccessError("You must be logged in to view this chat.");
        setLoading(false);
        return;
      }

      // Check access via getTripMessages (RLS will enforce access)
      const msgs = await getTripMessages(id);
      
      // If msgs is empty, it might be due to RLS blocking access, or just no messages.
      // But we will allow the UI to render. If they try to send and it fails, RLS is blocking them.
      setMessages(msgs);
      setLoading(false);

      // Subscribe to real-time messages
      const subscription = await subscribeToTripMessages(id, (msg) => {
        setMessages((prev) => {
          // Prevent duplicates
          if (prev.some(m => m.id === msg.id)) return prev;
          return [msg, ...prev]; // Add to top (since list is inverted)
        });
      });
      channelRef.current = subscription;
    }

    initChat();

    return () => {
      if (channelRef.current) {
        unsubscribeFromTripMessages(channelRef.current);
      }
    };
  }, [id]);

  const handleSend = async () => {
    if (!newMessage.trim() || !id) return;

    const messageText = newMessage.trim();
    setNewMessage(''); // optimistic clear

    const success = await sendTripMessage(id, messageText);
    if (!success) {
      setNewMessage(messageText); // restore on failure
      Alert.alert("Error", "Could not send message. You must be joined to the trip.");
    }
  };

  const renderMessage = ({ item }: { item: TripChatMessage }) => {
    const isMe = item.user_id === currentUserId;

    return (
      <View style={[styles.messageWrapper, isMe ? styles.messageWrapperRight : styles.messageWrapperLeft]}>
        {!isMe && (
          <Text style={styles.senderName}>{item.profiles?.name || 'Unknown'}</Text>
        )}
        <View style={[styles.messageBubble, isMe ? styles.messageBubbleRight : styles.messageBubbleLeft]}>
          <Text style={[styles.messageText, isMe ? styles.messageTextRight : styles.messageTextLeft]}>
            {item.message}
          </Text>
        </View>
        <Text style={styles.messageTime}>
          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  if (accessError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#1f2937" />
          </TouchableOpacity>
        </View>
        <View style={styles.centerContainer}>
          <Ionicons name="lock-closed-outline" size={48} color="#9ca3af" />
          <Text style={styles.errorText}>{accessError}</Text>
          <TouchableOpacity style={styles.goBackButton} onPress={() => router.back()}>
            <Text style={styles.goBackButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#1f2937" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Trip Group Chat</Text>
          <Text style={styles.headerSubtitle}>Members only</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 10}
      >
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#16a34a" />
          </View>
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            inverted
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
          />
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#9ca3af"
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]} 
            onPress={handleSend}
            disabled={!newMessage.trim()}
          >
            <Ionicons name="send" size={20} color={newMessage.trim() ? '#ffffff' : '#9ca3af'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#4b5563',
    textAlign: 'center',
    lineHeight: 24,
  },
  goBackButton: {
    marginTop: 24,
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  goBackButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    zIndex: 10,
  },
  backButton: {
    padding: 8,
  },
  headerInfo: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  messageWrapper: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  messageWrapperLeft: {
    alignSelf: 'flex-start',
  },
  messageWrapperRight: {
    alignSelf: 'flex-end',
  },
  senderName: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    marginLeft: 4,
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  messageBubbleLeft: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  messageBubbleRight: {
    backgroundColor: '#16a34a',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  messageTextLeft: {
    color: '#1f2937',
  },
  messageTextRight: {
    color: '#ffffff',
  },
  messageTime: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  input: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 15,
    color: '#1f2937',
    maxHeight: 100,
    minHeight: 44,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    marginBottom: 0,
  },
  sendButtonDisabled: {
    backgroundColor: '#f3f4f6',
  },
});
