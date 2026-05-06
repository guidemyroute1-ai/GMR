import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  BackHandler,
  Linking,
} from 'react-native';
import { Text } from '../../components/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { generateRazorpayCheckoutHTML } from '../../utils/razorpayCheckout';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../utils/supabase';

// ─── Razorpay Key ──────────────────────────────────────────────────────────────
// TODO: Move to environment config (.env) before production
const RAZORPAY_KEY_ID = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_RQbUI9bAOO5cba';

// ─── Color Palette ─────────────────────────────────────────────────────────────
const COLORS = {
  primary: '#16A34A',
  white: '#FFFFFF',
  darkGray: '#1F2937',
  mediumGray: '#6B7280',
  lightGray: '#F1F5F9',
  borderGray: '#E2E8F0',
  danger: '#EF4444',
  success: '#16A34A',
};

// ─── Payment Message Types ─────────────────────────────────────────────────────
interface PaymentSuccess {
  type: 'PAYMENT_SUCCESS';
  data: {
    paymentId: string;
    orderId: string | null;
    signature: string | null;
  };
}

interface PaymentFailed {
  type: 'PAYMENT_FAILED';
  data: {
    code: string;
    description: string;
    source: string;
    step: string;
    reason: string;
  };
}

interface PaymentCancelled {
  type: 'PAYMENT_CANCELLED';
  data: { reason: string };
}

interface PaymentError {
  type: 'PAYMENT_ERROR';
  data: { error: string };
}

type PaymentMessage = PaymentSuccess | PaymentFailed | PaymentCancelled | PaymentError;

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function PaymentScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'failed'>('idle');
  const [bookingSaved, setBookingSaved] = useState(false);

  // Route params
  const {
    amount,          // Total amount in rupees (e.g., "1998")
    description,     // Payment description
    bookingType,     // "vehicle" | "guide"
    itemId,          // Vehicle or Guide ID
    itemName,        // Vehicle or Guide name
    days,            // Number of days (optional)
    partnerId,       // Partner who owns the listing
  } = useLocalSearchParams<{
    amount: string;
    description: string;
    bookingType: string;
    itemId: string;
    itemName: string;
    days: string;
    partnerId: string;
  }>();

  const amountInPaise = Math.round(parseFloat(amount || '0') * 100);
  const amountInRupees = parseFloat(amount || '0');

  // Safe navigation helper – defers to next tick to avoid
  // "Attempted to navigate before mounting" errors from expo-router
  const safeNavigate = useCallback((fn: () => void) => {
    setTimeout(fn, 0);
  }, []);

  // Handle Android back button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (paymentStatus === 'success') {
          // After success, go back to home
          safeNavigate(() => router.replace('/(tabs)/Home'));
          return true;
        }
        // Show confirmation before leaving payment
        Alert.alert(
          'Cancel Payment?',
          'Are you sure you want to cancel this payment?',
          [
            { text: 'Stay', style: 'cancel' },
            {
              text: 'Leave',
              style: 'destructive',
              onPress: () => safeNavigate(() => router.back()),
            },
          ]
        );
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [paymentStatus, router, safeNavigate])
  );

  // Generate the checkout HTML
  const checkoutHTML = generateRazorpayCheckoutHTML({
    keyId: RAZORPAY_KEY_ID,
    amount: amountInPaise,
    name: 'Guide My Route',
    description: description || 'Booking Payment',
    prefillName: user?.displayName || '',
    prefillEmail: user?.email || '',
    prefillContact: user?.phoneNumber || '9999999999',
    theme: COLORS.primary,
  });

  // ─── Save Booking to Supabase ─────────────────────────────────────────────
  const saveBookingToFirestore = async (paymentId: string, retryCount = 0) => {
    try {
      if (!user) return;
      // Idempotency guard — prevent duplicate bookings
      if (bookingSaved) return;

      const bookingData = {
        // ── User App fields ──
        user_id: user.id,
        user_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown User',
        user_email: user.email || '',
        booking_type: bookingType || 'unknown',
        item_id: itemId || '',
        item_name: itemName || '',
        days: parseInt(days || '1'),
        amount: amountInRupees,
        payment_id: paymentId,
        payment_status: 'paid',
        status: 'confirmed',
        // ── Partner App sync fields ──
        partner_id: partnerId || itemId || '',
        type: bookingType || 'unknown',
        guest_name: user.user_metadata?.full_name || 'Guest Traveler',
        date: new Date().toISOString().split('T')[0],
        price: amountInRupees,
        note: '',
      };

      const { error } = await supabase.from('bookings').insert(bookingData);
      if (error) throw error;

      if (bookingData.partner_id) {
        supabase.functions.invoke('send-push', {
          body: {
            userId: bookingData.partner_id,
            title: 'New booking',
            body: `${bookingData.guest_name} booked ${bookingData.item_name}.`,
            data: { type: 'new_booking', screen: 'bookings' },
          },
        }).catch((pushError) => {
          console.warn('Push notification failed:', pushError.message);
        });
      }

      setBookingSaved(true);
      console.log('Booking saved successfully');
    } catch (error) {
      console.error('Error saving booking:', error);
      // Retry up to 2 times, then alert user
      if (retryCount < 2) {
        console.log(`Retrying booking save (attempt ${retryCount + 2})...`);
        await saveBookingToFirestore(paymentId, retryCount + 1);
      } else {
        Alert.alert(
          'Booking Save Failed',
          'Your payment was successful but we could not save your booking. Please contact support with your payment ID: ' + paymentId,
          [{ text: 'OK' }]
        );
      }
    }
  };

  // ─── Handle WebView Messages ───────────────────────────────────────────────
  const handleWebViewMessage = async (event: WebViewMessageEvent) => {
    try {
      const message: PaymentMessage = JSON.parse(event.nativeEvent.data);

      switch (message.type) {
        case 'PAYMENT_SUCCESS':
          setPaymentStatus('success');
          // Save the booking to Supabase
          await saveBookingToFirestore(message.data.paymentId);
          // Auto-navigate after a delay
          setTimeout(() => {
            safeNavigate(() => router.replace('/more/MyBookings'));
          }, 3000);
          break;

        case 'PAYMENT_FAILED':
          setPaymentStatus('failed');
          break;

        case 'PAYMENT_CANCELLED':
          // User dismissed the Razorpay modal – just stay on the payment page
          break;

        case 'PAYMENT_ERROR':
          setPaymentStatus('failed');
          Alert.alert('Payment Error', message.data.error);
          break;
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  // ─── Handle Close ──────────────────────────────────────────────────────────
  const handleClose = () => {
    if (paymentStatus === 'success') {
      safeNavigate(() => router.replace('/more/MyBookings'));
    } else {
      Alert.alert(
        'Cancel Payment?',
        'Are you sure you want to cancel this payment?',
        [
          { text: 'Stay', style: 'cancel' },
          {
            text: 'Leave',
            style: 'destructive',
            onPress: () => safeNavigate(() => router.back()),
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={handleClose}
          activeOpacity={0.7}
        >
          <Ionicons
            name={paymentStatus === 'success' ? 'checkmark-circle' : 'close'}
            size={24}
            color={paymentStatus === 'success' ? COLORS.success : COLORS.darkGray}
          />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.secureIndicator}>
            <Ionicons name="lock-closed" size={12} color={COLORS.success} />
            <Text style={styles.secureText}>Secure Payment</Text>
          </View>
          <Text style={styles.headerTitle}>
            {paymentStatus === 'success'
              ? 'Payment Complete'
              : `₹${amountInRupees.toLocaleString('en-IN')}`}
          </Text>
        </View>

        {/* Spacer to balance the header */}
        <View style={styles.headerBtn} />
      </View>

      {/* ── WebView ── */}
      <View style={styles.webviewContainer}>
        {isLoading && (
          <View style={styles.loaderOverlay}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loaderText}>Loading payment gateway...</Text>
          </View>
        )}

        <WebView
          ref={webViewRef}
          source={{ html: checkoutHTML }}
          onMessage={handleWebViewMessage}
          onLoadEnd={() => setIsLoading(false)}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={false}
          scalesPageToFit={true}
          mixedContentMode="compatibility"
          originWhitelist={['*']}
          style={styles.webview}
          onShouldStartLoadWithRequest={(request) => {
            const { url } = request;
            // Intercept UPI intent URLs and open them in external apps
            if (
              url.startsWith('upi://') ||
              url.startsWith('intent://') ||
              url.startsWith('gpay://') ||
              url.startsWith('phonepe://') ||
              url.startsWith('paytmmp://') ||
              url.startsWith('tez://')
            ) {
              Linking.openURL(url).catch(() => {
                Alert.alert(
                  'UPI App Not Found',
                  'No UPI app found on your device. Please install a UPI app like Google Pay, PhonePe, or Paytm.'
                );
              });
              return false; // Prevent WebView from loading this URL
            }
            return true; // Allow normal URLs
          }}
        />
      </View>

      {/* ── Bottom Info Bar ── */}
      <View style={styles.bottomInfo}>
        <View style={styles.bottomInfoRow}>
          <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.mediumGray} />
          <Text style={styles.bottomInfoText}>
            100% secure payment · Powered by Razorpay
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderGray,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
    gap: 2,
  },
  secureIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  secureText: {
    fontSize: 11,
    color: COLORS.success,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.darkGray,
    letterSpacing: -0.3,
  },

  // WebView
  webviewContainer: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  // Loader
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  loaderText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.mediumGray,
    fontWeight: '500',
  },

  // Bottom Info
  bottomInfo: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderGray,
  },
  bottomInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  bottomInfoText: {
    fontSize: 12,
    color: COLORS.mediumGray,
    fontWeight: '500',
  },
});
