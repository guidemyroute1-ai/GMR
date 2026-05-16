import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../store/useAuthStore';
import { Colors } from '../../constants/colors';

import { Spacing, Radius, FontSize } from '../../constants/theme';
import { getBookings, computeEarnings, type Booking } from '../../services/firestore';
import { Compass, Hotel, Bike, CalendarDays, CheckCircle2, Clock, ClipboardList, Plus, MessageSquare, BarChart3, Inbox } from 'lucide-react-native';

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
          <View style={styles.statusBanner}>
            <View style={styles.statusIconWrap}>
              <Clock color={Colors.warning} size={18} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.statusTitle}>Verification Pending</Text>
              <Text style={styles.statusDesc}>
                Admin is reviewing your profile. Some features may be restricted.
              </Text>
            </View>
          </View>
        )}
        {/* Header */}
        <LinearGradient
          colors={['#1E3A8A', '#0284C7']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Good day! 👋</Text>
              <Text style={styles.partnerName}>{profileName}</Text>
            </View>
            <View style={styles.rolePill}>
              <RoleIcon color={Colors.white} size={14} />
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
        </LinearGradient>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatCard label="Total Bookings" value={earnings.totalBookings} Icon={CalendarDays} color={Colors.primary} />
          <StatCard label="Confirmed" value={earnings.confirmedBookings} Icon={CheckCircle2} color={Colors.success} />
          <StatCard label="Pending" value={earnings.pendingBookings} Icon={Clock} color={Colors.warning} />
        </View>



        {/* Recent bookings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Bookings</Text>
          {recentBookings.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconWrap}>
                <Inbox color={Colors.primary} size={42} />
              </View>
              <Text style={styles.emptyTitle}>No bookings yet</Text>
              <Text style={styles.emptySubtext}>
                When travellers book your services, they&apos;ll appear here.
              </Text>
            </View>
          ) : (
            recentBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function StatCard({ label, value, Icon, color }: { label: string; value: number; Icon: any; color: string }) {
  return (
    <View style={[statStyles.card, { borderTopColor: color, borderTopWidth: 3 }]}>
      <Icon color={color} size={22} style={statStyles.icon} />
      <Text style={[statStyles.value, { color }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    marginHorizontal: 4,
    borderColor: '#d3dbe2',
    borderWidth: 1,
    elevation: 4,
  },
  icon: { marginBottom: 4 },
  value: { fontSize: FontSize.xl, fontWeight: '800' },
  label: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center', marginTop: 2 },
});

function QuickAction({
  Icon,
  label,
  color,
  onPress,
}: {
  Icon: any;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={qaStyles.item} activeOpacity={0.75} onPress={onPress}>
      <View style={[qaStyles.icon, { backgroundColor: `${color}15` }]}>
        <Icon color={color} size={24} />
      </View>
      <Text style={qaStyles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const qaStyles = StyleSheet.create({
  item: { alignItems: 'center', flex: 1 },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  label: { fontSize: 10, color: Colors.textMuted, fontWeight: '600', textAlign: 'center' },
});

function BookingCard({ booking }: { booking: Booking }) {
  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: Colors.statusPending, text: Colors.statusPendingText, label: 'Pending' },
    confirmed: { bg: Colors.statusConfirmed, text: Colors.statusConfirmedText, label: 'Confirmed' },
    cancelled: { bg: Colors.statusRejected, text: Colors.statusRejectedText, label: 'Cancelled' },
    completed: { bg: Colors.statusCompleted, text: Colors.statusCompletedText, label: 'Completed' },
  };
  const s = statusConfig[booking.status];

  return (
    <View style={bcStyles.card}>
      <View style={bcStyles.row}>
        <View style={bcStyles.info}>
          <View style={bcStyles.headerRow}>
            {booking.type === 'guide' && (
              <View style={[bcStyles.typeTag, { backgroundColor: '#DBEAFE' }]}>
                <Compass color="#1E40AF" size={10} />
                <Text style={[bcStyles.typeText, { color: '#1E40AF' }]}>Guide</Text>
              </View>
            )}
            {booking.type === 'hotel' && (
              <View style={[bcStyles.typeTag, { backgroundColor: '#F3E8FF' }]}>
                <Hotel color="#6B21A8" size={10} />
                <Text style={[bcStyles.typeText, { color: '#6B21A8' }]}>Hotel</Text>
              </View>
            )}
            {booking.type === 'rental' && (
              <View style={[bcStyles.typeTag, { backgroundColor: '#CCFBF1' }]}>
                <Bike color="#115E59" size={10} />
                <Text style={[bcStyles.typeText, { color: '#115E59' }]}>Rental</Text>
              </View>
            )}
            <View style={[bcStyles.badge, { backgroundColor: s.bg }]}>
              <Text style={[bcStyles.badgeText, { color: s.text }]}>{s.label}</Text>
            </View>
          </View>
          <Text style={bcStyles.guestName} numberOfLines={1}>{booking.guestName ?? 'Guest'}</Text>
          <View style={bcStyles.dateRow}>
            <CalendarDays color={Colors.textMuted} size={12} />
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
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#d3dbe2',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  info: { flex: 1, paddingRight: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  typeTag: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 100 },
  typeText: { fontSize: 9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  guestName: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  date: { fontSize: 13, color: Colors.textMuted },
  right: { alignItems: 'flex-end', justifyContent: 'center' },
  price: { fontSize: 16, fontWeight: '800', color: Colors.text },
  badge: { borderRadius: 100, paddingHorizontal: 8, paddingVertical: 2, flexDirection: 'row', alignItems: 'center' },
  badgeText: { fontSize: 10, fontWeight: '700' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  headerGradient: {
    paddingTop: 10,
    paddingHorizontal: Spacing.md,
    paddingBottom: 32,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  greeting: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.7)' },
  partnerName: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.white,
    marginTop: 2,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  rolePillText: { fontSize: FontSize.xs, color: Colors.white, fontWeight: '700' },
  earningsCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  earningsLabel: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  earningsValue: {
    fontSize: FontSize.xxxl,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: Spacing.md,
    letterSpacing: -1,
  },
  earningsRow: { flexDirection: 'row', alignItems: 'center' },
  earningsSub: { flex: 1, alignItems: 'center' },
  earningsSubLabel: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.65)' },
  earningsSubValue: { fontSize: FontSize.md, fontWeight: '700', color: Colors.white, marginTop: 2 },
  earningsDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.25)' },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    marginTop: -20,
    marginBottom: Spacing.md,
    gap: 4,
  },
  section: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 100,
    backgroundColor: 'rgba(26, 115, 232, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 6 },
  emptySubtext: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 240,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    padding: 12,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    gap: 12,
  },
  statusIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
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
