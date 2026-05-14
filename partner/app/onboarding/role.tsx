import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Spacing, Radius, FontSize } from '../../constants/theme';
import { useAuthStore } from '../../store/useAuthStore';
import type { UserRole } from '../../services/auth';
import { Compass, Hotel, Bike, ArrowLeft, Check, ChevronRight } from 'lucide-react-native';
import { Text } from '../../components/Text';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const roles = [
  {
    id: 'guide' as UserRole,
    Icon: Compass,
    title: 'Tour Guide',
    description: 'Lead travelers on unique local experiences.',
    color: '#3B82F6',
  },
  {
    id: 'hotel' as UserRole,
    Icon: Hotel,
    title: 'Hotel Owner',
    description: 'Manage your property and guest bookings.',
    color: '#8B5CF6',
  },
  {
    id: 'rental' as UserRole,
    Icon: Bike,
    title: 'Vehicle Rental',
    description: 'Rent out your fleet to explorers.',
    color: '#10B981',
  },
];

export default function RoleScreen() {
  const [selected, setSelected] = useState<UserRole | null>(null);
  const { setProfile } = useAuthStore();

  const handleContinue = () => {
    if (!selected) return;
    setProfile({ role: selected } as any);
    router.push('/onboarding/register');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color={Colors.text} size={22} />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '25%' }]} />
          </View>
          <Text style={styles.stepLabel}>Step 1 of 4</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.heading}>How will you{'\n'}partner with us?</Text>
          <Text style={styles.subheading}>
            Select your primary business category. You can add more services later.
          </Text>

          <View style={styles.rolesContainer}>
            {roles.map((role) => {
              const isSelected = selected === role.id;
              const Icon = role.Icon;

              return (
                <TouchableOpacity
                  key={role.id}
                  activeOpacity={0.9}
                  onPress={() => setSelected(role.id)}
                  style={[
                    styles.roleCard,
                    isSelected && styles.roleCardSelected,
                  ]}
                >
                  <View style={[
                    styles.iconBox,
                    { backgroundColor: isSelected ? role.color : '#F1F5F9' }
                  ]}>
                    <Icon
                      color={isSelected ? Colors.white : Colors.textMuted}
                      size={24}
                    />
                  </View>

                  <View style={styles.roleInfo}>
                    <Text style={[
                      styles.roleTitle,
                      isSelected && styles.roleTitleSelected
                    ]}>
                      {role.title}
                    </Text>
                    <Text style={styles.roleDesc} numberOfLines={1}>
                      {role.description}
                    </Text>
                  </View>

                  <View style={[
                    styles.radio,
                    isSelected && { borderColor: role.color, backgroundColor: role.color }
                  ]}>
                    {isSelected ? (
                      <Check color={Colors.white} size={12} strokeWidth={4} />
                    ) : (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          disabled={!selected}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={selected ? ['#1E3A8A', '#2563EB'] : ['#E2E8F0', '#E2E8F0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.continueBtn}
          >
            <Text style={[styles.continueBtnText, !selected && { color: Colors.textLight }]}>
              Continue
            </Text>
            <ChevronRight color={selected ? Colors.white : Colors.textLight} size={18} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  progressContainer: {
    flex: 1,
    gap: 6,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scroll: {
    flexGrow: 1,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  heading: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.text,
    lineHeight: 38,
    letterSpacing: -1,
    marginBottom: Spacing.sm,
  },
  subheading: {
    fontSize: 15,
    color: Colors.textMuted,
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  rolesContainer: {
    gap: Spacing.md,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    backgroundColor: '#F8FAFC',
    gap: 16,
    marginBottom: Spacing.sm,
  },
  roleCardSelected: {
    backgroundColor: Colors.white,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 6,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleInfo: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  roleTitleSelected: {
    color: Colors.text,
  },
  roleDesc: {
    fontSize: 13,
    color: Colors.textLight,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 0,
    height: 0,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 40,
    paddingTop: 20,
  },
  continueBtn: {
    height: 60,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  continueBtnText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '700',
  },
});

