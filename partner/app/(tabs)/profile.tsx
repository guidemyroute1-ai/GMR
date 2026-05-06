import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/useAuthStore';
import { Colors } from '../../constants/colors';
import { Spacing, Radius, FontSize } from '../../constants/theme';
import { signOut as signOutUser, updateUserProfile } from '../../services/auth';

import { Mail, Phone, Clipboard, Bell, Lock, HelpCircle, FileText, LogOut, ChevronRight, Compass, Hotel, Bike, Edit2 } from 'lucide-react-native';

export default function ProfileScreen() {
  const { user, profile, setUser, setProfile, reset, refreshProfile } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile?.name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [saving, setSaving] = useState(false);

  const [editingBusiness, setEditingBusiness] = useState(false);
  const [businessData, setBusinessData] = useState<Record<string, any>>(profile?.profileData ?? {});
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshProfile();
    } catch (error) {
      console.warn('Refresh profile failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const role = profile?.role ?? 'guide';
  const roleLabel = role === 'guide' ? 'Tour Guide' : role === 'hotel' ? 'Hotel Owner' : 'Rental Owner';
  const RoleIcon = role === 'guide' ? Compass : role === 'hotel' ? Hotel : Bike;
  const roleColor =
    role === 'guide' ? Colors.roleGuide : role === 'hotel' ? Colors.roleHotel : Colors.roleRental;

  const profileData = profile?.profileData ?? {};

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateUserProfile(user.uid, { name: name.trim(), phone: phone.trim() });
      setProfile({ ...profile!, name: name.trim(), phone: phone.trim() });
      setEditing(false);
    } catch {
      Alert.alert('Error', 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBusiness = async () => {
    if (!user) return;
    setSavingBusiness(true);
    try {
      await updateUserProfile(user.uid, { profileData: businessData });
      setProfile({ ...profile!, profileData: businessData });
      setEditingBusiness(false);
    } catch {
      Alert.alert('Error', 'Could not save business profile.');
    } finally {
      setSavingBusiness(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setSigningOut(true);
          try {
            await signOutUser();
            reset();
            router.replace('/auth/login');
          } catch {
            Alert.alert('Error', 'Sign out failed.');
          } finally {
            setSigningOut(false);
          }
        },
      },
    ]);
  };

  // Build display rows from profileData
  const profileRows = Object.entries(profileData)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([key, value]) => ({
      key,
      label: key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (s) => s.toUpperCase()),
      value: Array.isArray(value) ? value.join(', ') : String(value),
    }));

  return (
    <View style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Gradient header */}
        <View style={[styles.headerBg, { backgroundColor: roleColor }]}>
          {/* Avatar */}
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile?.name?.charAt(0).toUpperCase() ?? '?'}
              </Text>
            </View>
          </View>

          <Text style={styles.partnerName}>{profile?.name ?? 'Partner'}</Text>

          <View style={styles.roleBadge}>
            <RoleIcon color={Colors.white} size={14} />
            <Text style={styles.roleLabel}>{roleLabel}</Text>
          </View>

          <Text style={styles.email}>{profile?.email}</Text>
        </View>

        <View style={styles.content}>
          {/* Edit / Save toggle */}
          {!editing ? (
            <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)}>
              <Edit2 color={Colors.primary} size={16} />
              <Text style={styles.editBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.editForm}>
              <Text style={styles.editTitle}>Edit Basic Info</Text>

              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={Colors.textLight}
              />

              <Text style={[styles.label, { marginTop: Spacing.md }]}>Phone</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Phone number"
                placeholderTextColor={Colors.textLight}
                keyboardType="phone-pad"
              />

              <View style={styles.editActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => {
                    setName(profile?.name ?? '');
                    setPhone(profile?.phone ?? '');
                    setEditing(false);
                  }}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color={Colors.white} size="small" />
                  ) : (
                    <Text style={styles.saveText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Partner details section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Info</Text>
            <ProfileRow label="Email" value={profile?.email ?? ''} Icon={Mail} />
            <ProfileRow label="Phone" value={profile?.phone ?? ''} Icon={Phone} />
          </View>

          {/* Business Profile section */}
          {Object.keys(profile?.profileData || {}).length > 0 && (
            <View style={styles.section}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm }}>
                <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Business Profile</Text>
                {!editingBusiness && (
                  <TouchableOpacity onPress={() => {
                    setBusinessData(profile?.profileData ?? {});
                    setEditingBusiness(true);
                  }}>
                    <Edit2 color={Colors.primary} size={16} />
                  </TouchableOpacity>
                )}
              </View>

              {editingBusiness ? (
                <View style={{ marginTop: Spacing.sm }}>
                  {Object.entries(businessData).map(([key, value]) => (
                    <View key={key} style={{ marginBottom: Spacing.md }}>
                      <Text style={styles.label}>
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                      </Text>
                      <TextInput
                        style={styles.input}
                        value={Array.isArray(value) ? value.join(', ') : String(value || '')}
                        onChangeText={(text) => {
                          setBusinessData((prev) => ({
                            ...prev,
                            [key]: Array.isArray(prev[key]) ? text.split(',').map((s) => s.trim()) : text,
                          }));
                        }}
                        placeholder={`Enter ${key}`}
                        placeholderTextColor={Colors.textLight}
                      />
                    </View>
                  ))}

                  <View style={styles.editActions}>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => {
                        setBusinessData(profile?.profileData ?? {});
                        setEditingBusiness(false);
                      }}
                    >
                      <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.saveBtn, savingBusiness && { opacity: 0.7 }]}
                      onPress={handleSaveBusiness}
                      disabled={savingBusiness}
                    >
                      {savingBusiness ? (
                        <ActivityIndicator color={Colors.white} size="small" />
                      ) : (
                        <Text style={styles.saveText}>Save</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                profileRows.length > 0 ? (
                  profileRows.map((row) => (
                    <ProfileRow key={row.key} label={row.label} value={row.value} Icon={Clipboard} />
                  ))
                ) : (
                  <Text style={{ color: Colors.textMuted, fontSize: FontSize.sm, paddingVertical: Spacing.sm }}>
                    No business profile data available.
                  </Text>
                )
              )}
            </View>
          )}

          {/* Account section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <TouchableOpacity style={styles.menuItem}>
              <Bell color={Colors.text} size={18} />
              <Text style={styles.menuLabel}>Notifications</Text>
              <ChevronRight color={Colors.textLight} size={20} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <Lock color={Colors.text} size={18} />
              <Text style={styles.menuLabel}>Change Password</Text>
              <ChevronRight color={Colors.textLight} size={20} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <HelpCircle color={Colors.text} size={18} />
              <Text style={styles.menuLabel}>Help & Support</Text>
              <ChevronRight color={Colors.textLight} size={20} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <FileText color={Colors.text} size={18} />
              <Text style={styles.menuLabel}>Terms & Privacy</Text>
              <ChevronRight color={Colors.textLight} size={20} />
            </TouchableOpacity>
          </View>

          {/* Sign out */}
          <TouchableOpacity
            style={[styles.signOutBtn, signingOut && { opacity: 0.7 }]}
            onPress={handleSignOut}
            disabled={signingOut}
            activeOpacity={0.85}
          >
            {signingOut ? (
              <ActivityIndicator color={Colors.error} />
            ) : (
              <View style={styles.signOutContent}>
                <LogOut color={Colors.error} size={18} />
                <Text style={styles.signOutText}>Sign Out</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.version}>Guide My Route Partners v1.0</Text>
          <View style={styles.developerContainer}>
            <Text style={styles.developedBy}>Developed by</Text>
            <Text style={styles.developerName}>Mohit Aggarwal</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function ProfileRow({ label, value, Icon }: { label: string; value: string; Icon: any }) {
  if (!value) return null;
  return (
    <View style={prStyles.row}>
      <Icon color={Colors.textMuted} size={16} style={{ marginTop: 2 }} />
      <View style={prStyles.info}>
        <Text style={prStyles.label}>{label}</Text>
        <Text style={prStyles.value}>{value}</Text>
      </View>
    </View>
  );
}

const prStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  info: { flex: 1 },
  label: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '600', marginBottom: 2 },
  value: { fontSize: FontSize.base, color: Colors.text, fontWeight: '500' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  headerBg: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 36,
    paddingHorizontal: Spacing.lg,
  },
  avatarRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.primary,
  },
  partnerName: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
    gap: 5,
    marginBottom: 8,
  },
  roleLabel: { fontSize: FontSize.sm, color: Colors.white, fontWeight: '700' },
  email: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.75)' },
  content: { padding: Spacing.md, marginTop: -20 },
  editBtn: {
    backgroundColor: Colors.white,
    borderRadius: Radius.full,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  editBtnText: { fontSize: FontSize.base, fontWeight: '700', color: Colors.primary },
  editForm: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  editTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  label: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text, marginBottom: 6 },
  input: {
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: FontSize.base,
    color: Colors.text,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  editActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  cancelBtn: {
    flex: 1,
    borderRadius: Radius.full,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  cancelText: { color: Colors.textMuted, fontWeight: '600', fontSize: FontSize.base },
  saveBtn: {
    flex: 1,
    backgroundColor: Colors.accent,
    borderRadius: Radius.full,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveText: { color: Colors.white, fontWeight: '700', fontSize: FontSize.base },
  section: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  menuLabel: { flex: 1, fontSize: FontSize.base, color: Colors.text, fontWeight: '500' },
  signOutBtn: {
    backgroundColor: Colors.statusRejected,
    borderRadius: Radius.lg,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.error,
  },
  signOutContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  signOutText: { color: Colors.error, fontSize: FontSize.md, fontWeight: '700' },
  version: {
    textAlign: 'center',
    fontSize: FontSize.xs,
    color: Colors.textLight,
    marginBottom: 8,
  },
  developerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  developedBy: {
    fontSize: FontSize.xs || 10,
    color: Colors.textLight,
    fontWeight: '500',
    marginBottom: 2,
  },
  developerName: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: '700',
  },
});
