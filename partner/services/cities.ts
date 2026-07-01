import { supabase } from './supabase';

export const DEFAULT_CITIES = ['Rishikesh', 'Manali', 'Delhi'];

export function normalizeCity(value: unknown) {
  return String(value || '').trim().split(',')[0]?.trim() || '';
}

let cachedCities: string[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function fetchAvailableCities() {
  const now = Date.now();
  if (cachedCities && now - lastFetchTime < CACHE_TTL) {
    return cachedCities;
  }

  const { data, error } = await supabase
    .from('app_settings')
    .select('available_cities')
    .eq('id', 1)
    .maybeSingle();

  if (error) {
    console.warn('Unable to load city options:', error.message);
    return cachedCities || DEFAULT_CITIES;
  }

  const cities = Array.isArray(data?.available_cities)
    ? data.available_cities.map(normalizeCity).filter(Boolean)
    : [];

  const result = cities.length ? Array.from(new Set(cities)) : DEFAULT_CITIES;
  
  cachedCities = result;
  lastFetchTime = now;
  
  return result;
}
