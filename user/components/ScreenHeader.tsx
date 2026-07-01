import React, { ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

interface ScreenHeaderProps {
  title: string | ReactNode;
  subtitle?: string | ReactNode;
  showLocation?: boolean;
  location?: string;
  onLocationPress?: () => void;
  showAvatar?: boolean;
}

export default function ScreenHeader({ 
  title, 
  subtitle, 
  showLocation = false, 
  location = 'Faridabad', 
  onLocationPress,
  showAvatar = false
}: ScreenHeaderProps) {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity 
          style={styles.bellIconContainer} 
          onPress={() => (router.push as any)('/extra/notifications')}
        >
          <Ionicons name="notifications-outline" size={24} color="#1f2937" />
          <View style={styles.notificationDot} />
        </TouchableOpacity>
        
        {showLocation && (
          <TouchableOpacity style={styles.locationSelector} onPress={onLocationPress}>
            <Ionicons name="location" size={14} color="#16a34a" />
            <Text style={styles.locationText}>{location}</Text>
            <Feather name="chevron-down" size={16} color="#1f2937" />
          </TouchableOpacity>
        )}

        {showAvatar && (
          <TouchableOpacity onPress={() => (router.push as any)('/more/Profile')}>
            <Image 
              source={{ uri: (user as any)?.photoURL || (user as any)?.photo_url || (user as any)?.user_metadata?.avatar_url || (user as any)?.user_metadata?.picture || 'https://i.pravatar.cc/150?img=11' }} 
              style={styles.userAvatar} 
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: '#ffffff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bellIconContainer: {
    marginRight: 16,
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginHorizontal: 4,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e5e7eb',
  },
});
