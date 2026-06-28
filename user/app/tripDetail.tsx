import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../components/Text';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Trip } from '../hooks/useTrips';

const { width } = Dimensions.get('window');

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);

  useEffect(() => {
    if (id) {
      loadTrip();
      if (user) checkJoinedStatus();
    }
  }, [id, user]);

  const loadTrip = async () => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*, organizer:organizer_id(name, photo_url, rating)')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      setTrip(data as any as Trip);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkJoinedStatus = async () => {
    try {
      const { data } = await supabase
        .from('trip_participants')
        .select('id')
        .eq('trip_id', id)
        .eq('user_id', user!.id)
        .maybeSingle();
      if (data) setHasJoined(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleJoin = async () => {
    if (!user) {
      Alert.alert('Login Required', 'You must be logged in to join a trip.');
      return;
    }
    setJoining(true);
    try {
      const { error } = await supabase.from('trip_participants').insert({
        trip_id: trip!.id,
        user_id: user.id,
      });

      if (error) {
        if (error.code === '23505') {
          setHasJoined(true);
          return;
        }
        throw error;
      }

      setHasJoined(true);
      Alert.alert('Success', 'You have joined this trip!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not join trip.');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  if (!trip) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Trip not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: '#16a34a' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const d = new Date(trip.trip_date);
  const formattedDate = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
  const seatsLeft = Math.max(trip.capacity - trip.joined_count, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: trip.images?.[0] || 'https://images.unsplash.com/photo-1542382156885-32e73722a84a?auto=format&fit=crop&w=800&q=80' }} 
            style={styles.heroImage} 
          />
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1f2937" />
          </TouchableOpacity>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{trip.trip_type.toUpperCase()}</Text>
            </View>
            {trip.is_featured && (
              <View style={[styles.badge, { backgroundColor: '#eab308' }]}>
                <Text style={[styles.badgeText, { color: '#fff' }]}>FEATURED</Text>
              </View>
            )}
          </View>

          <Text style={styles.title}>{trip.title}</Text>
          {trip.subtitle ? <Text style={styles.subtitle}>{trip.subtitle}</Text> : null}

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={20} color="#16a34a" />
              <Text style={styles.infoText}>{formattedDate}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="location-outline" size={20} color="#16a34a" />
              <Text style={styles.infoText}>{trip.city || 'Location TBA'}</Text>
            </View>
          </View>

          {trip.organizer && (
            <View style={styles.organizerSection}>
              <Image source={{ uri: trip.organizer.photo_url || 'https://i.pravatar.cc/100' }} style={styles.organizerImage} />
              <View style={styles.organizerInfo}>
                <Text style={styles.organizerName}>Hosted by {trip.organizer.name}</Text>
                <Text style={styles.organizerRating}>⭐ {trip.organizer.rating || '5.0'} Organizer</Text>
              </View>
            </View>
          )}

          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>About this trip</Text>
            <Text style={styles.description}>{trip.description || 'No description provided.'}</Text>
          </View>

          {trip.includes && (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>What's included</Text>
              <Text style={styles.description}>{trip.includes}</Text>
            </View>
          )}

        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.priceInfo}>
          <Text style={styles.price}>₹{trip.price}</Text>
          <Text style={styles.seatsText}>{seatsLeft} seats left</Text>
        </View>
        <TouchableOpacity 
          style={[styles.joinButton, hasJoined && styles.joinedButton]} 
          onPress={hasJoined ? undefined : handleJoin}
          disabled={joining || hasJoined || seatsLeft === 0}
        >
          {joining ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.joinButtonText}>
              {hasJoined ? 'Joined' : seatsLeft === 0 ? 'Sold Out' : 'Join Trip'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { paddingBottom: 40 },
  imageContainer: { position: 'relative' },
  heroImage: { width, height: 300 },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  detailsContainer: { padding: 20, marginTop: -24, backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  badgeRow: { flexDirection: 'row', marginBottom: 12 },
  badge: { backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 8 },
  badgeText: { color: '#16a34a', fontSize: 10, fontWeight: '700' },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 4 },
  subtitle: { fontSize: 15, color: '#6b7280', marginBottom: 20 },
  infoRow: { flexDirection: 'row', marginBottom: 24, flexWrap: 'wrap', gap: 16 },
  infoItem: { flexDirection: 'row', alignItems: 'center' },
  infoText: { marginLeft: 8, fontSize: 14, color: '#374151', fontWeight: '500' },
  organizerSection: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#f9fafb', borderRadius: 16, marginBottom: 24 },
  organizerImage: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  organizerInfo: { flex: 1 },
  organizerName: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 2 },
  organizerRating: { fontSize: 13, color: '#6b7280' },
  descriptionSection: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 },
  description: { fontSize: 15, color: '#4b5563', lineHeight: 24 },
  footer: { flexDirection: 'row', padding: 16, borderTopWidth: 1, borderTopColor: '#f3f4f6', backgroundColor: '#fff', alignItems: 'center' },
  priceInfo: { flex: 1 },
  price: { fontSize: 24, fontWeight: '800', color: '#111827' },
  seatsText: { fontSize: 12, color: '#ef4444', fontWeight: '600', marginTop: 2 },
  joinButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 32,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinedButton: { backgroundColor: '#d1d5db' },
  joinButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
