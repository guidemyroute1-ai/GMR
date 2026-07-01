import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView as SafeAreaContextView } from 'react-native-safe-area-context';
import ScreenHeader from '../../components/ScreenHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Text } from '../../components/Text';
import { useLocation } from '../../contexts/LocationContext';
import { DEFAULT_CITIES, fetchAvailableCities, normalizeCity } from '../../utils/cities';
import { supabase } from '../../utils/supabase';


// ─── Design Tokens ─────────────────────────────────────────────────────────────
const C = {
  green:       '#16A34A',
  greenDark:   '#14532D',
  greenLight:  '#DCFCE7',
  greenTint:   '#F0FDF4',
  ink:         '#0F172A',
  inkMid:      '#374151',
  muted:       '#6B7280',
  mutedLight:  '#9CA3AF',
  border:      '#E2E8F0',
  borderLight: '#F1F5F9',
  surface:     '#FFFFFF',
  base:        '#EEF2EF',
  amber:       '#F59E0B',
  amberLight:  '#FEF3C7',
  sky:         '#0EA5E9',
  skyLight:    '#E0F2FE',
  coral:       '#F97316',
  coralLight:  '#FFF7ED',
  rose:        '#F43F5E',
  roseLight:   '#FFF1F2',
  gold:        '#FBBF24',
  white:       '#FFFFFF',
};

const SHADOW = {
  xs: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  sm: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.09, shadowRadius: 8, elevation: 3 },
  md: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 14, elevation: 6 },
  green: { shadowColor: '#16A34A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.30, shadowRadius: 10, elevation: 6 },
};


// ─── Types ─────────────────────────────────────────────────────────────────────
interface FeatureTag {
  label: string;
  color: string;
}

interface Vehicle {
  id: string;
  name: string;
  type: string;
  rating: number;
  reviews: number;
  pricePerDay: number;
  emoji: string;
  tags: FeatureTag[];
  image?: string;
  fuelType?: string;
  helmet?: string;
  minDuration?: string;
  deposit?: string;
  vehicleMake?: string;
  city?: string;
}

const FILTER_TABS = ['All', 'Scooty', 'Bike', 'Car'];


const normalizeVehicleType = (...values: unknown[]) => {
  const text = values
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (text.includes('car') || text.includes('cab') || text.includes('taxi')) return 'Car';
  if (text.includes('scoot') || text.includes('activa') || text.includes('moped')) return 'Scooty';
  return 'Bike';
};


// ─── Filter Header ─────────────────────────────────────────────────────────────
const FilterHeader = ({
  cityOptions, activeCity, onCityChange,
  activeTab, onTabChange,
  uniqueMakes, activeMake, onMakeChange,
}: {
  cityOptions: string[];
  activeCity: string;
  onCityChange: (c: string) => void;
  activeTab: string;
  onTabChange: (t: string) => void;
  uniqueMakes: string[];
  activeMake: string;
  onMakeChange: (m: string) => void;
}) => (
  <View style={styles.filterBox}>
    {/* City pills */}
    <View style={styles.cityRow}>
      <MaterialCommunityIcons name="map-marker-outline" size={15} color={C.green} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cityScroll}>
        {cityOptions.map((city) => {
          const active = activeCity === city;
          return (
            <TouchableOpacity
              key={city}
              style={[styles.cityPill, active && styles.cityPillActive]}
              onPress={() => onCityChange(city)}
              activeOpacity={0.75}
            >
              <Text style={[styles.cityPillTxt, active && styles.cityPillTxtActive]}>{city}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>

    {/* Segmented type control */}
    <View style={styles.segmentWrap}>
      <View style={styles.segment}>
        {FILTER_TABS.map((tab) => {
          const active = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.segmentItem, active && styles.segmentItemActive]}
              onPress={() => onTabChange(tab)}
              activeOpacity={0.75}
            >
              <Text style={[styles.segmentTxt, active && styles.segmentTxtActive]}>{tab}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>

    {/* Make row (conditional) */}
    {uniqueMakes.length > 1 && (
      <View style={styles.makeRow}>
        <MaterialCommunityIcons name="tune-variant" size={13} color={C.muted} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.makeScroll}>
          {uniqueMakes.map((make) => {
            const active = activeMake === make;
            return (
              <TouchableOpacity
                key={make}
                style={[styles.makePill, active && styles.makePillActive]}
                onPress={() => onMakeChange(make)}
                activeOpacity={0.75}
              >
                <Text style={[styles.makePillTxt, active && styles.makePillTxtActive]}>
                  {make === 'All' ? 'All Makes' : make}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    )}
  </View>
);
// ─── Vehicle Card ──────────────────────────────────────────────────────────────
const VehicleCard = ({ vehicle }: { vehicle: Vehicle }) => {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => router.push({ pathname: '/more/vehicle', params: { id: vehicle.id } })}
    >
      <View style={styles.cardContent}>
        <View style={styles.vehicleImagePlaceholder}>
          {vehicle.image ? (
            <Image source={{ uri: vehicle.image }} style={styles.vehicleImage} />
          ) : (
            <Text style={styles.vehicleEmoji}>{vehicle.emoji}</Text>
          )}
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.vehicleName} numberOfLines={1}>
            {vehicle.name}
          </Text>

          <View style={styles.ratingChip}>
            <Text style={styles.starIcon}>⭐</Text>
            <Text style={styles.ratingValue}>{Number(vehicle.rating || 0).toFixed(1)}</Text>
            <Text style={styles.ratingCount}>({vehicle.reviews || 0})</Text>
          </View>

          <View style={styles.detailsGrid}>
            {vehicle.fuelType && (
              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="gas-station" size={14} color={C.muted} />
                <Text style={styles.detailText}>{vehicle.fuelType}</Text>
              </View>
            )}
            {vehicle.helmet && (
              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="racing-helmet" size={14} color={C.muted} />
                <Text style={styles.detailText}>{vehicle.helmet}</Text>
              </View>
            )}
            {vehicle.minDuration && (
              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="clock-outline" size={14} color={C.muted} />
                <Text style={styles.detailText}>{vehicle.minDuration}</Text>
              </View>
            )}
            {vehicle.deposit && (
              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="shield-check-outline" size={14} color={C.muted} />
                <Text style={styles.detailText}>{vehicle.deposit}</Text>
              </View>
            )}
          </View>

          <View style={styles.cardFooter}>
            <View>
              <Text style={styles.priceValue}>₹{vehicle.pricePerDay}</Text>
              <Text style={styles.perDay}>per day</Text>
            </View>

            <View style={styles.bookNowBtn}>
              <Text style={styles.bookNowText}>View Details</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};


const DeliveryBanner = () => {
  return (
    <TouchableOpacity style={styles.bannerContainer} activeOpacity={0.9}>
      <View style={styles.bannerTextContainer}>
        <Text style={styles.bannerTitle}>Free delivery to your location</Text>
        <Text style={styles.bannerSubtitle}>We'll deliver your vehicle{'\n'}wherever you are!</Text>
      </View>

      <View style={styles.bannerRightContent}>
        <Image
          source={require('../../assets/images/delivery_scooter_1779357500492.png')}
          style={styles.bannerImage}
          resizeMode="contain"
        />

      </View>
    </TouchableOpacity>
  );
};
// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function RentAVehicleScreen() {
  const { filter, city } = useLocalSearchParams<{ filter?: string; city?: string }>();
  const { selectedCity, setSelectedCity } = useLocation();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(
    FILTER_TABS.includes(filter ?? '') ? (filter as string) : 'All'
  );
  const [activeMake, setActiveMake] = useState('All');
  const [activeFuel, setActiveFuel] = useState('All');
  const [cityOptions, setCityOptions] = useState<string[]>(DEFAULT_CITIES);
  const [activeCity, setActiveCity] = useState(normalizeCity(city) || selectedCity || DEFAULT_CITIES[0]);
  const [refreshing, setRefreshing] = useState(false);



  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('type', 'rental')
        .eq('is_active', true);

      if (error) {
        console.error('Supabase Fetch Error:', error);
      } else {
        const mapRow = (doc: any): Vehicle => {
          const details = doc.details || {};
          const vehicleType = normalizeVehicleType(
            details.vehicleType,
            details.vehicleTypes,
            details.category,
            doc.title
          );
          return {
            id: doc.id,
            name: doc.title,
            type: vehicleType,
            rating: details.rating || 4.5,
            reviews: details.reviews || Math.floor(Math.random() * 50) + 10,
            pricePerDay: doc.price,
            emoji: doc.details?.emoji || (vehicleType === 'Car' ? '🚗' : vehicleType === 'Scooty' ? '🛵' : '🏍️'),
            image: doc.images?.[0],
            tags: details.tags || [{ label: 'Verified', color: '#10B981' }],
            fuelType: details.fuelType,
            helmet: details.helmet,
            minDuration: details.minDuration,
            deposit: details.deposit,
            vehicleMake: details.vehicleMake,
            city: normalizeCity(details.city || doc.location?.address || doc.location || details.address),
          };
        };
        setVehicles((data || []).map(mapRow));
      }
    } catch (err) {
      console.error('Unexpected error fetching vehicles:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    let active = true;
    fetchAvailableCities().then((cities) => {
      if (!active) return;
      setCityOptions(cities);
      setActiveCity((current) => cities.includes(current) ? current : cities[0] || '');
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const nextCity = normalizeCity(city) || selectedCity;
    if (nextCity) setActiveCity(nextCity);
  }, [city, selectedCity]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchVehicles();
  };

  const uniqueMakes = ['All', ...Array.from(new Set(
    vehicles.map(v => v.vehicleMake).filter(Boolean) as string[]
  )).sort()];

  const uniqueFuelTypes = ['All', ...Array.from(new Set(
    vehicles.map(v => v.fuelType).filter(Boolean) as string[]
  )).sort()];

  const filtered = vehicles.filter((v) => {
    if (activeCity && normalizeCity(v.city) !== activeCity) return false;
    if (activeTab !== 'All' && v.type !== activeTab) return false;
    if (activeMake !== 'All' && v.vehicleMake !== activeMake) return false;
    if (activeFuel !== 'All' && v.fuelType !== activeFuel) return false;
    return true;
  });



  return (
    <SafeAreaContextView edges={['top', 'bottom']} style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />
      <ScreenHeader 
        title="Rentals" 
        showLocation={true} 
        location={activeCity || 'Faridabad'} 
      />
      <FilterHeader
        cityOptions={cityOptions}
        activeCity={activeCity}
        onCityChange={(c) => { setActiveCity(c); setSelectedCity(c); }}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        uniqueMakes={uniqueMakes}
        activeMake={activeMake}
        onMakeChange={setActiveMake}
      />
      {loading ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.loaderContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={C.green}
              colors={[C.green]}
            />
          }
        >
          <LoadingSpinner size="large" color={C.green} />
          <Text style={styles.loaderText}>Finding best vehicles for you...</Text>
        </ScrollView>
      ) : filtered.length === 0 ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={C.green}
              colors={[C.green]}
            />
          }
        >
          <MaterialCommunityIcons name="car-off" size={60} color={C.muted} />
          <Text style={styles.emptyText}>No vehicles found</Text>
          <Text style={styles.emptySubText}>Try adjusting your filters</Text>
        </ScrollView>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <VehicleCard vehicle={item} />}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={C.green}
              colors={[C.green]}
            />
          }
        />
      )}

      {/* STICKY BANNER AT BOTTOM */}
      <View style={styles.bannerWrapper}>
        <DeliveryBanner />
      </View>
    </SafeAreaContextView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.borderLight,
  },

  // ── Filter Box ──
  filterBox: {
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingBottom: 10,
    ...SHADOW.xs,
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingTop: 10,
    paddingBottom: 4,
    gap: 8,
  },
  cityScroll: { paddingRight: 16, gap: 6, flexDirection: 'row' },
  cityPill: {
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: C.borderLight,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  cityPillActive: { backgroundColor: C.greenLight, borderColor: C.green },
  cityPillTxt: { fontSize: 12, fontWeight: '700', color: C.muted },
  cityPillTxtActive: { color: C.green },

  segmentWrap: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 2 },
  segment: {
    flexDirection: 'row',
    backgroundColor: C.borderLight,
    borderRadius: 12,
    padding: 3,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  segmentItemActive: { backgroundColor: C.surface, ...SHADOW.xs },
  segmentTxt: { fontSize: 13, fontWeight: '600', color: C.muted },
  segmentTxtActive: { fontSize: 13, fontWeight: '800', color: C.ink },

  makeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingTop: 8,
    gap: 8,
  },
  makeScroll: { paddingRight: 16, gap: 6, flexDirection: 'row' },
  makePill: {
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: C.borderLight,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  makePillActive: { backgroundColor: C.coralLight, borderColor: C.coral },
  makePillTxt: { fontSize: 11, fontWeight: '600', color: C.muted },
  makePillTxtActive: { color: C.coral },
  filterTabsContainer: {
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  cityFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingTop: 10,
  },
  cityTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 50,
    backgroundColor: C.borderLight,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  cityTabActive: {
    backgroundColor: C.greenLight,
    borderColor: C.green,
  },
  cityTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.muted,
  },
  cityTabTextActive: {
    color: C.green,
  },
  makeFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: C.borderLight,
  },
  makeFilterScroll: {
    flexDirection: 'row',
    gap: 6,
    paddingRight: 16,
  },
  makeTab: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 50,
    backgroundColor: C.borderLight,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  makeTabActive: {
    backgroundColor: C.coralLight,
    borderColor: C.coral,
  },
  makeTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.muted,
  },
  makeTabTextActive: {
    color: C.coral,
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
    backgroundColor: C.base,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  filterTabActive: {
    backgroundColor: C.greenLight,
    borderColor: C.green,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.muted,
  },
  filterTabTextActive: {
    color: C.green,
  },

  bannerWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 16,
    backgroundColor: 'transparent',
  },
  bannerContainer: {
    backgroundColor: '#d2faa5ff',
    borderRadius: 16,
    padding: 16,
    height: 120,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'visible',
  },
  bannerTextContainer: {
    flex: 1,
    zIndex: 2,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: C.green,
    marginBottom: 6,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  bannerRightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 110,
    justifyContent: 'flex-end',
  },
  bannerImage: {
    width: 100,
    height: 100,
    position: 'absolute',

    bottom: -50,
    zIndex: 1,
    borderRadius: 20,


  },
  bannerArrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.surface,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 12,
    fontSize: 16,
    color: C.muted,
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
    color: C.ink,
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: C.muted,
    marginTop: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 160,
    gap: 16,
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.borderLight,
    overflow: 'hidden',
    ...SHADOW.md,
  },
  cardContent: {
    flexDirection: 'row',
    padding: 12,
  },
  vehicleImagePlaceholder: {
    width: 110,
    height: 110,
    backgroundColor: C.borderLight,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.borderLight,
  },
  vehicleImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  vehicleEmoji: {
    fontSize: 48,
  },
  cardBody: {
    flex: 1,
    paddingLeft: 16,
    justifyContent: 'space-between',
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: '700',
    color: C.ink,
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  starIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: '700',
    color: C.ink,
  },
  ratingCount: {
    fontSize: 12,
    color: C.muted,
    marginLeft: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '800',
    color: C.green,
  },
  perDay: {
    fontSize: 12,
    color: C.muted,
    fontWeight: '500',
  },
  bookNowBtn: {
    backgroundColor: C.green,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  bookNowText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.surface,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.base,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  detailText: {
    fontSize: 11,
    color: C.ink,
    fontWeight: '500',
  },
});
