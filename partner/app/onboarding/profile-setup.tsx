import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Spacing, Radius, FontSize } from '../../constants/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import { TextField, MultiSelectDropdown, SingleSelectDropdown } from '../../components/FormFields';

// ─── Guide fields (Part 1) ──────────────────────────────
function GuideFormPart1({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const [focused, setFocused] = useState<string | null>(null);
  return (
    <>
      <TextField label="Years of Experience *" placeholder="e.g. 5" value={data.experience}
        onChangeText={(v: string) => onChange({ ...data, experience: v })}
        keyboardType="numeric" focused={focused} name="experience" setFocused={setFocused} />
      <TextField label="Location *" placeholder="e.g. Rishikesh, Uttarakhand" value={data.location}
        onChangeText={(v: string) => onChange({ ...data, location: v })}
        focused={focused} name="location" setFocused={setFocused} />
      <MultiSelectDropdown 
        label="Languages Spoken *" 
        placeholder="Select languages"
        options={['English', 'Hindi', 'Bengali', 'Tamil', 'Telugu', 'Marathi', 'Gujarati', 'Kannada', 'Punjabi', 'French', 'Spanish', 'German', 'Japanese']}
        selected={Array.isArray(data.languages) ? data.languages : (data.languages ? data.languages.split(',').map((s:string) => s.trim()) : [])}
        onChange={(v: string[]) => onChange({ ...data, languages: v })}
        focused={focused}
        name="languages"
        setFocused={setFocused}
      />
    </>
  );
}

// ─── Hotel fields (Part 1) ──────────────────────────────
function HotelFormPart1({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const [focused, setFocused] = useState<string | null>(null);
  return (
    <>
      <TextField label="Hotel Name *" placeholder="e.g. Mountain View Resort" value={data.hotelName}
        onChangeText={(v: string) => onChange({ ...data, hotelName: v })}
        focused={focused} name="hotelName" setFocused={setFocused} />
      <TextField label="Location / Address *" placeholder="e.g. Manali, Himachal Pradesh" value={data.location}
        onChangeText={(v: string) => onChange({ ...data, location: v })}
        focused={focused} name="location" setFocused={setFocused} />
      <TextField label="Contact Number *" placeholder="e.g. +91 98765 43210" value={data.contactNumber}
        onChangeText={(v: string) => onChange({ ...data, contactNumber: v })}
        keyboardType="phone-pad" focused={focused} name="contactNumber" setFocused={setFocused} />
      <SingleSelectDropdown
        label="Property Type *"
        placeholder="Select property type"
        options={['Budget', 'Standard', 'Luxury', 'Hostel', 'Homestay', 'Resort', 'Guest House']}
        value={typeof data.propertyType === 'string' ? data.propertyType : (Array.isArray(data.propertyType) ? data.propertyType[0] ?? '' : '')}
        onChange={(v: string) => onChange({ ...data, propertyType: v })}
        focused={focused}
        name="propertyType"
        setFocused={setFocused}
      />
    </>
  );
}

// ─── Rental fields (Part 1) ─────────────────────────────
function RentalFormPart1({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const [focused, setFocused] = useState<string | null>(null);
  return (
    <>
      <TextField label="Shop / Business Name *" placeholder="e.g. Himalayan Rentals" value={data.shopName}
        onChangeText={(v: string) => onChange({ ...data, shopName: v })}
        focused={focused} name="shopName" setFocused={setFocused} />
      <TextField label="Location *" placeholder="e.g. Mall Road, Manali" value={data.location}
        onChangeText={(v: string) => onChange({ ...data, location: v })}
        focused={focused} name="location" setFocused={setFocused} />
      <TextField label="Contact Number *" placeholder="e.g. +91 98765 43210" value={data.contactNumber}
        onChangeText={(v: string) => onChange({ ...data, contactNumber: v })}
        keyboardType="phone-pad" focused={focused} name="contactNumber" setFocused={setFocused} />
      <MultiSelectDropdown 
        label="Vehicle Types *" 
        placeholder="Select vehicle types"
        options={['Scooter / Activa', 'Royal Enfield', 'Sports Bike', 'Cruiser Bike', 'Mountain Bike (MTB)', 'Electric Scooter', 'Standard Bike', 'Dirt Bike']}
        selected={Array.isArray(data.vehicleTypes) ? data.vehicleTypes : (data.vehicleTypes ? data.vehicleTypes.split(',').map((s:string) => s.trim()) : [])}
        onChange={(v: string[]) => onChange({ ...data, vehicleTypes: v })}
        focused={focused}
        name="vehicleTypes"
        setFocused={setFocused}
      />
    </>
  );
}

// ─── Main screen ─────────────────────────────────────────
export default function ProfileSetupScreen() {
  const { profile } = useAuthStore();
  const params = useLocalSearchParams();
  const initialData = params.formData ? JSON.parse(params.formData as string) : {};
  const [formData, setFormData] = useState<Record<string, any>>(initialData);

  const role = profile?.role ?? 'guide';

  const isFormValid = () => {
    if (role === 'guide') {
      const languagesCount = Array.isArray(formData.languages) ? formData.languages.length : (typeof formData.languages === 'string' && formData.languages.length > 0 ? 1 : 0);
      return !!(
        formData.experience?.toString().trim() &&
        formData.location?.trim() &&
        languagesCount > 0
      );
    } else if (role === 'hotel') {
      const propType = typeof formData.propertyType === 'string'
        ? formData.propertyType
        : (Array.isArray(formData.propertyType) ? formData.propertyType[0] : '');
      return !!(
        formData.hotelName?.trim() &&
        formData.location?.trim() &&
        formData.contactNumber?.trim() &&
        propType?.trim()
      );
    } else if (role === 'rental') {
      const vehiclesCount = Array.isArray(formData.vehicleTypes) ? formData.vehicleTypes.length : (typeof formData.vehicleTypes === 'string' && formData.vehicleTypes.trim().length > 0 ? 1 : 0);
      return !!(
        formData.shopName?.trim() &&
        formData.location?.trim() &&
        formData.contactNumber?.trim() &&
        vehiclesCount > 0
      );
    }
    return false;
  };

  const isValid = isFormValid();

  const handleNext = () => {
    if (!isValid) return;
    router.push({
      pathname: '/onboarding/profile-setup-2',
      params: { formData: JSON.stringify(formData) }
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color={Colors.primary} size={20} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.stepBadge}>
          <Text style={styles.stepText}>Step 3 of 5</Text>
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
          <Text style={styles.heading}>Basic Information</Text>
          <Text style={styles.subheading}>
            Let's start with some basic details about your business.
          </Text>

          {role === 'guide' && (
            <GuideFormPart1 data={formData} onChange={setFormData} />
          )}
          {role === 'hotel' && (
            <HotelFormPart1 data={formData} onChange={setFormData} />
          )}
          {role === 'rental' && (
            <RentalFormPart1 data={formData} onChange={setFormData} />
          )}

          <TouchableOpacity
            style={[styles.saveBtn, !isValid && styles.saveBtnDisabled]}
            onPress={handleNext}
            disabled={!isValid}
            activeOpacity={0.85}
          >
            <View style={styles.saveBtnContent}>
              <Text style={styles.saveBtnText}>Continue</Text>
              <ArrowRight color={Colors.white} size={20} />
            </View>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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


