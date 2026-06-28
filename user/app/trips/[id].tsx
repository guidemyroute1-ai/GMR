import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Text } from '../../components/Text';
import { WebView } from 'react-native-webview';
import RazorpayCheckout from 'react-native-razorpay';

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentState, setPaymentState] = useState<'processing' | 'success'>('processing');
  const [hasJoined, setHasJoined] = useState(false);

  useEffect(() => {
    fetchTripDetails();
    checkIfJoined();
  }, [id]);

  const fetchTripDetails = async () => {
    if (!id) return;
    try {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          organizer:users!organizer_id(id, name, photo_url, rating)
        `)
        .eq('id', id)
        .single();
        
      if (error) throw error;
      setTrip(data);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not load trip details.');
    } finally {
      setLoading(false);
    }
  };

  const checkIfJoined = async () => {
    if (!id || !user) return;
    try {
      const { data, error } = await supabase
        .from('trip_participants')
        .select('*')
        .eq('trip_id', id)
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        setHasJoined(true);
      }
    } catch (err) {
      // Not joined
    }
  };

  const handleJoinTrip = async () => {
    if (!user) {
      Alert.alert('Login Required', 'You need to be logged in to join this trip.');
      return;
    }
    
    // Check if trip is sold out
    if (trip.joined_count >= trip.capacity) {
      Alert.alert('Sold Out', 'This trip has reached its maximum capacity.');
      return;
    }

    setPaymentState('processing');
    setPaymentModalVisible(true);
    
    try {
      // Step 1: Create Razorpay order via edge function
      const orderResult = await supabase.functions.invoke('razorpay-create-trip-order', {
        body: { tripId: id },
      });

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

      // Hide modal momentarily for native Razorpay UI
      setPaymentModalVisible(false);

      // Step 2: Open Razorpay native checkout
      const checkoutResult = await RazorpayCheckout.open({
        description: `Joining ${trip.title}`,
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

      // Show processing modal again for verification
      setPaymentState('processing');
      setPaymentModalVisible(true);

      // Step 3: Verify payment & save application via edge function
      const verifyResult = await supabase.functions.invoke('razorpay-verify-trip-payment', {
        body: {
          razorpay_payment_id: checkoutResult.razorpay_payment_id,
          razorpay_order_id: checkoutResult.razorpay_order_id,
          razorpay_signature: checkoutResult.razorpay_signature,
          tripId: id
        }
      });

      if (verifyResult.error) {
        let errMsg = 'Payment verification failed.';
        try {
          const ctx = (verifyResult.error as any).context;
          if (ctx && typeof ctx.json === 'function') {
            const errBody = await ctx.json();
            errMsg = errBody?.error || errBody?.message || errMsg;
          } else if (verifyResult.error.message) {
            errMsg = verifyResult.error.message;
          }
        } catch {}
        throw new Error(errMsg);
      }

      // Success
      setPaymentState('success');
      setHasJoined(true);
      fetchTripDetails();
      
      setTimeout(() => {
        setPaymentModalVisible(false);
      }, 2000);
    } catch (err: any) {
      setPaymentModalVisible(false);
      const msg = String(err?.description || err?.message || '');
      if (msg.toLowerCase().includes('cancel') || msg.toLowerCase().includes('dismiss')) return;
      Alert.alert('Payment Failed', msg || 'There was an issue processing your payment.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  if (!trip) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Trip not found.</Text>
        <TouchableOpacity style={styles.backBtnError} onPress={() => router.back()}>
          <Text style={styles.backBtnErrorText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const mapHtml = trip.meeting_lat && trip.meeting_lng ? `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
            body { padding: 0; margin: 0; }
            html, body, #map { height: 100%; width: 100%; }
        </style>
    </head>
    <body>
        <div id="map"></div>
        <script>
            var map = L.map('map', {zoomControl: false, dragging: false, scrollWheelZoom: false}).setView([${trip.meeting_lat}, ${trip.meeting_lng}], 15);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
            L.marker([${trip.meeting_lat}, ${trip.meeting_lng}]).addTo(map);
        </script>
    </body>
    </html>
  ` : null;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Images */}
        <View style={styles.imageHeader}>
          <Image 
            source={{ uri: trip.images?.[0] || 'https://images.unsplash.com/photo-1504280327395-5e6e87fcd881' }} 
            style={styles.heroImage} 
          />
          <SafeAreaView style={styles.headerOverlay} edges={['top']}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color="#111827" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareBtn}>
              <Ionicons name="share-outline" size={24} color="#111827" />
            </TouchableOpacity>
          </SafeAreaView>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.badgeRow}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{trip.trip_type.toUpperCase()}</Text>
            </View>
            <View style={styles.capacityBadge}>
              <Ionicons name="people" size={14} color="#16a34a" />
              <Text style={styles.capacityText}>{trip.joined_count} / {trip.capacity} Joined</Text>
            </View>
          </View>

          <Text style={styles.title}>{trip.title}</Text>
          {trip.subtitle ? <Text style={styles.subtitle}>{trip.subtitle}</Text> : null}

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={20} color="#4b5563" />
              <Text style={styles.infoText}>{new Date(trip.trip_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="location-outline" size={20} color="#4b5563" />
              <Text style={styles.infoText}>{trip.city}</Text>
            </View>
          </View>

          {/* Organizer */}
          {trip.organizer && (
            <View style={styles.organizerCard}>
              <Image source={{ uri: trip.organizer.photo_url || 'https://i.pravatar.cc/150' }} style={styles.organizerImg} />
              <View style={styles.organizerInfo}>
                <Text style={styles.organizerLabel}>Hosted by</Text>
                <Text style={styles.organizerName}>{trip.organizer.name}</Text>
              </View>
              <View style={styles.organizerRating}>
                <Ionicons name="star" size={14} color="#eab308" />
                <Text style={styles.ratingText}>{trip.organizer.rating || '5.0'}</Text>
              </View>
            </View>
          )}

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>About this trip</Text>
          <Text style={styles.description}>{trip.description}</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Meeting Point</Text>
          <Text style={styles.locationText}>{trip.location_text}</Text>
          
          {mapHtml && (
            <View style={styles.mapContainer}>
              <WebView 
                source={{ html: mapHtml }} 
                style={styles.mapView}
                scrollEnabled={false}
              />
            </View>
          )}

          <View style={styles.bottomPadding} />
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Total Price</Text>
          <Text style={styles.priceValue}>₹{trip.price}</Text>
        </View>
        <TouchableOpacity 
          style={[styles.joinBtn, hasJoined && styles.joinedBtn]} 
          onPress={hasJoined ? undefined : handleJoinTrip}
          disabled={hasJoined || trip.joined_count >= trip.capacity}
          activeOpacity={0.8}
        >
          <Text style={styles.joinBtnText}>
            {hasJoined ? 'Joined' : trip.joined_count >= trip.capacity ? 'Sold Out' : 'Pay & Join'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Payment Modal */}
      <Modal visible={paymentModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {paymentState === 'processing' ? (
              <>
                <ActivityIndicator size="large" color="#16a34a" style={{ marginBottom: 16 }} />
                <Text style={styles.modalTitle}>Processing Payment...</Text>
                <Text style={styles.modalDesc}>Please do not close this window.</Text>
              </>
            ) : (
              <>
                <View style={styles.successCircle}>
                  <Ionicons name="checkmark" size={40} color="#fff" />
                </View>
                <Text style={styles.modalTitle}>Payment Successful!</Text>
                <Text style={styles.modalDesc}>You have successfully joined the trip.</Text>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  errorText: { fontSize: 16, color: '#ef4444', marginBottom: 16, fontWeight: '600' },
  backBtnError: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#f3f4f6', borderRadius: 8 },
  backBtnErrorText: { color: '#111827', fontWeight: '600' },
  scrollContent: { paddingBottom: 100 },
  imageHeader: { width: '100%', height: 320, position: 'relative' },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  headerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 10 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  shareBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  content: { padding: 20, backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -24 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  typeBadge: { backgroundColor: '#f0fdf4', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#bbf7d0' },
  typeBadgeText: { color: '#16a34a', fontSize: 12, fontWeight: '700' },
  capacityBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f3f4f6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  capacityText: { fontSize: 13, color: '#4b5563', fontWeight: '600' },
  title: { fontSize: 26, fontWeight: '800', color: '#111827', marginBottom: 8, lineHeight: 32 },
  subtitle: { fontSize: 16, color: '#6b7280', marginBottom: 16, lineHeight: 24 },
  infoRow: { flexDirection: 'row', gap: 20, marginBottom: 24 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 14, color: '#4b5563', fontWeight: '500' },
  organizerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#f3f4f6' },
  organizerImg: { width: 48, height: 48, borderRadius: 24, marginRight: 16 },
  organizerInfo: { flex: 1 },
  organizerLabel: { fontSize: 12, color: '#6b7280', fontWeight: '500', marginBottom: 2 },
  organizerName: { fontSize: 16, color: '#111827', fontWeight: '700' },
  organizerRating: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fefce8', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  ratingText: { fontSize: 13, fontWeight: '700', color: '#854d0e' },
  divider: { height: 1, backgroundColor: '#f3f4f6', marginVertical: 24 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 16 },
  description: { fontSize: 15, color: '#4b5563', lineHeight: 24 },
  locationText: { fontSize: 15, color: '#4b5563', lineHeight: 24, marginBottom: 16 },
  mapContainer: { width: '100%', height: 200, borderRadius: 16, overflow: 'hidden', backgroundColor: '#f3f4f6' },
  mapView: { flex: 1, backgroundColor: 'transparent' },
  bottomPadding: { height: 40 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#ffffff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32, borderTopWidth: 1, borderTopColor: '#f3f4f6', shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 10 },
  priceContainer: { flex: 1 },
  priceLabel: { fontSize: 13, color: '#6b7280', fontWeight: '500', marginBottom: 4 },
  priceValue: { fontSize: 22, fontWeight: '800', color: '#111827' },
  joinBtn: { backgroundColor: '#16a34a', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 12, flex: 1.5, alignItems: 'center' },
  joinedBtn: { backgroundColor: '#9ca3af' },
  joinBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: 300, backgroundColor: '#ffffff', borderRadius: 24, padding: 32, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  successCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#16a34a', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8, textAlign: 'center' },
  modalDesc: { fontSize: 15, color: '#6b7280', textAlign: 'center', lineHeight: 22 },
});
