import { Text } from '../../components/Text';
import { LinearGradient } from 'expo-linear-gradient';
import { Image as ExpoImage } from 'expo-image';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../utils/supabase';
import { normalizeCity } from '../../utils/cities';
import { useLocation } from '../../contexts/LocationContext';
import {
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
  Modal,
  SafeAreaView
} from 'react-native';
import { SafeAreaView as SafeAreaContextView } from 'react-native-safe-area-context';
import AppBar from '../../components/AppBar';

// ─── Color Palette ────────────────────────────────────────────────────────────
const COLORS = {
  primary: '#16A34A',       // Forest Green
  teal: '#14B8A6',          // Teal Green
  skyBlue: '#0EA5E9',       // Sky Blue
  orange: '#F97316',        // Sunset Orange
  white: '#FFFFFF',
  lightGray: '#F1F5F9',
  darkGray: '#1F2937',
  mediumGray: '#6B7280',
  borderGray: '#d3dbe2',
  onlineDot: '#22C55E',
};

// ─── Shadows ──────────────────────────────────────────────────────────────────
const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
  },
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface Guide {
  id: string;
  name: string;
  rating: number;
  reviews: number;
  isOnline: boolean;
  verified: boolean;
  profileImage?: string;
  city?: string;
}

interface Vehicle {
  id: string;
  type: string;
  pricePerDay: number;
  image: any;
}

interface Category {
  id: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Mock Data for fallback or other categories
const BANNERS = [
  { id: '1', source: require('../../assets/images/banner.png') },
  { id: '2', source: require('../../assets/images/banner2.png') },
  { id: '3', source: require('../../assets/images/banner3.png') },
];

const VEHICLES: Vehicle[] = [
  { id: '1', type: 'scooty', pricePerDay: 499, image: require('../../assets/images/scooty.png') },
  { id: '2', type: 'bike', pricePerDay: 899, image: require('../../assets/images/bike.png') },
  { id: '3', type: 'car', pricePerDay: 2499, image: require('../../assets/images/car.png') },
];

const CATEGORIES: Category[] = [
  { id: '1', label: 'Food Tours', icon: 'restaurant-outline', color: '#FEF3C7' },
  { id: '2', label: 'City Walks', icon: 'walk-outline', color: '#DBEAFE' },
  { id: '3', label: 'Adventure', icon: 'trail-sign-outline', color: '#DCFCE7' },
  { id: '4', label: 'Hidden Gems', icon: 'diamond-outline', color: '#F3E8FF' },
  { id: '5', label: 'Night Life', icon: 'moon-outline', color: '#FEE2E2' },
  { id: '6', label: 'Photography', icon: 'camera-outline', color: '#E0F2FE' },
];

const TRUST_POINTS = [
  { id: '1', value: 'Verified', label: 'local partners' },
  { id: '2', value: 'Fast', label: 'booking flow' },
  { id: '3', value: 'City', label: 'based picks' },
];

const SERVICE_SHORTCUTS = [
  {
    id: 'guides',
    title: 'Find a guide',
    subtitle: 'Local experts nearby',
    icon: 'people-outline' as const,
    color: '#DCFCE7',
    iconColor: '#15803D',
  },
  {
    id: 'rentals',
    title: 'Rent a ride',
    subtitle: 'Scooty, bike or car',
    icon: 'bicycle-outline' as const,
    color: '#E0F2FE',
    iconColor: '#0284C7',
  },
  {
    id: 'hotels',
    title: 'Book stays',
    subtitle: 'Comfortable city stays',
    icon: 'bed-outline' as const,
    color: '#FFF7ED',
    iconColor: '#EA580C',
  },
];

// ─── Reusable Star Rating ─────────────────────────────────────────────────────
const StarRating = ({ rating }: { rating: number }) => (
  <View style={styles.starRow}>
    {[1, 2, 3, 4, 5].map((s) => (
      <Ionicons
        key={s}
        name={s <= Math.round(rating) ? 'star' : 'star-outline'}
        size={10}
        color="#FBBF24"
      />
    ))}
    <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
  </View>
);

// ─── Guide Card ───────────────────────────────────────────────────────────────
const GuideCard = ({ guide }: { guide: Guide }) => {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.guideCard}
      activeOpacity={0.92}
      onPress={() => router.push({ pathname: '/more/guideDetail', params: { id: guide.id } })}
    >
      {/* Cover Photo */}
      <View style={styles.guideImagePlaceholder}>
        {guide.profileImage ? (
          <ExpoImage
            source={{ uri: guide.profileImage }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
        ) : (
          <View style={styles.coverPlaceholder}>
            <Ionicons name="person" size={38} color={COLORS.mediumGray} style={{ opacity: 0.35 }} />
          </View>
        )}

        {/* Gradient overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.65)']}
          style={styles.cardGradient}
        />

        {/* Online pill — top-left */}
        {guide.isOnline && (
          <View style={styles.onlineBadge}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Online</Text>
          </View>
        )}

        {/* Name + verified over gradient */}
        <View style={styles.coverBottomOverlay}>
          <View style={styles.guideNameRow}>
            <Text style={styles.guideName} numberOfLines={1}>{guide.name}</Text>
            {guide.verified && (
              <Ionicons name="shield-checkmark" size={12} color="#60F5A1" style={{ marginLeft: 3 }} />
            )}
          </View>
        </View>
      </View>

      {/* Card Body */}
      <View style={styles.guideInfo}>
        {/* Stars + review count */}
        <View style={styles.guideMetaRow}>
          <StarRating rating={guide.rating} />
          <Text style={styles.reviewCount}> ({guide.reviews})</Text>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={styles.bookGuideBtn}
          activeOpacity={0.85}
          onPress={() => router.push({ pathname: '/more/guideDetail', params: { id: guide.id } })}
        >
          <Text style={styles.bookGuideBtnText}>Book Guide</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

// ─── Vehicle Card ─────────────────────────────────────────────────────────────
const VehicleCard = ({ vehicle, city }: { vehicle: Vehicle; city?: string }) => {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={styles.vehicleCard}
      activeOpacity={0.85}
      onPress={() =>
        router.push({
          pathname: '/(tabs)/RentAVehicle',
          params: { filter: vehicle.type, city },
        })
      }
    >
      {/* Image */}
      <View style={styles.vehicleImagePlaceholder}>
        <Image source={vehicle.image} style={styles.vehicleImage} resizeMode="contain" />
      </View>
      <Text style={styles.vehicleType}>{vehicle.type}</Text>
      <Text style={styles.vehiclePrice}>
        ₹ {vehicle.pricePerDay.toLocaleString()}<Text style={styles.perDay}>/Day</Text>
      </Text>
    </TouchableOpacity>
  );
};

// ─── Category Card ───────────────────────────────────────────────────────────
const CATEGORY_SUBTITLES: Record<string, string> = {
  'Food Tours':   'Taste the culture',
  'City Walks':   'Explore on foot',
  'Adventure':    'Thrill awaits',
  'Hidden Gems':  'Off the beaten path',
  'Night Life':   'After dark fun',
  'Photography':  'Capture memories',
};

const CategoryCard = ({ category }: { category: Category }) => (
  <TouchableOpacity
    style={[styles.categoryCard, { backgroundColor: category.color }]}
    activeOpacity={0.82}
  >
    <View style={styles.categoryIconWrap}>
      <Ionicons name={category.icon} size={22} color={COLORS.darkGray} />
    </View>
    <Text style={styles.categoryCardLabel}>{category.label}</Text>
    <Text style={styles.categoryCardSub}>{CATEGORY_SUBTITLES[category.label] ?? ''}</Text>
  </TouchableOpacity>
);

const ServiceShortcut = ({
  item,
  onPress,
}: {
  item: typeof SERVICE_SHORTCUTS[number];
  onPress: () => void;
}) => (
  <TouchableOpacity style={styles.serviceShortcut} activeOpacity={0.86} onPress={onPress}>
    <View style={[styles.serviceIconWrap, { backgroundColor: item.color }]}>
      <Ionicons name={item.icon} size={22} color={item.iconColor} />
    </View>
    <View style={styles.serviceTextWrap}>
      <Text style={styles.serviceTitle} numberOfLines={1}>{item.title}</Text>
        <Ionicons name="chevron-forward" size={17} color={COLORS.mediumGray} />
    </View>

  </TouchableOpacity>
);

// ─── Section Header ───────────────────────────────────────────────────────────
const SectionHeader = ({
  title,
  subtitle,
  onSeeAll,
}: {
  title: string;
  subtitle?: string;
  onSeeAll?: () => void;
}) => (
  <View style={styles.sectionHeader}>
    <View>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
    {onSeeAll && (
      <TouchableOpacity onPress={onSeeAll} activeOpacity={0.7}>
        <View style={styles.seeAllPill}>
          <Text style={styles.seeAllText}>See all</Text>
          <Ionicons name="arrow-forward" size={13} color={COLORS.primary} />
        </View>
      </TouchableOpacity>
    )}
  </View>
);

// ─── Main HomeScreen ──────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const [searchText, setSearchText] = useState<string>('');
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loadingGuides, setLoadingGuides] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showCitySelector, setShowCitySelector] = useState(false);
  const [activeBanner, setActiveBanner] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const { cityOptions, selectedCity, setSelectedCity } = useLocation();

  useEffect(() => {
    const timer = setInterval(() => {
      const nextIndex = (activeBanner + 1) % BANNERS.length;
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
      setActiveBanner(nextIndex);
    }, 3000);

    return () => clearInterval(timer);
  }, [activeBanner]);

  useEffect(() => {
    setLoadingGuides(true);

    // Initial fetch
    const fetchGuides = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, city, rating, reviews, is_online, is_approved, profile_data, photo_url')
        .eq('role', 'guide')
        .eq('is_approved', true);

      if (!error && data) {
        const guidesData: Guide[] = data
          .map((row) => ({
            id: row.id,
            name: row.name || 'Anonymous',
            rating: row.rating || 4.5,
            reviews: row.reviews || 0,
            isOnline: row.is_online || false,
            verified: row.is_approved || false,
            city: normalizeCity(row.city || row.profile_data?.city || row.profile_data?.location),
            profileImage: row.profile_data?.profileImage || row.photo_url || null,
          }))
          .filter((guide) => !selectedCity || guide.city === selectedCity)
          .slice(0, 5);
        setGuides(guidesData);
      } else if (error) {
        console.warn('Home fetch guides issue:', error.message);
      }

      setLoadingGuides(false);
      setRefreshing(false);
    };

    fetchGuides();
  }, [refreshKey, selectedCity]);

  const onRefresh = () => {
    setRefreshing(true);
    setGuides([]);
    setRefreshKey(k => k + 1);
  };

  return (
    <SafeAreaContextView edges={['top']} style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

     


      {/* ── Scrollable Content ── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        <AppBar />
       {/* ── Location Selector ── */}
      <View style={styles.locationBar}>
        <TouchableOpacity style={styles.loc} activeOpacity={0.8} onPress={() => setShowCitySelector(true)}>
          <ExpoImage source={require('../../assets/svg/location-pin-svgrepo-com.svg')} style={{ width: 16, height: 16, marginRight: 6, tintColor: COLORS.darkGray }} contentFit="contain" />
          <Text style={styles.locationText}>{selectedCity || 'Select city'}</Text>
          <Ionicons name="chevron-down" size={16} color={COLORS.mediumGray} />
        </TouchableOpacity>
      </View>
      {/* <View style={styles.divider} /> */}

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Where do you want to go?"
            placeholderTextColor={COLORS.mediumGray}
            value={searchText}
            onChangeText={setSearchText}
          />
          <TouchableOpacity style={styles.searchBtn} activeOpacity={0.85}>
            <ExpoImage source={require('../../assets/svg/search-svgrepo-com.svg')} style={{ width: 20, height: 20, tintColor: COLORS.white }} contentFit="contain" />
          </TouchableOpacity>
        </View>

 

        <View style={styles.heroPanel}>
          <FlatList
            ref={flatListRef}
            data={BANNERS}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            getItemLayout={(data, index) => ({
              length: SCREEN_WIDTH - 32,
              offset: (SCREEN_WIDTH - 32) * index,
              index,
            })}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_WIDTH - 32));
              setActiveBanner(index);
            }}
            renderItem={({ item }) => (
              <View style={styles.heroSlide}>
                <ExpoImage
                  source={item.source}
                  style={styles.heroImage}
                  contentFit="contain"
                  transition={300}
                />
             
              </View>
            )}
          />
          <View style={styles.paginationDots}>
            {BANNERS.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  activeBanner === index ? styles.activeDot : null,
                ]}
              />
            ))}
          </View>
        </View>


               <View style={styles.serviceGrid}>
          {SERVICE_SHORTCUTS.map((item) => (
            <ServiceShortcut
              key={item.id}
              item={item}
              onPress={() => {
                if (item.id === 'guides') {
                  router.push({ pathname: '/(tabs)/AllGuides', params: { city: selectedCity } });
                } else if (item.id === 'rentals') {
                  router.push({ pathname: '/(tabs)/RentAVehicle', params: { city: selectedCity } });
                } else {
                  router.push({ pathname: '/(tabs)/HotelListings', params: { city: selectedCity } });
                }
              }}
            />
          ))}
        </View>

     

        {/* ── Featured Guides ── */}
        <SectionHeader title="Featured Guides" subtitle="Book trusted local help" onSeeAll={() => router.push({ pathname: '/(tabs)/AllGuides', params: { city: selectedCity } })} />
        <FlatList
          data={guides}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
          renderItem={({ item }) => <GuideCard guide={item} />}
          ListEmptyComponent={
            !loadingGuides ? (
              <View style={styles.emptyGuidesCard}>
                <Ionicons name="people-outline" size={24} color={COLORS.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.emptyGuidesTitle}>No featured guides yet</Text>
                  <Text style={styles.emptyGuidesText}>Check all guides or try another city.</Text>
                </View>
                <TouchableOpacity
                  style={styles.emptyGuidesButton}
                  onPress={() => router.push({ pathname: '/(tabs)/AllGuides', params: { city: selectedCity } })}
                >
                  <Text style={styles.emptyGuidesButtonText}>View</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />

        {/* ── Rent a Vehicle ── */}
        <SectionHeader title="Rent a Vehicle" subtitle="Flexible rides for city travel" onSeeAll={() => router.push({ pathname: '/(tabs)/RentAVehicle', params: { city: selectedCity } })} />
        <FlatList
          data={VEHICLES}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
          renderItem={({ item }) => <VehicleCard vehicle={item} city={selectedCity} />}
        />

        {/* ── Quick Categories ── */}
        <SectionHeader title="Quick Categories" subtitle="Jump into high intent travel plans" />
        <View style={styles.categoriesGrid}>
          {CATEGORIES.map((cat) => (
            <CategoryCard key={cat.id} category={cat} />
          ))}
        </View>

        {/* ── Promo Banner ── */}
        <LinearGradient
          colors={['#14532D', '#16A34A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.promoBanner}
        >
          {/* Decorative circles */}
          <View style={styles.promoCircle1} />
          <View style={styles.promoCircle2} />

          <View style={styles.promoContent}>
            <View style={styles.promoTagPill}
            >
              <Ionicons name="sparkles-outline" size={13} color={COLORS.white} />
              <Text style={styles.promoTag}>Limited Offer</Text>
            </View>
            <Text style={styles.promoTitle}>Free Delivery</Text>
            <Text style={styles.promoSubtitle}>
              We'll bring the vehicle straight to your door.
            </Text>
            <View style={styles.promoTrustRow}>
              <Ionicons name="time-outline" size={13} color="rgba(255,255,255,0.82)" />
              <Text style={styles.promoTrustText}>Reserve now, ride when ready</Text>
            </View>
            <TouchableOpacity
              style={styles.promoBtn}
              activeOpacity={0.85}
              onPress={() => router.push({ pathname: '/(tabs)/RentAVehicle', params: { city: selectedCity } })}
            >
              <Text style={styles.promoBtnText}>Explore Rentals</Text>
              <Ionicons name="arrow-forward" size={14} color="#14532D" />
            </TouchableOpacity>
          </View>
          <View style={styles.promoImageWrap}>
            <Image
              source={require('../../assets/images/scooty.png')}
              style={styles.promoImage}
              resizeMode="contain"
            />
          </View>
        </LinearGradient>

        {/* Bottom padding for tab bar */}
        <View style={{ height: 20 }} />
      </ScrollView>

      <Modal
        visible={showCitySelector}
        animationType="slide"
        onRequestClose={() => setShowCitySelector(false)}
      >
        <SafeAreaContextView edges={['top', 'bottom']} style={styles.cityModalSafeArea}>
          <View style={styles.cityModalHeader}>
            <Text style={styles.cityModalTitle}>Select Your City</Text>
            <TouchableOpacity onPress={() => setShowCitySelector(false)}>
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>

          <View style={styles.citySearchBarContainer}>
            <TextInput
              style={styles.citySearchInput}
              placeholder="Search"
              placeholderTextColor="#9CA3AF"
            />
            <Ionicons name="search" size={20} color="#9CA3AF" />
          </View>

          <ScrollView contentContainerStyle={styles.cityGridContainer}>
            {cityOptions.map((city) => (
              <TouchableOpacity
                key={city}
                style={[styles.cityGridCard, selectedCity === city && styles.cityGridCardActive]}
                activeOpacity={0.8}
                onPress={async () => {
                  await setSelectedCity(city);
                }}
              >
                <View style={styles.cityIconWrapper}>
                  <Ionicons name="location" size={40} color={COLORS.orange} />
                </View>
                <Text style={[styles.cityGridName, selectedCity === city && styles.cityGridNameActive]}>{city}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.cityModalFooter}>
            <TouchableOpacity 
              style={styles.cityModalSaveBtn} 
              activeOpacity={0.85}
              onPress={() => setShowCitySelector(false)}
            >
              <Text style={styles.cityModalSaveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaContextView>
      </Modal>
    </SafeAreaContextView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  // App Bar
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderGray,
  },
  menuButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    gap: 5,
  },
  menuLine: {
    height: 2,
    width: 22,
    backgroundColor: COLORS.darkGray,
    borderRadius: 2,
    marginVertical: 2,
  },
  appBarTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.darkGray,
    letterSpacing: -0.3,
  },
  appBarTitleGreen: {
    color: COLORS.primary,
  },
  notifButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifIcon: {
    fontSize: 22,
  },
  notifDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: COLORS.orange,
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },

  // Location Bar
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
   backgroundColor: COLORS.lightGray,
  },
  locationPin: {
    fontSize: 16,
    marginRight: 6,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginRight: 6,
  },
  locationChevron: {
    fontSize: 16,
    color: COLORS.mediumGray,
  },
  loc: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    ...SHADOWS.small,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderGray,
  },
  cityOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.35)',
    justifyContent: 'flex-end',
  },
  citySheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 18,
    paddingBottom: 28,
  },
  citySheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.darkGray,
    marginBottom: 12,
  },
  cityOption: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.borderGray,
  },
  cityOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  cityOptionTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },

  // Scroll
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  introPanel: {
    marginHorizontal: 16,
    marginTop: 14,
    padding: 18,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.small,
  },
  introKicker: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  introTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  introSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
    color: COLORS.mediumGray,
  },
  trustRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  trustItem: {
    flex: 1,
    minHeight: 58,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  trustValue: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.darkGray,
    marginBottom: 3,
  },
  trustLabel: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '600',
    color: COLORS.mediumGray,
  },

  heroPanel: {
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 16,
    borderRadius: 22,
    overflow: 'hidden',
    height: 190,
    ...SHADOWS.large,
    backgroundColor: COLORS.white,
    position: 'relative',
    borderWidth: 2,
    borderColor: COLORS.borderGray,
  },
  heroSlide: {
    width: SCREEN_WIDTH - 32,
    height: 190,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  paginationDots: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  activeDot: {
    width: 18,
    backgroundColor: COLORS.primary,
  },
  heroCopy: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 18,
    justifyContent: 'flex-end',
  },
  heroKicker: {
    color: '#BBF7D0',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
  },
  heroTitle: {
    color: COLORS.white,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900',
    maxWidth: 260,
  },
  heroMetaRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  heroMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  heroMetaText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 4,
    ...SHADOWS.small,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    color: COLORS.darkGray,

  },
  searchBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    margin: 1.5,
    marginRight: 2.5,
  },
  searchIcon: {
    fontSize: 18,
  },

  serviceGrid: {
    marginHorizontal: 16,
    marginTop: 12,
    gap: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  serviceShortcut: {
    minHeight: 75,
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 13,
    gap: 5,
    ...SHADOWS.small,
  },
  serviceIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',

  },
  serviceTextWrap: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  serviceTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.darkGray,

  },
  serviceSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.mediumGray,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.darkGray,
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.mediumGray,
    marginTop: 4,
  },
  seeAllPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,

    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderRadius: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,

    borderColor: COLORS.primary,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },

  // Horizontal List
  horizontalList: {
    paddingLeft: 16,
    paddingRight: 8,
    paddingBottom: 12,
  },

  emptyGuidesCard: {
    width: SCREEN_WIDTH - 32,
    minHeight: 76,
    marginLeft: 16,
    marginRight: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    ...SHADOWS.small,
  },
  emptyGuidesTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  emptyGuidesText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.mediumGray,
  },
  emptyGuidesButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
  },
  emptyGuidesButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },

  // Guide Card
  guideCard: {
    width: 140,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    marginRight: 12,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  guideImagePlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: COLORS.lightGray,
    position: 'relative',
    overflow: 'hidden',
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E9EFF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  coverBottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 9,
    paddingBottom: 8,
  },
  onlineBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.52)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 4,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.onlineDot,
  },
  onlineText: {
    fontSize: 10,
    color: COLORS.white,
    fontWeight: '700',
  },
  guideNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  guideName: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.white,
    flex: 1,
    letterSpacing: -0.2,
  },
  guideInfo: {
    padding: 9,
    gap: 7,
  },
  guideMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  starIcon: {
    fontSize: 12,
  },
  ratingText: {
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
  bookGuideBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  bookGuideBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.1,
  },

  // Vehicle Card
  vehicleCard: {
    width: 130,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    marginRight: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...SHADOWS.small,
  },
  vehicleImagePlaceholder: {
    width: '100%',
    height: 80,
    backgroundColor: COLORS.lightGray,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  vehicleImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  vehicleType: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  vehiclePrice: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
  },
  perDay: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.mediumGray,
  },

  // Quick Categories — Card Grid
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 8,
  },
  categoryCard: {
    width: '47.5%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(31,41,55,0.07)',
  },
  categoryIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.62)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryCardLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.darkGray,
    marginBottom: 2,
  },
  categoryCardSub: {
    fontSize: 11,
    color: COLORS.mediumGray,
    fontWeight: '500',
  },
  // kept for any legacy refs
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 50,
    gap: 7,
    borderWidth: 1,
    borderColor: 'rgba(31,41,55,0.08)',
  },
  categoryEmoji: {
    fontSize: 18,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.darkGray,
  },

  // Promo Banner — upgraded
  promoBanner: {
    flexDirection: 'row',
    borderRadius: 24,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    overflow: 'hidden',
    ...SHADOWS.medium,
    shadowColor: '#14532D',
  },
  promoCircle1: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -50,
    right: -30,
  },
  promoCircle2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -30,
    left: 60,
  },
  promoContent: {
    flex: 1,
    justifyContent: 'center',
  },
  promoTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
  },
  promoTag: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.95)',
  },
  promoTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -0.5,
    marginBottom: 5,
  },
  promoSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 18,
    marginBottom: 8,
  },
  promoTrustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 14,
  },
  promoTrustText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.82)',
  },
  promoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.white,
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  promoBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#14532D',
    letterSpacing: 0.2,
  },
  promoImageWrap: {
    width: 105,
    height: 105,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    alignSelf: 'center',
  },
  promoImage: {
    width: 96,
    height: 86,
  },

  // Bottom Tab Bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderGray,
    paddingBottom: 10,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingTop: 4,
  },
  tabEmoji: {
    fontSize: 20,
    opacity: 0.45,
  },
  tabEmojiActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.mediumGray,
    marginTop: 3,
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  tabActiveBar: {
    position: 'absolute',
    bottom: -8,
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },

  // City Selector Modal
  cityModalSafeArea: {
    flex: 1,
    backgroundColor: '#FFF7F7',
  },
  cityModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  cityModalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  citySearchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 24,
  },
  citySearchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  cityGridContainer: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  cityGridCard: {
    backgroundColor: '#FFFFFF',
    width: '47%',
    aspectRatio: 0.9,
    borderRadius: 24,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cityGridCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#F0FDF4',
  },
  cityIconWrapper: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cityGridName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  cityGridNameActive: {
    color: COLORS.primary,
  },
  cityModalFooter: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: '#FFF7F7',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
  },
  cityModalSaveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  cityModalSaveBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
