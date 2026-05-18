import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, ImageBackground, StatusBar, Image } from 'react-native';
import { Text } from '../../components/Text';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
  primary: '#16A34A',      // Forest Green
  primaryLight: '#4ADE80', // Lighter Green for icons
  iconBg: '#1B4332',       // Darker Green for icon background
  white: '#FFFFFF',
  textSecondary: '#D1D5DB', // Light gray
  glassBg: 'rgba(30, 30, 30, 0.65)',
};

const SPLASH_IMAGES = [
  require('../../assets/sp/sp1_1_11zon.png'),
  require('../../assets/sp/sp2_2_11zon.png'),
  require('../../assets/sp/sp3_3_11zon.png'),
  require('../../assets/sp/sp4_4_11zon.png'),
  require('../../assets/sp/sp5_5_11zon.png'),
  require('../../assets/sp/sp6_6_11zon.png'),
  require('../../assets/sp/sp7_7_11zon.png'),
];

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Pick a random image once per mount
  const backgroundImage = useMemo(
    () => SPLASH_IMAGES[Math.floor(Math.random() * SPLASH_IMAGES.length)],
    []
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ImageBackground
        source={backgroundImage}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.8)']}
          style={[
            styles.gradient,
            { paddingBottom: Math.max(insets.bottom, 20) + 20 }
          ]}
        >
          {/* ── Header Section (Logo/Title) ── */}
          <View style={styles.headerContainer}>
            <View style={styles.welcomeBadge}>
              <MaterialCommunityIcons name="shield-check-outline" size={14} color={COLORS.primaryLight} />
              <Text style={styles.welcomeBadgeText}>Verified travel partners</Text>
            </View>
            <View style={styles.logoPinContainer}>
              <Image 
                source={require('../../assets/images/gmr_logo.png')} 
                style={styles.welcomeLogo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.logoText}>
              Guide My <Text style={styles.logoTextGreen}>Route</Text>
            </Text>
            <Text style={styles.subtitle}>
              Book local guides, rentals and stays with a travel flow built for faster decisions.
            </Text>
          </View>

          {/* ── Features Card ── */}
          <View style={styles.featuresCard}>
            {/* Feature 1 */}
            <View style={styles.featureItem}>
              <View style={styles.iconBox}>
                <MaterialCommunityIcons name="account-check-outline" size={24} color={COLORS.primaryLight} />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Verified local guides</Text>
                <Text style={styles.featureDesc}>Find trusted people who know the city.</Text>
              </View>
            </View>

            {/* Feature 2 */}
            <View style={styles.featureItem}>
              <View style={styles.iconBox}>
                <MaterialCommunityIcons name="moped" size={24} color={COLORS.primaryLight} />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Bike, scooty and car rentals</Text>
                <Text style={styles.featureDesc}>Compare travel options without extra calls.</Text>
              </View>
            </View>

            {/* Feature 3 */}
            <View style={styles.featureItem}>
              <View style={styles.iconBox}>
                <MaterialCommunityIcons name="map-marker-path" size={24} color={COLORS.primaryLight} />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Plans that match your route</Text>
                <Text style={styles.featureDesc}>Move from exploring to booking quickly.</Text>
              </View>
            </View>

            <View style={styles.assuranceRow}>
              <View style={styles.assuranceItem}>
                <Text style={styles.assuranceValue}>Fast</Text>
                <Text style={styles.assuranceLabel}>booking</Text>
              </View>
              <View style={styles.assuranceDivider} />
              <View style={styles.assuranceItem}>
                <Text style={styles.assuranceValue}>Local</Text>
                <Text style={styles.assuranceLabel}>support</Text>
              </View>
              <View style={styles.assuranceDivider} />
              <View style={styles.assuranceItem}>
                <Text style={styles.assuranceValue}>Secure</Text>
                <Text style={styles.assuranceLabel}>checkout</Text>
              </View>
            </View>
          </View>

          {/* ── Get Started Button ── */}
          <TouchableOpacity
            style={styles.getStartedButton}
            activeOpacity={0.85}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.getStartedText}>Get Started</Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color={COLORS.white} />
          </TouchableOpacity>

          {/* ── Login Link ── */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/login')} activeOpacity={0.7}>
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 80,
  },

  // Header
  headerContainer: {
    position: 'absolute',
    top: 64,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  welcomeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(10, 34, 24, 0.68)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 14,
  },
  welcomeBadgeText: {
    color: '#E5E7EB',
    fontSize: 12,
    fontWeight: '800',
  },
  logoPinContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  welcomeLogo: {
    width: 80,
    height: 80,
    borderRadius: 20,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#E5E7EB',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  logoTextGreen: {
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
    maxWidth: 310,
  },

  // Features Card
  featuresCard: {
    backgroundColor: COLORS.glassBg,
    borderRadius: 20,
    paddingTop: 18,
    paddingBottom: 16,
    paddingHorizontal: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  featureDesc: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  assuranceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    marginTop: 10,
    paddingVertical: 12,
  },
  assuranceItem: {
    flex: 1,
    alignItems: 'center',
  },
  assuranceValue: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 3,
  },
  assuranceLabel: {
    color: '#A7F3D0',
    fontSize: 11,
    fontWeight: '700',
  },
  assuranceDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },

  // Button
  getStartedButton: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  getStartedText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '700',
  },

  // Login link
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  loginText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  loginLink: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});
