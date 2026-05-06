'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function approvePartner(id: string) {
  try {
    const { error } = await supabaseAdmin.from('users').update({ is_approved: true }).eq('id', id);
    if (error) throw error;
    revalidatePath('/partners');
    revalidatePath(`/partners/${id}`);
    return { success: true };
  } catch (error) {
    console.error('Error approving partner:', error);
    return { success: false, error: 'Failed to approve partner' };
  }
}

export async function rejectPartner(id: string) {
  try {
    const { error } = await supabaseAdmin.from('users').update({ is_approved: false }).eq('id', id);
    if (error) throw error;
    revalidatePath('/partners');
    revalidatePath(`/partners/${id}`);
    return { success: true };
  } catch (error) {
    console.error('Error rejecting partner:', error);
    return { success: false, error: 'Failed to reject partner' };
  }
}
