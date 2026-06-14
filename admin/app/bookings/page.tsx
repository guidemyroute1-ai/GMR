import { getBookings } from '@/lib/data';
import BookingsClient from './BookingsClient';

export const revalidate = 60; // revalidate at most every 60 seconds

export default async function BookingsPage() {
  const bookings = await getBookings();
  return <BookingsClient bookings={bookings} />;
}
