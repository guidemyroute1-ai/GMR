import { getPartnerById } from '@/lib/data';
import PartnerDetailClient from './PartnerDetailClient';
import { notFound } from 'next/navigation';

export default async function PartnerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  if (!id) {
    notFound();
  }

  const partner = await getPartnerById(id);

  if (!partner) {
    notFound();
  }

  return <PartnerDetailClient partner={partner as any} />;
}
