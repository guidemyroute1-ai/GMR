import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
 
} from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Spacing, Radius, FontSize } from '../../constants/theme';
import { registerUser, createUserDoc } from '../../services/auth';
import { useAuthStore } from '../../store/useAuthStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ArrowRight } from 'lucide-react-native';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const { user, profile, setUser, setProfile } = useAuthStore();
  const role = profile?.role ?? 'guide';
  const insets = useSafeAreaInsets();

  // If user is already authenticated (e.g. via Google), prefill their info
  React.useEffect(() => {
    if (user) {
      if (user.displayName) setName(user.displayName);
      if (user.email) setEmail(user.email);
    }
  }, [user]);

  const emailRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const passRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Missing Fields', 'Please fill in your name and email.');
      return;
    }

    if (!phone.trim()) {
      Alert.alert('Required Field', 'Phone number is required for listing partners.');
      return;
    }

    const cleanedPhone = phone.replace(/\D/g, '');
    if (cleanedPhone.length < 8) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid phone number.');
      return;
    }

    if (!user) {
      if (!password || !confirmPassword) {
        Alert.alert('Missing Fields', 'Please fill in password fields.');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('Password Mismatch', 'Passwords do not match.');
        return;
      }
      if (password.length < 6) {
        Alert.alert('Weak Password', 'Password must be at least 6 characters.');
        return;
      }
    }

    setLoading(true);
    try {
      let uid = user?.uid;
      
      if (!user) {
        const newUser = await registerUser(email.trim(), password);
        setUser(newUser);
        uid = newUser.uid;
      }

      if (uid) {
        await createUserDoc(uid, name.trim(), email.trim(), phone.trim(), role);
        setProfile({
          id: uid,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          role,
          isOnboarded: false,
          isApproved: false,
          hasUploadedDocs: false,
          profileData: {},
          createdAt: null as any,
        });
        router.push('/onboarding/profile-setup');
      }
    } catch (err: any) {
      console.error("Registration failed:", err);
      Alert.alert('Registration Failed', err.message || 'Registration failed. Please try again.');
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
          <Text style={styles.stepText}>Step 2 of 3</Text>
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
          <Text style={styles.heading}>Create your{'\n'}account</Text>
          <Text style={styles.subheading}>
            Partner as a{' '}
            <Text style={{ color: Colors.primary, fontWeight: '700' }}>
              {role === 'guide' ? 'Tour Guide' : role === 'hotel' ? 'Hotel Owner' : 'Vehicle Rental'}
            </Text>
          </Text>

          {/* Full Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={[styles.input, focusedField === 'name' && styles.inputFocused]}
              placeholder="Your full name"
              placeholderTextColor={Colors.textLight}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              returnKeyType="next"
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField(null)}
              onSubmitEditing={() => emailRef.current?.focus()}
            />
          </View>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              ref={emailRef}
              style={[styles.input, focusedField === 'email' && styles.inputFocused]}
              placeholder="you@example.com"
              placeholderTextColor={Colors.textLight}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              onSubmitEditing={() => phoneRef.current?.focus()}
            />
          </View>

          {/* Phone */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              ref={phoneRef}
              style={[styles.input, focusedField === 'phone' && styles.inputFocused]}
              placeholder="+91 98765 43210"
              placeholderTextColor={Colors.textLight}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              returnKeyType={user ? "done" : "next"}
              onFocus={() => setFocusedField('phone')}
              onBlur={() => setFocusedField(null)}
              onSubmitEditing={() => user ? handleRegister() : passRef.current?.focus()}
            />
          </View>

          {/* Passwords - Only show if not logged in via Google/SSO */}
          {!user && (
            <>
              {/* Password */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  ref={passRef}
                  style={[styles.input, focusedField === 'password' && styles.inputFocused]}
                  placeholder="Min. 6 characters"
                  placeholderTextColor={Colors.textLight}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  returnKeyType="next"
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  onSubmitEditing={() => confirmRef.current?.focus()}
                />
              </View>

              {/* Confirm Password */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <TextInput
                  ref={confirmRef}
                  style={[styles.input, focusedField === 'confirm' && styles.inputFocused]}
                  placeholder="Re-enter password"
                  placeholderTextColor={Colors.textLight}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  returnKeyType="done"
                  onFocus={() => setFocusedField('confirm')}
                  onBlur={() => setFocusedField(null)}
                  onSubmitEditing={handleRegister}
                />
              </View>
            </>
          )}

          {/* Submit */}
          <TouchableOpacity
            style={[styles.registerBtn, loading && styles.registerBtnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <View style={styles.registerBtnContent}>
                <Text style={styles.registerBtnText}>Continue</Text>
                <ArrowRight color={Colors.white} size={20} />
              </View>
            )}
          </TouchableOpacity>

          {/* Already have account - only show if not logged in via Google/SSO */}
          {!user && (
            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => router.replace('/auth/login')}
            >
              <Text style={styles.loginLinkText}>
                Already a partner?{' '}
                <Text style={{ color: Colors.primary, fontWeight: '700' }}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          )}
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
    marginBottom: Spacing.xl,
  },
  fieldGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputFocused: {
    backgroundColor: Colors.white,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 2,
  },
  registerBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: Spacing.lg,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 4,
  },
  registerBtnDisabled: {
    opacity: 0.7,
  },
  registerBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  registerBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 24,
    paddingBottom: 40,
  },
  loginLinkText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
});
