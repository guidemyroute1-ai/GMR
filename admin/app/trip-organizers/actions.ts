'use server';

import { revalidatePath } from 'next/cache';
import { approveOrganizer, rejectOrganizer } from '@/lib/tripOrganizersData';

export async function approveOrganizerAction(applicationId: string, userId: string) {
  try {
    await approveOrganizer(applicationId, userId);
    revalidatePath('/trip-organizers');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function rejectOrganizerAction(applicationId: string) {
  try {
    await rejectOrganizer(applicationId);
    revalidatePath('/trip-organizers');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
