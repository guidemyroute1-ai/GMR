import { Tabs } from 'expo-router';
import { useAuthStore } from '../../store/useAuthStore';
import { Colors } from '../../constants/colors';
import { View, Text, StyleSheet } from 'react-native';
import { Home, Calendar, Compass, Hotel, Bike, User } from 'lucide-react-native';
import Header from '../../components/Header';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function TabIcon({ Icon, focused, badge }: { Icon: any; focused: boolean; badge?: number }) {
  return (
    <View style={tabStyles.iconWrap}>
      <Icon color={focused ? Colors.primary : Colors.textLight} size={22} />
      {!!badge && badge > 0 && (
        <View style={tabStyles.badge}>
          <Text style={tabStyles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      )}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.accent,
    marginTop: 2,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -8,
    backgroundColor: Colors.accent,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
});

export default function TabsLayout() {
  const { profile, pendingRequestCount } = useAuthStore();
  const role = profile?.role ?? 'guide';
  const insets = useSafeAreaInsets();
  
  const bottomPadding = insets.bottom > 0 ? insets.bottom : 12;
  const tabHeight = 60 + bottomPadding;

  const listingLabel =
    role === 'guide' ? 'Services' : role === 'hotel' ? 'Rooms' : 'Vehicles';

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        header: () => (
          <View style={{ backgroundColor: Colors.white, paddingTop: insets.top }}>
            <Header />
          </View>
        ),
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.05,
          shadowRadius: 12,
          height: tabHeight,
          paddingBottom: bottomPadding,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={Home} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Bookings',
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={Calendar} focused={focused} badge={pendingRequestCount} />
          ),
        }}
      />
      <Tabs.Screen
        name="listings"
        options={{
          title: listingLabel,
          tabBarIcon: ({ focused }) => {
            const Icon = role === 'guide' ? Compass : role === 'hotel' ? Hotel : Bike;
            return <TabIcon Icon={Icon} focused={focused} />;
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={User} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
