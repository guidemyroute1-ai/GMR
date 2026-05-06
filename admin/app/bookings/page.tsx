import { getBookings } from '@/lib/data';
import BookingsClient from './BookingsClient';

export const dynamic = 'force-dynamic';

export default async function BookingsPage() {
  const bookings = await getBookings();
  return <BookingsClient bookings={bookings} />;
}
