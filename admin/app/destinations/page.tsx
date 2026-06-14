import { supabaseAdmin } from '@/lib/supabase-server';
import DestinationsClient from './DestinationsClient';

export const revalidate = 60; // revalidate at most every 60 seconds

export default async function DestinationsPage() {
  const { data: destinations, error } = await supabaseAdmin
    .from('popular_destinations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching destinations:', error);
  }

  return <DestinationsClient destinations={destinations ?? []} />;
}
