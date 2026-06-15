import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView as SafeAreaContextView } from 'react-native-safe-area-context';
import AppBar from '../../components/AppBar';
import { Text } from '../../components/Text';
import { useLocation } from '../../contexts/LocationContext';
import { normalizeCity } from '../../utils/cities';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const C = {
  // Brand
  green: '#16A34A',
  greenDark: '#14532D',
  greenLight: '#DCFCE7',
  greenTint: '#F0FDF4',
  greenMid: '#22C55E',

  // Neutrals
  ink: '#0D1B12',   // near-black with green undertone
  inkSoft: '#374151',
  muted: '#6B7280',
  mutedLight: '#9CA3AF',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  surface: '#FFFFFF',
  base: '#F7F9F7',   // off-white with green undertone — the page background
  baseDark: '#EFF5F1',

  // Accents
  amber: '#F59E0B',
  amberLight: '#FEF3C7',
  coral: '#F97316',
  coralLight: '#FFF7ED',
  sky: '#0EA5E9',
  skyLight: '#E0F2FE',
  violet: '#8B5CF6',
  violetLight: '#F5F3FF',

  // Utility
  white: '#FFFFFF',
  onlineDot: '#22C55E',
  gold: '#FBBF24',
};

const SHADOW = {
  xs: {
    shadowColor: '#0D1B12',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  sm: {
    shadowColor: '#0D1B12',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  md: {
    shadowColor: '#0D1B12',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 14,
    elevation: 6,
  },
  green: {
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 6,
  },
};

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Guide {
  id: string;
  name: string;
  rating: number;
  reviews: number;
  isOnline: boolean;
  verified: boolean;
  profileImage?: string;
  city?: string;
  languages?: string[];
  hourlyRate?: number;
}

interface HomeHotel {
  id: string;
  name: string;
  rating: number;
  pricePerNight: number;
  image?: string;
  location?: string;
  city?: string;
}

interface HomeVehicle {
  id: string;
  name: string;
  type: string;
  rating: number;
  pricePerDay: number;
  image?: string;
  emoji: string;
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
  iconColor: string;
  accent: string;
}

const { width: SW } = Dimensions.get('window');

// ─── Mock Data ─────────────────────────────────────────────────────────────────
const BANNERS = [
  { id: '1', source: require('../../assets/images/banner.png') },
  { id: '2', source: require('../../assets/images/banner2.png') },
  { id: '3', source: require('../../assets/images/banner3.png') },
];


// Each vehicle type gets a tint so cards feel alive
const VEHICLE_TINTS: Record<string, { bg: string; accent: string }> = {
  scooty: { bg: '#F0FDF4', accent: C.green },
  bike: { bg: '#EFF6FF', accent: C.sky },
  car: { bg: '#FFF7ED', accent: C.coral },
};

const CATEGORIES: Category[] = [
  { id: '1', label: 'Food Tours', icon: 'restaurant-outline', color: C.amberLight, iconColor: '#D97706', accent: C.amber },
  { id: '2', label: 'City Walks', icon: 'walk-outline', color: C.skyLight, iconColor: C.sky, accent: C.sky },
  { id: '3', label: 'Adventure', icon: 'trail-sign-outline', color: C.greenLight, iconColor: C.green, accent: C.green },
  { id: '4', label: 'Hidden Gems', icon: 'diamond-outline', color: C.violetLight, iconColor: C.violet, accent: C.violet },
  { id: '5', label: 'Night Life', icon: 'moon-outline', color: '#FEE2E2', iconColor: '#EF4444', accent: '#EF4444' },
  { id: '6', label: 'Photography', icon: 'camera-outline', color: '#E0F2FE', iconColor: '#0284C7', accent: '#0284C7' },
];

const CATEGORY_SUBTITLES: Record<string, string> = {
  'Food Tours': 'Taste the culture',
  'City Walks': 'Explore on foot',
  'Adventure': 'Thrill awaits',
  'Hidden Gems': 'Off the beaten path',
  'Night Life': 'After dark fun',
  'Photography': 'Capture memories',
};

const QUICK_NAV = [
  { id: 'rent', label: 'Rent', icon: 'bicycle-outline' as const, iconColor: C.green, bgColor: C.greenTint },
  { id: 'hotels', label: 'Hotels', icon: 'business-outline' as const, iconColor: C.sky, bgColor: C.skyLight },
  { id: 'guides', label: 'Guides', icon: 'people-outline' as const, iconColor: C.violet, bgColor: C.violetLight },
  { id: 'experiences', label: 'Explore', icon: 'compass-outline' as const, iconColor: C.coral, bgColor: C.coralLight },

];

// ─── StarRating ────────────────────────────────────────────────────────────────
const StarRating = ({ rating }: { rating: number }) => (
  <View style={s.starRow}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Ionicons key={n} name={n <= Math.round(rating) ? 'star' : 'star-outline'} size={9} color={C.gold} />
    ))}
    <Text style={s.ratingNum}>{rating.toFixed(1)}</Text>
  </View>
);

// ─── GuideCard ─────────────────────────────────────────────────────────────────
const GuideCard = ({ guide }: { guide: Guide }) => {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={s.guideCard}
      activeOpacity={0.93}
      onPress={() => router.push({ pathname: '/more/guideDetail', params: { id: guide.id } })}
    >
      {/* Portrait photo area */}
      <View style={s.guidePhoto}>
        {guide.profileImage ? (
          <ExpoImage source={{ uri: guide.profileImage }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <View style={s.guidePhotoFallback}>
            <Ionicons name="person" size={34} color={C.border} />
          </View>
        )}
        <LinearGradient colors={['transparent', 'rgba(13,27,18,0.85)']} style={s.guideGrad} />

        {/* Top left tags */}
        <View style={s.guideTopTags}>
          {guide.isOnline ? (
            <View style={s.onlinePill}>
              <View style={s.onlineDot} />
              <Text style={s.onlineTxt}>Online</Text>
            </View>
          ) : <View />}
          {guide.hourlyRate && (
            <View style={s.ratePill}>
              <Text style={s.rateTxt}>₹{guide.hourlyRate}/hr</Text>
            </View>
          )}
        </View>

        {/* Info over gradient */}
        <View style={s.guideNameBlock}>
          <Text style={s.guideName} numberOfLines={1}>{guide.name}</Text>
          {guide.verified && (
            <Ionicons name="shield-checkmark" size={13} color="#4ADE80" style={{ marginLeft: 4 }} />
          )}
        </View>
      </View>

      {/* Info strip */}
      <View style={s.guideInfoStrip}>
        <View style={s.guideLocationRow}>
          <Ionicons name="location" size={10} color={C.green} />
          <Text style={s.guideLocationTxt} numberOfLines={1}>{guide.city || 'Local'}</Text>
          {guide.languages && guide.languages.length > 0 && (
            <>
              <View style={s.guideDot} />
              <Text style={s.guideLangTxt} numberOfLines={1}>{guide.languages.join(', ')}</Text>
            </>
          )}
        </View>

        <View style={s.guideBottomRow}>
          <View style={s.guideMetaRow}>
            <StarRating rating={guide.rating} />
            <Text style={s.guideReviews}>({guide.reviews})</Text>
          </View>
          <TouchableOpacity
            style={s.bookBtn}
            activeOpacity={0.85}
            onPress={() => router.push({ pathname: '/more/guideDetail', params: { id: guide.id } })}
          >
            <Text style={s.bookBtnTxt}>Book</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── VehicleCard ───────────────────────────────────────────────────────────────
const VehicleCard = ({ vehicle, city }: { vehicle: Vehicle; city?: string }) => {
  const router = useRouter();
  const tint = VEHICLE_TINTS[vehicle.type] ?? { bg: C.base, accent: C.green };
  return (
    <TouchableOpacity
      style={[s.vehicleCard, { backgroundColor: tint.bg }]}
      activeOpacity={0.88}
      onPress={() => router.push({ pathname: '/(tabs)/RentAVehicle', params: { filter: vehicle.type, city } })}
    >
      {/* Image */}
      <View style={s.vehicleImgWrap}>
        <Image source={vehicle.image} style={s.vehicleImg} resizeMode="contain" />
      </View>
      <Text style={[s.vehicleType, { color: tint.accent }]}>
        {vehicle.type.charAt(0).toUpperCase() + vehicle.type.slice(1)}
      </Text>
      <View style={s.vehiclePriceRow}>
        <Text style={s.vehiclePrice}>₹{vehicle.pricePerDay.toLocaleString()}</Text>
        <Text style={s.vehiclePerDay}>/day</Text>
      </View>
      {/* Small caret */}
      <View style={[s.vehicleTag, { backgroundColor: tint.accent }]}>
        <Ionicons name="arrow-forward" size={11} color={C.white} />
      </View>
    </TouchableOpacity>
  );
};

// ─── CategoryCard ──────────────────────────────────────────────────────────────
const CategoryCard = ({ cat }: { cat: Category }) => (
  <TouchableOpacity style={[s.catCard, { backgroundColor: cat.color }]} activeOpacity={0.82}>
    <View style={[s.catIconWrap, { backgroundColor: 'rgba(255,255,255,0.68)' }]}>
      <Ionicons name={cat.icon} size={20} color={cat.iconColor} />
    </View>
    <Text style={s.catLabel}>{cat.label}</Text>
    <Text style={s.catSub}>{CATEGORY_SUBTITLES[cat.label] ?? ''}</Text>
    <View style={[s.catAccentDot, { backgroundColor: cat.accent }]} />
  </TouchableOpacity>
);

// ─── HotelMiniCard ─────────────────────────────────────────────────────────────
const HotelMiniCard = ({ hotel }: { hotel: HomeHotel }) => {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={s.miniCard}
      activeOpacity={0.88}
      onPress={() => router.push({ pathname: '/more/hotel', params: { id: hotel.id } })}
    >
      <View style={s.miniImgWrap}>
        {hotel.image ? (
          <Image source={{ uri: hotel.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', backgroundColor: C.skyLight }]}>
            <Ionicons name="business" size={28} color={C.sky} />
          </View>
        )}
        <View style={s.miniRatingBadge}>
          <Ionicons name="star" size={10} color={C.gold} />
          <Text style={s.miniRatingTxt}>{hotel.rating.toFixed(1)}</Text>
        </View>
      </View>
      <View style={s.miniInfo}>
        <Text style={s.miniName} numberOfLines={1}>{hotel.name}</Text>
        {hotel.location ? <Text style={s.miniSub} numberOfLines={1}>{hotel.location}</Text> : null}
        <Text style={s.miniPrice}>₹{hotel.pricePerNight.toLocaleString()}<Text style={s.miniPriceSub}>/night</Text></Text>
      </View>
    </TouchableOpacity>
  );
};

// ─── VehicleMiniCard ───────────────────────────────────────────────────────────
const VehicleMiniCard = ({ vehicle }: { vehicle: HomeVehicle }) => {
  const router = useRouter();
  const tint = vehicle.type === 'Car' ? { bg: C.coralLight, accent: C.coral }
    : vehicle.type === 'Scooty' ? { bg: C.greenTint, accent: C.green }
    : { bg: C.skyLight, accent: C.sky };
  return (
    <TouchableOpacity
      style={[s.miniCard, { backgroundColor: tint.bg }]}
      activeOpacity={0.88}
      onPress={() => router.push({ pathname: '/more/vehicle', params: { id: vehicle.id } })}
    >
      <View style={s.miniImgWrap}>
        {vehicle.image ? (
          <Image source={{ uri: vehicle.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ fontSize: 36 }}>{vehicle.emoji}</Text>
          </View>
        )}
        <View style={[s.miniRatingBadge, { backgroundColor: tint.accent }]}>
          <Text style={[s.miniRatingTxt, { color: C.white }]}>{vehicle.type}</Text>
        </View>
      </View>
      <View style={s.miniInfo}>
        <Text style={s.miniName} numberOfLines={1}>{vehicle.name}</Text>
        <Text style={s.miniPrice}>₹{vehicle.pricePerDay.toLocaleString()}<Text style={s.miniPriceSub}>/day</Text></Text>
      </View>
    </TouchableOpacity>
  );
};

// ─── SectionHeader ─────────────────────────────────────────────────────────────
const SectionHeader = ({
  title, subtitle, onSeeAll,
}: { title: string; subtitle?: string; onSeeAll?: () => void }) => (
  <View style={s.secHeader}>
    <View style={{ flex: 1 }}>
      <Text style={s.secTitle}>{title}</Text>
      {subtitle ? <Text style={s.secSub}>{subtitle}</Text> : null}
    </View>
    {onSeeAll && (
      <TouchableOpacity onPress={onSeeAll} activeOpacity={0.7}>
        <View style={s.seeAllPill}>
          <Text style={s.seeAllTxt}>See all</Text>
          <Ionicons name="arrow-forward" size={12} color={C.green} />
        </View>
      </TouchableOpacity>
    )}
  </View>
);

// ─── HomeScreen ────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loadingGuides, setLoadingGuides] = useState(true);
  const [hotels, setHotels] = useState<HomeHotel[]>([]);
  const [vehicles, setVehicles] = useState<HomeVehicle[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showCity, setShowCity] = useState(false);
  const [activeBanner, setActiveBanner] = useState(0);
  const bannerRef = useRef<FlatList>(null);
  const { cityOptions, selectedCity, setSelectedCity } = useLocation();

  // Auto-scroll banners
  useEffect(() => {
    const t = setInterval(() => {
      const next = (activeBanner + 1) % BANNERS.length;
      bannerRef.current?.scrollToIndex({ index: next, animated: true });
      setActiveBanner(next);
    }, 3000);
    return () => clearInterval(t);
  }, [activeBanner]);

  // Fetch guides
  useEffect(() => {
    setLoadingGuides(true);
    (async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, city, rating, reviews, is_online, is_approved, profile_data, photo_url')
        .eq('role', 'guide')
        .eq('is_approved', true);

      if (!error && data) {
        const list: Guide[] = data
          .map((r) => ({
            id: r.id,
            name: r.name || 'Anonymous',
            rating: r.rating || 4.5,
            reviews: r.reviews || 0,
            isOnline: r.is_online || false,
            verified: r.is_approved || false,
            city: normalizeCity(r.city || r.profile_data?.city || r.profile_data?.location),
            profileImage: r.profile_data?.profileImage || r.photo_url || null,
            languages: r.profile_data?.languages || ['English', 'Hindi'],
            hourlyRate: r.profile_data?.hourlyRate || 300,
          }))
          .filter((g) => !selectedCity || g.city === selectedCity)
          .slice(0, 5);
        setGuides(list);
      } else if (error) {
        console.warn('Home fetch guides:', error.message);
      }
      setLoadingGuides(false);
      setRefreshing(false);
    })();
  }, [refreshKey, selectedCity]);

  // Fetch hotels
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('id, title, price, images, location, details')
        .eq('type', 'hotel')
        .eq('is_active', true)
        .limit(5);
      if (!error && data) {
        setHotels(data.map((doc: any) => ({
          id: doc.id,
          name: doc.title,
          rating: doc.details?.rating || 4.5,
          pricePerNight: doc.price,
          image: doc.images?.[0],
          location: typeof doc.location === 'string' ? doc.location : doc.location?.address || doc.details?.address || '',
          city: normalizeCity(doc.details?.city || (typeof doc.location === 'string' ? doc.location : doc.location?.address)),
        })));
      }
    })();
  }, [refreshKey, selectedCity]);

  // Fetch vehicles
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('id, title, price, images, location, details')
        .eq('type', 'rental')
        .eq('is_active', true)
        .limit(5);
      if (!error && data) {
        const typeOf = (doc: any) => {
          const t = [doc.details?.vehicleType, doc.details?.category, doc.title].filter(Boolean).join(' ').toLowerCase();
          if (t.includes('car') || t.includes('cab')) return 'Car';
          if (t.includes('scoot') || t.includes('activa')) return 'Scooty';
          return 'Bike';
        };
        setVehicles(data.map((doc: any) => {
          const vType = typeOf(doc);
          return {
            id: doc.id,
            name: doc.title,
            type: vType,
            rating: doc.details?.rating || 4.5,
            pricePerDay: doc.price,
            image: doc.images?.[0],
            emoji: vType === 'Car' ? '🚗' : vType === 'Scooty' ? '🛵' : '🏍️',
            city: normalizeCity(doc.details?.city || (typeof doc.location === 'string' ? doc.location : doc.location?.address)),
          };
        }));
      }
    })();
  }, [refreshKey, selectedCity]);

  const onRefresh = () => { setRefreshing(true); setGuides([]); setHotels([]); setVehicles([]); setRefreshKey(k => k + 1); };

  const handleSearch = () => {
    const t = searchText.trim();
    if (t) { const c = normalizeCity(t); if (c) { setSelectedCity(c); setSearchText(''); } }
  };

  return (
    <SafeAreaContextView edges={['top']} style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.green} colors={[C.green]} />
        }
      >
        {/* ══ HERO SEARCH BLOCK ══════════════════════════════════════════════ */}
        <LinearGradient
          colors={['#F0FDF4', '#FAFAF8']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={s.heroBlock}
        >
          {/* ── AppBar ── */}
          <View style={{ marginHorizontal: -16 }}>
            <AppBar transparent />
          </View>

          {/* Header Row */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',marginTop:8, marginBottom: 16 }}>
            {/* Greeting headline */}
            <Text style={[s.heroHeadline, { marginBottom: 0 }]}>Hi, <Text style={s.heroHeadlineAccent}>{user?.displayName ? user.displayName.split(' ')[0] : 'Explorer'}</Text></Text>
            
            {/* City selector row */}
            <TouchableOpacity style={[s.cityChip, { marginBottom: 0, alignSelf: 'auto' }]} activeOpacity={0.8} onPress={() => setShowCity(true)}>
              <View style={s.cityChipDot} />
              <ExpoImage
                source={require('../../assets/svg/location-pin-svgrepo-com.svg')}
                style={{ width: 13, height: 13, tintColor: C.green }}
                contentFit="contain"
              />
              <Text style={s.cityChipTxt}>{selectedCity || 'Pick a city'}</Text>
              <Ionicons name="chevron-down" size={13} color={C.green} />
            </TouchableOpacity>
          </View>

          {/* Search bar */}
          <View style={s.searchBar}>
            <Ionicons name="search-outline" size={17} color={C.muted} style={{ marginLeft: 14 }} />
            <TextInput
              style={s.searchInput}
              placeholder="City, landmark, or vibe…"
              placeholderTextColor={C.mutedLight}
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            <TouchableOpacity style={s.searchGo} activeOpacity={0.85} onPress={handleSearch}>
              <ExpoImage
                source={require('../../assets/svg/search-svgrepo-com.svg')}
                style={{ width: 17, height: 17, tintColor: C.white }}
                contentFit="contain"
              />
            </TouchableOpacity>
          </View>


        </LinearGradient>

        {/* ══ QUICK NAV ══════════════════════════════════════════════════════ */}
        <View style={s.quickNavRow}>
          {QUICK_NAV.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={s.quickNavItem}
              activeOpacity={0.78}
              onPress={() => {
                if (item.id === 'rent') router.push({ pathname: '/(tabs)/RentAVehicle', params: { city: selectedCity } });
                else if (item.id === 'hotels') router.push({ pathname: '/(tabs)/HotelListings', params: { city: selectedCity } });
                else if (item.id === 'guides') router.push({ pathname: '/(tabs)/AllGuides', params: { city: selectedCity } });
              }}
            >
              <View style={[s.quickNavIcon, { backgroundColor: item.bgColor }]}>
                <Ionicons name={item.icon} size={20} color={item.iconColor} />
              </View>
              <Text style={s.quickNavLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ══ BANNER CAROUSEL ════════════════════════════════════════════════ */}
        <View style={s.bannerWrap}>
          <FlatList
            ref={bannerRef}
            data={BANNERS}
            keyExtractor={(i) => i.id}
            horizontal pagingEnabled showsHorizontalScrollIndicator={false}
            getItemLayout={(_, idx) => ({ length: SW - 32, offset: (SW - 32) * idx, index: idx })}
            onMomentumScrollEnd={(e) => {
              setActiveBanner(Math.round(e.nativeEvent.contentOffset.x / (SW - 32)));
            }}
            renderItem={({ item }) => (
              <View style={s.bannerSlide}>
                <ExpoImage source={item.source} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
              </View>
            )}
          />
          {/* Dots */}
          <View style={s.dots}>
            {BANNERS.map((_, i) => (
              <View key={i} style={[s.dot, i === activeBanner && s.dotActive]} />
            ))}
          </View>
        </View>

        {/* ══ FEATURED GUIDES ════════════════════════════════════════════════ */}
        <SectionHeader
          title="Featured Guides"
          subtitle="Trusted local experts"
          onSeeAll={() => router.push({ pathname: '/(tabs)/AllGuides', params: { city: selectedCity } })}
        />
        <FlatList
          data={guides}
          keyExtractor={(i) => i.id}
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.hList}
          renderItem={({ item }) => <GuideCard guide={item} />}
          ListEmptyComponent={
            !loadingGuides ? (
              <View style={s.emptyCard}>
                <View style={s.emptyIconWrap}><Ionicons name="people-outline" size={22} color={C.green} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.emptyTitle}>No guides yet</Text>
                  <Text style={s.emptySub}>Try another city or check all.</Text>
                </View>
                <TouchableOpacity
                  style={s.emptyBtn}
                  onPress={() => router.push({ pathname: '/(tabs)/AllGuides', params: { city: selectedCity } })}
                >
                  <Text style={s.emptyBtnTxt}>View all</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />

        {/* ══ TOP HOTELS ═════════════════════════════════════════════════════ */}
        <SectionHeader
          title="Top Hotels"
          subtitle="Best stays near you"
          onSeeAll={() => router.push({ pathname: '/(tabs)/HotelListings', params: { city: selectedCity } })}
        />
        <FlatList
          data={hotels}
          keyExtractor={(i) => i.id}
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.hList}
          renderItem={({ item }) => <HotelMiniCard hotel={item} />}
          ListEmptyComponent={
            <View style={s.emptyCard}>
              <View style={s.emptyIconWrap}><Ionicons name="business-outline" size={22} color={C.sky} /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.emptyTitle}>No hotels yet</Text>
                <Text style={s.emptySub}>Try another city.</Text>
              </View>
              <TouchableOpacity style={s.emptyBtn} onPress={() => router.push({ pathname: '/(tabs)/HotelListings', params: { city: selectedCity } })}>
                <Text style={s.emptyBtnTxt}>View all</Text>
              </TouchableOpacity>
            </View>
          }
        />

        {/* ══ RENT A VEHICLE ═════════════════════════════════════════════════ */}
        <SectionHeader
          title="Rent a Ride"
          subtitle="Flexible city travel"
          onSeeAll={() => router.push({ pathname: '/(tabs)/RentAVehicle', params: { city: selectedCity } })}
        />
        <FlatList
          data={vehicles}
          keyExtractor={(i) => i.id}
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.hList}
          renderItem={({ item }) => <VehicleMiniCard vehicle={item} />}
          ListEmptyComponent={
            <View style={s.emptyCard}>
              <View style={s.emptyIconWrap}><Ionicons name="bicycle-outline" size={22} color={C.green} /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.emptyTitle}>No rentals yet</Text>
                <Text style={s.emptySub}>Try another city.</Text>
              </View>
              <TouchableOpacity style={s.emptyBtn} onPress={() => router.push({ pathname: '/(tabs)/RentAVehicle', params: { city: selectedCity } })}>
                <Text style={s.emptyBtnTxt}>View all</Text>
              </TouchableOpacity>
            </View>
          }
        />

        {/* ══ QUICK CATEGORIES ═══════════════════════════════════════════════ */}
        <SectionHeader title="Explore by Mood" subtitle="Jump into what excites you" />
        <View style={s.catGrid}>
          {CATEGORIES.map((cat) => <CategoryCard key={cat.id} cat={cat} />)}
        </View>

        {/* ══ PROMO BANNER ═══════════════════════════════════════════════════ */}
        <LinearGradient
          colors={['#0D3B20', '#16A34A']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={s.promo}
        >
          {/* Decorative circles */}
          <View style={s.promoCircle1} />
          <View style={s.promoCircle2} />

          <View style={s.promoContent}>
            <View style={s.promoTag}>
              <Ionicons name="sparkles-outline" size={11} color={C.white} />
              <Text style={s.promoTagTxt}>Limited Offer</Text>
            </View>
            <Text style={s.promoTitle}>Free Delivery</Text>
            <Text style={s.promoSub}>We bring the vehicle to your door — no hassle.</Text>
            <View style={s.promoTrustRow}>
              <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.75)" />
              <Text style={s.promoTrustTxt}>Reserve now, ride when ready</Text>
            </View>
            <TouchableOpacity
              style={s.promoBtn}
              activeOpacity={0.85}
              onPress={() => router.push({ pathname: '/(tabs)/RentAVehicle', params: { city: selectedCity } })}
            >
              <Text style={s.promoBtnTxt}>Explore Rentals</Text>
              <Ionicons name="arrow-forward" size={13} color={C.greenDark} />
            </TouchableOpacity>
          </View>

          <View style={s.promoImgWrap}>
            <Image source={require('../../assets/images/scooty.png')} style={s.promoImg} resizeMode="contain" />
          </View>
        </LinearGradient>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ══ CITY SELECTOR MODAL ════════════════════════════════════════════════ */}
      <Modal visible={showCity} animationType="slide" transparent={true} onRequestClose={() => setShowCity(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.cityModalOverlay}>
          <View style={s.cityRoot}>
            {/* Handle */}
            <View style={s.cityHandle} />

            {/* Header */}
            <View style={s.cityHeader}>
              <View>
                <Text style={s.cityHeaderTitle}>Select Your City</Text>
                <Text style={s.cityHeaderSub}>Find guides and rentals near you</Text>
              </View>
              <TouchableOpacity style={s.cityCloseBtn} onPress={() => setShowCity(false)}>
                <Ionicons name="close" size={20} color={C.inkSoft} />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={s.citySearchWrap}>
              <Ionicons name="search-outline" size={18} color={C.muted} style={{ marginLeft: 14 }} />
              <TextInput
                style={s.citySearchInput}
                placeholder="Search cities…"
                placeholderTextColor={C.mutedLight}
              />
            </View>

            {/* List */}
            <ScrollView contentContainerStyle={s.cityList}>
              {cityOptions.map((city) => {
                const active = selectedCity === city;
                return (
                  <TouchableOpacity
                    key={city}
                    style={[s.cityListItem, active && s.cityListItemActive]}
                    activeOpacity={0.7}
                    onPress={async () => { await setSelectedCity(city); setShowCity(false); }}
                  >
                    <View style={[s.cityListItemIcon, active && s.cityListItemIconActive]}>
                      <Ionicons name="location" size={18} color={active ? C.white : C.muted} />
                    </View>
                    <Text style={[s.cityListItemName, active && s.cityListItemNameActive]} numberOfLines={1}>
                      {city}
                    </Text>
                    {active && (
                      <Ionicons name="checkmark-circle" size={24} color={C.green} />
                    )}
                  </TouchableOpacity>
                );
              })}
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaContextView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({

  // ── Root ──
  root: { flex: 1, backgroundColor: C.surface },
  scroll: { flex: 1, backgroundColor: C.base },
  scrollContent: { paddingBottom: 16 },

  // ── Hero Search Block ──
  heroBlock: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 15,
    backgroundColor: C.greenTint,
  },

  cityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: C.surface,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 7,
    gap: 5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.greenLight,
    ...SHADOW.xs,
  },
  cityChipDot: {
    // subtle brand accent
    display: 'none',
  },
  cityChipTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: C.ink,
    letterSpacing: -0.1,
  },

  heroHeadline: {
    fontSize: 30,
    fontWeight: '900',
    color: C.ink,
    lineHeight: 36,
    letterSpacing: -0.8,
    marginBottom: 10,
  },
  heroHeadlineAccent: {
    color: C.green,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: C.greenLight,
    ...SHADOW.sm,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: C.ink,
    fontWeight: '500',
  },
  searchGo: {
    backgroundColor: C.green,
    padding: 13,
    margin: 3,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Quick Nav ──
  quickNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
  },
  quickNavItem: { alignItems: 'center', gap: 6, flex: 1 },
  quickNavIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.xs,
  },
  quickNavLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.inkSoft,
    textAlign: 'center',
  },

  // ── Banner ──
  bannerWrap: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
    height: 168,
    ...SHADOW.md,
  },
  bannerSlide: { width: SW - 32, height: 168 },
  dots: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.45)' },
  dotActive: { width: 18, backgroundColor: C.white },

  // ── Section Header ──
  secHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  secTitle: { fontSize: 18, fontWeight: '800', color: C.ink, letterSpacing: -0.3 },
  secSub: { fontSize: 12, fontWeight: '500', color: C.muted, marginTop: 2 },
  seeAllPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: C.greenLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.green,
  },
  seeAllTxt: { fontSize: 12, fontWeight: '700', color: C.green },

  // ── Horizontal List ──
  hList: { paddingLeft: 16, paddingRight: 8, paddingBottom: 6 },

  // ── Empty State ──
  emptyCard: {
    width: SW - 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    ...SHADOW.xs,
  },
  emptyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: C.greenTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: C.ink, marginBottom: 2 },
  emptySub: { fontSize: 12, color: C.muted },
  emptyBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: C.green,
    ...SHADOW.green,
  },
  emptyBtnTxt: { color: C.white, fontSize: 12, fontWeight: '700' },

  // ── Mini Card (Hotels & Vehicles) ──
  miniCard: {
    width: 152,
    backgroundColor: C.surface,
    borderRadius: 18,
    marginRight: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.borderLight,
    ...SHADOW.sm,
  },
  miniImgWrap: {
    width: '100%',
    height: 110,
    backgroundColor: C.baseDark,
    position: 'relative',
    overflow: 'hidden',
  },
  miniRatingBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
  },
  miniRatingTxt: { fontSize: 11, fontWeight: '700', color: C.ink },
  miniInfo: { padding: 10, gap: 2 },
  miniName: { fontSize: 13, fontWeight: '700', color: C.ink },
  miniSub: { fontSize: 11, color: C.muted },
  miniPrice: { fontSize: 14, fontWeight: '800', color: C.ink, marginTop: 4 },
  miniPriceSub: { fontSize: 11, fontWeight: '500', color: C.muted },

  // ── Guide Card ──
  guideCard: {
    width: 155,
    backgroundColor: C.surface,
    borderRadius: 20,
    marginRight: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.borderLight,
    ...SHADOW.sm,
  },
  guidePhoto: {
    width: '100%',
    height: 115,
    backgroundColor: C.baseDark,
    position: 'relative',
    overflow: 'hidden',
  },
  guidePhotoFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDF2ED',
  },
  guideGrad: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: '60%',
  },
  guideTopTags: {
    position: 'absolute',
    top: 10, left: 10, right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.56)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.onlineDot },
  onlineTxt: { fontSize: 10, color: C.white, fontWeight: '700' },
  ratePill: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rateTxt: { fontSize: 10, color: C.ink, fontWeight: '800' },
  guideNameBlock: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  guideName: { fontSize: 14, fontWeight: '800', color: C.white, flex: 1, letterSpacing: -0.2 },

  guideInfoStrip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  guideLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  guideLocationTxt: {
    fontSize: 11,
    color: C.inkSoft,
    fontWeight: '600',
    maxWidth: 60,
  },
  guideDot: {
    width: 3, height: 3, borderRadius: 1.5, backgroundColor: C.mutedLight,
  },
  guideLangTxt: {
    fontSize: 11,
    color: C.muted,
    flex: 1,
  },
  guideBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  guideMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  starRow: { flexDirection: 'row', alignItems: 'center', gap: 1 },
  ratingNum: { fontSize: 10, fontWeight: '700', color: C.ink, marginLeft: 3 },
  guideReviews: { fontSize: 10, color: C.muted },
  bookBtn: {
    backgroundColor: C.green,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    ...SHADOW.green,
  },
  bookBtnTxt: { fontSize: 11, fontWeight: '700', color: C.white },

  // ── Vehicle Card ──
  vehicleCard: {
    width: 136,
    borderRadius: 20,
    marginRight: 12,
    padding: 12,
    alignItems: 'center',
    ...SHADOW.sm,
    position: 'relative',
    overflow: 'hidden',
  },
  vehicleImgWrap: { width: '100%', height: 82, alignItems: 'center', justifyContent: 'center', marginBottom: 8, borderRadius: 12, overflow: 'hidden' },
  vehicleImg: { width: '100%', height: '100%', borderRadius: 12 },
  vehicleType: { fontSize: 13, fontWeight: '800', marginBottom: 2, letterSpacing: -0.2 },
  vehiclePriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  vehiclePrice: { fontSize: 16, fontWeight: '900', color: C.ink },
  vehiclePerDay: { fontSize: 11, fontWeight: '500', color: C.muted },
  vehicleTag: {
    position: 'absolute',
    top: 10, right: 10,
    width: 22, height: 22,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Category Grid ──
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 6,
  },
  catCard: {
    width: '47.5%',
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    position: 'relative',
    overflow: 'hidden',
  },
  catIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  catLabel: { fontSize: 14, fontWeight: '800', color: C.ink, marginBottom: 3, letterSpacing: -0.2 },
  catSub: { fontSize: 11, color: C.muted, fontWeight: '500' },
  catAccentDot: {
    position: 'absolute',
    bottom: -14,
    right: -14,
    width: 56,
    height: 56,
    borderRadius: 28,
    opacity: 0.15,
  },

  // ── Promo Banner ──
  promo: {
    flexDirection: 'row',
    borderRadius: 22,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 18,
    overflow: 'hidden',
    ...SHADOW.md,
    shadowColor: C.greenDark,
  },
  promoCircle1: {
    position: 'absolute',
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -60, right: -40,
  },
  promoCircle2: {
    position: 'absolute',
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: -35, left: 70,
  },
  promoContent: { flex: 1, justifyContent: 'center' },
  promoTag: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, marginBottom: 9,
  },
  promoTagTxt: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.95)' },
  promoTitle: { fontSize: 24, fontWeight: '900', color: C.white, letterSpacing: -0.6, marginBottom: 6 },
  promoSub: { fontSize: 12, color: 'rgba(255,255,255,0.72)', lineHeight: 17, marginBottom: 8 },
  promoTrustRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 14 },
  promoTrustTxt: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.75)' },
  promoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.white,
    paddingVertical: 10, paddingHorizontal: 18,
    borderRadius: 12, alignSelf: 'flex-start',
  },
  promoBtnTxt: { fontSize: 12, fontWeight: '800', color: C.greenDark, letterSpacing: 0.1 },
  promoImgWrap: {
    width: 100, height: 100,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 10, alignSelf: 'center',
  },
  promoImg: { width: 92, height: 82 },

  // ── City Modal ──
  cityModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  cityRoot: { 
    backgroundColor: C.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '85%',
    ...SHADOW.md,
  },
  cityHandle: {
    width: 40, height: 5,
    backgroundColor: C.border,
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  cityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 10, paddingBottom: 20,
  },
  cityHeaderTitle: { fontSize: 22, fontWeight: '900', color: C.ink, letterSpacing: -0.4 },
  cityHeaderSub: { fontSize: 13, color: C.muted, marginTop: 2 },
  cityCloseBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  citySearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 16,
  },
  citySearchInput: { flex: 1, fontSize: 15, color: C.ink, paddingVertical: 14, paddingHorizontal: 12 },
  cityList: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  cityListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 8,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cityListItemActive: {
    backgroundColor: C.greenTint,
    borderColor: C.greenLight,
  },
  cityListItemIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: C.surface,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 14,
  },
  cityListItemIconActive: { backgroundColor: C.green },
  cityListItemName: { flex: 1, fontSize: 16, fontWeight: '600', color: C.ink },
  cityListItemNameActive: { color: C.greenDark, fontWeight: '700' },
});