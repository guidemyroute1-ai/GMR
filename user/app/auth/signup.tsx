import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../components/Text';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#16A34A',
  primaryDark: '#15803D',
  white: '#FFFFFF',
  black: '#000000',
  bg: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  error: '#EF4444',
  inputBg: '#F8FAFC',
};

const SHADOW = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  }
};

export default function SignUpScreen() {
  const router = useRouter();
  const { signUpWithEmail, signInWithGoogle } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSignUp = async () => {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Missing Email', 'Please enter your email address.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match. Please try again.');
      return;
    }

    setLoading(true);
    try {
      await signUpWithEmail(email.trim(), password, name.trim());
      // User is now signed in — _layout auth guard will redirect to home automatically
    } catch (err: any) {
      const message = err?.message || 'Sign up failed. Please try again.';
      Alert.alert('Sign Up Failed', message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      const message = err?.message || '';
      // Ignore user-cancelled flows
      if (
        message.toLowerCase().includes('cancel') ||
        message.toLowerCase().includes('cancelled') ||
        message.toLowerCase().includes('closed')
      ) {
        return;
      }
      Alert.alert('Google Sign-In Failed', message || 'Could not sign in with Google.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <View style={styles.flex}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >

          {/* HEADER SECTION (Gradient Background) */}
          <View style={styles.headerContainer}>
            <LinearGradient
              colors={['#E5F6DF', '#F8FAFC']}
              style={StyleSheet.absoluteFillObject}
            />
            {/* Subtle decorative circles */}
            <View style={styles.headerDecor1} />
            <View style={styles.headerDecor2} />

            <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
              <View style={styles.headerContent}>
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>Join thousands of travellers exploring smarter</Text>
              </View>
            </SafeAreaView>
          </View>

          {/* FORM CARD (Overlaps header) */}
          <View style={styles.card}>
            {/* Full Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>FULL NAME</Text>
              <View style={styles.inputRow}>
                <Ionicons name="person" size={20} color={COLORS.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Your full name"
                  placeholderTextColor={COLORS.textMuted}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>EMAIL</Text>
              <View style={styles.inputRow}>
                <Ionicons name="mail" size={20} color={COLORS.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter Your Mail Here"
                  placeholderTextColor={COLORS.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>PASSWORD</Text>
              <View style={styles.inputRow}>
                <Ionicons name="lock-closed" size={20} color={COLORS.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Min. 6 characters"
                  placeholderTextColor={COLORS.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  returnKeyType="next"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={COLORS.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>CONFIRM PASSWORD</Text>
              <View style={styles.inputRow}>
                <Ionicons name="lock-closed" size={20} color={COLORS.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter your password"
                  placeholderTextColor={COLORS.textMuted}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirm}
                  returnKeyType="done"
                  onSubmitEditing={handleSignUp}
                />
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
                  <Ionicons
                    name={showConfirm ? 'eye-off' : 'eye'}
                    size={20}
                    color={COLORS.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              style={[styles.primaryBtnContainer, loading && styles.btnDisabled]}
              onPress={handleSignUp}
              disabled={loading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#22C55E', '#15803D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryBtn}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Text style={styles.primaryBtnText}>Create Account</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or sign up with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google */}
            <TouchableOpacity
              style={[styles.googleBtn, googleLoading && styles.btnDisabled]}
              onPress={handleGoogleSignUp}
              disabled={googleLoading}
              activeOpacity={0.85}
            >
              {googleLoading ? (
                <ActivityIndicator color={COLORS.textPrimary} size="small" />
              ) : (
                <>
                  <Text style={styles.googleBtnText}>Continue with </Text>
                  <Image source={require('@/assets/svg/Google.png')} style={styles.googleIcon} />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.replace('/auth/login')} activeOpacity={0.7}>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingBottom: 48, flexGrow: 1 },

  headerContainer: {
    paddingBottom: 60,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  headerSafeArea: {
    paddingTop: Platform.OS === 'android' ? 20 : 0,
  },
  headerDecor1: {
    position: 'absolute',
    top: -50,
    right: -30,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  headerDecor2: {
    position: 'absolute',
    top: 60,
    left: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 20,
  },

  title: { fontSize: 32, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 8 },
  subtitle: { fontSize: 16, color: COLORS.textSecondary, fontWeight: '500' },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 32,
    padding: 26,
    marginHorizontal: 16,
    marginTop: -60, // Overlaps the header more dynamically
    borderWidth: 1,
    borderColor: '#FFFFFF',
    ...SHADOW.lg,
  },

  fieldGroup: { marginBottom: 24 },
  label: { 
    fontSize: 11, 
    fontWeight: '800', 
    color: COLORS.textMuted, 
    marginBottom: 8,
    letterSpacing: 1.5,
    marginLeft: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9', // softer, borderless look
    borderRadius: 20,
    paddingHorizontal: 18,
    height: 50,
  },
  inputIcon: { marginRight: 14 },
  input: { flex: 1, fontSize: 16, color: COLORS.textPrimary, height: '100%', fontWeight: '500' },
  eyeBtn: { padding: 4 },

  primaryBtnContainer: {
    marginTop: 16,
    marginBottom: 15,
    borderRadius: 20,
    ...SHADOW.lg,
    shadowColor: COLORS.primary, // glowing shadow
    shadowOpacity: 0.3,
  },
  primaryBtn: {
    borderRadius: 20,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: COLORS.white, fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },
  btnDisabled: { opacity: 0.6 },

  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { fontSize: 13, color: COLORS.textMuted, marginHorizontal: 16, fontWeight: '600' },

  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    height: 60,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    ...SHADOW.sm,
  },
  googleBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  googleIcon: {
    width: 50,
    height: 24,
    resizeMode: 'contain',
    marginLeft: 5,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '500' },
  footerLink: { fontSize: 15, fontWeight: '700', color: COLORS.primary },

  developerBadge: {
    alignSelf: 'center',
    marginTop: 40,
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOW.sm,
  },
  developerText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
