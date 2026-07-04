import React from 'react';
import { View, StyleSheet, TouchableOpacity, StatusBar, Image } from 'react-native';
import { Text } from '../../components/Text';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Video, ResizeMode } from 'expo-av';

const COLORS = {
  primary: '#16A34A',      // Forest Green
  primaryLight: '#4ADE80', // Lighter Green for icons
  iconBg: '#1B4332',       // Darker Green for icon background
  white: '#FFFFFF',
  textSecondary: '#D1D5DB', // Light gray
  glassBg: 'rgba(30, 30, 30, 0.20)',
};

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <Video
        source={require('../../assets/sp/WhatsApp Video 2026-06-17 at 13.15.34.mp4')}
        style={styles.backgroundImage}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
        isMuted
      />

      <View style={StyleSheet.absoluteFillObject}>
        <LinearGradient
          colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.8)']}
          style={[
            styles.gradient,
            { paddingBottom: Math.max(insets.bottom, 20) + 20 }
          ]}
        >
          {/* ── Header Section (Logo/Title) ── */}
          <View style={styles.headerContainer}>
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

          

          {/* ── Get Started Button ── */}
          <TouchableOpacity
            style={styles.getStartedButtonContainer}
            activeOpacity={0.85}
            onPress={() => router.push('/auth/login')}
          >
            <LinearGradient
              colors={['#22C55E', '#15803D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.getStartedButton}
            >
              <Text style={styles.getStartedText}>Get Started</Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color={COLORS.white} />
            </LinearGradient>
          </TouchableOpacity>

          {/* ── Login Link ── */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/login')} activeOpacity={0.7}>
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
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
    fontSize: 32,
    fontWeight: '900',
    color: '#E5E7EB',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  logoTextGreen: {
    color: COLORS.primaryLight,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
    maxWidth: 310,
    letterSpacing: 0.5,
  },

  // Button
  getStartedButtonContainer: {
    marginBottom: 20,
    borderRadius: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  getStartedButton: {
    flexDirection: 'row',
    gap: 8,
    borderRadius: 20,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  getStartedText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  loginText: {
    color: '#D1D5DB',
    fontSize: 15,
  },
  loginLink: {
    color: COLORS.primaryLight,
    fontSize: 15,
    fontWeight: '800',
  },
  
  // Developer Badge
  devBadgeContainer: {
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  devBadgeText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '500',
  },
});
