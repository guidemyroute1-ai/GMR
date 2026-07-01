import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, SafeAreaView, Platform, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { getProfileById } from '../../services/communityService';
import { Profile } from '../../types/community';

export default function OrganizerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      if (id) {
        const data = await getProfileById(id);
        setProfile(data);
      }
      setLoading(false);
    }
    loadProfile();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Organizer not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <Feather name="arrow-left" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Organizer Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.profileHeader}>
          <Image 
            source={{ uri: profile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80' }} 
            style={styles.avatar} 
          />
          {!!profile.is_trip_organizer_verified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
            </View>
          )}
        </View>

        <Text style={styles.name}>{profile.name || 'Unknown User'}</Text>
        <Text style={styles.location}>
          <Ionicons name="location-outline" size={14} color="#6b7280" /> {profile.location || 'Unknown Location'}
        </Text>

        <View style={styles.tagContainer}>
          <Ionicons name={(profile.tag_icon as any) || 'person'} size={14} color="#16a34a" />
          <Text style={styles.tagText}>{profile.tag || 'Explorer'}</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{profile.trips_count || 0}</Text>
            <Text style={styles.statLabel}>Trips Organized</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {profile.rating || 'N/A'} <Ionicons name="star" size={16} color="#eab308" />
            </Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        <View style={styles.aboutSection}>
          <Text style={styles.sectionTitle}>About {profile.name?.split(' ')[0]}</Text>
          <Text style={styles.aboutText}>
            This organizer is verified by the GMR platform. They have organized multiple successful trips and are highly rated by the community. Reach out to them to learn more about their upcoming adventures!
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.chatButton} 
          onPress={() => router.push(`/chat/${profile.id}` as any)}
        >
          <Ionicons name="chatbubble-ellipses" size={20} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.chatButtonText}>Chat with {profile.name?.split(' ')[0] || 'Organizer'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backIcon: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  container: {
    padding: 24,
    alignItems: 'center',
  },
  profileHeader: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#16a34a',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 4,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 2,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  location: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 12,
  },
  tagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 24,
  },
  tagText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    width: '100%',
    marginBottom: 32,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e5e7eb',
  },
  aboutSection: {
    width: '100%',
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 24,
  },
  chatButton: {
    flexDirection: 'row',
    backgroundColor: '#16a34a',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  chatButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    marginBottom: 16,
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#1f2937',
    fontWeight: '600',
  },
});
