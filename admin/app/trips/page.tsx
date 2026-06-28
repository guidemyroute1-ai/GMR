import { getTrips } from '@/lib/tripsData';
import TripsClient from './TripsClient';

export const revalidate = 0;

export default async function TripsPage() {
  const trips = await getTrips();
  return <TripsClient trips={trips} />;
}
