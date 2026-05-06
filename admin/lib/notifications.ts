'use server';

import { supabaseAdmin } from './supabase-server';

import * as admin from 'firebase-admin';
import path from 'path';

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    const serviceAccountPath = path.resolve(
      process.cwd(),
      'guidemyroute-77af8-firebase-adminsdk-fbsvc-67e173961a.json'
    );
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath),
    });
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

async function sendFCMPush(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ successCount: number; failureCount: number; invalidTokens: string[] }> {
  if (!tokens.length) return { successCount: 0, failureCount: 0, invalidTokens: [] };

  try {
    const message = {
      notification: { title, body },
      data: data || {},
      tokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    const invalidTokens: string[] = [];

    response.responses.forEach((res, index) => {
      if (!res.success) {
        const errorCode = res.error?.code;
        if (
          errorCode === 'messaging/invalid-registration-token' ||
          errorCode === 'messaging/registration-token-not-registered'
        ) {
          invalidTokens.push(tokens[index]);
        }
      }
    });

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      invalidTokens,
    };
  } catch (error) {
    console.error('FCM push send error:', error);
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

    const result = await sendFCMPush(tokens, title, body, data);

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

