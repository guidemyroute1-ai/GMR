import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { Colors } from '../../constants/colors';
import { Spacing, Radius, FontSize } from '../../constants/theme';

import {
  getBookings,
  updateBookingStatus,
  type Booking,
  type BookingStatus,
} from '../../services/firestore';
import { useFocusEffect } from 'expo-router';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  CheckCheck, 
  Inbox, 
  CalendarDays, 
  FileText, 
  Compass, 
  Hotel, 
  Bike,
  ChevronRight
} from 'lucide-react-native';
import { Text } from '../../components/Text';

const FILTERS: { key: BookingStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'completed', label: 'Done' },
  { key: 'cancelled', label: 'Cancelled' },
];

const statusConfig: Record<BookingStatus, { color: string; label: string; Icon: any }> = {
  pending:   { color: '#F59E0B', label: 'Pending',   Icon: Clock },
  confirmed: { color: '#10B981', label: 'Confirmed', Icon: CheckCircle2 },
  cancelled: { color: '#EF4444', label: 'Cancelled', Icon: XCircle },
  completed: { color: '#3B82F6', label: 'Completed', Icon: CheckCheck },
};

export default function BookingsScreen() {
  const { user, refreshProfile } = useAuthStore();
  const userUid = user?.uid;
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<BookingStatus | 'all'>('all');
  const [updating, setUpdating] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    if (!userUid) return;
    try {
      setBookings(await getBookings(userUid));
    } catch (error) {
      console.warn('Failed to load bookings:', error);
    } finally {
      setLoading(false);
    }
  }, [userUid]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    await loadBookings();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadBookings();
    }, [loadBookings])
  );

  const filtered =
    filter === 'all' ? bookings : bookings.filter((b) => b.status === filter);

  const handleStatusChange = async (bookingId: string, status: BookingStatus) => {
    const actionLabel = status === 'confirmed' ? 'accept' : status === 'cancelled' ? 'cancel' : 'mark as ' + status;
    Alert.alert(
      `${status.charAt(0).toUpperCase() + status.slice(1)} Booking`,
      `Are you sure you want to ${actionLabel} this booking?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Proceed',
          onPress: async () => {
            setUpdating(bookingId);
            try {
              await updateBookingStatus(bookingId, status);
              await loadBookings();
            } catch {
              Alert.alert('Error', 'Failed to update booking status.');
            } finally {
              setUpdating(null);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Bookings</Text>
          <Text style={styles.subtitle}>Manage your incoming requests</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{bookings.length}</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <FlatList
          data={FILTERS}
          horizontal
          keyExtractor={(f) => f.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, filter === item.key && styles.filterChipActive]}
              onPress={() => setFilter(item.key)}
            >
              <Text style={[styles.filterText, filter === item.key && styles.filterTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIconWrap}>
            <Inbox color={Colors.primary} size={40} />
          </View>
          <Text style={styles.emptyTitle}>No bookings found</Text>
          <Text style={styles.emptySubtext}>
            {filter === 'all'
              ? 'Incoming bookings will appear here.'
              : `No ${filter} bookings at the moment.`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(b) => b.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          renderItem={({ item }) => (
            <BookingItem
              booking={item}
              updating={updating === item.id}
              onAccept={() => handleStatusChange(item.id, 'confirmed')}
              onReject={() => handleStatusChange(item.id, 'cancelled')}
              onComplete={() => handleStatusChange(item.id, 'completed')}
            />
          )}
        />
      )}
    </View>
  );
}

function BookingItem({
  booking,
  updating,
  onAccept,
  onReject,
  onComplete,
}: {
  booking: Booking;
  updating: boolean;
  onAccept: () => void;
  onReject: () => void;
  onComplete: () => void;
}) {
  const s = statusConfig[booking.status] || statusConfig.pending;
  const isPending = booking.status === 'pending';
  const isConfirmed = booking.status === 'confirmed';

  const formattedPrice = booking.price.toLocaleString('en-IN', {
    maximumFractionDigits: 0,
    style: 'currency',
    currency: 'INR',
  });

  return (
    <View style={biStyles.card}>
      <View style={biStyles.cardHeader}>
        <View style={biStyles.typeInfo}>
          {booking.type === 'guide' && <Compass size={14} color={Colors.textMuted} />}
          {booking.type === 'hotel' && <Hotel size={14} color={Colors.textMuted} />}
          {booking.type === 'rental' && <Bike size={14} color={Colors.textMuted} />}
          <Text style={biStyles.typeText}>{booking.type.toUpperCase()}</Text>
        </View>
        <View style={[biStyles.statusIndicator, { backgroundColor: s.color + '15' }]}>
          <View style={[biStyles.statusDot, { backgroundColor: s.color }]} />
          <Text style={[biStyles.statusText, { color: s.color }]}>{s.label}</Text>
        </View>
      </View>

      <View style={biStyles.cardBody}>
        <View style={biStyles.mainInfo}>
          <Text style={biStyles.guestName}>{booking.guestName || 'Guest Traveler'}</Text>
          <Text style={biStyles.priceText}>{formattedPrice}</Text>
        </View>

        <View style={biStyles.detailRow}>
          <View style={biStyles.detailItem}>
            <CalendarDays size={14} color={Colors.textMuted} />
            <Text style={biStyles.detailText}>{booking.date}</Text>
          </View>
          {booking.note && (
            <View style={biStyles.detailItem}>
              <FileText size={14} color={Colors.textMuted} />
              <Text style={biStyles.detailText} numberOfLines={1}>{booking.note}</Text>
            </View>
          )}
        </View>

        {updating ? (
          <View style={biStyles.updatingWrap}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        ) : (
          <View style={biStyles.actionsContainer}>
            {isPending && (
              <View style={biStyles.pendingActions}>
                <TouchableOpacity 
                  style={biStyles.primaryAction} 
                  onPress={onAccept}
                  activeOpacity={0.7}
                >
                  <Text style={biStyles.primaryActionText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={biStyles.secondaryAction} 
                  onPress={onReject}
                  activeOpacity={0.7}
                >
                  <Text style={biStyles.secondaryActionText}>Decline</Text>
                </TouchableOpacity>
              </View>
            )}
            {isConfirmed && (
              <TouchableOpacity 
                style={biStyles.completeAction} 
                onPress={onComplete}
                activeOpacity={0.7}
              >
                <CheckCheck size={18} color={Colors.white} />
                <Text style={biStyles.completeActionText}>Mark as Completed</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const biStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  typeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardBody: {
    padding: Spacing.md,
  },
  mainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  guestName: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  priceText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.primary,
  },
  detailRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  actionsContainer: {
    marginTop: 4,
  },
  pendingActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  primaryAction: {
    flex: 2,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  primaryActionText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: FontSize.sm,
  },
  secondaryAction: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  secondaryActionText: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: FontSize.sm,
  },
  completeAction: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  completeActionText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: FontSize.sm,
  },
  updatingWrap: {
    paddingVertical: 12,
    alignItems: 'center',
  },
});

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  countBadge: {
    backgroundColor: Colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  filtersContainer: {
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  filters: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xs,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: '#F3F4F6',
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  filterTextActive: {
    color: Colors.white,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(26, 115, 232, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
