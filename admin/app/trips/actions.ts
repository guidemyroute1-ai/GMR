'use server';

import { revalidatePath } from 'next/cache';
import { deleteTrip, toggleFeatured, approveTrip } from '@/lib/tripsData';

export async function deleteTripAction(tripId: string) {
  try {
    await deleteTrip(tripId);
    revalidatePath('/trips');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleFeaturedAction(tripId: string, currentStatus: boolean) {
  try {
    await toggleFeatured(tripId, currentStatus);
    revalidatePath('/trips');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function approveTripAction(tripId: string, currentStatus: boolean) {
  try {
    await approveTrip(tripId, currentStatus);
    revalidatePath('/trips');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
