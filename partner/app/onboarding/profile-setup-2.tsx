import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Spacing, Radius, FontSize } from '../../constants/theme';
import { updateUserProfile } from '../../services/auth';
import { useAuthStore } from '../../store/useAuthStore';
import { useOnboardingStore } from '../../store/useOnboardingStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import { TextField, MultiSelectDropdown, SingleSelectDropdown } from '../../components/FormFields';

// ─── Guide fields (Part 2) ──────────────────────────────
function GuideFormPart2({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const [focused, setFocused] = useState<string | null>(null);
  return (
    <>
      <MultiSelectDropdown
        label="Specialisations *"
        placeholder="Select specialisations"
        options={['Trekking', 'Wildlife', 'Heritage', 'Photography', 'Culinary', 'Adventure', 'City Tour', 'Spiritual', 'Water Sports', 'Camping']}
        selected={Array.isArray(data.specialisations) ? data.specialisations : (data.specialisations ? data.specialisations.split(',').map((s: string) => s.trim()) : [])}
        onChange={(v: string[]) => onChange({ ...data, specialisations: v })}
        focused={focused} name="specialisations" setFocused={setFocused}
      />
      <MultiSelectDropdown
        label="Availability *"
        placeholder="Select available days"
        options={['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']}
        selected={Array.isArray(data.availability) ? data.availability : (data.availability ? data.availability.split(',').map((s: string) => s.trim()) : [])}
        onChange={(v: string[]) => onChange({ ...data, availability: v })}
        focused={focused} name="availability" setFocused={setFocused}
      />
      <TextField label="Max Group Size *" placeholder="e.g. 10" value={data.maxGroupSize}
        onChangeText={(v: string) => onChange({ ...data, maxGroupSize: v })}
        keyboardType="numeric" focused={focused} name="maxGroupSize" setFocused={setFocused} />
      <TextField label="Starting Price per Day (₹) *" placeholder="e.g. 500" value={data.pricePerDay}
        onChangeText={(v: string) => onChange({ ...data, pricePerDay: v })}
        keyboardType="numeric" focused={focused} name="price" setFocused={setFocused} />
      <TextField label="Certifications (if any)" placeholder="e.g. Adventure Tour License, First Aid" value={data.certifications}
        onChangeText={(v: string) => onChange({ ...data, certifications: v })}
        focused={focused} name="certifications" setFocused={setFocused} />
      <TextField label="About You (bio) *" placeholder="Describe yourself and your tours..." value={data.bio}
        onChangeText={(v: string) => onChange({ ...data, bio: v })}
        multiline focused={focused} name="bio" setFocused={setFocused} />
    </>
  );
}

// ─── Hotel fields (Part 2) ──────────────────────────────
function HotelFormPart2({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const [focused, setFocused] = useState<string | null>(null);
  return (
    <>
      <MultiSelectDropdown
        label="Room Types Available *"
        placeholder="Select room types"
        options={['Single', 'Double', 'Twin', 'Suite', 'Dormitory', 'Family', 'Deluxe']}
        selected={Array.isArray(data.roomTypes) ? data.roomTypes : (data.roomTypes ? data.roomTypes.split(',').map((s: string) => s.trim()) : [])}
        onChange={(v: string[]) => onChange({ ...data, roomTypes: v })}
        focused={focused}
        name="roomTypes"
        setFocused={setFocused}
      />
      <TextField label="Starting Price per Night (₹) *" placeholder="e.g. 800" value={data.pricePerNight}
        onChangeText={(v: string) => onChange({ ...data, pricePerNight: v })}
        keyboardType="numeric" focused={focused} name="price" setFocused={setFocused} />
      <TextField label="Total Rooms *" placeholder="e.g. 12" value={data.totalRooms}
        onChangeText={(v: string) => onChange({ ...data, totalRooms: v })}
        keyboardType="numeric" focused={focused} name="rooms" setFocused={setFocused} />
      <SingleSelectDropdown
        label="Check-in Time *"
        placeholder="Select check-in time"
        options={['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM']}
        value={data.checkInTime ?? ''}
        onChange={(v: string) => onChange({ ...data, checkInTime: v })}
        focused={focused} name="checkInTime" setFocused={setFocused}
      />
      <SingleSelectDropdown
        label="Check-out Time *"
        placeholder="Select check-out time"
        options={['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM']}
        value={data.checkOutTime ?? ''}
        onChange={(v: string) => onChange({ ...data, checkOutTime: v })}
        focused={focused} name="checkOutTime" setFocused={setFocused}
      />
      <TextField label="Amenities *" placeholder="e.g. WiFi, Hot Water, Parking, Restaurant" value={data.amenities}
        onChangeText={(v: string) => onChange({ ...data, amenities: v })}
        multiline focused={focused} name="amenities" setFocused={setFocused} />
    </>
  );
}

// ─── Rental fields (Part 2) ─────────────────────────────
function RentalFormPart2({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const [focused, setFocused] = useState<string | null>(null);
  return (
    <>
      <TextField label="Price per Day (₹) *" placeholder="e.g. 600" value={data.pricePerDay}
        onChangeText={(v: string) => onChange({ ...data, pricePerDay: v })}
        keyboardType="numeric" focused={focused} name="price" setFocused={setFocused} />
      <TextField label="Total Vehicles Available *" placeholder="e.g. 8" value={data.totalVehicles}
        onChangeText={(v: string) => onChange({ ...data, totalVehicles: v })}
        keyboardType="numeric" focused={focused} name="total" setFocused={setFocused} />
      <TextField label="Security Deposit (₹) *" placeholder="e.g. 2000" value={data.securityDeposit}
        onChangeText={(v: string) => onChange({ ...data, securityDeposit: v })}
        keyboardType="numeric" focused={focused} name="deposit" setFocused={setFocused} />
      <MultiSelectDropdown
        label="Documents Required from Renter *"
        placeholder="Select required documents"
        options={['Aadhaar Card', 'Driving License', 'Passport', 'Voter ID', 'PAN Card', 'International Driving Permit']}
        selected={Array.isArray(data.docsRequired) ? data.docsRequired : (data.docsRequired ? data.docsRequired.split(',').map((s: string) => s.trim()) : [])}
        onChange={(v: string[]) => onChange({ ...data, docsRequired: v })}
        focused={focused} name="docsRequired" setFocused={setFocused}
      />
    </>
  );
}

export default function ProfileSetup2Screen() {
  const { user, profile, setProfile } = useAuthStore();
  const { data: storeData, updateData: setStoreData } = useOnboardingStore();
  
  const role = storeData.role || profile?.role || 'guide';
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>(storeData);

  useEffect(() => {
    return () => {
      setStoreData(formData);
    };
  }, [formData]);

  const isFormValid = () => {
    if (role === 'guide') {
      const specsCount = Array.isArray(formData.specialisations) ? formData.specialisations.length : (typeof formData.specialisations === 'string' && formData.specialisations.length > 0 ? 1 : 0);
      const availCount = Array.isArray(formData.availability) ? formData.availability.length : 0;
      return !!(
        specsCount > 0 &&
        availCount > 0 &&
        formData.maxGroupSize?.toString().trim() &&
        formData.pricePerDay?.toString().trim() &&
        formData.bio?.trim()
      );
    } else if (role === 'hotel') {
      const roomTypesCount = Array.isArray(formData.roomTypes) ? formData.roomTypes.length : (typeof formData.roomTypes === 'string' && formData.roomTypes.trim().length > 0 ? 1 : 0);
      return !!(
        roomTypesCount > 0 &&
        formData.pricePerNight?.toString().trim() &&
        formData.totalRooms?.toString().trim() &&
        formData.checkInTime?.trim() &&
        formData.checkOutTime?.trim() &&
        formData.amenities?.trim()
      );
    } else if (role === 'rental') {
      const docsCount = Array.isArray(formData.docsRequired) ? formData.docsRequired.length : (formData.docsRequired ? 1 : 0);
      return !!(
        formData.pricePerDay?.toString().trim() &&
        formData.totalVehicles?.toString().trim() &&
        formData.securityDeposit?.toString().trim() &&
        docsCount > 0
      );
    }
    return false;
  };

  const isValid = isFormValid();

  const handleSave = async () => {
    if (!user || !isValid) return;

    setLoading(true);
    try {
      // Sync local form data to store first
      setStoreData(formData);
      
      const mergedProfileData = { ...storeData, ...formData };
      
      await updateUserProfile(user.uid, {
        profileData: mergedProfileData,
        ...(storeData.latitude != null ? { latitude: storeData.latitude } : {}),
        ...(storeData.longitude != null ? { longitude: storeData.longitude } : {}),
      });
      setProfile({ ...profile!, profileData: mergedProfileData });
      
      if (role === 'guide') {
        router.push('/onboarding/profile-photo');
      } else {
        router.push('/onboarding/upload-docs');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.safe, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color={Colors.primary} size={20} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.stepBadge}>
          <Text style={styles.stepText}>Step 4 of 6</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.heading}>More Details</Text>
          <Text style={styles.subheading}>
            Provide more specific details about your offerings.
          </Text>

          {role === 'guide' && (
            <GuideFormPart2 data={formData} onChange={setFormData} />
          )}
          {role === 'hotel' && (
            <HotelFormPart2 data={formData} onChange={setFormData} />
          )}
          {role === 'rental' && (
            <RentalFormPart2 data={formData} onChange={setFormData} />
          )}

          <TouchableOpacity
            style={[styles.saveBtn, (!isValid || loading) && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!isValid || loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <View style={styles.saveBtnContent}>
                <CheckCircle2 color={Colors.white} size={20} />
                <Text style={styles.saveBtnText}>Continue to Verification</Text>
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  backBtn: {
    padding: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backText: {
    fontSize: FontSize.base,
    color: Colors.primary,
    fontWeight: '600',
  },
  stepBadge: {
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  stepText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  scroll: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 60,
  },
  heading: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.text,
    lineHeight: 40,
    marginBottom: Spacing.sm,
    letterSpacing: -0.5,
  },
  subheading: {
    fontSize: FontSize.base,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
    lineHeight: 22,
  },
  saveBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.full,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: Spacing.lg,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveBtnText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
