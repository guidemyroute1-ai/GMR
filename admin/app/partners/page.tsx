import { getPartners } from '@/lib/data';
import PartnersClient from './PartnersClient';

export const revalidate = 60; // revalidate at most every 60 seconds

export default async function PartnersPage() {
  const partners = await getPartners();
  
  return <PartnersClient partners={partners} />;
}
