import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView as SafeAreaContextView } from 'react-native-safe-area-context';
import { Text } from '../../components/Text';
import { useLocation } from '../../contexts/LocationContext';
import { normalizeCity } from '../../utils/cities';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useTrips, Trip } from '../../hooks/useTrips';
import { getCommunities } from '../../services/communityService';
import { Community } from '../../types/community';
import ScreenHeader from '../../components/ScreenHeader';

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const C = {
  green: '#10B981', 
  greenDark: '#047857',
  greenLight: '#D1FAE5',
  greenTint: '#F0FDF4',
  ink: '#111827',
  inkSoft: '#4B5563',
  muted: '#6B7280',
  mutedLight: '#9CA3AF',
  border: '#E5E7EB',
  surface: '#FFFFFF',
  base: '#FAFAFA',
  white: '#FFFFFF',
  gold: '#FBBF24',
};

const SHADOW = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
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

interface Category {
  id: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  iconColor: string;
}

const { width: SW } = Dimensions.get('window');

// ─── Mock Data matching new UI ─────────────────────────────────────────────────
const CATEGORIES: Category[] = [
  { id: '1', label: 'Hidden Gems', icon: 'diamond-outline', color: '#F3E8FF', iconColor: '#9333EA' },
  { id: '2', label: 'Nature', icon: 'leaf-outline', color: '#DCFCE7', iconColor: '#16A34A' },
  { id: '3', label: 'Cafe Meetups', icon: 'cafe-outline', color: '#FFEDD5', iconColor: '#EA580C' },
  { id: '4', label: 'Adventure', icon: 'trail-sign-outline', color: '#E0F2FE', iconColor: '#0284C7' },
  { id: '5', label: 'Road Trips', icon: 'car-outline', color: '#FEE2E2', iconColor: '#DC2626' },
  { id: '6', label: 'Camping', icon: 'bonfire-outline', color: '#DCFCE7', iconColor: '#16A34A' },
  { id: '7', label: 'Photography', icon: 'camera-outline', color: '#F3E8FF', iconColor: '#9333EA' },
  { id: '8', label: 'Food Trails', icon: 'restaurant-outline', color: '#FFEDD5', iconColor: '#EA580C' },
];






// ─── HomeScreen ────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  
  const [guides, setGuides] = useState<Guide[]>([]);
  const [hotels, setHotels] = useState<HomeHotel[]>([]);
  const [vehicles, setVehicles] = useState<HomeVehicle[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showCity, setShowCity] = useState(false);
  const { weekendTrips } = useTrips();
  
  const { cityOptions, selectedCity, setSelectedCity } = useLocation();

  useEffect(() => {
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
      }
      setRefreshing(false);
    })();
  }, [refreshKey, selectedCity]);

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


  // Fetch real communities
  useEffect(() => {
    getCommunities().then((data) => setCommunities(data)).catch(() => {});
  }, [refreshKey]);

  const onRefresh = () => { 
    setRefreshing(true); 
    setGuides([]); 
    setHotels([]); 
    setVehicles([]); 
    setRefreshKey(k => k + 1); 
  };

  const handleSearch = () => {
    const t = searchText.trim();
    if (t) { const c = normalizeCity(t); if (c) { setSelectedCity(c); setSearchText(''); } }
  };

  const renderSectionHeader = (title: string, onSeeAll?: () => void) => (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{title}</Text>
      {onSeeAll && (
        <TouchableOpacity style={s.seeAllBtn} onPress={onSeeAll}>
          <Text style={s.seeAllText}>See all</Text>
          <Ionicons name="arrow-forward" size={14} color={C.green} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaContextView edges={['top', 'bottom']} style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.base} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.green} colors={[C.green]} />
        }
      >
        {/* 1. Header Row */}
        <ScreenHeader 
          title={<Text style={{ fontSize: 22, fontWeight: '800' }}>Good Evening, <Text style={s.greetingName}>{user?.displayName?.split(' ')[0] || 'Keshav'}</Text> 👋</Text>}
          subtitle="Where will your next story begin?"
          showAvatar={true}
          showLocation={false}
        />


        {/* 2. Search Bar & Location */}
        <View style={s.searchRow}>
          <View style={s.searchBar}>
            <Ionicons name="search-outline" size={20} color={C.muted} style={{ marginLeft: 12 }} />
            <TextInput
              style={s.searchInput}
              placeholder="Search Experiences..."
              placeholderTextColor={C.mutedLight}
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleSearch}
            />
          </View>
          <TouchableOpacity style={s.citySelector} onPress={() => setShowCity(true)}>
            <Ionicons name="location-outline" size={16} color={C.ink} />
            <Text style={s.cityText} numberOfLines={1}>{selectedCity || 'Faridabad'}</Text>
            <Ionicons name="chevron-down" size={14} color={C.ink} />
          </TouchableOpacity>
        </View>

        {/* 3. Hero Banner */}
        <TouchableOpacity style={s.heroBanner} activeOpacity={0.9}>
          <ExpoImage source={{ uri: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&q=80&w=1200' }} style={StyleSheet.absoluteFill} contentFit="cover" />
          <LinearGradient colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.8)']} style={StyleSheet.absoluteFill} />
          <View style={s.heroTag}>
            <Ionicons name="flame" size={12} color="#F97316" />
            <Text style={s.heroTagText}>THIS WEEKEND</Text>
          </View>
          
          <View style={s.heroContent}>
            <View style={{ flex: 1 }}>
              <Text style={s.heroTitle}>Delhi Unseen</Text>
              <Text style={s.heroSubtitle}>Hidden places, amazing people</Text>
              
              <View style={s.facepileRow}>
                <View style={s.facepile}>
                  <ExpoImage source={{ uri: 'https://i.pravatar.cc/150?img=1' }} style={s.face} />
                  <ExpoImage source={{ uri: 'https://i.pravatar.cc/150?img=2' }} style={[s.face, { marginLeft: -10 }]} />
                  <ExpoImage source={{ uri: 'https://i.pravatar.cc/150?img=3' }} style={[s.face, { marginLeft: -10 }]} />
                  <ExpoImage source={{ uri: 'https://i.pravatar.cc/150?img=4' }} style={[s.face, { marginLeft: -10 }]} />
                </View>
                <Text style={s.facepileText}>+47 going</Text>
              </View>
              
              <View style={s.heroBottomRow}>
                <Text style={s.heroPrice}>₹599 <Text style={s.heroSeats}>4 seats left</Text></Text>
              </View>
            </View>
            <TouchableOpacity style={s.heroJoinBtn}>
              <Text style={s.heroJoinBtnText}>Join Trip</Text>
              <Ionicons name="arrow-forward" size={16} color={C.white} />
            </TouchableOpacity>
          </View>
          
          {/* Carousel dots */}
          <View style={s.heroDots}>
            <View style={[s.heroDot, s.heroDotActive]} />
            <View style={s.heroDot} />
            <View style={s.heroDot} />
            <View style={s.heroDot} />
          </View>
        </TouchableOpacity>

        {/* 4. Explore Experiences */}
        {renderSectionHeader('Explore Experiences', () => {})}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.exploreList}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity key={cat.id} style={s.catItem}>
              <View style={[s.catIconBox, { backgroundColor: cat.color }]}>
                <Ionicons name={cat.icon} size={24} color={cat.iconColor} />
              </View>
              <Text style={s.catItemLabel}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 5. Communities Near You */}
        {renderSectionHeader('Communities Near You', () => router.push('/(tabs)/Community' as any))}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.horizontalList}>
          {communities.slice(0, 6).map((com) => (
            <TouchableOpacity
              key={com.id}
              style={s.communityCard}
              onPress={() => router.push(`/community/${com.id}` as any)}
            >
              <ExpoImage
                source={{ uri: com.image_url || 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=800&q=80' }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
              />
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={StyleSheet.absoluteFill} />
              <TouchableOpacity style={s.favBtn}>
                <Ionicons name="heart-outline" size={18} color={C.white} />
              </TouchableOpacity>
              <View style={s.communityContent}>
                <Text style={s.communityName}>{com.name}</Text>
                <View style={s.communityBottom}>
                  <Text style={s.communityMembers}>{com.member_count} Members</Text>
                  <TouchableOpacity style={s.joinBtnSmall}>
                    <Text style={s.joinBtnSmallText}>Join</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 6. Trending Trips */}
        {renderSectionHeader('Trending Trips', () => (router.push as any)({ pathname: '/(tabs)/Trips' }))}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.horizontalList}
          data={weekendTrips}
          keyExtractor={(item) => item.id}
          renderItem={({ item }: { item: Trip }) => {
            const dateStr = item.trip_date
              ? new Date(item.trip_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()
              : '';
            const seatsLeft = item.capacity - (item.joined_count || 0);
            return (
              <TouchableOpacity
                style={s.tripCard}
                activeOpacity={0.9}
                onPress={() => (router.push as any)({ pathname: '/tripDetail', params: { id: item.id } })}
              >
                <ExpoImage
                  source={{ uri: item.images?.[0] || 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&q=80&w=800' }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={StyleSheet.absoluteFill} />
                <TouchableOpacity style={s.favBtn}>
                  <Ionicons name="heart-outline" size={18} color={C.white} />
                </TouchableOpacity>
                <View style={s.tripDateBadge}>
                  <Text style={s.tripDateText}>{dateStr}</Text>
                </View>
                <View style={s.tripContent}>
                  <Text style={s.tripName} numberOfLines={1}>{item.title}</Text>
                  <Text style={s.tripSub} numberOfLines={1}>{item.subtitle || item.category || item.city}</Text>
                  <View style={s.tripBottom}>
                    <View style={s.facepileRow}>
                      <View style={s.facepileSmall}>
                        <ExpoImage source={{ uri: 'https://i.pravatar.cc/150?img=5' }} style={s.faceSmall} />
                        <ExpoImage source={{ uri: 'https://i.pravatar.cc/150?img=6' }} style={[s.faceSmall, { marginLeft: -6 }]} />
                        <ExpoImage source={{ uri: 'https://i.pravatar.cc/150?img=7' }} style={[s.faceSmall, { marginLeft: -6 }]} />
                      </View>
                      <Text style={s.tripCapacity}>{item.joined_count}/{item.capacity}</Text>
                    </View>
                    <Text style={s.tripPrice}>₹{item.price.toLocaleString()}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={[s.tripCard, { alignItems: 'center', justifyContent: 'center', backgroundColor: C.border }]}>
              <Ionicons name="compass-outline" size={28} color={C.muted} />
              <Text style={[s.tripSub, { color: C.muted, marginTop: 6 }]}>No trips this weekend</Text>
            </View>
          }
        />



        {/* 8. Local Guides */}
        {renderSectionHeader('Local Guides', () => (router.push as any)({ pathname: '/(tabs)/AllGuides', params: { city: selectedCity } }))}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.horizontalList}
          data={guides}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={s.cardLarge} onPress={() => (router.push as any)({ pathname: '/more/guideDetail', params: { id: item.id } })}>
               <ExpoImage source={{ uri: item.profileImage || 'https://i.pravatar.cc/150?img=11' }} style={s.cardLargeImg} contentFit="cover" />
               <View style={s.cardLargeContent}>
                  <Text style={s.cardLargeTitle} numberOfLines={1}>{item.name}</Text>
                  <Text style={s.cardLargeSub} numberOfLines={1}>{item.city}</Text>
                  <View style={s.cardLargeRow}>
                    <View style={s.ratingPill}>
                      <Ionicons name="star" size={10} color={C.white} />
                      <Text style={s.ratingText}>{item.rating.toFixed(1)}</Text>
                    </View>
                    <Text style={s.cardLargePrice}>₹{item.hourlyRate} <Text style={s.cardLargePriceSub}>/hr</Text></Text>
                  </View>
               </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<View style={s.emptyCompact}><Text style={s.emptyCompactText}>No guides found.</Text></View>}
        />

        {/* 9. Recommended Hotels */}
        {renderSectionHeader('Recommended Hotels', () => (router.push as any)({ pathname: '/(tabs)/HotelListings', params: { city: selectedCity } }))}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.horizontalList}
          data={hotels}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={s.cardLarge} onPress={() => (router.push as any)({ pathname: '/more/hotel', params: { id: item.id } })}>
               <ExpoImage source={{ uri: item.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=400' }} style={s.cardLargeImg} contentFit="cover" />
               <View style={s.cardLargeContent}>
                  <Text style={s.cardLargeTitle} numberOfLines={1}>{item.name}</Text>
                  <Text style={s.cardLargeSub} numberOfLines={1}>{item.location}</Text>
                  <View style={s.cardLargeRow}>
                    <View style={s.ratingPill}>
                      <Ionicons name="star" size={10} color={C.white} />
                      <Text style={s.ratingText}>{item.rating.toFixed(1)}</Text>
                    </View>
                    <Text style={s.cardLargePrice}>₹{item.pricePerNight.toLocaleString()} <Text style={s.cardLargePriceSub}>/night</Text></Text>
                  </View>
               </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<View style={s.emptyCompact}><Text style={s.emptyCompactText}>No hotels found.</Text></View>}
        />

        {/* 10. Nearby Rentals */}
        {renderSectionHeader('Nearby Rentals', () => (router.push as any)({ pathname: '/(tabs)/RentAVehicle', params: { city: selectedCity } }))}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.horizontalList}
          data={vehicles}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={s.cardLarge} onPress={() => (router.push as any)({ pathname: '/more/vehicle', params: { id: item.id } })}>
               <ExpoImage source={{ uri: item.image || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=400' }} style={s.cardLargeImg} contentFit="cover" />
               <View style={s.cardLargeContent}>
                  <Text style={s.cardLargeTitle} numberOfLines={1}>{item.name}</Text>
                  <Text style={s.cardLargeSub} numberOfLines={1}>{item.type}</Text>
                  <View style={s.cardLargeRow}>
                    <View style={s.ratingPill}>
                      <Ionicons name="star" size={10} color={C.white} />
                      <Text style={s.ratingText}>{item.rating.toFixed(1)}</Text>
                    </View>
                    <Text style={s.cardLargePrice}>₹{item.pricePerDay.toLocaleString()} <Text style={s.cardLargePriceSub}>/day</Text></Text>
                  </View>
               </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<View style={s.emptyCompact}><Text style={s.emptyCompactText}>No rentals found.</Text></View>}
        />

        {/* 9. Bottom Banner */}
        <View style={s.bottomBanner}>
          <View style={s.bottomBannerIcon}>
            <Ionicons name="people-outline" size={24} color={C.green} />
          </View>
          <View style={s.bottomBannerTextCol}>
            <Text style={s.bottomBannerTitle}>2,317 travelers are exploring this weekend.</Text>
            <Text style={s.bottomBannerSub}>Will you be one of them?</Text>
          </View>
          <TouchableOpacity style={s.exploreNowBtn}>
            <Text style={s.exploreNowText}>Explore Now</Text>
            <Ionicons name="arrow-forward" size={14} color={C.green} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ══ CITY SELECTOR MODAL ═══════════════════════════════════════════════ */}
      <Modal visible={showCity} animationType="slide" transparent={true} onRequestClose={() => setShowCity(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.cityModalOverlay}>
          <View style={s.cityRoot}>
            <View style={s.cityHandle} />
            <View style={s.cityHeader}>
              <View>
                <Text style={s.cityHeaderTitle}>Select Your City</Text>
                <Text style={s.cityHeaderSub}>Find guides and rentals near you</Text>
              </View>
              <TouchableOpacity style={s.cityCloseBtn} onPress={() => setShowCity(false)}>
                <Ionicons name="close" size={20} color={C.inkSoft} />
              </TouchableOpacity>
            </View>
            <View style={s.citySearchWrap}>
              <Ionicons name="search-outline" size={18} color={C.muted} style={{ marginLeft: 14 }} />
              <TextInput
                style={s.citySearchInput}
                placeholder="Search cities…"
                placeholderTextColor={C.mutedLight}
              />
            </View>
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
  root: { flex: 1, backgroundColor: C.base },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 16 },

  // Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTextCol: { flex: 1 },
  greeting: { fontSize: 22, fontWeight: '800', color: C.ink },
  greetingName: { color: C.green },
  subGreeting: { fontSize: 13, color: C.muted, marginTop: 4 },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtn: { position: 'relative' },
  badge: { position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 1, borderColor: C.base },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.border },

  // Search
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 20,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    height: 44,
  },
  searchInput: { flex: 1, fontSize: 13, color: C.ink, paddingHorizontal: 10 },
  citySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    height: 44,
    gap: 4,
  },
  cityText: { fontSize: 13, fontWeight: '600', color: C.ink, maxWidth: 80 },

  // Hero Banner
  heroBanner: {
    marginHorizontal: 16,
    height: 220,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 24,
  },
  heroTag: {
    position: 'absolute',
    top: 16, left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  heroTagText: { color: C.white, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  heroContent: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  heroTitle: { fontSize: 26, fontWeight: '900', color: C.white, marginBottom: 4 },
  heroSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 12 },
  facepileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  facepile: { flexDirection: 'row' },
  face: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: C.white },
  facepileText: { color: C.white, fontSize: 12, fontWeight: '600', marginLeft: 8 },
  heroBottomRow: { flexDirection: 'row', alignItems: 'baseline' },
  heroPrice: { fontSize: 20, fontWeight: '800', color: C.green },
  heroSeats: { fontSize: 12, fontWeight: '500', color: C.white, marginLeft: 8 },
  heroJoinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.green,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  heroJoinBtnText: { color: C.white, fontSize: 14, fontWeight: '700' },
  heroDots: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  heroDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  heroDotActive: { backgroundColor: C.white, width: 16 },

  // Sections
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: C.ink },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  seeAllText: { fontSize: 13, fontWeight: '700', color: C.green },

  // Explore
  exploreList: { paddingHorizontal: 16, gap: 16, paddingBottom: 24 },
  catItem: { alignItems: 'center', gap: 8, width: 64 },
  catIconBox: {
    width: 60, height: 60,
    borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  catItemLabel: { fontSize: 11, fontWeight: '600', color: C.ink, textAlign: 'center' },

  // Horizontal lists general
  horizontalList: { paddingHorizontal: 16, gap: 12, paddingBottom: 24 },
  favBtn: { position: 'absolute', top: 12, right: 12 },

  // Communities
  communityCard: {
    width: 160, height: 180,
    borderRadius: 20,
    overflow: 'hidden',
  },
  communityContent: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    padding: 12,
  },
  communityName: { color: C.white, fontSize: 14, fontWeight: '800', marginBottom: 8 },
  communityBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  communityMembers: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '500' },
  joinBtnSmall: {
    backgroundColor: C.green,
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 12,
  },
  joinBtnSmallText: { color: C.white, fontSize: 11, fontWeight: '700' },

  // Trending Trips
  tripCard: {
    width: 220, height: 140,
    borderRadius: 20,
    overflow: 'hidden',
  },
  tripDateBadge: {
    position: 'absolute', top: 12, left: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8,
  },
  tripDateText: { color: C.white, fontSize: 10, fontWeight: '700' },
  tripContent: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 12,
  },
  tripName: { color: C.white, fontSize: 16, fontWeight: '800', marginBottom: 2 },
  tripSub: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginBottom: 8 },
  tripBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  facepileSmall: { flexDirection: 'row' },
  faceSmall: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: C.white },
  tripCapacity: { color: C.white, fontSize: 11, fontWeight: '600', marginLeft: 6 },
  tripPrice: { color: C.white, fontSize: 14, fontWeight: '800' },

  // Official Trips
  officialCard: {
    width: SW - 64,
    height: 160,
    borderRadius: 24,
    overflow: 'hidden',
  },
  officialContent: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    padding: 16,
    justifyContent: 'space-between',
  },
  officialBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#3B82F6',
    alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8,
  },
  officialBadgeText: { color: C.white, fontSize: 10, fontWeight: '800' },
  officialBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  officialTitle: { color: C.white, fontSize: 18, fontWeight: '800', marginBottom: 2 },
  officialSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  officialPrice: { color: C.white, fontSize: 16, fontWeight: '800', marginBottom: 6 },
  viewTripBtn: { backgroundColor: C.white, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16 },
  viewTripBtnText: { color: C.ink, fontSize: 12, fontWeight: '700' },

  // Horizontal Cards
  cardLarge: {
    width: 200,
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 8,
    borderWidth: 1, borderColor: C.border,
    ...SHADOW.sm,
  },
  cardLargeImg: { width: '100%', height: 120, borderRadius: 12, marginBottom: 12 },
  cardLargeContent: { gap: 4, paddingHorizontal: 4, paddingBottom: 4 },
  cardLargeTitle: { fontSize: 15, fontWeight: '800', color: C.ink },
  cardLargeSub: { fontSize: 12, color: C.muted, marginBottom: 4 },
  cardLargeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  ratingPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#10B981', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, gap: 2 },
  ratingText: { color: C.white, fontSize: 10, fontWeight: '700' },
  cardLargePrice: { fontSize: 14, fontWeight: '800', color: C.ink },
  cardLargePriceSub: { fontSize: 10, fontWeight: '500', color: C.muted },
  
  emptyCompact: { width: SW - 32, height: 140, alignItems: 'center', justifyContent: 'center', backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border },
  emptyCompactText: { fontSize: 12, color: C.muted },

  // Bottom Banner
  bottomBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    backgroundColor: C.greenTint,
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  bottomBannerIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.greenLight, alignItems: 'center', justifyContent: 'center' },
  bottomBannerTextCol: { flex: 1 },
  bottomBannerTitle: { fontSize: 13, fontWeight: '700', color: C.ink, marginBottom: 2 },
  bottomBannerSub: { fontSize: 11, color: C.muted },
  exploreNowBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.surface, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: C.greenLight },
  exploreNowText: { fontSize: 12, fontWeight: '700', color: C.green },

  // City Modal
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
    backgroundColor: C.base,
    alignItems: 'center', justifyContent: 'center',
  },
  citySearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.base,
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
    backgroundColor: C.base,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 14,
  },
  cityListItemIconActive: { backgroundColor: C.green },
  cityListItemName: { flex: 1, fontSize: 16, fontWeight: '600', color: C.ink },
  cityListItemNameActive: { color: C.greenDark, fontWeight: '700' },
});