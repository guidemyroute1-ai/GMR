import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { router, useNavigation } from 'expo-router';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import ScreenHeader from '../../components/ScreenHeader';

// Color Palette from Design
const COLORS = {
  primary: '#16A34A',
  primaryLight: '#DCFCE7',
  white: '#FFFFFF',
  background: '#F8FAFC',
  darkGray: '#0F172A',
  gray: '#475569',
  lightGray: '#94A3B8',
  border: '#E2E8F0',
  orange: '#F97316',
  orangeLight: '#FFF7ED',
  purple: '#A855F7',
  purpleLight: '#F3E8FF',
  blue: '#3B82F6',
  blueLight: '#EFF6FF',
};

type FilterType = 'All' | 'Trips' | 'Hotels' | 'Rentals';
type StatusType = 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled';

interface Booking {
  id: string;
  title: string;
  subtitle: string;
  type: 'trip' | 'hotel' | 'rental';
  dateStr: string;
  timeStr: string;
  durationStr: string;
  status: StatusType;
  image: string | null;
  amount: number;
  bookingId: string;
  item_id?: string;
  rawDate: number;
  prePaymentStatus?: string;
}

export default function MyBookingsScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const canGoBack = navigation.canGoBack();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<FilterType>('All');
  
  const fetchBookings = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const rows = data || [];

      // Batch fetch listing images
      const listingIds = [...new Set(rows.filter((r) => r.booking_type !== 'guide' && r.item_id).map((r) => r.item_id))];
      const guideIds = [...new Set(rows.filter((r) => r.booking_type === 'guide').map((r) => r.partner_id || r.item_id).filter(Boolean))];
      
      const listingImageMap: Record<string, string | null> = {};
      if (listingIds.length > 0) {
        const { data: listings } = await supabase.from('listings').select('id, images').in('id', listingIds);
        (listings || []).forEach((l) => {
          listingImageMap[l.id] = l.images && Array.isArray(l.images) && l.images.length > 0 ? l.images[0] : null;
        });
      }

      const guideImageMap: Record<string, string | null> = {};
      if (guideIds.length > 0) {
        const { data: users } = await supabase.from('users').select('id, photo_url, profile_data').in('id', guideIds);
        (users || []).forEach((u) => {
          const pd = u.profile_data || {};
          guideImageMap[u.id] = u.photo_url || pd.profileImage || pd.profile_image || null;
        });
      }

      const parsed: Booking[] = rows.map((row) => {
        let type: 'trip' | 'hotel' | 'rental' = 'rental';
        if (row.booking_type === 'guide' || row.booking_type === 'trip') type = 'trip';
        else if (row.booking_type === 'hotel') type = 'hotel';
        else if (row.booking_type === 'vehicle' || row.booking_type === 'rental') type = 'rental';

        let status: StatusType = 'Pending';
        const rawStatus = (row.status || '').toLowerCase();
        if (rawStatus === 'confirmed') status = 'Confirmed';
        else if (rawStatus === 'completed') status = 'Completed';
        else if (rawStatus === 'cancelled' || rawStatus === 'rejected') status = 'Cancelled';
        
        let image = null;
        if (row.booking_type === 'guide') {
          image = guideImageMap[row.partner_id || row.item_id] || null;
        } else {
          image = listingImageMap[row.item_id] || null;
        }

        const dateObj = new Date(row.date || row.created_at || Date.now());
        const dateStr = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        let durationStr = row.days ? `${row.days} Days` : 'N/A';
        if (type === 'trip') durationStr = row.number_of_people ? `${row.number_of_people} Booked` : '1 Booked';
        if (type === 'hotel') durationStr = row.rooms ? `${row.rooms} Room • ${row.number_of_people || 1} Guests` : '1 Room';

        // Fake booking ID for UI if not present
        const bId = row.id ? row.id.substring(0, 5).toUpperCase() : '12345';
        const prefix = type === 'trip' ? 'TRP' : type === 'hotel' ? 'HOT' : 'RNT';

        return {
          id: row.id,
          title: row.item_name || (type === 'trip' ? 'Trip' : type === 'hotel' ? 'Hotel' : 'Rental'),
          subtitle: row.pickup_location || row.city || 'Various locations',
          type,
          dateStr,
          timeStr,
          durationStr,
          status,
          image,
          amount: row.amount || row.price || 0,
          bookingId: `${prefix}${bId}`,
          item_id: row.item_id,
          rawDate: dateObj.getTime(),
          prePaymentStatus: row.pre_payment_status,
        };
      });

      setBookings(parsed);
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', 'Failed to fetch bookings.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBookings();
  }, [user]);

  const filtered = bookings.filter((b) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Trips' && b.type === 'trip') return true;
    if (activeTab === 'Hotels' && b.type === 'hotel') return true;
    if (activeTab === 'Rentals' && b.type === 'rental') return true;
    return false;
  });

  const upcoming = filtered.filter((b) => b.status === 'Confirmed' || b.status === 'Pending').sort((a, b) => a.rawDate - b.rawDate);
  const past = filtered.filter((b) => b.status === 'Completed' || b.status === 'Cancelled').sort((a, b) => b.rawDate - a.rawDate);

  // Summary Stats
  const totalUpcoming = upcoming.length;
  const totalCompleted = past.filter(b => b.status === 'Completed').length;
  const totalSpent = past.filter(b => b.status === 'Completed').reduce((sum, b) => sum + b.amount, 0);
  const savedTrips = past.filter(b => b.status === 'Completed' && b.type === 'trip').length; // Dynamic mock stat for design

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'trip': return { bg: COLORS.primaryLight, color: COLORS.primary, label: 'TRIP' };
      case 'hotel': return { bg: COLORS.purpleLight, color: COLORS.purple, label: 'HOTEL' };
      case 'rental': return { bg: COLORS.orangeLight, color: COLORS.orange, label: 'RENTAL' };
      default: return { bg: COLORS.primaryLight, color: COLORS.primary, label: 'TRIP' };
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      {/* HEADER */}
      <ScreenHeader 
        title="Bookings"
        showAvatar={true}
        showLocation={false}
      />

      {/* TABS */}
      <View style={styles.tabsContainer}>
        {(['All', 'Trips', 'Hotels', 'Rentals'] as FilterType[]).map((tab) => {
          const isActive = activeTab === tab;
          let icon = '';
          if (tab === 'All') icon = 'grid-outline';
          if (tab === 'Trips') icon = 'map-outline';
          if (tab === 'Hotels') icon = 'business-outline';
          if (tab === 'Rentals') icon = 'bicycle-outline'; 
          
          return (
            <TouchableOpacity 
              key={tab} 
              style={[styles.tabBtn, isActive && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={icon as any} 
                size={16} 
                color={isActive ? COLORS.primary : COLORS.gray} 
              />
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView 
          style={styles.scroll} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        >
          {/* UPCOMING TRIPS */}
          {upcoming.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="briefcase-outline" size={20} color={COLORS.gray} />
                  <Text style={styles.sectionTitle}>Upcoming Trips</Text>
                </View>
                <TouchableOpacity>
                  <Text style={styles.viewAllText}>View all <Ionicons name="chevron-forward" size={12} /></Text>
                </TouchableOpacity>
              </View>

              {/* FEATURED CARD */}
              <View style={styles.featuredCard}>
                <View style={styles.featuredImageContainer}>
                  {upcoming[0].image ? (
                    <ExpoImage source={{ uri: upcoming[0].image }} style={styles.featuredImage} contentFit="cover" />
                  ) : (
                    <View style={[styles.featuredImage, { backgroundColor: COLORS.border, alignItems: 'center', justifyContent: 'center' }]}>
                      <Ionicons name="image-outline" size={40} color={COLORS.lightGray} />
                    </View>
                  )}
                  {/* Countdown Badge */}
                  <View style={styles.countdownBadge}>
                    <Text style={styles.countdownText}>
                      {Math.max(1, Math.ceil((upcoming[0].rawDate - Date.now()) / (1000 * 60 * 60 * 24)))} Days to go
                    </Text>
                  </View>
                </View>

                <View style={styles.featuredContent}>
                  <View style={styles.featuredRow}>
                    <View style={{ flex: 1, paddingRight: 10 }}>
                      <View style={[styles.typeBadge, { backgroundColor: getBadgeStyle(upcoming[0].type).bg }]}>
                        <Text style={[styles.typeBadgeText, { color: getBadgeStyle(upcoming[0].type).color }]}>
                          {getBadgeStyle(upcoming[0].type).label}
                        </Text>
                      </View>
                      <Text style={styles.featuredTitle} numberOfLines={1}>{upcoming[0].title}</Text>
                      <Text style={styles.featuredSubtitle} numberOfLines={1}>{upcoming[0].subtitle}</Text>
                    </View>
                    <View style={styles.bookingIdBadge}>
                      <Text style={styles.bookingIdLabel}>Booking ID</Text>
                      <Text style={styles.bookingIdText}>{upcoming[0].bookingId}</Text>
                    </View>
                  </View>

                  <View style={styles.featuredMeta}>
                    <View style={styles.metaItem}>
                      <Ionicons name="calendar-outline" size={16} color={COLORS.gray} />
                      <Text style={styles.metaText}>{upcoming[0].dateStr}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="time-outline" size={16} color={COLORS.gray} />
                      <Text style={styles.metaText}>Starts at {upcoming[0].timeStr}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="people-outline" size={16} color={COLORS.gray} />
                      <Text style={styles.metaText}>{upcoming[0].durationStr}</Text>
                    </View>
                  </View>

                  {/* Avatars pile */}
                  {upcoming[0].type === 'trip' && (
                    <View style={styles.avatarPile}>
                      <ExpoImage source={{ uri: 'https://i.pravatar.cc/150?u=1' }} style={styles.pileAvatar} />
                      <ExpoImage source={{ uri: 'https://i.pravatar.cc/150?u=2' }} style={[styles.pileAvatar, { marginLeft: -10 }]} />
                      <ExpoImage source={{ uri: 'https://i.pravatar.cc/150?u=3' }} style={[styles.pileAvatar, { marginLeft: -10 }]} />
                      <View style={[styles.pileAvatarExtra, { marginLeft: -10 }]}>
                        <Text style={styles.pileExtraText}>+1</Text>
                      </View>
                    </View>
                  )}

                  {/* Actions */}
                  <View style={[styles.featuredActions, upcoming[0].type !== 'trip' && { marginTop: 12 }]}>
                    <TouchableOpacity style={styles.actionBtnSecondary} onPress={() => router.push({ pathname: '/more/bookingDetail', params: { id: upcoming[0].id }})}>
                      <Text style={styles.actionBtnSecondaryText}>View Details</Text>
                    </TouchableOpacity>
                    {upcoming[0].prePaymentStatus === 'awaiting_payment' && (
                      <TouchableOpacity 
                        style={styles.actionBtnSecondary} 
                        onPress={() => router.push({ pathname: '/more/bookingDetail', params: { id: upcoming[0].id }})}
                      >
                        <Ionicons name="card-outline" size={16} color={COLORS.primary} style={{ marginRight: 4 }} />
                        <Text style={styles.actionBtnSecondaryText}>Pay Now</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.actionBtnPrimary} onPress={() => Alert.alert('Itinerary', 'Viewing itinerary...')}>
                      <Ionicons name="map-outline" size={16} color={COLORS.white} style={{ marginRight: 4 }} />
                      <Text style={styles.actionBtnPrimaryText}>Trip Itinerary</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* COMPACT CARDS */}
              {upcoming.slice(1).map((booking) => {
                const badgeStyle = getBadgeStyle(booking.type);
                return (
                  <TouchableOpacity 
                    key={booking.id} 
                    style={styles.compactCard}
                    onPress={() => router.push({ pathname: '/more/bookingDetail', params: { id: booking.id }})}
                    activeOpacity={0.8}
                  >
                    {booking.image ? (
                      <ExpoImage source={{ uri: booking.image }} style={styles.compactImage} contentFit="cover" />
                    ) : (
                      <View style={[styles.compactImage, { backgroundColor: COLORS.border, alignItems: 'center', justifyContent: 'center' }]}>
                        <Ionicons name="image-outline" size={24} color={COLORS.lightGray} />
                      </View>
                    )}
                    <View style={styles.compactInfo}>
                      <View style={styles.compactTopRow}>
                        <View style={[styles.typeBadgeCompact, { backgroundColor: badgeStyle.bg }]}>
                          <Text style={[styles.typeBadgeTextCompact, { color: badgeStyle.color }]}>{badgeStyle.label}</Text>
                        </View>
                        <View style={styles.bookingIdBadgeCompact}>
                          <Text style={styles.bookingIdLabelCompact}>Booking ID</Text>
                          <Text style={[styles.bookingIdTextCompact, { color: badgeStyle.color }]}>{booking.bookingId}</Text>
                        </View>
                      </View>
                      <Text style={styles.compactTitle} numberOfLines={1}>{booking.title}</Text>
                      <Text style={styles.compactSubtitle} numberOfLines={1}>{booking.subtitle}</Text>
                    </View>
                    <View style={styles.compactRight}>
                      <View style={styles.compactMetaRight}>
                        <View style={styles.metaItem}>
                          <Ionicons name="calendar-outline" size={12} color={COLORS.gray} />
                          <Text style={styles.compactMetaText}>{booking.dateStr}</Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Ionicons name={booking.type === 'hotel' ? 'bed-outline' : booking.type === 'trip' ? 'people-outline' : 'time-outline'} size={12} color={COLORS.gray} />
                          <Text style={styles.compactMetaText}>{booking.durationStr}</Text>
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={COLORS.lightGray} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* PAST TRIPS */}
          {past.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="time-outline" size={20} color={COLORS.gray} />
                  <Text style={styles.sectionTitle}>Past Trips</Text>
                </View>
             
              </View>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                {past.map((booking) => (
                  <View key={booking.id} style={styles.pastCard}>
                    <View style={styles.pastImageContainer}>
                      {booking.image ? (
                        <ExpoImage source={{ uri: booking.image }} style={styles.pastImage} contentFit="cover" />
                      ) : (
                        <View style={[styles.pastImage, { backgroundColor: COLORS.border, alignItems: 'center', justifyContent: 'center' }]}>
                          <Ionicons name="image-outline" size={30} color={COLORS.lightGray} />
                        </View>
                      )}
                      <View style={styles.ratingBadge}>
                        <Ionicons name="star" size={12} color={COLORS.white} />
                        <Text style={styles.ratingText}>4.8</Text>
                      </View>
                    </View>
                    <View style={styles.pastInfo}>
                      <View style={[styles.typeBadge, { backgroundColor: getBadgeStyle(booking.type).bg, alignSelf: 'flex-start' }]}>
                        <Text style={[styles.typeBadgeText, { color: getBadgeStyle(booking.type).color }]}>{getBadgeStyle(booking.type).label}</Text>
                      </View>
                      <Text style={styles.pastTitle} numberOfLines={1}>{booking.title}</Text>
                      <View style={styles.metaItemPast}>
                        <Ionicons name="time-outline" size={12} color={COLORS.gray} />
                        <Text style={styles.pastMetaText}>{booking.dateStr}</Text>
                      </View>
                      <View style={styles.metaItemPast}>
                        <Ionicons name="people-outline" size={12} color={COLORS.gray} />
                        <Text style={styles.pastMetaText}>{booking.durationStr}</Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.reviewBtn}
                        onPress={() => router.push({ pathname: '/more/RateAndReview', params: { bookingId: booking.id, itemId: booking.item_id }})}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.reviewBtnText}>Write Review</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* EMPTY STATE */}
          {!loading && upcoming.length === 0 && past.length === 0 && (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconBox}>
                <Ionicons name="file-tray-outline" size={48} color={COLORS.gray} />
              </View>
              <Text style={styles.emptyTitle}>No Bookings Found</Text>
              <Text style={styles.emptySubtitle}>You don't have any bookings in this category yet.</Text>
            </View>
          )}

          {/* BOOKINGS SUMMARY */}
          {bookings.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="wallet-outline" size={20} color={COLORS.gray} />
                <Text style={styles.sectionTitle}>Bookings Summary</Text>
              </View>
              <View style={styles.summaryGrid}>
                <View style={[styles.summaryCard, { backgroundColor: COLORS.primaryLight }]}>
                  <View style={[styles.summaryIconBox, { backgroundColor: COLORS.primary }]}>
                    <Ionicons name="briefcase-outline" size={20} color={COLORS.white} />
                  </View>
                  <View>
                    <Text style={styles.summaryLabel}>Upcoming</Text>
                    <Text style={styles.summaryValue}>{totalUpcoming}</Text>
                    <Text style={styles.summarySubLabel}>Bookings</Text>
                  </View>
                </View>
                
                <View style={[styles.summaryCard, { backgroundColor: COLORS.blueLight }]}>
                  <View style={[styles.summaryIconBox, { backgroundColor: COLORS.blue }]}>
                    <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.white} />
                  </View>
                  <View>
                    <Text style={styles.summaryLabel}>Completed</Text>
                    <Text style={styles.summaryValue}>{totalCompleted}</Text>
                    <Text style={styles.summarySubLabel}>Trips</Text>
                  </View>
                </View>
                
                <View style={[styles.summaryCard, { backgroundColor: COLORS.orangeLight }]}>
                  <View style={[styles.summaryIconBox, { backgroundColor: COLORS.orange }]}>
                    <Ionicons name="star-outline" size={20} color={COLORS.white} />
                  </View>
                  <View>
                    <Text style={styles.summaryLabel}>Total Spent</Text>
                    <Text style={styles.summaryValue}>₹{totalSpent.toLocaleString()}</Text>
                    <Text style={styles.summarySubLabel}>All Time</Text>
                  </View>
                </View>
                
                <View style={[styles.summaryCard, { backgroundColor: COLORS.purpleLight }]}>
                  <View style={[styles.summaryIconBox, { backgroundColor: COLORS.purple }]}>
                    <Ionicons name="bookmark-outline" size={20} color={COLORS.white} />
                  </View>
                  <View>
                    <Text style={styles.summaryLabel}>Saved</Text>
                    <Text style={styles.summaryValue}>{savedTrips}</Text>
                    <Text style={styles.summarySubLabel}>Trips</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* HELP BANNER */}
          <View style={styles.helpBanner}>
            <View style={styles.helpIconBox}>
              <Ionicons name="shield-checkmark-outline" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.helpTextContainer}>
              <Text style={styles.helpTitle}>Need help with a booking?</Text>
              <Text style={styles.helpSubtitle}>Chat with our support team, we're here to help!</Text>
            </View>
            <TouchableOpacity style={styles.supportBtn} onPress={() => router.push('/extra/HelpSupport')}>
              <Ionicons name="headset-outline" size={16} color={COLORS.primary} />
              <Text style={styles.supportBtnText}>Contact Support</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 5,
    marginRight: -35,
  },
  backBtn: {
    padding: 4,
    marginLeft: -4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.darkGray,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bellBtn: {
    position: 'relative',
    padding: 4,
  },
  bellDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.orange,
    borderWidth: 1,
    borderColor: COLORS.white,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.border,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 15,
    gap: 8,
    backgroundColor: COLORS.white,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  tabBtnActive: {
    borderColor: COLORS.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray,
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  scroll: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.darkGray,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  
  // Featured Card
  featuredCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginBottom: 16,
  },
  featuredImageContainer: {
    position: 'relative',
  },
  featuredImage: {
    width: '100%',
    height: 180,
  },
  countdownBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(31, 41, 55, 0.75)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  countdownText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  featuredContent: {
    padding: 16,
  },
  featuredRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.darkGray,
    marginBottom: 2,
  },
  featuredSubtitle: {
    fontSize: 13,
    color: COLORS.gray,
  },
  bookingIdBadge: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bookingIdLabel: {
    fontSize: 9,
    color: COLORS.lightGray,
    fontWeight: '700',
  },
  bookingIdText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.darkGray,
  },
  featuredMeta: {
    marginBottom: 16,
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 13,
    color: COLORS.gray,
    fontWeight: '500',
  },
  avatarPile: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  pileAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  pileAvatarExtra: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pileExtraText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.gray,
  },
  featuredActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
  },
  actionBtnSecondaryText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  actionBtnPrimary: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  actionBtnPrimaryText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  
  // Compact Card
  compactCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  compactImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  compactInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  compactTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  typeBadgeCompact: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeTextCompact: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bookingIdBadgeCompact: {
    backgroundColor: COLORS.purpleLight, // Can be dynamic based on type, using a neutral or light color
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  bookingIdLabelCompact: {
    fontSize: 8,
    color: COLORS.gray,
    fontWeight: '600',
  },
  bookingIdTextCompact: {
    fontSize: 9,
    fontWeight: '800',
  },
  compactTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.darkGray,
    marginBottom: 2,
  },
  compactSubtitle: {
    fontSize: 12,
    color: COLORS.gray,
  },
  compactRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  compactMetaRight: {
    alignItems: 'flex-end',
    marginRight: 8,
    gap: 4,
  },
  compactMetaText: {
    fontSize: 11,
    color: COLORS.gray,
    fontWeight: '500',
  },

  // Past Trips
  horizontalScroll: {
    paddingHorizontal: 20,
    gap: 16,
  },
  pastCard: {
    width: 220,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  pastImageContainer: {
    position: 'relative',
  },
  pastImage: {
    width: '100%',
    height: 120,
  },
  ratingBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  ratingText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },
  pastInfo: {
    padding: 12,
  },
  pastTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  metaItemPast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  pastMetaText: {
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: '500',
  },
  reviewBtn: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
  },
  reviewBtnText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },

  // Summary Grid
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  summaryCard: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    color: COLORS.gray,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.darkGray,
    marginVertical: 2,
  },
  summarySubLabel: {
    fontSize: 10,
    color: COLORS.lightGray,
    fontWeight: '500',
  },

  // Help Banner
  helpBanner: {
    marginHorizontal: 20,
    backgroundColor: COLORS.primaryLight, 
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  helpIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  helpTextContainer: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.darkGray,
    marginBottom: 2,
  },
  helpSubtitle: {
    fontSize: 11,
    color: COLORS.gray,
    fontWeight: '500',
  },
  supportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    gap: 6,
    marginLeft: 12,
  },
  supportBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.gray,
  },
});
