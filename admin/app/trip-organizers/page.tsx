import { getTripOrganizerApplications } from '@/lib/tripOrganizersData';
import OrganizersClient from './OrganizersClient';

export const revalidate = 0; 

export default async function TripOrganizersPage() {
  const applications = await getTripOrganizerApplications();
  return <OrganizersClient applications={applications} />;
}
