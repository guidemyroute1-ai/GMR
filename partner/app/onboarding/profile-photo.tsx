import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { Spacing, Radius, FontSize } from '../../constants/theme';
import { useAuthStore } from '../../store/useAuthStore';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Image as ImageIcon, ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import { updateUserProfile, uploadToSupabase } from '../../services/auth';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { AlertService } from '@/contexts/AlertContext';

export default function ProfilePhotoScreen() {
  const { user, profile, setProfile } = useAuthStore();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const pickImage = async (type: 'profile' | 'cover') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      aspect: type === 'profile' ? [1, 1] : [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      const uri = result.assets[0].uri;
      if (type === 'profile') setProfileImage(uri);
      else setCoverImage(uri);
    }
  };

  const takePhoto = async (type: 'profile' | 'cover') => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      AlertService.alert('Permission needed', 'Camera permission is required to take photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      aspect: type === 'profile' ? [1, 1] : [16, 9],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0].uri) {
      if (type === 'profile') setProfileImage(result.assets[0].uri);
      else setCoverImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!profileImage) {
      AlertService.alert('Required', 'Please upload a profile photo.');
      return;
    }

    setLoading(true);
    try {
      const currentData = profile?.profileData || {};
      
      let profileUrl = profileImage;
      if (!profileUrl.startsWith('http')) {
        profileUrl = await uploadToSupabase(profileImage, 'image/jpeg', `profile-${Date.now()}.jpg`, 'avatars');
      }

      let coverUrl = coverImage;
      if (coverImage && !coverImage.startsWith('http')) {
        coverUrl = await uploadToSupabase(coverImage, 'image/jpeg', `cover-${Date.now()}.jpg`, 'avatars');
      }

      const updatedData = { ...currentData, profileImage: profileUrl, coverImage: coverUrl };
      await updateUserProfile(user.uid, { profileData: updatedData });
      setProfile({ ...profile!, profileData: updatedData });
      router.push('/onboarding/upload-docs');
    } catch (error) {
      AlertService.alert('Error', 'Failed to save photos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.safe, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color={Colors.primary} size={20} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.stepBadge}>
          <Text style={styles.stepText}>Step 5 of 6</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Animated.View entering={FadeInDown.duration(600).springify()}>
          <Text style={styles.title}>Add Your Photos</Text>
          <Text style={styles.subtitle}>Help travelers recognize you by adding a clear profile photo.</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).springify().delay(100)} style={styles.section}>
          <Text style={styles.label}>Profile Photo *</Text>
          <View style={styles.photoContainer}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profilePreview} />
            ) : (
              <View style={[styles.profilePreview, styles.placeholder]}>
                <ImageIcon color={Colors.textMuted} size={40} />
              </View>
            )}
          </View>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => pickImage('profile')}>
              <ImageIcon color={Colors.primary} size={20} />
              <Text style={styles.actionText}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => takePhoto('profile')}>
              <Camera color={Colors.primary} size={20} />
              <Text style={styles.actionText}>Camera</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).springify().delay(200)} style={styles.section}>
          <Text style={styles.label}>Cover Photo (Optional)</Text>
          <View style={styles.photoContainer}>
            {coverImage ? (
              <Image source={{ uri: coverImage }} style={styles.coverPreview} />
            ) : (
              <View style={[styles.coverPreview, styles.placeholder]}>
                <ImageIcon color={Colors.textMuted} size={40} />
              </View>
            )}
          </View>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => pickImage('cover')}>
              <ImageIcon color={Colors.primary} size={20} />
              <Text style={styles.actionText}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => takePhoto('cover')}>
              <Camera color={Colors.primary} size={20} />
              <Text style={styles.actionText}>Camera</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).springify().delay(300)}>
          <TouchableOpacity 
          style={[styles.saveBtn, (!profileImage || loading) && styles.saveBtnDisabled]} 
          onPress={handleSave}
          disabled={!profileImage || loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <View style={styles.saveBtnContent}>
              <CheckCircle2 color={Colors.white} size={20} />
              <Text style={styles.saveBtnText}>Continue</Text>
            </View>
          )}
        </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  stepBadge: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  stepText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  container: {
    padding: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.base,
    color: Colors.textMuted,
    marginBottom: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  profilePreview: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  coverPreview: {
    width: '100%',
    height: 200,
    borderRadius: Radius.md,
  },
  placeholder: {
    backgroundColor: Colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionText: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  saveBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.full,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: Spacing.md,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
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
