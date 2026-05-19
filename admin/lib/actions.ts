'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from './supabase-server';

const DEFAULT_CITIES = ['Rishikesh', 'Manali', 'Delhi'];

async function ensureSettingsRow() {
  const { data, error } = await supabaseAdmin
    .from('app_settings')
    .select('service_fee_percentage, available_cities')
    .eq('id', 1)
    .maybeSingle();

  if (error) throw error;
  if (data) return data;

  const { data: created, error: createError } = await supabaseAdmin
    .from('app_settings')
    .upsert(
      { id: 1, service_fee_percentage: 5, available_cities: DEFAULT_CITIES },
      { onConflict: 'id' }
    )
    .select('service_fee_percentage, available_cities')
    .single();

  if (createError) throw createError;
  return created;
}

export async function deleteUser(uid: string) {
  try {
    // Delete from auth (Supabase Auth admin API)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(uid);
    if (authError) throw authError;

    // Delete from users table
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', uid);
    if (dbError) throw dbError;

    revalidatePath('/users');
    revalidatePath('/partners');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return { error: error.message };
  }
}

export async function approvePartner(uid: string) {
  try {
    const { error } = await supabaseAdmin
      .from('users')
      .update({ is_approved: true })
      .eq('id', uid);
    if (error) throw error;



    revalidatePath('/partners');
    return { success: true };
  } catch (error: any) {
    console.error('Error approving partner:', error);
    return { error: error.message };
  }
}

export async function deleteListing(id: string) {
  try {
    const { error } = await supabaseAdmin
      .from('listings')
      .delete()
      .eq('id', id);
    if (error) throw error;
    revalidatePath('/listings');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting listing:', error);
    return { error: error.message };
  }
}

export async function getSettings() {
  try {
    const data = await ensureSettingsRow();
    
    return {
      success: true,
      serviceFee: data?.service_fee_percentage || 5,
      cities: Array.isArray(data?.available_cities) ? data.available_cities : DEFAULT_CITIES,
    };
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    return { error: error.message };
  }
}

export async function updateServiceFee(fee: number) {
  try {
    const { error } = await supabaseAdmin
      .from('app_settings')
      .upsert({ id: 1, service_fee_percentage: fee }, { onConflict: 'id' });

    if (error) throw error;

    revalidatePath('/settings');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating service fee:', error);
    return { error: error.message };
  }
}

export async function updateAvailableCities(cities: string[]) {
  try {
    const cleanCities = Array.from(
      new Set(cities.map((city) => city.trim()).filter(Boolean))
    );

    const { error } = await supabaseAdmin
      .from('app_settings')
      .upsert({ id: 1, available_cities: cleanCities }, { onConflict: 'id' });

    if (error) throw error;

    revalidatePath('/settings');
    return { success: true, cities: cleanCities };
  } catch (error: any) {
    console.error('Error updating available cities:', error);
    return { error: error.message };
  }
}


export async function updateListing(
  id: string,
  data: {
    name: string;
    partner: string;
    category: string;
    location: string;
    price: string;
    status: string;
    details?: Record<string, any>;
  }
) {
  try {
    const priceNum = parseFloat(data.price.replace(/[^0-9.]/g, ''));
    const { error } = await supabaseAdmin
      .from('listings')
      .update({
        title: data.name,
        partner_id: data.partner,
        type: data.category.toLowerCase(),
        location: data.location,
        price: isNaN(priceNum) ? null : priceNum,
        is_active: data.status === 'active',
        details: data.details ?? {},
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (error) throw error;

    revalidatePath('/listings');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating listing:', error);
    return { error: error.message };
  }
}

export async function cancelBooking(id: string) {
  try {
    // Fetch booking details before cancelling for notification
    const { data: bookingData, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();
    if (fetchError) throw fetchError;

    const { error } = await supabaseAdmin
      .from('bookings')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (error) throw error;



    revalidatePath('/bookings');
    return { success: true };
  } catch (error: any) {
    console.error('Error canceling booking:', error);
    return { error: error.message };
  }
}

// ───────────────────────── Destinations ──────────────────────────

export async function addDestination(data: {
  name: string;
  state: string;
  image_url: string;
  is_popular: boolean;
}) {
  try {
    const { error } = await supabaseAdmin
      .from('popular_destinations')
      .insert([data]);
    if (error) throw error;
    revalidatePath('/destinations');
    return { success: true };
  } catch (error: any) {
    console.error('Error adding destination:', error);
    return { error: error.message };
  }
}

export async function deleteDestination(id: string) {
  try {
    const { error } = await supabaseAdmin
      .from('popular_destinations')
      .delete()
      .eq('id', id);
    if (error) throw error;
    revalidatePath('/destinations');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting destination:', error);
    return { error: error.message };
  }
}

export async function toggleDestinationPopular(id: string, is_popular: boolean) {
  try {
    const { error } = await supabaseAdmin
      .from('popular_destinations')
      .update({ is_popular })
      .eq('id', id);
    if (error) throw error;
    revalidatePath('/destinations');
    return { success: true };
  } catch (error: any) {
    console.error('Error toggling destination:', error);
    return { error: error.message };
  }
}
