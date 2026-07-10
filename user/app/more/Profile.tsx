import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../components/Text';
import ScreenHeader from '../../components/ScreenHeader';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../utils/supabase';

// ─── Color Palette ─────────────────────────────────────────────────────────────
const COLORS = {
  primary: '#16A34A',
  teal: '#14B8A6',
  skyBlue: '#0EA5E9',
  orange: '#F97316',
  white: '#FFFFFF',
  lightGray: '#F1F5F9',
  darkGray: '#1F2937',
  mediumGray: '#6B7280',
  borderGray: '#d3dbe2',
  danger: '#EF4444',
  greenBg: '#F0FDF4',
  greenText: '#15803D',
};

const SHADOW = {
  sm: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  md: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 5 },
};

// ─── Types ─────────────────────────────────────────────────────────────────────
interface StatItem {
  label: string;
  value: string | number;
}

interface MenuItem {
  id: string;
  icon: string;
  iconSource?: any;
  label: string;
  subLabel?: string;
  type: 'navigate' | 'badge' | 'toggle' | 'danger';
  badge?: string;
  badgeColor?: string;
  badgeBg?: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

// ─── Menu Row ──────────────────────────────────────────────────────────────────
const MenuRow = ({
  item,
  isLast,
  notifEnabled,
  onToggle,
  onLogout,
  onPress,
}: {
  item: MenuItem;
  isLast: boolean;
  notifEnabled?: boolean;
  onToggle?: () => void;
  onLogout?: () => void;
  onPress?: () => void;
}) => {
  const isDanger = item.type === 'danger';

  return (
    <TouchableOpacity
      style={[styles.menuRow, isLast && styles.menuRowLast]}
      activeOpacity={0.7}
      onPress={isDanger ? onLogout : onPress}
    >
      <View
        style={[
          styles.menuIconBox,
          isDanger && { backgroundColor: '#FEE2E2' },
        ]}
      >
        {item.iconSource ? (
          <ExpoImage source={item.iconSource} style={{ width: 22, height: 22, tintColor: isDanger ? COLORS.danger : '#4B5563' }} contentFit="contain" />
        ) : (
          <Text style={styles.menuIcon}>{item.icon}</Text>
        )}
      </View>

      <View style={styles.menuTextContainer}>
        <Text style={[styles.menuLabel, isDanger && { color: COLORS.danger }]}>
          {item.label}
        </Text>
        {item.subLabel ? (
          <Text style={styles.menuSubLabel}>{item.subLabel}</Text>
        ) : null}
      </View>

      <View style={styles.menuRight}>
        {item.type === 'badge' && item.badge && (
          <View style={[styles.menuBadge, { backgroundColor: item.badgeBg }]}>
            <Text style={[styles.menuBadgeText, { color: item.badgeColor }]}>
              {item.badge}
            </Text>
          </View>
        )}
        {item.type === 'toggle' && (
          <Switch
            value={notifEnabled}
            onValueChange={onToggle}
            trackColor={{ false: COLORS.borderGray, true: '#86EFAC' }}
            thumbColor={notifEnabled ? COLORS.primary : COLORS.mediumGray}
          />
        )}
        {(item.type === 'navigate' || item.type === 'badge') && (
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        )}
        {item.type === 'danger' && (
          <Ionicons name="chevron-forward" size={18} color={COLORS.danger} />
        )}
      </View>
    </TouchableOpacity>
  );
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getProviderLabel(user: any): string {
  if (!user?.providerData?.length) return '';
  const providerId = user.providerData[0].providerId;
  if (providerId === 'google.com') return 'Google';
  if (providerId === 'password') return 'Email';
  return providerId;
}

// ─── Main ProfileScreen ────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [notifEnabled, setNotifEnabled] = useState<boolean>(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [tripsCount, setTripsCount] = useState<number>(0);
  const [reviewsCount, setReviewsCount] = useState<number>(0);
  const [userRating, setUserRating] = useState<number>(0);
  const [isOrganizerVerified, setIsOrganizerVerified] = useState<boolean>(false);
  const [organizerAppStatus, setOrganizerAppStatus] = useState<string | null>(null);

  const fetchStats = React.useCallback(async () => {
    if (!user?.uid) return;
    try {
      const { count: bookingsCount, error: bError } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.uid);
      if (!bError && bookingsCount !== null) {
        setTripsCount(bookingsCount);
      }

      const { count: revsCount, error: rError } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.uid);
      if (!rError && revsCount !== null) {
        setReviewsCount(revsCount);
      }

      const { data: userData, error: uError } = await supabase
        .from('users')
        .select('rating, is_trip_organizer_verified')
        .eq('id', user.uid)
        .maybeSingle();
      if (!uError && userData) {
        setUserRating(userData.rating || 0);
        setIsOrganizerVerified(userData.is_trip_organizer_verified || false);
      }

      if (!userData?.is_trip_organizer_verified) {
        const { data: appData } = await supabase
          .from('trip_organizer_applications')
          .select('status')
          .eq('user_id', user.uid)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (appData) {
          setOrganizerAppStatus(appData.status);
        }
      }
    } catch (err) {
      console.warn('Error fetching profile stats:', err);
    }
  }, [user?.uid]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        supabase.auth.getUser(),
        fetchStats()
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchStats]);

  React.useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const STATS: StatItem[] = [
    { label: 'Rating', value: userRating > 0 ? userRating.toFixed(1) : 'New' },
    { label: 'Trips Completed', value: tripsCount },
    { label: 'Reviews', value: reviewsCount },
  ];

  const displayName = user?.displayName || 'Traveller';
  const providerLabel = getProviderLabel(user);
  const isVerified = user?.emailVerified ?? false;

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          try {
            await signOut();
            router.replace('/auth/login');
          } catch {
            Alert.alert('Error', 'Could not log out. Please try again.');
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  const handleMenuPress = (item: MenuItem) => {
    if (item.id === '1') router.push('../more/personalInformation');
    else if (item.id === '3') router.push('../more/MyBookings');
    else if (item.id === '11') router.push('../extra/TermsPrivacy');
    else if (item.id === 'create_trip') router.push('../more/createTrip');
    else if (item.id === 'organizer_dashboard') router.push('../more/OrganizerDashboard');
    else if (item.id === 'become_organizer') {
      if (organizerAppStatus === 'pending') {
        Alert.alert('Application Pending', 'Your organizer application is currently being reviewed.');
      } else {
        router.push('../more/becomeOrganizer');
      }
    }
  };

  const getMenuSections = (): MenuSection[] => {
    const accountItems: MenuItem[] = [
      { id: '1', icon: '👤', label: 'Personal Information', subLabel: 'Update your details', type: 'navigate' },
      { id: '3', icon: '📋', iconSource: require('../../assets/svg/calender-svgrepo-com.svg'), label: 'My Bookings', subLabel: 'View and manage your trips', type: 'navigate' },
    ];

    if (isOrganizerVerified) {
      accountItems.push({
        id: 'create_trip', icon: '✈️', label: 'Create a Trip', subLabel: 'Host a new adventure',
        type: 'badge', badge: 'NEW', badgeBg: '#DCFCE7', badgeColor: COLORS.primary
      });
      accountItems.push({
        id: 'organizer_dashboard', icon: '📊', label: 'Organizer Dashboard', subLabel: 'Track trips and revenue',
        type: 'navigate'
      });
    } else {
      accountItems.push({
        id: 'become_organizer', icon: '🎯', label: 'Become a Trip Organizer', subLabel: 'Start hosting trips',
        type: organizerAppStatus === 'pending' ? 'badge' : 'navigate',
        badge: organizerAppStatus === 'pending' ? 'PENDING' : undefined, badgeBg: '#FEF3C7', badgeColor: '#D97706'
      });
    }

    accountItems.push(
      { id: '11', icon: '📄', iconSource: require('../../assets/svg/license-svgrepo-com.svg'), label: 'Terms & Privacy', subLabel: 'Legal and privacy policies', type: 'navigate' },
      { id: '12', icon: '🚪', iconSource: require('../../assets/svg/logout-2-svgrepo-com.svg'), label: 'Log Out', subLabel: 'Sign out securely', type: 'danger' }
    );
    return [{ title: 'Account Settings', items: accountItems }];
  };

  const MENU_SECTIONS = getMenuSections();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" translucent={false} />

      <View style={{ backgroundColor: '#ffffff', paddingTop: insets.top }}>
        <ScreenHeader
          title="Profile"
          showAvatar={false}
          showLocation={false}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* HEADER SECTION */}
        <View style={[styles.headerContainer, { paddingTop: 10 }]}>
          <LinearGradient
            colors={['#E5F6DF', '#F8FAFC']}
            style={StyleSheet.absoluteFillObject}
          />
          {/* Subtle background decoration to mimic mountain landscape */}
          <View style={styles.headerDecor1} />
          <View style={styles.headerDecor2} />

          {/* Profile Info */}
          <View style={styles.profileInfoContainer}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarCircle}>
                {user?.photoURL ? (
                  <ExpoImage
                    source={{ uri: user.photoURL }}
                    style={{ width: '100%', height: '100%', borderRadius: 35 }}
                    contentFit="cover"
                  />
                ) : (
                  <Text style={styles.avatarInitials}>{getInitials(displayName)}</Text>
                )}
              </View>
            </View>

            <View style={styles.profileTextContainer}>
              <View style={styles.nameRow}>
                <Text style={styles.profileName}>{displayName}</Text>
                {isVerified && (
                  <View style={styles.verifiedChip}>
                    <Ionicons name="compass-outline" size={12} color={COLORS.greenText} />
                    <Text style={styles.verifiedText}>Explorer</Text>
                  </View>
                )}
              </View>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color={COLORS.mediumGray} />
                <Text style={styles.locationText}>Global Traveler</Text>
              </View>
            </View>
          </View>
        </View>

        {/* FLOATING STATS CARD */}
        <View style={styles.statsCard}>
          {STATS.map((stat, idx) => (
            <React.Fragment key={stat.label}>
              <View style={styles.statItem}>
                <View style={styles.statValueRow}>
                  {idx === 0 && <Ionicons name="star-outline" size={14} color={COLORS.primary} style={{ marginRight: 4 }} />}
                  {idx === 1 && <Ionicons name="people-outline" size={14} color={COLORS.skyBlue} style={{ marginRight: 4 }} />}
                  {idx === 2 && <Ionicons name="flame-outline" size={14} color={COLORS.orange} style={{ marginRight: 4 }} />}
                  <Text style={styles.statValue}>{stat.value}</Text>
                </View>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
              {idx < STATS.length - 1 && <View style={styles.statDivider} />}
            </React.Fragment>
          ))}
        </View>

        {/* BIO & EDIT PROFILE */}
        <View style={styles.bioContainer}>
          <Text style={styles.bioText}>
            Adventure seeker • Weekend Explorer • Love meeting new people and exploring hidden gems.
          </Text>
          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={() => router.push('../more/personalInformation')}
          >
            <Ionicons name="pencil" size={12} color={COLORS.primary} />
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* MENU SECTIONS */}
        <View style={styles.menuContainer}>
          {MENU_SECTIONS.map((section) => (
            <View key={section.title} style={styles.menuSection}>
              <View style={styles.menuCard}>
                {section.items.map((item, idx) => (
                  <MenuRow
                    key={item.id}
                    item={item}
                    isLast={idx === section.items.length - 1}
                    notifEnabled={notifEnabled}
                    onToggle={() => setNotifEnabled((prev) => !prev)}
                    onLogout={handleLogout}
                    onPress={() => handleMenuPress(item)}
                  />
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* HELP & SUPPORT BANNER */}
        <View style={styles.helpBanner}>
          <View style={styles.helpIconBox}>
            <Ionicons name="headset-outline" size={24} color={COLORS.greenText} />
          </View>
          <View style={styles.helpTextContainer}>
            <Text style={styles.helpTitle}>Need Help?</Text>
            <Text style={styles.helpSubtitle}>We're here to help you 24/7</Text>
          </View>
          <TouchableOpacity
            style={styles.helpBtn}
            onPress={() => router.push('../extra/HelpSupport')}
          >
            <Ionicons name="headset-outline" size={14} color={COLORS.greenText} style={{ marginRight: 4 }} />
            <Text style={styles.helpBtnText}>Contact Support</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.developerBadge}>
          <Text style={styles.developerText}>Developed by Mohit Aggarwal</Text>
        </View>

        {loggingOut && (
          <View style={styles.loggingOutOverlay}>
            <ActivityIndicator color={COLORS.primary} size="small" />
            <Text style={styles.loggingOutText}>Logging out...</Text>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // ── HEADER ──
  headerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    position: 'relative',
    overflow: 'hidden',
  },
  headerDecor1: {
    position: 'absolute',
    bottom: -30,
    right: -50,
    width: 250,
    height: 150,
    borderRadius: 100,
    backgroundColor: '#DCFCE7',
    opacity: 0.6,
    transform: [{ scaleX: 1.5 }],
  },
  headerDecor2: {
    position: 'absolute',
    bottom: -10,
    left: -40,
    width: 200,
    height: 100,
    borderRadius: 80,
    backgroundColor: '#D1FAE5',
    opacity: 0.5,
    transform: [{ scaleX: 1.2 }],
  },
  topActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOW.sm,
  },
  notifBadge: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.danger,
    borderWidth: 1,
    borderColor: COLORS.white,
  },
  profileInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 20,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 16,
  },
  avatarCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#94A3B8', // placeholder color
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  avatarInitials: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.white,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  profileTextContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.darkGray,
  },
  verifiedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.greenText,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    color: COLORS.mediumGray,
    fontWeight: '500',
  },

  // ── STATS CARD ──
  statsCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginHorizontal: 20,
    paddingVertical: 16,
    paddingHorizontal: 10,
    marginTop: -25,
    ...SHADOW.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.darkGray,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.mediumGray,
    fontWeight: '500',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
  },

  // ── BIO & EDIT ──
  bioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 16,
  },
  bioText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.mediumGray,
    fontWeight: '500',
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 4,
  },
  editProfileText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // ── MENU ──
  menuContainer: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  menuSection: {
    marginBottom: 24,
  },
  menuCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    ...SHADOW.sm,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 14,
  },
  menuRowLast: {
    borderBottomWidth: 0,
  },
  menuIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: {
    fontSize: 18,
  },
  menuTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.darkGray,
    marginBottom: 2,
  },
  menuSubLabel: {
    fontSize: 11,
    color: COLORS.mediumGray,
    fontWeight: '500',
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  menuBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  menuBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },

  // ── HELP BANNER ──
  helpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.greenBg,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  helpIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  helpTextContainer: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.darkGray,
    marginBottom: 2,
  },
  helpSubtitle: {
    fontSize: 11,
    color: COLORS.mediumGray,
    fontWeight: '500',
  },
  helpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  helpBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.greenText,
  },

  developerBadge: {
    alignSelf: 'center',
    marginTop: 30,
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
    color: COLORS.mediumGray,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  loggingOutOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  loggingOutText: {
    fontSize: 13,
    color: COLORS.mediumGray,
    fontWeight: '500',
  },
});
