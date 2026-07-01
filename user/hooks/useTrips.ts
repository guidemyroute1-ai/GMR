import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from '../contexts/LocationContext';

export interface TripOrganizer {
  name: string;
  photo_url?: string;
  rating?: number;
}

export interface DayPlan {
  day: number;
  title: string;
  activities: string;
  accommodation?: string;
  meals?: string;
}

export interface Trip {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  trip_type: 'official' | 'community' | 'last_minute';
  category?: string;
  interests: string[];
  trip_date: string;
  end_date?: string;
  price: number;
  original_price?: number;
  capacity: number;
  joined_count: number;
  city?: string;
  location_text?: string;
  meeting_lat?: number;
  meeting_lng?: number;
  difficulty?: 'Easy' | 'Moderate' | 'Hard';
  what_to_bring?: string;
  day_plans?: DayPlan[];
  images: string[];
  is_active: boolean;
  is_featured: boolean;
  date_badge_color?: string;
  includes?: string;
  rating?: number;
  review_count?: number;
  chat_room_id?: string;
  created_at: string;
  organizer?: TripOrganizer;
}

export interface TripsData {
  featuredTrips: Trip[];
  weekendTrips: Trip[];
  officialTrips: Trip[];
  communityTrips: Trip[];
  nearbyTrips: Trip[];
  lastMinuteTrips: Trip[];
  upcomingTrip: Trip | null;
}

export function useTrips() {
  const { user } = useAuth();
  const { selectedCity } = useLocation();

  const [data, setData] = useState<TripsData>({
    featuredTrips: [],
    weekendTrips: [],
    officialTrips: [],
    communityTrips: [],
    nearbyTrips: [],
    lastMinuteTrips: [],
    upcomingTrip: null,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const now = new Date().toISOString();
    const weekEnd = new Date(Date.now() + 7 * 864e5).toISOString();

    try {
      const [
        featuredRes,
        weekendRes,
        officialRes,
        communityRes,
        nearbyRes,
        lastMinuteRes,
        upcomingRes,
      ] = await Promise.all([
        supabase
          .from('trips')
          .select('*, organizer:organizer_id(name, photo_url, rating)')
          .eq('is_featured', true)
          .eq('is_active', true)
          .gte('trip_date', now)
          .limit(5),
        supabase
          .from('trips')
          .select('*, organizer:organizer_id(name, photo_url, rating)')
          .gte('trip_date', now)
          .lte('trip_date', weekEnd)
          .eq('is_active', true)
          .order('trip_date')
          .limit(5),
        supabase
          .from('trips')
          .select('*, organizer:organizer_id(name, photo_url, rating)')
          .eq('trip_type', 'official')
          .eq('is_active', true)
          .gte('trip_date', now)
          .limit(3),
        supabase
          .from('trips')
          .select('*, organizer:organizer_id(name, photo_url, rating)')
          .eq('trip_type', 'community')
          .eq('is_active', true)
          .gte('trip_date', now)
          .order('created_at', { ascending: false })
          .limit(6),
        selectedCity
          ? supabase
              .from('trips')
              .select('*, organizer:organizer_id(name, photo_url, rating)')
              .eq('city', selectedCity)
              .eq('is_active', true)
              .gte('trip_date', now)
              .limit(4)
          : Promise.resolve({ data: [] }),
        supabase
          .from('trips')
          .select('*, organizer:organizer_id(name, photo_url, rating)')
          .eq('trip_type', 'last_minute')
          .eq('is_active', true)
          .gte('trip_date', now)
          .limit(4),
        user
          ? supabase
              .from('trip_participants')
              .select('trip:trip_id(*, organizer:organizer_id(name, photo_url, rating))')
              .eq('user_id', user.id)
              .gte('trip.trip_date', now)
              .order('trip(trip_date)')
              .limit(1)
          : Promise.resolve({ data: null }),
      ]);

      setData({
        featuredTrips: (featuredRes.data || []) as any as Trip[],
        weekendTrips: (weekendRes.data || []) as any as Trip[],
        officialTrips: (officialRes.data || []) as any as Trip[],
        communityTrips: (communityRes.data || []) as any as Trip[],
        nearbyTrips: (nearbyRes.data || []) as any as Trip[],
        lastMinuteTrips: (lastMinuteRes.data || []) as any as Trip[],
        upcomingTrip: upcomingRes.data && upcomingRes.data.length > 0 
          ? ((upcomingRes.data[0] as any).trip as any as Trip) 
          : null,
      });
    } catch (error) {
      console.error('Error fetching trips:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, selectedCity]);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  return { ...data, loading, refreshing, refresh };
}
