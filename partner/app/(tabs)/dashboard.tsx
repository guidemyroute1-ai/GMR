import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import { useAuthStore } from '../../store/useAuthStore';
import { Colors } from '../../constants/colors';
import { Spacing, Radius, FontSize } from '../../constants/theme';
import { getBookings, computeEarnings, type Booking } from '../../services/database';
import { Compass, Hotel, Bike, CalendarDays, CheckCircle2, Clock, Inbox } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';

const { height } = Dimensions.get('window');

export default function DashboardScreen() {
  const { user, profile, refreshProfile } = useAuthStore();
  const userUid = user?.uid;
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const role = profile?.role ?? 'guide';
  const roleLabel = role === 'guide' ? 'Tour Guide' : role === 'hotel' ? 'Hotel Owner' : 'Rental Owner';
  const RoleIcon = role === 'guide' ? Compass : role === 'hotel' ? Hotel : Bike;
  const profileName = profile?.profileData?.hotelName ?? profile?.profileData?.shopName ?? profile?.name ?? 'Partner';

  const loadBookings = useCallback(async () => {
    if (!userUid) return;
    try {
      setBookings(await getBookings(userUid));
    } catch (error) {
      console.warn('Failed to load bookings:', error);
    }
  }, [userUid]);

  useFocusEffect(
    useCallback(() => {
      loadBookings();
    }, [loadBookings])
  );

  const earnings = computeEarnings(bookings);
  const recentBookings = bookings.slice(0, 3);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    await loadBookings();
    setTimeout(() => setRefreshing(false), 500);
  };

  return (
    <View style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Verification Status Banner */}
        {!profile?.isApproved && (
          <Animated.View entering={FadeInDown.duration(600).springify()} style={styles.statusBanner}>
            <View style={styles.statusIconWrap}>
              <Clock color={Colors.warning} size={18} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.statusTitle}>Verification Pending</Text>
              <Text style={styles.statusDesc}>
                Admin is reviewing your profile. Some features may be restricted.
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Hero Header Area */}
        <View style={styles.headerContainer}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop' }}
            style={styles.heroImage}
            contentFit="cover"
          />
          <View style={styles.imageOverlay} />
          <Animated.View entering={FadeIn.duration(800)} style={styles.headerContent}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.greeting}>Good day</Text>
                <Text style={styles.partnerName}>{profileName}</Text>
              </View>
              <View style={styles.rolePill}>
                <RoleIcon color={Colors.primary} size={14} />
                <Text style={styles.rolePillText}>{roleLabel}</Text>
              </View>
            </View>

            {/* Earnings main card */}
            <View style={styles.earningsCard}>
              <Text style={styles.earningsLabel}>Total Earnings</Text>
              <Text style={styles.earningsValue}>₹ {earnings.total.toLocaleString('en-IN')}</Text>
              <View style={styles.earningsRow}>
                <View style={styles.earningsSub}>
                  <Text style={styles.earningsSubLabel}>This Month</Text>
                  <Text style={styles.earningsSubValue}>₹ {earnings.thisMonth.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.earningsDivider} />
                <View style={styles.earningsSub}>
                  <Text style={styles.earningsSubLabel}>Pending</Text>
                  <Text style={[styles.earningsSubValue, { color: Colors.warning }]}>
                    ₹ {earnings.pending.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <Animated.View entering={FadeInUp.duration(600).delay(100).springify()} style={{ flex: 1 }}>
            <StatCard label="Total Bookings" value={earnings.totalBookings} Icon={CalendarDays} color={Colors.primary} />
          </Animated.View>
          <Animated.View entering={FadeInUp.duration(600).delay(200).springify()} style={{ flex: 1 }}>
            <StatCard label="Confirmed" value={earnings.confirmedBookings} Icon={CheckCircle2} color={Colors.success} />
          </Animated.View>
          <Animated.View entering={FadeInUp.duration(600).delay(300).springify()} style={{ flex: 1 }}>
            <StatCard label="Pending" value={earnings.pendingBookings} Icon={Clock} color={Colors.warning} />
          </Animated.View>
        </View>

        {/* Recent bookings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Bookings</Text>
          {recentBookings.length === 0 ? (
            <Animated.View entering={FadeInUp.duration(600).delay(400).springify()} style={styles.emptyCard}>
              <View style={styles.emptyIconWrap}>
                <Inbox color={Colors.primary} size={42} />
              </View>
              <Text style={styles.emptyTitle}>No bookings yet</Text>
              <Text style={styles.emptySubtext}>
                When travellers book your services, they&apos;ll appear here.
              </Text>
            </Animated.View>
          ) : (
            recentBookings.map((booking, index) => (
              <Animated.View key={booking.id} entering={FadeInUp.duration(500).delay(400 + (index * 100)).springify()}>
                <BookingCard booking={booking} />
              </Animated.View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function StatCard({ label, value, Icon, color }: { label: string; value: number; Icon: any; color: string }) {
  return (
    <View style={[statStyles.card, { borderTopColor: color, borderTopWidth: 4 }]}>
      <Icon color={color} size={24} style={statStyles.icon} />
      <Text style={[statStyles.value, { color }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  icon: { marginBottom: 8 },
  value: { fontSize: FontSize.xxl, fontWeight: '800' },
  label: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center', marginTop: 4, fontWeight: '600' },
});

function BookingCard({ booking }: { booking: Booking }) {
  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: 'rgba(245, 158, 11, 0.1)', text: Colors.statusPendingText, label: 'Pending' },
    confirmed: { bg: 'rgba(16, 185, 129, 0.1)', text: Colors.statusConfirmedText, label: 'Confirmed' },
    cancelled: { bg: 'rgba(239, 68, 68, 0.1)', text: Colors.statusRejectedText, label: 'Cancelled' },
    completed: { bg: 'rgba(59, 130, 246, 0.1)', text: Colors.statusCompletedText, label: 'Completed' },
  };
  const s = statusConfig[booking.status];

  return (
    <View style={bcStyles.card}>
      <View style={bcStyles.row}>
        <View style={bcStyles.info}>
          <View style={bcStyles.headerRow}>
            {booking.type === 'guide' && (
              <View style={[bcStyles.typeTag, { backgroundColor: 'rgba(30, 64, 175, 0.1)' }]}>
                <Compass color="#1E40AF" size={12} />
                <Text style={[bcStyles.typeText, { color: '#1E40AF' }]}>Guide</Text>
              </View>
            )}
            {booking.type === 'hotel' && (
              <View style={[bcStyles.typeTag, { backgroundColor: 'rgba(107, 33, 168, 0.1)' }]}>
                <Hotel color="#6B21A8" size={12} />
                <Text style={[bcStyles.typeText, { color: '#6B21A8' }]}>Hotel</Text>
              </View>
            )}
            {booking.type === 'rental' && (
              <View style={[bcStyles.typeTag, { backgroundColor: 'rgba(17, 94, 89, 0.1)' }]}>
                <Bike color="#115E59" size={12} />
                <Text style={[bcStyles.typeText, { color: '#115E59' }]}>Rental</Text>
              </View>
            )}
            <View style={[bcStyles.badge, { backgroundColor: s.bg }]}>
              <Text style={[bcStyles.badgeText, { color: s.text }]}>{s.label}</Text>
            </View>
          </View>
          <Text style={bcStyles.guestName} numberOfLines={1}>{booking.guestName ?? 'Guest'}</Text>
          <View style={bcStyles.dateRow}>
            <CalendarDays color={Colors.textMuted} size={14} />
            <Text style={bcStyles.date}>{booking.date}</Text>
          </View>
        </View>
        <View style={bcStyles.right}>
          <Text style={bcStyles.price}>₹{booking.price.toLocaleString('en-IN')}</Text>
        </View>
      </View>
    </View>
  );
}

const bcStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  info: { flex: 1, paddingRight: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  typeTag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 100 },
  typeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  guestName: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 6 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  date: { fontSize: 13, color: Colors.textMuted, fontWeight: '500' },
  right: { alignItems: 'flex-end', justifyContent: 'center' },
  price: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  badge: { borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4, flexDirection: 'row', alignItems: 'center' },
  badgeText: { fontSize: 10, fontWeight: '700' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F3F4F6' },
  headerContainer: {
    paddingTop: 10,
    paddingBottom: 40,
    position: 'relative',
    overflow: 'hidden',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  headerContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    position: 'relative',
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
  },
  greeting: { fontSize: FontSize.md, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  partnerName: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.white,
    marginTop: 4,
    letterSpacing: -0.5,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  rolePillText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '700', textTransform: 'uppercase' },
  earningsCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backdropFilter: 'blur(10px)',
  },
  earningsLabel: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)', marginBottom: 6, fontWeight: '500' },
  earningsValue: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: Spacing.md,
    letterSpacing: -1,
  },
  earningsRow: { flexDirection: 'row', alignItems: 'center' },
  earningsSub: { flex: 1 },
  earningsSubLabel: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  earningsSubValue: { fontSize: FontSize.md, fontWeight: '700', color: Colors.white, marginTop: 4 },
  earningsDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: Spacing.md },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.sm,
    marginTop: -24,
    marginBottom: Spacing.xl,
  },
  section: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: Spacing.lg,
    letterSpacing: -0.5,
  },
  emptyCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: 32,
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(26, 115, 232, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    borderRadius: Radius.md,
    gap: 12,
  },
  statusIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
  },
  statusDesc: {
    fontSize: 12,
    color: '#B45309',
    marginTop: 2,
  },
});
