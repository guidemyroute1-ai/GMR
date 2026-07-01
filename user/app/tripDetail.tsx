import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../components/Text';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Trip, DayPlan } from '../hooks/useTrips';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

const DIFFICULTY_COLOR: Record<string, string> = {
  Easy: '#16a34a',
  Moderate: '#f59e0b',
  Hard: '#ef4444',
};

// ─── Sub-components ────────────────────────────────────────────────────────

function ImageGallery({ images }: { images: string[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const fallback = 'https://images.unsplash.com/photo-1542382156885-32e73722a84a?auto=format&fit=crop&w=800&q=80';
  const list = images?.length > 0 ? images : [fallback];

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(idx);
  };

  return (
    <View style={{ height: 300 }}>
      <FlatList
        data={list}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <Image source={{ uri: item }} style={{ width, height: 300 }} resizeMode="cover" />
        )}
      />
      {list.length > 1 && (
        <View style={styles.dotsRow}>
          {list.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === activeIndex && styles.dotActive]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function StatChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View style={styles.statChip}>
      {icon}
      <Text style={styles.statChipText}>{label}</Text>
    </View>
  );
}

function DayCard({ plan, index }: { plan: DayPlan; index: number }) {
  const [open, setOpen] = useState(index === 0);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((v) => !v);
  };

  return (
    <View style={styles.dayCard}>
      <TouchableOpacity style={styles.dayCardHeader} onPress={toggle} activeOpacity={0.75}>
        <View style={styles.dayBadge}>
          <Text style={styles.dayBadgeText}>Day {plan.day}</Text>
        </View>
        <Text style={styles.dayCardTitle} numberOfLines={1}>
          {plan.title || `Day ${plan.day}`}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color="#9ca3af" />
      </TouchableOpacity>

      {open && (
        <View style={styles.dayCardBody}>
          {/* Activities */}
          <Text style={styles.dayBodyLabel}>📍 Plan</Text>
          <Text style={styles.dayBodyText}>{plan.activities}</Text>

          {(plan.accommodation || plan.meals) && (
            <View style={styles.dayMeta}>
              {plan.accommodation ? (
                <View style={styles.dayMetaItem}>
                  <Ionicons name="bed-outline" size={14} color="#6b7280" />
                  <Text style={styles.dayMetaText}>{plan.accommodation}</Text>
                </View>
              ) : null}
              {plan.meals ? (
                <View style={styles.dayMetaItem}>
                  <Ionicons name="restaurant-outline" size={14} color="#6b7280" />
                  <Text style={styles.dayMetaText}>{plan.meals}</Text>
                </View>
              ) : null}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────
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
        if (error.code === '23505') { setHasJoined(true); return; }
        throw error;
      }
      setHasJoined(true);
      Alert.alert('Success 🎉', 'You have joined this trip!');
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

  // ── Derived values ──────────────────────────────────────────────
  const startDate = new Date(trip.trip_date);
  const endDate = trip.end_date ? new Date(trip.end_date) : null;
  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const dayCount = endDate
    ? Math.round((endDate.getTime() - startDate.getTime()) / 864e5) + 1
    : 1;

  const seatsLeft = Math.max(trip.capacity - (trip.joined_count ?? 0), 0);
  const seatPercent = Math.round(((trip.capacity - seatsLeft) / trip.capacity) * 100);

  const diffColor = DIFFICULTY_COLOR[trip.difficulty ?? ''] ?? '#6b7280';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Hero Gallery ──────────────────────────────────────────── */}
        <View style={styles.imageContainer}>
          <ImageGallery images={trip.images} />
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#1f2937" />
          </TouchableOpacity>
          {trip.images?.length > 1 && (
            <View style={styles.imageCountBadge}>
              <Ionicons name="images-outline" size={12} color="#fff" />
              <Text style={styles.imageCountText}>{trip.images.length}</Text>
            </View>
          )}
        </View>

        <View style={styles.detailsContainer}>

          {/* ── Badges row ─────────────────────────────────────────── */}
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{trip.trip_type.toUpperCase()}</Text>
            </View>
            {trip.is_featured && (
              <View style={[styles.badge, { backgroundColor: '#fef3c7', borderColor: '#fbbf24' }]}>
                <Ionicons name="star" size={10} color="#f59e0b" />
                <Text style={[styles.badgeText, { color: '#d97706' }]}>FEATURED</Text>
              </View>
            )}
            {trip.difficulty && (
              <View style={[styles.badge, { backgroundColor: `${diffColor}15`, borderColor: `${diffColor}40` }]}>
                <Text style={[styles.badgeText, { color: diffColor }]}>{trip.difficulty.toUpperCase()}</Text>
              </View>
            )}
          </View>

          {/* ── Title & Subtitle ────────────────────────────────────── */}
          <Text style={styles.title}>{trip.title}</Text>
          {trip.subtitle ? <Text style={styles.subtitle}>{trip.subtitle}</Text> : null}

          {/* ── Stat chips ──────────────────────────────────────────── */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statRow}>
            <StatChip
              icon={<Ionicons name="calendar-outline" size={14} color="#16a34a" />}
              label={endDate ? `${formatDate(startDate)} → ${formatDate(endDate)}` : formatDate(startDate)}
            />
            <StatChip
              icon={<Ionicons name="time-outline" size={14} color="#16a34a" />}
              label={dayCount === 1 ? '1 Day' : `${dayCount} Days`}
            />
            <StatChip
              icon={<Ionicons name="location-outline" size={14} color="#16a34a" />}
              label={trip.city || 'TBA'}
            />
            <StatChip
              icon={<Ionicons name="people-outline" size={14} color="#16a34a" />}
              label={`${trip.capacity} spots`}
            />
            {trip.rating != null && (
              <StatChip
                icon={<Ionicons name="star" size={14} color="#f59e0b" />}
                label={`${trip.rating} (${trip.review_count ?? 0})`}
              />
            )}
          </ScrollView>

          {/* ── Seats bar ───────────────────────────────────────────── */}
          <View style={styles.seatsSection}>
            <View style={styles.seatsLabelRow}>
              <Text style={styles.seatsLabel}>
                <Text style={{ color: seatsLeft === 0 ? '#ef4444' : '#16a34a', fontWeight: '700' }}>
                  {seatsLeft === 0 ? 'Sold Out' : `${seatsLeft} seats left`}
                </Text>
                {'  '}of {trip.capacity}
              </Text>
              <Text style={styles.seatPercent}>{seatPercent}% filled</Text>
            </View>
            <View style={styles.seatBarBg}>
              <View style={[styles.seatBarFill, { width: `${seatPercent}%` as any, backgroundColor: seatsLeft === 0 ? '#ef4444' : '#16a34a' }]} />
            </View>
          </View>

          {/* ── Organizer ───────────────────────────────────────────── */}
          {trip.organizer && (
            <View style={styles.organizerCard}>
              <Image
                source={{ uri: trip.organizer.photo_url || 'https://i.pravatar.cc/100' }}
                style={styles.organizerImage}
              />
              <View style={styles.organizerInfo}>
                <Text style={styles.organizerLabel}>Hosted by</Text>
                <Text style={styles.organizerName}>{trip.organizer.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <Ionicons name="star" size={12} color="#f59e0b" />
                  <Text style={styles.organizerRating}>
                    {trip.organizer.rating ?? '5.0'} · Organizer
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.contactBtn}>
                <Ionicons name="chatbubble-ellipses-outline" size={18} color="#16a34a" />
              </TouchableOpacity>
            </View>
          )}

          {/* ── Divider ─────────────────────────────────────────────── */}
          <View style={styles.divider} />

          {/* ── Meeting point ───────────────────────────────────────── */}
          {trip.location_text ? (
            <View style={styles.infoBlock}>
              <Text style={styles.sectionTitle}>📍 Meeting Point</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location-sharp" size={16} color="#16a34a" />
                <Text style={styles.locationText}>{trip.location_text}</Text>
              </View>
            </View>
          ) : null}

          {/* ── About ───────────────────────────────────────────────── */}
          <View style={styles.infoBlock}>
            <Text style={styles.sectionTitle}>About this Trip</Text>
            <Text style={styles.bodyText}>{trip.description || 'No description provided.'}</Text>
          </View>

          {/* ── What's included ─────────────────────────────────────── */}
          {trip.includes ? (
            <View style={styles.infoBlock}>
              <Text style={styles.sectionTitle}>✅ What's Included</Text>
              <Text style={styles.bodyText}>{trip.includes}</Text>
            </View>
          ) : null}

          {/* ── What to Bring ───────────────────────────────────────── */}
          {trip.what_to_bring ? (
            <View style={styles.infoBlock}>
              <Text style={styles.sectionTitle}>🎒 What to Bring</Text>
              <View style={styles.bringCard}>
                {trip.what_to_bring.split(/[,\n]+/).map((item, i) => {
                  const clean = item.trim();
                  return clean ? (
                    <View key={i} style={styles.bringItem}>
                      <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                      <Text style={styles.bringText}>{clean}</Text>
                    </View>
                  ) : null;
                })}
              </View>
            </View>
          ) : null}

          {/* ── Day-wise Itinerary ──────────────────────────────────── */}
          {trip.day_plans && trip.day_plans.length > 0 && (
            <View style={styles.infoBlock}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="calendar" size={18} color="#16a34a" />
                <Text style={styles.sectionTitle}>Day-wise Itinerary</Text>
              </View>
              <Text style={styles.itinerarySubtitle}>
                {trip.day_plans.length}-day trip plan
              </Text>
              {trip.day_plans.map((plan, idx) => (
                <DayCard key={plan.day} plan={plan} index={idx} />
              ))}
            </View>
          )}

          <View style={{ height: 8 }} />
        </View>
      </ScrollView>

      {/* ── Footer: Price + Join ───────────────────────────────────── */}
      <View style={styles.footer}>
        <View style={styles.priceBlock}>
          <Text style={styles.price}>₹{trip.price}</Text>
          {trip.original_price && trip.original_price > trip.price && (
            <Text style={styles.originalPrice}>₹{trip.original_price}</Text>
          )}
          <Text style={styles.perPersonText}>per person</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.joinButton,
            hasJoined && styles.joinedButton,
            seatsLeft === 0 && !hasJoined && styles.soldOutButton,
          ]}
          onPress={hasJoined ? undefined : handleJoin}
          disabled={joining || hasJoined || seatsLeft === 0}
        >
          {joining ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.joinButtonText}>
              {hasJoined ? '✓ Joined' : seatsLeft === 0 ? 'Sold Out' : 'Join Trip'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { paddingBottom: 24 },

  // ── Gallery ──────────────────────────────────────────────────────
  imageContainer: { position: 'relative' },
  dotsRow: {
    position: 'absolute',
    bottom: 12,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { backgroundColor: '#fff', width: 18 },
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
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  imageCountBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  imageCountText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  // ── Details panel ────────────────────────────────────────────────
  detailsContainer: {
    padding: 20,
    marginTop: -24,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },

  // ── Badges ───────────────────────────────────────────────────────
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: { color: '#16a34a', fontSize: 10, fontWeight: '700' },

  // ── Title ────────────────────────────────────────────────────────
  title: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 4, lineHeight: 30 },
  subtitle: { fontSize: 15, color: '#6b7280', marginBottom: 16, lineHeight: 22 },

  // ── Stat chips ───────────────────────────────────────────────────
  statRow: { marginBottom: 20, marginHorizontal: -4 },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  statChipText: { fontSize: 12, fontWeight: '600', color: '#374151' },

  // ── Seats bar ────────────────────────────────────────────────────
  seatsSection: { marginBottom: 20 },
  seatsLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  seatsLabel: { fontSize: 13, color: '#6b7280' },
  seatPercent: { fontSize: 12, color: '#9ca3af', fontWeight: '500' },
  seatBarBg: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  seatBarFill: { height: '100%', borderRadius: 3 },

  // ── Organizer ────────────────────────────────────────────────────
  organizerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  organizerImage: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  organizerInfo: { flex: 1 },
  organizerLabel: { fontSize: 11, color: '#9ca3af', fontWeight: '500' },
  organizerName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  organizerRating: { fontSize: 12, color: '#6b7280' },
  contactBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },

  // ── Divider ──────────────────────────────────────────────────────
  divider: { height: 1, backgroundColor: '#f3f4f6', marginBottom: 20 },

  // ── Info blocks ──────────────────────────────────────────────────
  infoBlock: { marginBottom: 24 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 10 },
  bodyText: { fontSize: 15, color: '#4b5563', lineHeight: 24 },

  // ── Meeting point ────────────────────────────────────────────────
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  locationText: { flex: 1, fontSize: 14, color: '#374151', lineHeight: 20 },

  // ── What to Bring ────────────────────────────────────────────────
  bringCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  bringItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bringText: { flex: 1, fontSize: 14, color: '#374151', lineHeight: 20 },

  // ── Day-wise Itinerary ───────────────────────────────────────────
  itinerarySubtitle: { fontSize: 13, color: '#9ca3af', marginBottom: 12, marginTop: -6 },
  dayCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  dayCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#f8fafc',
  },
  dayBadge: {
    backgroundColor: '#16a34a',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 52,
    alignItems: 'center',
  },
  dayBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  dayCardTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: '#111827' },
  dayCardBody: { padding: 14, gap: 10 },
  dayBodyLabel: { fontSize: 12, fontWeight: '700', color: '#6b7280', marginBottom: 2 },
  dayBodyText: { fontSize: 14, color: '#374151', lineHeight: 22 },
  dayMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 },
  dayMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  dayMetaText: { fontSize: 12, color: '#6b7280' },

  // ── Footer ───────────────────────────────────────────────────────
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    backgroundColor: '#fff',
  },
  priceBlock: { flex: 1 },
  price: { fontSize: 26, fontWeight: '800', color: '#111827' },
  originalPrice: {
    fontSize: 14,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
    marginTop: -2,
  },
  perPersonText: { fontSize: 11, color: '#9ca3af', marginTop: 1 },
  joinButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 32,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 130,
  },
  joinedButton: { backgroundColor: '#6b7280' },
  soldOutButton: { backgroundColor: '#ef4444' },
  joinButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
