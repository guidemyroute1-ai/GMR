import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Text } from '../../components/Text';
import { Colors } from '../../constants/colors';
import { Spacing, Radius, FontSize } from '../../constants/theme';
import { ArrowLeft, User, CalendarDays, FileText, IndianRupee, Tag, Phone, MapPin, Package, CreditCard, Clock, CheckCircle2, Eye } from 'lucide-react-native';
import { supabase } from '../../services/supabase';
import { updateBookingStatus } from '../../services/database';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CustomerDetailsScreen() {
  const params = useLocalSearchParams();
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [extraDetails, setExtraDetails] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
 const insets = useSafeAreaInsets();
  useEffect(() => {
    async function fetchPhoneAndDetails() {
      const bookingId = params.bookingId || params.id;
      if (!bookingId) return;
      
      const { data: booking } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .maybeSingle();
        
      if (booking) {
        setExtraDetails(booking);
        
        if (booking.user_id) {
          const { data: user } = await supabase
            .from('users')
            .select('phone')
            .eq('id', booking.user_id)
            .maybeSingle();
            
          if (user?.phone) {
            setPhoneNumber(user.phone);
          }
        }
      }
    }
    fetchPhoneAndDetails();
  }, [params.bookingId, params.id]);

  const handleCall = () => {
    if (!phoneNumber) {
      Alert.alert('Phone number not available', 'The customer has not provided a valid phone number.');
      return;
    }
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleMarkAsComplete = async () => {
    const bookingId = params.bookingId || params.id;
    if (!bookingId) return;

    Alert.alert(
      'Mark as Complete',
      'Are you sure you want to mark this booking as complete?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: async () => {
            try {
              setIsUpdating(true);
              await updateBookingStatus(bookingId as string, 'completed');
              Alert.alert('Success', 'Booking marked as complete');
              router.back();
            } catch (error) {
              console.error(error);
              Alert.alert('Error', 'Failed to update booking status');
            } finally {
              setIsUpdating(false);
            }
          }
        }
      ]
    );
  };

  const handleViewDetails = () => {
    // Optionally navigate to specific booking item screen if it exists
    Alert.alert('View Details', 'More details about the package/booking will be available here soon.');
  };
  
  return (
    <View style={{paddingBottom: insets.bottom}}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customer Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <User size={40} color={Colors.primary} />
          </View>
          <Text style={styles.name}>{params.guestName || extraDetails?.guest_name || 'Guest Traveler'}</Text>
          <Text style={styles.status}>{(params.status || extraDetails?.status)?.toString().toUpperCase()}</Text>
          
          <TouchableOpacity 
            style={[styles.callBtn, !phoneNumber && styles.callBtnDisabled]} 
            onPress={handleCall}
            activeOpacity={0.8}
            disabled={!phoneNumber}
          >
            <Phone size={20} color={Colors.white} />
            <Text style={styles.callBtnText}>Call Customer</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.detailsContainer}>
          <Text style={styles.sectionTitle}>Booking Information</Text>
          
          {extraDetails?.item_name && (
            <View style={styles.infoRow}>
              <Package size={20} color={Colors.textMuted} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Package / Item</Text>
                <Text style={styles.infoValue}>{extraDetails.item_name}</Text>
              </View>
            </View>
          )}

          <View style={styles.infoRow}>
            <Tag size={20} color={Colors.textMuted} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Service Type</Text>
              <Text style={styles.infoValue}>{params.type?.toString().toUpperCase() || extraDetails?.booking_type?.toUpperCase()}</Text>
            </View>
          </View>

          {extraDetails?.city && (
            <View style={styles.infoRow}>
              <MapPin size={20} color={Colors.textMuted} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>City / Location</Text>
                <Text style={styles.infoValue}>{extraDetails.city}</Text>
              </View>
            </View>
          )}

          <View style={styles.infoRow}>
            <CalendarDays size={20} color={Colors.textMuted} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Booking Date</Text>
              <Text style={styles.infoValue}>{params.date || extraDetails?.date}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <IndianRupee size={20} color={Colors.textMuted} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Price / Amount</Text>
              <Text style={styles.infoValue}>₹{params.price || extraDetails?.price || extraDetails?.amount}</Text>
            </View>
          </View>
          
        

          {extraDetails?.created_at && (
            <View style={styles.infoRow}>
              <Clock size={20} color={Colors.textMuted} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Created At</Text>
                <Text style={styles.infoValue}>{new Date(extraDetails.created_at).toLocaleString()}</Text>
              </View>
            </View>
          )}

          {(params.note || extraDetails?.note) && (
            <View style={styles.infoRow}>
              <FileText size={20} color={Colors.textMuted} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Notes / Requirements</Text>
                <Text style={styles.infoValue}>{params.note || extraDetails?.note}</Text>
              </View>
            </View>
          )}
        </View>
        
        <View style={styles.actionButtonsContainer}>


          <TouchableOpacity 
            style={[styles.completeBtn, isUpdating && styles.btnDisabled]} 
            onPress={handleMarkAsComplete}
            activeOpacity={0.8}
            disabled={isUpdating || extraDetails?.status === 'completed' || params.status === 'completed'}
          >
            {isUpdating ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <>
                <CheckCircle2 size={20} color={Colors.white} />
                <Text style={styles.completeBtnText}>
                  {(extraDetails?.status === 'completed' || params.status === 'completed') ? 'Completed' : 'Mark as Complete'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: 50, // Added padding for typical status bar
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  content: {
    padding: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(26, 115, 232, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  status: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
    letterSpacing: 0.5,
    marginBottom: Spacing.xl,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.full,
    gap: Spacing.sm,
    width: '100%',
  },
  callBtnDisabled: {
    backgroundColor: Colors.textMuted,
    opacity: 0.7,
  },
  callBtnText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  detailsContainer: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: '500',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  viewDetailsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.primary,
    gap: Spacing.sm,
  },
  viewDetailsBtnText: {
    color: Colors.primary,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  completeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.success,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    gap: Spacing.sm,
  },
  completeBtnText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
