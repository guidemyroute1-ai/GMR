import { getPartners } from '@/lib/data';
import PartnersClient from './PartnersClient';

export const dynamic = 'force-dynamic';

export default async function PartnersPage() {
  const partners = await getPartners();
  
  return <PartnersClient partners={partners} />;
}
