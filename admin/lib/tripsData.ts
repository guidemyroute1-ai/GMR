import { supabaseAdmin } from './supabase-server';

export interface Trip {
  id: string;
  organizer_id: string;
  title: string;
  trip_type: string;
  trip_date: string;
  price: number;
  capacity: number;
  joined_count: number;
  is_active: boolean;
  is_featured: boolean;
  city: string;
  created_at: string;
  organizer: {
    name: string;
    email: string;
    phone: string;
  } | null;
}

export async function getTrips(): Promise<Trip[]> {
  const { data, error } = await supabaseAdmin
    .from('trips')
    .select(`
      id,
      organizer_id,
      title,
      trip_type,
      trip_date,
      price,
      capacity,
      joined_count,
      is_active,
      is_featured,
      city,
      created_at,
      organizer:users!organizer_id(
        name,
        email,
        phone
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching trips:', error);
    return [];
  }

  return (data || []) as unknown as Trip[];
}

export async function deleteTrip(tripId: string) {
  const { error } = await supabaseAdmin
    .from('trips')
    .delete()
    .eq('id', tripId);
    
  if (error) throw error;
  return true;
}

export async function toggleFeatured(tripId: string, currentStatus: boolean) {
  const { error } = await supabaseAdmin
    .from('trips')
    .update({ is_featured: !currentStatus })
    .eq('id', tripId);
    
  if (error) throw error;
  return true;
}
