import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useAuthStore } from '../../store/useAuthStore';
import { Colors } from '../../constants/colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Spacing, Radius, FontSize } from '../../constants/theme';
import { supabase } from '../../services/supabase';
import { Map, Plus, Trash2, Calendar, Users, FileText, Edit2 } from 'lucide-react-native';
import { AlertService } from '@/contexts/AlertContext';

type Trip = {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  capacity: number;
  trip_participants?: { count: number }[];
  trip_date: string;
  images: string[];
  is_active: boolean;
};

export default function TripsScreen() {
  const { user, profile } = useAuthStore();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchTrips = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*, trip_participants(count)')
        .eq('organizer_id', user.uid)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTrips(data || []);
    } catch (err) {
      console.warn('Failed to fetch trips:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchTrips();
    }, [fetchTrips])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTrips();
    setRefreshing(false);
  };

  const handleDelete = (id: string, title: string) => {
    AlertService.alert('Delete Trip', `Remove "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(id);
          try {
            const { error } = await supabase.from('trips').delete().eq('id', id);
            if (error) throw error;
            await fetchTrips();
          } catch {
            AlertService.alert('Error', 'Could not delete trip.');
          } finally {
            setDeleting(null);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <View style={styles.titleRow}>
            <Map color={Colors.text} size={28} />
            <Text style={styles.title}>My Trips</Text>
          </View>
          <Text style={styles.subtitle}>{trips.length} trip{trips.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, !profile?.isApproved && { backgroundColor: Colors.textMuted }]}
          onPress={() => {
            if (!profile?.isApproved) {
              AlertService.alert('Pending Approval', 'Your account is pending approval from the admin. You cannot create trips yet.');
              return;
            }
            router.push('/(admin)/create-trip');
          }}
          activeOpacity={0.85}
        >
          <Plus color={Colors.white} size={20} />
          <Text style={styles.addBtnText}>Create</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : trips.length === 0 ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIconWrap}>
            <Map color={Colors.primary} size={48} />
          </View>
          <Text style={styles.emptyTitle}>No trips yet</Text>
          <Text style={styles.emptySubtext}>
            Create your first official trip for travelers to book.
          </Text>
          <TouchableOpacity
            style={[styles.emptyBtn, !profile?.isApproved && { backgroundColor: Colors.textMuted }]}
            onPress={() => {
              if (!profile?.isApproved) {
                AlertService.alert('Pending Approval', 'Your account is pending approval from the admin. You cannot create trips yet.');
                return;
              }
              router.push('/(admin)/create-trip');
            }}
          >
            <Text style={styles.emptyBtnText}>Create First Trip</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardMain}>
                <Image
                  source={{ uri: item.images?.[0] || 'https://via.placeholder.com/150' }}
                  style={styles.cardImg}
                />
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.cardSubtitle} numberOfLines={1}>
                    {item.subtitle}
                  </Text>
                  
                  <View style={styles.detailsRow}>
                    <View style={styles.detailItem}>
                      <Calendar color={Colors.textMuted} size={14} />
                      <Text style={styles.detailText}>
                        {new Date(item.trip_date).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Users color={Colors.textMuted} size={14} />
                      <Text style={styles.detailText}>
                        Joined: {item.trip_participants?.[0]?.count || 0}/{item.capacity}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={styles.price}>₹{item.price}</Text>
                </View>
              </View>

              <View style={styles.cardActions}>
                {!item.is_active && (
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>Inactive</Text>
                  </View>
                )}
                <View style={{ flex: 1 }} />
                <TouchableOpacity
                  style={[styles.actionBtn, { marginRight: 8 }]}
                  onPress={() => router.push(`/(admin)/edit-trip?id=${item.id}`)}
                >
                  <Edit2 color={Colors.primary} size={18} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleDelete(item.id, item.title)}
                  disabled={deleting === item.id}
                >
                  {deleting === item.id ? (
                    <ActivityIndicator size="small" color={Colors.error} />
                  ) : (
                    <Trash2 color={Colors.error} size={18} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.text,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.full,
    gap: 6,
  },
  addBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: FontSize.sm,
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
    padding: Spacing.xl,
  },
  emptyIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(74,222,128,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: FontSize.base,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  emptyBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: Radius.full,
  },
  emptyBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: FontSize.md,
  },
  list: {
    padding: Spacing.md,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardMain: {
    flexDirection: 'row',
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  cardImg: {
    width: 100,
    height: 100,
    borderRadius: Radius.md,
    backgroundColor: Colors.inputBg,
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: FontSize.base,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginBottom: 6,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  price: {
    fontSize: FontSize.md,
    fontWeight: '800',
    color: Colors.primary,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: '#f8fafc',
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(239,68,68,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  statusBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.error,
  },
});
