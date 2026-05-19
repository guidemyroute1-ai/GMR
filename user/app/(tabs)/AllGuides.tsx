import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Dimensions,
  Modal,
} from 'react-native';
import { Text } from '../../components/Text';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { DEFAULT_CITIES, fetchAvailableCities, normalizeCity } from '../../utils/cities';
import { useLocation } from '../../contexts/LocationContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 16 * 2 - 12) / 2; // 2-column grid

const COLORS = {
  primary: '#16A34A',
  primaryLight: '#DCFCE7',
  white: '#FFFFFF',
  lightGray: '#F1F5F9',
  darkGray: '#111827',
  mediumGray: '#6B7280',
  borderGray: '#E2E8F0',
  skyBlue: '#0EA5E9',
  star: '#FBBF24',
  cardBg: '#FFFFFF',
};

const firstPositiveNumber = (...values: unknown[]) => {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return 0;
};

const SHADOWS = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
};

interface Destination {
  id: string;
  name: string;
  state: string;
  image_url: string;
}

interface Guide {
  id: string;
  name: string;
  rating: number;
  reviews: number;
  isOnline: boolean;
  verified: boolean;
  specialty?: string;
  profileImage?: string;
  hourlyRate?: number;
  city?: string;
}

type GuideSortOption = 'recommended' | 'priceLow' | 'ratingHigh';

interface GuideFilters {
  onlineOnly: boolean;
  verifiedOnly: boolean;
  minRating: number;
  maxRate: number;
  sortBy: GuideSortOption;
  city: string;
}

const DEFAULT_GUIDE_FILTERS: GuideFilters = {
  onlineOnly: false,
  verifiedOnly: false,
  minRating: 0,
  maxRate: 0,
  sortBy: 'recommended',
  city: '',
};

const GUIDE_RATING_FILTERS = [
  { label: 'Any rating', value: 0 },
  { label: '4+', value: 4 },
  { label: '4.5+', value: 4.5 },
];

const GUIDE_RATE_FILTERS = [
  { label: 'Any price', value: 0 },
  { label: 'Under Rs 500', value: 500 },
  { label: 'Under Rs 1000', value: 1000 },
  { label: 'Under Rs 2000', value: 2000 },
];

const GUIDE_SORT_OPTIONS: { label: string; value: GuideSortOption }[] = [
  { label: 'Recommended', value: 'recommended' },
  { label: 'Price low', value: 'priceLow' },
  { label: 'Rating high', value: 'ratingHigh' },
];

const getActiveGuideFilterCount = (filters: GuideFilters) =>
  Number(filters.onlineOnly) +
  Number(filters.verifiedOnly) +
  Number(filters.minRating > 0) +
  Number(filters.maxRate > 0) +
  Number(filters.sortBy !== 'recommended');

const StarRating = ({ rating }: { rating: number }) => (
  <View style={styles.starRow}>
    {[1, 2, 3, 4, 5].map((s) => (
      <Ionicons
        key={s}
        name={s <= Math.round(rating) ? 'star' : 'star-outline'}
        size={11}
        color={COLORS.star}
      />
    ))}
    <Text style={styles.ratingValue}>{rating?.toFixed(1) || '0.0'}</Text>
  </View>
);

const SpecialtyChip = ({ label }: { label: string }) => (
  <View style={styles.chip}>
    <Text style={styles.chipText} numberOfLines={1}>{label}</Text>
  </View>
);

const GuideCard = ({ item, onPress }: { item: Guide; onPress: () => void }) => {
  const specialties: string[] = item.specialty
    ? item.specialty.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 2)
    : [];

  return (
    <TouchableOpacity
      style={styles.guideCard}
      activeOpacity={0.92}
      onPress={onPress}
    >
      {/* Cover Photo */}
      <View style={styles.coverContainer}>
        {item.profileImage ? (
          <ExpoImage
            source={{ uri: item.profileImage }}
            style={styles.coverImage}
            contentFit="cover"
          />
        ) : (
          <View style={styles.coverPlaceholder}>
            <Ionicons name="person" size={48} color={COLORS.mediumGray} style={{ opacity: 0.35 }} />
          </View>
        )}

        {/* Gradient overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.62)']}
          style={styles.coverGradient}
        />

        {/* Online badge — top right */}
        {item.isOnline && (
          <View style={styles.onlinePill}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlinePillText}>Online</Text>
          </View>
        )}

        {/* Name + verified — bottom over gradient */}
        <View style={styles.coverBottom}>
          <View style={styles.nameRow}>
            <Text style={styles.guideName} numberOfLines={1}>{item.name}</Text>
            {item.verified && (
              <Ionicons name="shield-checkmark" size={14} color="#60F5A1" style={{ marginLeft: 4 }} />
            )}
          </View>
          {item.hourlyRate ? (
            <Text style={styles.rateLabel}>From ₹{item.hourlyRate}/hr</Text>
          ) : null}
        </View>
      </View>

      {/* Card Body */}
      <View style={styles.cardBody}>
        {/* Specialty chips */}
        {specialties.length > 0 && (
          <View style={styles.chipsRow}>
            {specialties.map((s, i) => (
              <SpecialtyChip key={i} label={s} />
            ))}
          </View>
        )}

        {/* Rating row */}
        <View style={styles.metaRow}>
          <StarRating rating={item.rating} />
          <Text style={styles.reviewCount}>({item.reviews || 0})</Text>
        </View>

        {/* CTA */}
        <TouchableOpacity style={styles.ctaBtn} activeOpacity={0.85} onPress={onPress}>
          <Text style={styles.ctaBtnText}>View Profile</Text>
          <Ionicons name="arrow-forward" size={14} color={COLORS.white} style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const DestinationCard = ({
  dest,
  guideCount,
  onPress,
}: {
  dest: Destination;
  guideCount: number;
  onPress: () => void;
}) => (
  <TouchableOpacity style={styles.destinationCard} activeOpacity={0.8} onPress={onPress}>
    <ExpoImage
      source={{ uri: dest.image_url }}
      style={styles.destinationImg}
      contentFit="cover"
      transition={200}
    />
    <LinearGradient
      colors={['transparent', 'rgba(0,0,0,0.8)']}
      style={styles.destinationGradient}
    />
    <View style={styles.destinationOverlay}>
      <Text style={styles.destinationName}>{dest.name}</Text>
      <View style={styles.destinationMeta}>
        <Ionicons name="location" size={12} color={COLORS.white} style={{ marginRight: 2 }} />
        <Text style={styles.destinationState}>{dest.state}</Text>
      </View>
      <View style={styles.destinationGuideCount}>
        <Text style={styles.destinationGuideCountText}>{guideCount} Guides</Text>
      </View>
    </View>
  </TouchableOpacity>
);

const SupportBanner = () => (
  <View style={styles.supportBanner}>
    <View style={styles.supportBannerGridItem}>
      <View style={styles.supportBannerIconBox}>
        <Ionicons name="shield-checkmark-outline" size={28} color={COLORS.primary} />
      </View>
      <View style={styles.supportBannerTexts}>
        <Text style={styles.supportBannerTitle}>Verified & Trusted Guides</Text>
        <Text style={styles.supportBannerSubtitle}>All guides are verified and background checked.</Text>
      </View>
    </View>
    
    <View style={styles.supportBannerDivider} />
    
    <View style={styles.supportBannerGridItem}>
      <View style={styles.supportBannerIconBox}>
        <Ionicons name="headset-outline" size={28} color={COLORS.primary} />
      </View>
      <View style={styles.supportBannerTexts}>
        <Text style={styles.supportBannerTitle}>24/7 Support</Text>
        <Text style={styles.supportBannerSubtitle}>We're here to help you at every step.</Text>
      </View>
    </View>
  </View>
);

export default function AllGuidesScreen() {
  const router = useRouter();
  const { city: cityParam } = useLocalSearchParams<{ city?: string }>();
  const { user } = useAuth();
  const { selectedCity } = useLocation();
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [cityOptions, setCityOptions] = useState<string[]>(DEFAULT_CITIES);
  const [guideFilters, setGuideFilters] = useState<GuideFilters>({
    ...DEFAULT_GUIDE_FILTERS,
    city: normalizeCity(cityParam) || DEFAULT_CITIES[0],
  });
  const [guides, setGuides] = useState<Guide[]>([]);
  const [popularDestinations, setPopularDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    fetchAvailableCities().then((cities) => {
      if (!active) return;
      setCityOptions(cities);
      setGuideFilters((current) => ({
        ...current,
        city: cities.includes(current.city) ? current.city : cities[0] || '',
      }));
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const city = normalizeCity(cityParam) || selectedCity;
    if (!city) return;
    setGuideFilters((current) => (
      current.city === city ? current : { ...current, city }
    ));
  }, [cityParam, selectedCity]);

  useEffect(() => {
    if (!user) {
      setGuides([]);
      setFetchError('Please sign in to view guides.');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const fetchGuides = async () => {
      setFetchError(null);
      const { data, error } = await supabase
        .from('users')
        .select('id, name, city, rating, reviews, is_online, is_approved, profile_data, photo_url')
        .eq('role', 'guide')
        .eq('is_approved', true);

      if (error) {
        setFetchError('Unable to load guides right now. Please try again.');
        console.warn('AllGuides fetch issue:', error.message);
        setGuides([]);
      } else {
        const guidesData: Guide[] = (data || []).map((row) => ({
          id: row.id,
          name: row.name || 'Anonymous',
          rating: row.rating || 0,
          reviews: row.reviews || 0,
          isOnline: row.is_online || false,
          verified: row.is_approved || false,
          specialty: Array.isArray(row.profile_data?.specialisations)
            ? row.profile_data.specialisations.join(', ')
            : (row.profile_data?.specialisations || row.profile_data?.specialty || 'General Guide'),
          profileImage: row.profile_data?.profileImage || row.photo_url || null,
          city: normalizeCity(row.city || row.profile_data?.city || row.profile_data?.location),
          hourlyRate: firstPositiveNumber(
            row.profile_data?.per_hour_rate,
            row.profile_data?.hourlyRate,
            row.profile_data?.hourly_rate,
            row.profile_data?.pricePerDay,
            row.profile_data?.price_per_day
          ) || undefined,
        }));
        setGuides(guidesData);
      }

      const { data: destData, error: destError } = await supabase
        .from('popular_destinations')
        .select('*')
        .eq('is_popular', true);

      if (!destError && destData) {
        setPopularDestinations(destData);
      }

      setLoading(false);
      setRefreshing(false);
    };

    fetchGuides();
  }, [user, refreshKey]);

  const onRefresh = () => {
    setRefreshing(true);
    setGuides([]);
    setRefreshKey((k) => k + 1);
  };

  const activeFilterCount = getActiveGuideFilterCount(guideFilters);
  const filteredGuides = guides
    .filter((guide) => {
      const q = searchText.trim().toLowerCase();
      const specialty = typeof guide.specialty === 'string' ? guide.specialty : '';
      const matchesSearch = !q
        || (guide.name || '').toLowerCase().includes(q)
        || specialty.toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (guideFilters.city && normalizeCity(guide.city) !== guideFilters.city) return false;
      if (guideFilters.onlineOnly && !guide.isOnline) return false;
      if (guideFilters.verifiedOnly && !guide.verified) return false;
      if (guideFilters.minRating > 0 && guide.rating < guideFilters.minRating) return false;
      if (guideFilters.maxRate > 0 && (!guide.hourlyRate || guide.hourlyRate > guideFilters.maxRate)) return false;
      return true;
    })
    .sort((a, b) => {
      if (guideFilters.sortBy === 'priceLow') {
        return (a.hourlyRate || Number.MAX_SAFE_INTEGER) - (b.hourlyRate || Number.MAX_SAFE_INTEGER);
      }
      if (guideFilters.sortBy === 'ratingHigh') {
        return b.rating - a.rating || b.reviews - a.reviews;
      }
      return Number(b.verified) - Number(a.verified)
        || Number(b.isOnline) - Number(a.isOnline)
        || b.rating - a.rating;
    });

  const navigateToGuide = (id: string) =>
    router.push({ pathname: '/more/guideDetail', params: { id } });

  const handleDestinationPress = (cityName: string) => {
    setGuideFilters((prev) => ({ ...prev, city: normalizeCity(cityName) || cityName }));
  };

  const renderHeader = () => {
    return (
      <View style={styles.listHeaderContainer}>
        {popularDestinations.length > 0 && (
          <View style={styles.popularSection}>
            <View style={styles.popularSectionHeader}>
              <Text style={styles.popularSectionTitle}>Popular Destinations</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.popularScrollContent}>
              {popularDestinations.map(dest => {
                const count = guides.filter(g => normalizeCity(g.city) === normalizeCity(dest.name)).length;
                return (
                  <DestinationCard 
                    key={dest.id} 
                    dest={dest} 
                    guideCount={count} 
                    onPress={() => handleDestinationPress(dest.name)} 
                  />
                );
              })}
            </ScrollView>
          </View>
        )}
        <View style={styles.allGuidesHeader}>
          <Text style={styles.allGuidesTitle}>All Guides</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Search + Filter bar */}
      <View style={styles.searchFilterContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={COLORS.mediumGray} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search guides or specialties..."
            placeholderTextColor={COLORS.mediumGray}
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color={COLORS.mediumGray} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterBtn, activeFilterCount > 0 && styles.filterBtnActive]}
          activeOpacity={0.8}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="options-outline" size={21} color={COLORS.darkGray} />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Results count */}
      {!loading && !fetchError && (
        <Text style={styles.resultsCount}>
          {filteredGuides.length} guide{filteredGuides.length !== 1 ? 's' : ''} available
          {activeFilterCount > 0 ? ` - ${activeFilterCount} filter${activeFilterCount !== 1 ? 's' : ''}` : ''}
        </Text>
      )}

      {/* Content */}
      {loading ? (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} />
          }
        >
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading guides...</Text>
        </ScrollView>
      ) : fetchError ? (
        <ScrollView
          contentContainerStyle={styles.emptyStateWrap}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} />
          }
        >
          <Ionicons name="cloud-offline-outline" size={52} color={COLORS.mediumGray} style={{ opacity: 0.5, marginBottom: 12 }} />
          <Text style={styles.emptyStateTitle}>Could not load guides</Text>
          <Text style={styles.emptyStateText}>{fetchError}</Text>
        </ScrollView>
      ) : (
        <FlatList
          data={filteredGuides}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          renderItem={({ item }) => (
            <GuideCard item={item} onPress={() => navigateToGuide(item.id)} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={<SupportBanner />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyStateWrap}>
              <Ionicons name="person-outline" size={52} color={COLORS.mediumGray} style={{ opacity: 0.4, marginBottom: 12 }} />
              <Text style={styles.emptyStateTitle}>No guides found</Text>
              <Text style={styles.emptyStateText}>Try a different search term.</Text>
            </View>
          }
        />
      )}

    

      <Modal
        visible={showFilters}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.filterSheet}>
            <View style={styles.filterSheetHeader}>
              <Text style={styles.filterSheetTitle}>Guide filters</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={22} color={COLORS.darkGray} />
              </TouchableOpacity>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>City</Text>
              <View style={styles.filterChipRow}>
                {cityOptions.map((city) => (
                  <TouchableOpacity
                    key={city}
                    style={[styles.filterChipBtn, guideFilters.city === city && styles.filterChipBtnActive]}
                    onPress={() => setGuideFilters((prev) => ({ ...prev, city }))}
                  >
                    <Text style={[styles.filterChipText, guideFilters.city === city && styles.filterChipTextActive]}>
                      {city}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Availability</Text>
              <View style={styles.filterChipRow}>
                <TouchableOpacity
                  style={[styles.filterChipBtn, guideFilters.onlineOnly && styles.filterChipBtnActive]}
                  onPress={() => setGuideFilters((prev) => ({ ...prev, onlineOnly: !prev.onlineOnly }))}
                >
                  <Text style={[styles.filterChipText, guideFilters.onlineOnly && styles.filterChipTextActive]}>
                    Online now
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterChipBtn, guideFilters.verifiedOnly && styles.filterChipBtnActive]}
                  onPress={() => setGuideFilters((prev) => ({ ...prev, verifiedOnly: !prev.verifiedOnly }))}
                >
                  <Text style={[styles.filterChipText, guideFilters.verifiedOnly && styles.filterChipTextActive]}>
                    Verified
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Rating</Text>
              <View style={styles.filterChipRow}>
                {GUIDE_RATING_FILTERS.map((ratingFilter) => (
                  <TouchableOpacity
                    key={ratingFilter.label}
                    style={[styles.filterChipBtn, guideFilters.minRating === ratingFilter.value && styles.filterChipBtnActive]}
                    onPress={() => setGuideFilters((prev) => ({ ...prev, minRating: ratingFilter.value }))}
                  >
                    <Text style={[styles.filterChipText, guideFilters.minRating === ratingFilter.value && styles.filterChipTextActive]}>
                      {ratingFilter.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Hourly rate</Text>
              <View style={styles.filterChipRow}>
                {GUIDE_RATE_FILTERS.map((rateFilter) => (
                  <TouchableOpacity
                    key={rateFilter.label}
                    style={[styles.filterChipBtn, guideFilters.maxRate === rateFilter.value && styles.filterChipBtnActive]}
                    onPress={() => setGuideFilters((prev) => ({ ...prev, maxRate: rateFilter.value }))}
                  >
                    <Text style={[styles.filterChipText, guideFilters.maxRate === rateFilter.value && styles.filterChipTextActive]}>
                      {rateFilter.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Sort by</Text>
              <View style={styles.filterChipRow}>
                {GUIDE_SORT_OPTIONS.map((sortOption) => (
                  <TouchableOpacity
                    key={sortOption.value}
                    style={[styles.filterChipBtn, guideFilters.sortBy === sortOption.value && styles.filterChipBtnActive]}
                    onPress={() => setGuideFilters((prev) => ({ ...prev, sortBy: sortOption.value }))}
                  >
                    <Text style={[styles.filterChipText, guideFilters.sortBy === sortOption.value && styles.filterChipTextActive]}>
                      {sortOption.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterActions}>
              <TouchableOpacity
                style={styles.resetFilterBtn}
                onPress={() => setGuideFilters({ ...DEFAULT_GUIDE_FILTERS, city: cityOptions[0] || '' })}
              >
                <Text style={styles.resetFilterText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyFilterBtn}
                onPress={() => setShowFilters(false)}
              >
                <Text style={styles.applyFilterText}>Show {filteredGuides.length} guides</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },

  /* ── Search bar ── */
  searchFilterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 10,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderGray,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.darkGray,
    paddingVertical: 0,
  },
  filterBtn: {
    width: 44,
    height: 44,
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderGray,
  },
  filterBtnActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  filterBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
  },

  /* ── Results count ── */
  resultsCount: {
    fontSize: 12,
    color: COLORS.mediumGray,
    fontWeight: '500',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },

  /* ── Popular Destinations & Header Section ── */
  listHeaderContainer: {
    paddingBottom: 8,
  },
  allGuidesHeader: {
    paddingHorizontal: 8,
    paddingTop: 12,
  },
  allGuidesTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.darkGray,
    letterSpacing: -0.3,
  },
  popularSection: {
    paddingTop: 6,
    paddingBottom: 10,
  },
  popularSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  popularSectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.darkGray,
    letterSpacing: -0.3,
  },
  popularSectionSeeAll: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  popularScrollContent: {
    paddingHorizontal: 6,
    paddingBottom: 4,
    gap: 10,
  },

  /* ── Destination Card ── */
  destinationCard: {
    width: 100,
    height: 120,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#D1D5DB',
  },
  destinationImg: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  destinationImgPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  destinationGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '65%',
    borderRadius: 18,
  },
  destinationOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
  },
  destinationName: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -0.2,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  destinationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  destinationState: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },
  destinationGuideCount: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 20,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  destinationGuideCountText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.2,
  },

  /* ── Support Banner ── */
  supportBanner: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
    backgroundColor: '#F3F8F5',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  supportBannerGridItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  supportBannerIconBox: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  supportBannerTexts: {
    flex: 1,
  },
  supportBannerTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 2,
  },
  supportBannerSubtitle: {
    fontSize: 10,
    color: COLORS.darkGray,
    lineHeight: 13,
  },
  supportBannerDivider: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginHorizontal: 12,
  },

  /* ── List ── */
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 32,
  },
  columnWrapper: {
    gap: 12,
    marginBottom: 12,
  },

  /* ── Card ── */
  guideCard: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
    overflow: 'hidden',
    ...SHADOWS.card,
  },

  /* Cover */
  coverContainer: {
    width: '100%',
    height: 170,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E9EFF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '65%',
  },

  /* Online pill — top right */
  onlinePill: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.52)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  onlinePillText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },

  /* Name over gradient */
  coverBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  guideName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.white,
    flex: 1,
    letterSpacing: -0.2,
  },
  rateLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.82)',
    fontWeight: '600',
    marginTop: 2,
  },

  /* Body */
  cardBody: {
    padding: 10,
    gap: 8,
  },

  /* Chips */
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  chip: {
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    maxWidth: CARD_WIDTH - 28,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2563EB',
  },

  /* Rating */
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingValue: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.darkGray,
    marginLeft: 3,
  },
  reviewCount: {
    fontSize: 11,
    color: COLORS.mediumGray,
    fontWeight: '500',
  },

  /* CTA */
  ctaBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  ctaBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },

  /* Loading */
  loadingText: {
    color: COLORS.mediumGray,
    marginTop: 12,
    fontSize: 14,
  },

  /* Empty / error */
  emptyStateWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyStateTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.darkGray,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 13,
    color: COLORS.mediumGray,
    textAlign: 'center',
    lineHeight: 19,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  filterSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 22,
  },
  filterSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  filterSheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.darkGray,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  filterChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChipBtn: {
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  filterChipBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.mediumGray,
  },
  filterChipTextActive: {
    color: COLORS.primary,
  },
  filterActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  resetFilterBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  resetFilterText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.darkGray,
  },
  applyFilterBtn: {
    flex: 1.5,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
  },
  applyFilterText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.white,
  },
});
