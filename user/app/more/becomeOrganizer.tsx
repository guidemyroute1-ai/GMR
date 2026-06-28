import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../components/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import RazorpayCheckout from 'react-native-razorpay';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';

type ApplicationStatus = 'none' | 'pending' | 'approved' | 'rejected';

export default function BecomeOrganizerScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [appStatus, setAppStatus] = useState<ApplicationStatus>('none');

  // Check if user already has a submitted application
  useEffect(() => {
    if (!user) { setCheckingStatus(false); return; }
    supabase
      .from('trip_organizer_applications')
      .select('status')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.status) setAppStatus(data.status as ApplicationStatus);
        setCheckingStatus(false);
      });
  }, [user]);

  const handlePayment = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in.');
      return;
    }

    setLoading(true);
    try {
      // Step 1: Create Razorpay order via edge function
      const orderResult = await supabase.functions.invoke('razorpay-create-organizer-order', {
        body: {},
      });

      // Decode error body from edge function (non-2xx returns error with context)
      if (orderResult.error) {
        let errMsg = 'Failed to create order.';
        try {
          const ctx = (orderResult.error as any).context;
          if (ctx && typeof ctx.json === 'function') {
            const errBody = await ctx.json();
            errMsg = errBody?.error || errBody?.message || errMsg;
          } else if (orderResult.error.message) {
            errMsg = orderResult.error.message;
          }
        } catch {}
        throw new Error(errMsg);
      }

      const order = orderResult.data;
      if (!order?.keyId || !order?.orderId) {
        throw new Error('Invalid order response from server.');
      }

      // Step 2: Open Razorpay native checkout
      const checkoutResult = await RazorpayCheckout.open({
        description: 'Trip Organizer Verification',
        currency: order.currency || 'INR',
        key: order.keyId,
        amount: order.amount,
        name: 'GMR',
        order_id: order.orderId,
        prefill: {
          email: user.email,
          contact: (user as any).phone || '9999999999',
          name: (user.user_metadata as any)?.full_name || 'User',
        },
        theme: { color: '#16A34A' },
      }) as { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string };

      if (!checkoutResult.razorpay_payment_id || !checkoutResult.razorpay_order_id || !checkoutResult.razorpay_signature) {
        throw new Error('Razorpay did not return complete payment details.');
      }

      // Step 3: Verify payment & save application via edge function
      const verifyResult = await supabase.functions.invoke('razorpay-verify-organizer-payment', {
        body: {
          razorpay_payment_id: checkoutResult.razorpay_payment_id,
          razorpay_order_id: checkoutResult.razorpay_order_id,
          razorpay_signature: checkoutResult.razorpay_signature,
        }
      });

      if (verifyResult.error) {
        let errMsg = 'Payment verification failed.';
        try {
          const ctx = (verifyResult.error as any).context;
          if (ctx && typeof ctx.json === 'function') {
            const errBody = await ctx.json();
            errMsg = errBody?.error || errBody?.message || errMsg;
            if (errMsg.toLowerCase().includes('already')) {
              setAppStatus('pending');
              return;
            }
          } else if (verifyResult.error.message) {
            errMsg = verifyResult.error.message;
          }
        } catch {}
        throw new Error(errMsg);
      }

      // Success → show pending state
      setAppStatus('pending');
    } catch (err: any) {
      // Don't show error for user-cancelled payments
      const msg = String(err?.description || err?.message || '');
      if (msg.toLowerCase().includes('cancel') || msg.toLowerCase().includes('dismiss')) return;
      Alert.alert('Payment Failed', msg || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Loading skeleton ────────────────────────────────────────────────────
  if (checkingStatus) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Become an Organizer</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#16a34a" />
        </View>
      </SafeAreaView>
    );
  }

  // ─── Pending state ───────────────────────────────────────────────────────
  if (appStatus === 'pending') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Become an Organizer</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.centered}>
          {/* Animated clock icon */}
          <View style={styles.statusIconBg}>
            <Ionicons name="time" size={52} color="#f59e0b" />
          </View>

          <Text style={styles.statusTitle}>Application Submitted!</Text>
          <Text style={styles.statusSubtitle}>
            Your payment was received and your application is under review.
          </Text>

          {/* 24-hour card */}
          <View style={styles.timeCard}>
            <Ionicons name="hourglass-outline" size={20} color="#16a34a" style={{ marginRight: 10 }} />
            <Text style={styles.timeCardText}>Verification usually completes within <Text style={styles.timeCardBold}>24 hours</Text></Text>
          </View>

          {/* Steps */}
          <View style={styles.stepsContainer}>
            {[
              { icon: 'checkmark-circle', label: 'Payment received', done: true },
              { icon: 'document-text', label: 'Application under review', done: false, active: true },
              { icon: 'shield-checkmark', label: 'Verification complete', done: false },
            ].map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <Ionicons
                  name={step.icon as any}
                  size={22}
                  color={step.done ? '#16a34a' : step.active ? '#f59e0b' : '#d1d5db'}
                />
                <Text style={[styles.stepLabel, step.done && styles.stepLabelDone, step.active && styles.stepLabelActive]}>
                  {step.label}
                </Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.backHomeBtn} onPress={() => router.back()}>
            <Text style={styles.backHomeBtnText}>Back to Profile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Rejected state ──────────────────────────────────────────────────────
  if (appStatus === 'rejected') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Become an Organizer</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centered}>
          <View style={[styles.statusIconBg, { backgroundColor: '#fee2e2' }]}>
            <Ionicons name="close-circle" size={52} color="#ef4444" />
          </View>
          <Text style={styles.statusTitle}>Application Rejected</Text>
          <Text style={styles.statusSubtitle}>
            Unfortunately your application was not approved this time. You can contact support for more details.
          </Text>
          <TouchableOpacity style={styles.backHomeBtn} onPress={() => router.back()}>
            <Text style={styles.backHomeBtnText}>Back to Profile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Default: payment form ───────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Become an Organizer</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconContainer}>
          <View style={styles.iconBg}>
            <Ionicons name="people" size={48} color="#16a34a" />
          </View>
        </View>

        <Text style={styles.title}>Host Your Own Trips</Text>
        <Text style={styles.subtitle}>
          Join our community of verified trip organizers and start hosting amazing experiences.
        </Text>

        <View style={styles.featuresList}>
          {[
            { icon: 'checkmark-circle', title: 'Verified Badge', desc: 'Get a trusted badge on your profile' },
            { icon: 'create', title: 'Create Trips', desc: 'Host community trips and earn' },
            { icon: 'people', title: 'Grow Community', desc: 'Build your own travel community' },
            { icon: 'headset', title: 'Priority Support', desc: 'Get 24/7 priority support from GMR' },
          ].map((item, index) => (
            <View key={index} style={styles.featureItem}>
              <Ionicons name={item.icon as any} size={24} color="#16a34a" style={styles.featureIcon} />
              <View>
                <Text style={styles.featureTitle}>{item.title}</Text>
                <Text style={styles.featureDesc}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.paymentBox}>
          <Text style={styles.paymentLabel}>One-time Verification Fee</Text>
          <Text style={styles.paymentAmount}>₹499</Text>
          <Text style={styles.paymentNote}>Fully refundable if your application is rejected.</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.payButton}
          onPress={handlePayment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.payButtonText}>Pay ₹499 & Apply</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backButton: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  content: { padding: 24 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },

  // Status screens
  statusIconBg: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  statusTitle: { fontSize: 24, fontWeight: '800', color: '#111827', textAlign: 'center', marginBottom: 12 },
  statusSubtitle: { fontSize: 15, color: '#6b7280', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  timeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginBottom: 28,
    width: '100%',
  },
  timeCardText: { fontSize: 14, color: '#374151', flex: 1 },
  timeCardBold: { fontWeight: '700', color: '#16a34a' },
  stepsContainer: { width: '100%', marginBottom: 36 },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  stepLabel: { fontSize: 14, color: '#9ca3af', marginLeft: 12 },
  stepLabelDone: { color: '#16a34a', fontWeight: '600' },
  stepLabelActive: { color: '#f59e0b', fontWeight: '600' },
  backHomeBtn: {
    backgroundColor: '#f3f4f6',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  backHomeBtnText: { fontSize: 15, fontWeight: '700', color: '#374151' },

  // Payment form
  iconContainer: { alignItems: 'center', marginBottom: 24 },
  iconBg: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 15, color: '#6b7280', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  featuresList: { marginBottom: 32 },
  featureItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  featureIcon: { marginRight: 16, marginTop: 2 },
  featureTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 4 },
  featureDesc: { fontSize: 14, color: '#6b7280' },
  paymentBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  paymentLabel: { fontSize: 14, fontWeight: '600', color: '#64748b', marginBottom: 8 },
  paymentAmount: { fontSize: 36, fontWeight: '800', color: '#111827', marginBottom: 8 },
  paymentNote: { fontSize: 12, color: '#64748b', textAlign: 'center' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#f3f4f6', backgroundColor: '#fff' },
  payButton: {
    backgroundColor: '#16a34a',
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  payButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
