import { supabase } from './supabase';

export const DEFAULT_CITIES = ['Rishikesh', 'Manali', 'Delhi'];

export function normalizeCity(value: unknown) {
  return String(value || '').trim().split(',')[0]?.trim() || '';
}

export async function fetchAvailableCities() {
  const { data, error } = await supabase
    .from('app_settings')
    .select('available_cities')
    .eq('id', 1)
    .maybeSingle();

  if (error) {
    console.warn('Unable to load city options:', error.message);
    return DEFAULT_CITIES;
  }

  const cities = Array.isArray(data?.available_cities)
    ? data.available_cities.map(normalizeCity).filter(Boolean)
    : [];

  return cities.length ? Array.from(new Set(cities)) : DEFAULT_CITIES;
}
