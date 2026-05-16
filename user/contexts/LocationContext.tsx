import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, AppState, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../components/Text';
import { useAuth } from './AuthContext';
import { DEFAULT_CITIES, fetchAvailableCities, normalizeCity } from '../utils/cities';
import { supabase } from '../utils/supabase';

const LOCATION_STORAGE_PREFIX = 'gmr:selectedCity:';

const COLORS = {
  primary: '#16A34A',
  white: '#FFFFFF',
  lightGray: '#F1F5F9',
  darkGray: '#1F2937',
  mediumGray: '#6B7280',
  borderGray: '#E2E8F0',
};

interface LocationContextValue {
  cityOptions: string[];
  selectedCity: string;
  loadingLocation: boolean;
  setSelectedCity: (city: string) => Promise<void>;
}

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

function getStorageKey(userId: string) {
  return `${LOCATION_STORAGE_PREFIX}${userId}`;
}

function pickSupportedCity(value: unknown, options: string[]) {
  const city = normalizeCity(value);
  return options.includes(city) ? city : '';
}

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [cityOptions, setCityOptions] = useState<string[]>(DEFAULT_CITIES);
  const [selectedCity, setSelectedCityState] = useState('');
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [savingCity, setSavingCity] = useState(false);

  const applyCityOptions = useCallback((options: string[]) => {
    setCityOptions(options);
  }, []);

  const refreshCityOptions = useCallback(async () => {
    const options = await fetchAvailableCities();
    applyCityOptions(options);
    return options;
  }, [applyCityOptions]);

  useEffect(() => {
    let active = true;

    async function loadLocation() {
      if (loading) return;

      if (!user?.uid) {
        setSelectedCityState('');
        setShowLocationPrompt(false);
        setLoadingLocation(false);
        return;
      }

      setLoadingLocation(true);

      const options = await refreshCityOptions();
      if (!active) return;

      const [{ data: profile }, storedCity] = await Promise.all([
        supabase
          .from('users')
          .select('city, profile_data')
          .eq('id', user.uid)
          .maybeSingle(),
        AsyncStorage.getItem(getStorageKey(user.uid)),
      ]);

      if (!active) return;

      const profileData = profile?.profile_data || {};
      const savedCity =
        pickSupportedCity(profile?.city, options) ||
        pickSupportedCity(profileData.city, options) ||
        pickSupportedCity(profileData.location, options) ||
        pickSupportedCity(storedCity, options);

      setSelectedCityState(savedCity);
      setShowLocationPrompt(!savedCity);
      setLoadingLocation(false);
    }

    loadLocation().catch((error) => {
      console.warn('Unable to load user location:', error.message);
      if (!active) return;
      setSelectedCityState('');
      setShowLocationPrompt(Boolean(user?.uid));
      setLoadingLocation(false);
    });

    return () => {
      active = false;
    };
  }, [loading, refreshCityOptions, user?.uid]);

  useEffect(() => {
    if (!user?.uid || !selectedCity || cityOptions.includes(selectedCity)) return;
    setSelectedCityState('');
    setShowLocationPrompt(true);
  }, [cityOptions, selectedCity, user?.uid]);

  useEffect(() => {
    if (!user?.uid) return undefined;

    const channel = supabase
      .channel('app-settings-location')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_settings', filter: 'id=eq.1' },
        (payload) => {
          const next = payload.new as { available_cities?: unknown } | null;
          const nextCities = Array.isArray(next?.available_cities)
            ? next.available_cities.map(normalizeCity).filter(Boolean)
            : [];

          if (nextCities.length) {
            applyCityOptions(Array.from(new Set(nextCities)));
          } else {
            refreshCityOptions();
          }
        }
      )
      .subscribe();

    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshCityOptions();
    });

    return () => {
      appStateSubscription.remove();
      supabase.removeChannel(channel);
    };
  }, [applyCityOptions, refreshCityOptions, user?.uid]);

  const setSelectedCity = useCallback(async (city: string) => {
    if (!user?.uid) return;

    const normalizedCity = normalizeCity(city);
    if (!normalizedCity) return;

    setSavingCity(true);
    setSelectedCityState(normalizedCity);
    setShowLocationPrompt(false);

    try {
      await AsyncStorage.setItem(getStorageKey(user.uid), normalizedCity);

      const { data: profile } = await supabase
        .from('users')
        .select('profile_data')
        .eq('id', user.uid)
        .maybeSingle();

      const profileData = profile?.profile_data || {};
      const { error } = await supabase
        .from('users')
        .update({
          city: normalizedCity,
          profile_data: {
            ...profileData,
            city: normalizedCity,
            location: normalizedCity,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.uid);

      if (error) throw error;
    } catch (error: any) {
      console.warn('Unable to save user location:', error.message);
    } finally {
      setSavingCity(false);
    }
  }, [user?.uid]);

  const value = useMemo<LocationContextValue>(() => ({
    cityOptions,
    selectedCity,
    loadingLocation,
    setSelectedCity,
  }), [cityOptions, loadingLocation, selectedCity, setSelectedCity]);

  return (
    <LocationContext.Provider value={value}>
      {children}
      <Modal visible={showLocationPrompt} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.iconWrap}>
              <Ionicons name="location" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.title}>Choose your location</Text>
            <Text style={styles.subtitle}>Select a city to show nearby guides, hotels, and vehicles.</Text>

            <View style={styles.options}>
              {cityOptions.map((city) => (
                <TouchableOpacity
                  key={city}
                  style={styles.option}
                  activeOpacity={0.85}
                  disabled={savingCity}
                  onPress={() => setSelectedCity(city)}
                >
                  <Text style={styles.optionText}>{city}</Text>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.mediumGray} />
                </TouchableOpacity>
              ))}
            </View>

            {savingCity && (
              <View style={styles.savingRow}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.savingText}>Saving location...</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used inside LocationProvider');
  return ctx;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,23,42,0.45)',
    paddingHorizontal: 24,
  },
  sheet: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    padding: 20,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCFCE7',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.darkGray,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.mediumGray,
  },
  options: {
    marginTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.borderGray,
  },
  option: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.borderGray,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.darkGray,
  },
  savingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  savingText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.mediumGray,
  },
});
