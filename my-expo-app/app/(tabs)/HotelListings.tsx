import { Text } from '../../components/Text';
import { useRouter } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import AppBar from '../../components/AppBar';
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
  borderGray: '#d3dbe2',
};

// ─── Types ─────────────────────────────────────────────────────────────────────
interface FeatureTag {
  label: string;
  color: string;
}

interface Hotel {
  id: string;
  name: string;
  type: string;
  rating: number;
  reviews: number;
  pricePerNight: number;
  emoji: string;
  tags: FeatureTag[];
  image?: string;
  location?: string;
  distance?: string;
  originalPrice?: number;
  taxes?: number;
  isGenius?: boolean;
  scoreText?: string;
  roomType?: string;
  cancellationPolicy?: string;
  paymentPolicy?: string;
}

const FILTER_TABS = ['All', 'Hotel', 'Resort', 'Villa', 'Homestay'];

const HotelCard = ({ hotel }: { hotel: Hotel }) => {
  const router = useRouter();

  // Mock data for missing fields to match the image
  const distance = hotel.distance || '1.3 km from centre';
  const originalPrice = hotel.originalPrice || hotel.pricePerNight + 1000;
  const taxes = hotel.taxes || 93;
  const isGenius = hotel.isGenius !== undefined ? hotel.isGenius : true;
  const scoreText = hotel.scoreText || 'Exceptional';
  const roomType = hotel.roomType || '1 bed';
  const cancellationPolicy = hotel.cancellationPolicy || 'Free cancellation';
  const paymentPolicy = hotel.paymentPolicy || 'No prepayment needed';

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => router.push({ pathname: '/more/hotel', params: { id: hotel.id } })}
    >
      <View style={styles.cardContent}>
        {/* Left Side: Image */}
        <View style={styles.imageContainer}>
          {hotel.image ? (
            <Image source={{ uri: hotel.image }} style={styles.hotelImage} />
          ) : (
            <View style={styles.emojiContainer}>
              <Text style={styles.hotelEmoji}>{hotel.emoji}</Text>
            </View>
          )}
        </View>

        {/* Right Side: Details */}
        <View style={styles.detailsContainer}>
          {/* Header Row */}
          <View style={styles.headerRow}>
            <Text style={styles.hotelName} numberOfLines={2}>{hotel.name}</Text>
            <TouchableOpacity hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <Ionicons name="heart-outline" size={20} color={COLORS.darkGray} />
            </TouchableOpacity>
          </View>

          {/* Location */}
          <Text style={styles.locationText} numberOfLines={1}>{hotel.location || 'Paharganj, New Delhi'}</Text>

          {/* Stars and Genius */}
          <View style={styles.starsRow}>
            <View style={styles.stars}>
              {[1, 2, 3, 4].map((_, i) => (
                <Ionicons key={i} name="star" size={14} color="#FBBF24" />
              ))}
            </View>
            {isGenius && (
              <View style={styles.geniusBadge}>
                <Text style={styles.geniusText}>Genius</Text>
              </View>
            )}
          </View>

          {/* Score Row */}
          <View style={styles.scoreRow}>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreNumber}>{hotel.rating.toFixed(1)}</Text>
            </View>
            <Text style={styles.scoreText}>
              {scoreText} <Text style={styles.bullet}>•</Text> {hotel.reviews} reviews
            </Text>
          </View>

          {/* Distance */}
          <View style={styles.distanceRow}>
            <Ionicons name="location-outline" size={14} color={COLORS.darkGray} />
            <Text style={styles.distanceText}>Paharganj <Text style={styles.bullet}>•</Text> {distance}</Text>
          </View>

          {/* Getaway Deal */}
          <View style={styles.dealBadge}>
            <Text style={styles.dealText}>Getaway Deal</Text>
          </View>

          {/* Room Info */}
          <Text style={styles.roomInfo}><Text style={styles.roomInfoBold}>Hotel room: </Text>{roomType}</Text>

          {/* Policies */}
          <View style={styles.policyRow}>
            <Ionicons name="checkmark" size={16} color="#16A34A" />
            <Text style={styles.policyText}>{cancellationPolicy}</Text>
          </View>
          <View style={styles.policyRow}>
            <Ionicons name="checkmark" size={16} color="#16A34A" />
            <Text style={styles.policyText}>{paymentPolicy}</Text>
          </View>

          {/* Pricing area */}
          <View style={styles.pricingContainer}>
            <Text style={styles.priceSubtitle}>Price for 1 night, 2 adults</Text>
            <View style={styles.priceRow}>
              <Text style={styles.originalPrice}>₹ {originalPrice.toLocaleString()}</Text>
              <Text style={styles.currentPrice}>₹ {hotel.pricePerNight.toLocaleString()}</Text>
            </View>
            <Text style={styles.taxesText}>+ ₹ {taxes} taxes and charges</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function HotelListingsScreen() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  const mapRow = useCallback((doc: any): Hotel => {
    const propertyType = doc.details?.propertyType || 'Hotel';
    return {
      id: doc.id,
      name: doc.title,
      type: propertyType,
      rating: doc.details?.rating || 4.5,
      reviews: doc.details?.reviews || Math.floor(Math.random() * 50) + 10,
      pricePerNight: doc.price,
      emoji: doc.details?.emoji || (propertyType === 'Resort' ? '🌴' : propertyType === 'Villa' ? '🏡' : '🏨'),
      image: doc.images?.[0],
      tags: doc.details?.tags || [{ label: 'Verified', color: '#10B981' }],
      location: doc.location?.address || doc.details?.address || '',
    };
  }, []);

  const fetchHotels = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('type', 'hotel')
        .eq('is_active', true);

      if (error) {
        console.error('Supabase Fetch Error:', error);
      } else {
        setHotels((data || []).map(mapRow));
      }
    } catch (err) {
      console.error('Unexpected error fetching hotels:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [mapRow]);

  useEffect(() => {
    fetchHotels();
  }, [fetchHotels]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHotels();
  };

  const filtered = hotels.filter((h) => activeTab === 'All' || h.type === activeTab);

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <AppBar />

      <View style={styles.filterTabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterTabsScroll}>
          {FILTER_TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.filterTab, activeTab === tab && styles.filterTabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.filterTabText, activeTab === tab && styles.filterTabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.loaderContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
        >
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loaderText}>Finding best stays for you...</Text>
        </ScrollView>
      ) : filtered.length === 0 ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
        >
          <MaterialCommunityIcons name="bed-empty" size={60} color={COLORS.mediumGray} />
          <Text style={styles.emptyText}>No stays found</Text>
          <Text style={styles.emptySubText}>Try adjusting your filters</Text>
        </ScrollView>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <HotelCard hotel={item} />}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  filterTabsContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderGray,
  },
  filterTabsScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    flexDirection: 'row',
  },
  filterTab: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 50,
    backgroundColor: COLORS.lightGray,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  filterTabActive: {
    backgroundColor: '#DCFCE7',
    borderColor: COLORS.primary,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.mediumGray,
  },
  filterTabTextActive: {
    color: COLORS.primary,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.mediumGray,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.darkGray,
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: COLORS.mediumGray,
    marginTop: 4,
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
  },
  imageContainer: {
    width: 120,
    backgroundColor: '#F8FAFC',
  },
  emojiContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hotelImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  hotelEmoji: {
    fontSize: 40,
  },
  detailsContainer: {
    flex: 1,
    padding: 12,
    paddingLeft: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  hotelName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.darkGray,
    flex: 1,
    marginRight: 8,
    lineHeight: 20,
  },
  locationText: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginTop: 4,
    marginBottom: 6,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stars: {
    flexDirection: 'row',
    marginRight: 6,
  },
  geniusBadge: {
    backgroundColor: '#004CB8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  geniusText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreBox: {
    backgroundColor: '#003580',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
    marginRight: 8,
  },
  scoreNumber: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 13,
  },
  scoreText: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  bullet: {
    color: COLORS.mediumGray,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  distanceText: {
    fontSize: 11,
    color: COLORS.darkGray,
    marginLeft: 4,
  },
  dealBadge: {
    backgroundColor: '#008234',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  dealText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },
  roomInfo: {
    fontSize: 11,
    color: COLORS.darkGray,
    marginBottom: 6,
  },
  roomInfoBold: {
    fontWeight: '700',
  },
  policyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  policyText: {
    fontSize: 11,
    color: '#008234',
    fontWeight: '600',
    marginLeft: 4,
  },
  pricingContainer: {
    marginTop: 12,
    alignItems: 'flex-end',
  },
  priceSubtitle: {
    fontSize: 11,
    color: COLORS.darkGray,
    marginBottom: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  originalPrice: {
    fontSize: 13,
    color: '#D91E18',
    textDecorationLine: 'line-through',
    marginRight: 6,
  },
  currentPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.darkGray,
  },
  taxesText: {
    fontSize: 10,
    color: COLORS.mediumGray,
    marginTop: 2,
  },
});
