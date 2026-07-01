import React, { useEffect, useState } from 'react';
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
import { useOnboardingStore } from '../../store/useOnboardingStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import { TextField, MultiSelectDropdown, SingleSelectDropdown } from '../../components/FormFields';
import { DEFAULT_CITIES, fetchAvailableCities } from '../../services/cities';

// ─── Guide fields (Part 1) ──────────────────────────────
function GuideFormPart1({ data, onChange, cityOptions }: { data: any; onChange: (d: any) => void; cityOptions: string[] }) {
  const [focused, setFocused] = useState<string | null>(null);
  return (
    <>
      <TextField label="Years of Experience *" placeholder="e.g. 5" value={data.experience}
        onChangeText={(v: string) => onChange({ ...data, experience: v })}
        keyboardType="numeric" focused={focused} name="experience" setFocused={setFocused} />
      <SingleSelectDropdown
        label="City *"
        placeholder="Select city"
        options={cityOptions}
        value={data.city || data.location || ''}
        onChange={(v: string) => onChange({ ...data, city: v, location: v })}
        focused={focused}
        name="city"
        setFocused={setFocused}
      />
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
function HotelFormPart1({ data, onChange, cityOptions }: { data: any; onChange: (d: any) => void; cityOptions: string[] }) {
  const [focused, setFocused] = useState<string | null>(null);
  return (
    <>
      <TextField label="Hotel Name *" placeholder="e.g. Mountain View Resort" value={data.hotelName}
        onChangeText={(v: string) => onChange({ ...data, hotelName: v })}
        focused={focused} name="hotelName" setFocused={setFocused} />
      <SingleSelectDropdown
        label="City *"
        placeholder="Select city"
        options={cityOptions}
        value={data.city || data.location || ''}
        onChange={(v: string) => onChange({ ...data, city: v, location: v })}
        focused={focused}
        name="city"
        setFocused={setFocused}
      />
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
function RentalFormPart1({ data, onChange, cityOptions }: { data: any; onChange: (d: any) => void; cityOptions: string[] }) {
  const [focused, setFocused] = useState<string | null>(null);
  return (
    <>
      <TextField label="Shop / Business Name *" placeholder="e.g. Himalayan Rentals" value={data.shopName}
        onChangeText={(v: string) => onChange({ ...data, shopName: v })}
        focused={focused} name="shopName" setFocused={setFocused} />
      <SingleSelectDropdown
        label="City *"
        placeholder="Select city"
        options={cityOptions}
        value={data.city || data.location || ''}
        onChange={(v: string) => onChange({ ...data, city: v, location: v })}
        focused={focused}
        name="city"
        setFocused={setFocused}
      />
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
  const { data: formData, updateData: setFormData } = useOnboardingStore();
  const [cityOptions, setCityOptions] = useState<string[]>(DEFAULT_CITIES);

  const role = formData.role || profile?.role || 'guide';
  const insets = useSafeAreaInsets();

  useEffect(() => {
    let active = true;
    fetchAvailableCities().then((cities) => {
      if (!active) return;
      setCityOptions(cities);
      setFormData((current: any)  => {
        const currentCity = current.city || current.location;
        if (currentCity && cities.includes(currentCity)) return current;
        if (cities.length === 0) return current;
        return { ...current, city: cities[0], location: cities[0] };
      });
    });
    return () => {
      active = false;
    };
  }, []);

  const isFormValid = () => {
    if (role === 'guide') {
      const languagesCount = Array.isArray(formData.languages) ? formData.languages.length : (typeof formData.languages === 'string' && formData.languages.length > 0 ? 1 : 0);
      return !!(
        formData.experience?.toString().trim() &&
        (formData.city?.trim() || formData.location?.trim()) &&
        languagesCount > 0
      );
    } else if (role === 'hotel') {
      const propType = typeof formData.propertyType === 'string'
        ? formData.propertyType
        : (Array.isArray(formData.propertyType) ? formData.propertyType[0] : '');
      return !!(
        formData.hotelName?.trim() &&
        (formData.city?.trim() || formData.location?.trim()) &&
        formData.contactNumber?.trim() &&
        propType?.trim()
      );
    } else if (role === 'rental') {
      const vehiclesCount = Array.isArray(formData.vehicleTypes) ? formData.vehicleTypes.length : (typeof formData.vehicleTypes === 'string' && formData.vehicleTypes.trim().length > 0 ? 1 : 0);
      return !!(
        formData.shopName?.trim() &&
        (formData.city?.trim() || formData.location?.trim()) &&
        formData.contactNumber?.trim() &&
        vehiclesCount > 0
      );
    }
    return false;
  };

  const isValid = isFormValid();

  const handleNext = () => {
    if (!isValid) return;
    router.push('/onboarding/location-picker');
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
          <Text style={styles.stepText}>Step 2 of 6</Text>
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
            <GuideFormPart1 data={formData} onChange={setFormData} cityOptions={cityOptions} />
          )}
          {role === 'hotel' && (
            <HotelFormPart1 data={formData} onChange={setFormData} cityOptions={cityOptions} />
          )}
          {role === 'rental' && (
            <RentalFormPart1 data={formData} onChange={setFormData} cityOptions={cityOptions} />
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
