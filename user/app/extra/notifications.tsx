import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Platform, StatusBar } from 'react-native';
import { Text } from '../../components/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  timestamp: number;
}

const NOTIFICATIONS_STORAGE_KEY = '@gmr_notifications';

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const storedStr = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
        if (storedStr) {
          setNotifications(JSON.parse(storedStr));
        }
      } catch (err) {
        console.error('Failed to load notifications:', err);
      }
    };
    loadNotifications();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={48} color="#94A3B8" />
          <Text style={styles.emptyText}>No recent notifications</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.notificationItem}>
              <View style={styles.notificationHeader}>
                <Text style={styles.notificationTitle}>{item.title}</Text>
                <Text style={styles.notificationTime}>{item.time}</Text>
              </View>
              <Text style={styles.notificationMessage}>{item.message}</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  notificationItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  notificationTime: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
});
