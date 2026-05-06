'use server';

import { supabaseAdmin } from './supabase-server';

type ExpoTicket = {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
};

async function sendExpoPush(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ successCount: number; failureCount: number; invalidTokens: string[] }> {
  if (!tokens.length) return { successCount: 0, failureCount: 0, invalidTokens: [] };

  const messages = tokens.map((to) => ({
    to,
    sound: 'default',
    title,
    body,
    data: data || {},
  }));

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const json = await response.json();
    const tickets = (json?.data || []) as ExpoTicket[];
    const invalidTokens: string[] = [];
    let successCount = 0;
    let failureCount = 0;

    tickets.forEach((ticket, index) => {
      if (ticket.status === 'ok') {
        successCount += 1;
      } else {
        failureCount += 1;
        if (ticket.details?.error === 'DeviceNotRegistered') {
          invalidTokens.push(tokens[index]);
        }
      }
    });

    return { successCount, failureCount, invalidTokens };
  } catch (error) {
    console.error('Expo push send error:', error);
    return { successCount: 0, failureCount: tokens.length, invalidTokens: [] };
  }
}

export async function sendNotificationToUser(
  uid: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ success: boolean; sent: number; failed: number }> {
  try {
    const { data: rows, error } = await supabaseAdmin
      .from('push_tokens')
      .select('token')
      .eq('user_id', uid);

    if (error) throw error;

    const tokens = [...new Set((rows || []).map((row) => row.token).filter(Boolean))];

    if (!tokens.length) {
      const { data: userRow } = await supabaseAdmin
        .from('users')
        .select('fcm_tokens')
        .eq('id', uid)
        .maybeSingle();
      tokens.push(...(userRow?.fcm_tokens || []));
    }

    if (!tokens.length) return { success: true, sent: 0, failed: 0 };

    const result = await sendExpoPush(tokens, title, body, data);

    if (result.invalidTokens.length > 0) {
      await supabaseAdmin.from('push_tokens').delete().in('token', result.invalidTokens);
      const validTokens = tokens.filter((token) => !result.invalidTokens.includes(token));
      await supabaseAdmin.from('users').update({ fcm_tokens: validTokens }).eq('id', uid);
    }

    return { success: true, sent: result.successCount, failed: result.failureCount };
  } catch (error) {
    console.error('Error sending notification:', error);
    return { success: false, sent: 0, failed: 0 };
  }
}

export async function sendNotificationToUsers(
  uids: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ totalSent: number; totalFailed: number }> {
  let totalSent = 0;
  let totalFailed = 0;

  for (const uid of uids) {
    const result = await sendNotificationToUser(uid, title, body, data);
    totalSent += result.sent;
    totalFailed += result.failed;
  }

  return { totalSent, totalFailed };
}

export async function sendNotificationToRole(
  role: 'user' | 'guide' | 'hotel' | 'rental',
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ totalSent: number; totalFailed: number }> {
  try {
    const { data: rows, error } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('role', role);

    if (error) throw error;

    return sendNotificationToUsers((rows || []).map((row) => row.id), title, body, data);
  } catch (error) {
    console.error('Error sending role notification:', error);
    return { totalSent: 0, totalFailed: 0 };
  }
}

export async function notifyPartnerNewBooking(
  partnerId: string,
  bookingDetails: { guestName: string; itemName: string; date: string }
) {
  return sendNotificationToUser(
    partnerId,
    'New booking',
    `${bookingDetails.guestName} booked "${bookingDetails.itemName}" for ${bookingDetails.date}`,
    { type: 'new_booking', screen: 'bookings' }
  );
}

export async function notifyUserBookingConfirmed(
  userId: string,
  bookingDetails: { itemName: string; date: string }
) {
  return sendNotificationToUser(
    userId,
    'Booking confirmed',
    `Your booking for "${bookingDetails.itemName}" on ${bookingDetails.date} has been confirmed.`,
    { type: 'booking_confirmed', screen: 'bookings' }
  );
}

export async function notifyUserBookingCancelled(
  userId: string,
  bookingDetails: { itemName: string }
) {
  return sendNotificationToUser(
    userId,
    'Booking cancelled',
    `Your booking for "${bookingDetails.itemName}" has been cancelled.`,
    { type: 'booking_cancelled', screen: 'bookings' }
  );
}

export async function notifyPartnerApproved(partnerId: string) {
  return sendNotificationToUser(
    partnerId,
    'Account approved',
    'Your partner account has been approved. You can now create listings and receive bookings.',
    { type: 'account_approved', screen: 'home' }
  );
}

