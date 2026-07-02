import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import * as ExpoNotifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import { Router } from 'expo-router';

const CHANNEL_ID = 'gmr-default';

export async function initNotifications(userId: string): Promise<() => void> {
  // Android 13+ (API 33+) requires an explicit POST_NOTIFICATIONS runtime permission.
  // ExpoNotifications.requestPermissionsAsync() triggers the system dialog on Android.
  // On iOS, this call is a no-op — Firebase's requestPermission() handles iOS below.
  if (Platform.OS === 'android') {
    const { status } = await ExpoNotifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.log('[FCM] Android notification permission not granted');
      return () => { };
    }
  }

  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (!enabled) {
    console.log('[FCM] Permission not granted');
    return () => { };
  }

  try {
    const token = await messaging().getToken();
    console.log('[FCM] Got token:', token ? '✓' : 'null');
    if (token) {
      const { error } = await supabase.rpc('register_fcm_token', { p_token: token });
      if (error) {
        console.error('[FCM] Failed to register token via RPC:', error.message);
      } else {
        console.log('[FCM] Token registered successfully for user:', userId);
      }
    }
  } catch (err) {
    console.error('[FCM] Failed to get or register FCM token:', err);
  }

  const unsubscribeRefresh = messaging().onTokenRefresh(async (newToken) => {
    try {
      await supabase.rpc('register_fcm_token', { p_token: newToken });
    } catch (err) {
      console.error('[FCM] Failed to update refreshed token:', err);
    }
  });

  // Foreground FCM messages — schedule a local notification so it shows as a heads-up banner
  const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
    console.log('[FCM] ▶ Foreground message:', JSON.stringify(remoteMessage.data));
    const title =
      (remoteMessage.data?.title as string) ||
      remoteMessage.notification?.title ||
      'Guide My Route';
    const body =
      (remoteMessage.data?.body as string) ||
      remoteMessage.notification?.body ||
      'You have a new notification.';

    await ExpoNotifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: remoteMessage.data ?? {},
        sound: 'default',
        ...(Platform.OS === 'android' && { channelId: CHANNEL_ID }),
      },
      trigger: null,
    }).catch((err) => console.error('[FCM] foreground scheduleNotification failed:', err));
  });

  return () => {
    unsubscribeRefresh();
    unsubscribeForeground();
  };
}

export async function handleNotificationTap(
  remoteMessage: FirebaseMessagingTypes.RemoteMessage | null,
  router: Router
): Promise<void> {
  if (!remoteMessage) return;

  const data = remoteMessage.data ?? {};
  const type = typeof data.type === 'string' ? data.type : '';
  const bookingId = typeof data.bookingId === 'string' ? data.bookingId : '';
  const amount = typeof data.amount === 'string' ? data.amount : '';
  const description = typeof data.description === 'string' ? data.description : 'Guide Booking';

  if (type === 'guide_accepted' || type === 'booking_accepted') {
    if (bookingId && amount) {
      router.push({
        pathname: '/more/payment',
        params: {
          bookingId,
          amount,
          description,
        },
      });
      return;
    }

    router.push('/more/MyBookings');
    return;
  }

  if (type.startsWith('booking_') || type === 'new_booking') {
    router.push('/more/MyBookings');
  }
}

export async function unregisterFCMToken(): Promise<void> {
  try {
    const token = await messaging().getToken();
    if (token) {
      await supabase.rpc('unregister_fcm_token', { p_token: token });
    }
  } catch (err) {
    console.error('[FCM] Failed to unregister FCM token:', err);
  }
}
