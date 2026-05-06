import { getListings } from '@/lib/data';
import ListingsClient from './ListingsClient';

export const dynamic = 'force-dynamic';

export default async function ListingsPage() {
  const listings = await getListings();
  
  return <ListingsClient listings={listings} />;
}
