import { getListings } from '@/lib/data';
import ListingsClient from './ListingsClient';

export const revalidate = 60; // revalidate at most every 60 seconds

export default async function ListingsPage() {
  const listings = await getListings();
  
  return <ListingsClient listings={listings} />;
}
