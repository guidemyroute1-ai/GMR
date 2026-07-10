import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import { Text } from '../../components/Text';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../utils/supabase';

// ─── Color Palette ─────────────────────────────────────────────────────────────
const COLORS = {
  primary: '#16A34A',
  teal: '#14B8A6',
  skyBlue: '#0EA5E9',
  orange: '#F97316',
  white: '#FFFFFF',
  lightGray: '#F1F5F9',
  darkGray: '#1F2937',
  mediumGray: '#6B7280',
  borderGray: '#E2E8F0',
  danger: '#EF4444',
  greenBg: '#F0FDF4',
  greenText: '#15803D',
};

const SHADOW = {
  sm: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  md: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 5 },
};

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Trip {
  id: string;
  title: string;
  price: number;
  capacity: number;
  joined_count: number;
  is_active: boolean;
  trip_date: string;
  image_urls?: string[];
}

export default function OrganizerDashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('id, title, price, capacity, joined_count, is_active, trip_date, image_urls')
        .eq('organizer_id', user.uid)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTrips((data || []) as Trip[]);
    } catch (err) {
      console.warn('Error fetching organizer data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  // ─── Calculated Metrics ────────────────────────────────────────────────────────
  const totalRevenue = trips.reduce((sum, trip) => sum + (trip.price * (trip.joined_count || 0)), 0);
  const totalSubscribers = trips.reduce((sum, trip) => sum + (trip.joined_count || 0), 0);
  const activeTripsCount = trips.filter(t => t.is_active).length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" translucent={false} />

      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.darkGray} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Organizer Dashboard</Text>
        <View style={{ width: 40 }} /> {/* Spacer to center the title */}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <>
            {/* Top Metrics Cards */}
            <View style={styles.metricsContainer}>
              <View style={[styles.metricCard, styles.revenueCard, SHADOW.sm]}>
                <LinearGradient colors={['#ECFDF5', '#D1FAE5']} style={[StyleSheet.absoluteFillObject, { borderRadius: 16 }]} />
                <View style={styles.metricIconBox}>
                  <Ionicons name="wallet-outline" size={24} color={COLORS.primary} />
                </View>
                <Text style={styles.metricLabel}>Total Revenue</Text>
                <Text style={styles.metricValue}>₹{totalRevenue.toLocaleString()}</Text>
              </View>

              <View style={styles.metricRow}>
                <View style={[styles.metricSmallCard, SHADOW.sm]}>
                  <View style={[styles.metricIconBox, { backgroundColor: '#E0F2FE' }]}>
                    <Ionicons name="people-outline" size={20} color={COLORS.skyBlue} />
                  </View>
                  <Text style={styles.metricLabel}>Subscribers</Text>
                  <Text style={[styles.metricValue, { fontSize: 20 }]}>{totalSubscribers}</Text>
                </View>

                <View style={[styles.metricSmallCard, SHADOW.sm]}>
                  <View style={[styles.metricIconBox, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="airplane-outline" size={20} color={COLORS.orange} />
                  </View>
                  <Text style={styles.metricLabel}>Active Trips</Text>
                  <Text style={[styles.metricValue, { fontSize: 20 }]}>{activeTripsCount}</Text>
                </View>
              </View>
            </View>

            {/* Trips List */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Organized Trips</Text>
              <Text style={styles.sectionSubtitle}>{trips.length} trips total</Text>
            </View>

            {trips.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="sad-outline" size={48} color={COLORS.mediumGray} />
                <Text style={styles.emptyText}>You haven't organized any trips yet.</Text>
                <TouchableOpacity 
                  style={styles.createTripBtn}
                  onPress={() => router.push('../more/createTrip')}
                >
                  <Text style={styles.createTripBtnText}>Create a Trip</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.tripsContainer}>
                {trips.map((trip) => {
                  const revenue = trip.price * (trip.joined_count || 0);
                  const isFull = trip.joined_count >= trip.capacity;
                  
                  return (
                    <View key={trip.id} style={[styles.tripCard, SHADOW.sm]}>
                      <View style={styles.tripImageContainer}>
                        <Image 
                          source={{ uri: trip.image_urls?.[0] || 'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?q=80&w=1000&auto=format&fit=crop' }} 
                          style={styles.tripImage} 
                          contentFit="cover"
                        />
                        <View style={[styles.statusBadge, { backgroundColor: trip.is_active ? '#DCFCE7' : '#FEF3C7' }]}>
                          <Text style={[styles.statusText, { color: trip.is_active ? COLORS.primary : '#D97706' }]}>
                            {trip.is_active ? 'Active' : 'Pending Review'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.tripContent}>
                        <Text style={styles.tripTitle} numberOfLines={2}>{trip.title}</Text>
                        <View style={styles.tripDateRow}>
                          <Ionicons name="calendar-outline" size={14} color={COLORS.mediumGray} />
                          <Text style={styles.tripDateText}>{new Date(trip.trip_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                        </View>

                        <View style={styles.tripStatsRow}>
                          <View style={styles.tripStat}>
                            <Text style={styles.tripStatLabel}>Subscribers</Text>
                            <Text style={[styles.tripStatValue, isFull && { color: COLORS.danger }]}>
                              {trip.joined_count || 0} / {trip.capacity}
                            </Text>
                          </View>
                          <View style={styles.tripStatDivider} />
                          <View style={styles.tripStat}>
                            <Text style={styles.tripStatLabel}>Revenue</Text>
                            <Text style={[styles.tripStatValue, { color: COLORS.primary }]}>
                              ₹{revenue.toLocaleString()}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingBottom: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'JakartaBold',
    color: COLORS.darkGray,
  },
  loadingContainer: {
    paddingTop: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricsContainer: {
    marginBottom: 30,
  },
  metricCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  revenueCard: {
    minHeight: 140,
    justifyContent: 'center',
  },
  metricIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  metricLabel: {
    fontFamily: 'JakartaMedium',
    fontSize: 14,
    color: COLORS.mediumGray,
    marginBottom: 8,
  },
  metricValue: {
    fontFamily: 'JakartaBold',
    fontSize: 32,
    color: COLORS.darkGray,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  metricSmallCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'JakartaBold',
    fontSize: 20,
    color: COLORS.darkGray,
  },
  sectionSubtitle: {
    fontFamily: 'JakartaMedium',
    fontSize: 14,
    color: COLORS.mediumGray,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    backgroundColor: COLORS.white,
    borderRadius: 16,
  },
  emptyText: {
    fontFamily: 'JakartaMedium',
    fontSize: 16,
    color: COLORS.mediumGray,
    marginTop: 16,
    marginBottom: 24,
  },
  createTripBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  createTripBtnText: {
    fontFamily: 'JakartaBold',
    color: COLORS.white,
    fontSize: 14,
  },
  tripsContainer: {
    gap: 16,
  },
  tripCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
  },
  tripImageContainer: {
    height: 140,
    width: '100%',
    position: 'relative',
  },
  tripImage: {
    width: '100%',
    height: '100%',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontFamily: 'JakartaBold',
    fontSize: 12,
  },
  tripContent: {
    padding: 16,
  },
  tripTitle: {
    fontFamily: 'JakartaBold',
    fontSize: 16,
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  tripDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tripDateText: {
    fontFamily: 'JakartaMedium',
    fontSize: 13,
    color: COLORS.mediumGray,
    marginLeft: 6,
  },
  tripStatsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  tripStat: {
    flex: 1,
  },
  tripStatDivider: {
    width: 1,
    height: '100%',
    backgroundColor: COLORS.borderGray,
    marginHorizontal: 16,
  },
  tripStatLabel: {
    fontFamily: 'JakartaMedium',
    fontSize: 12,
    color: COLORS.mediumGray,
    marginBottom: 4,
  },
  tripStatValue: {
    fontFamily: 'JakartaBold',
    fontSize: 15,
    color: COLORS.darkGray,
  },
});
