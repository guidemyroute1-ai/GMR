import { Ionicons } from '@expo/vector-icons';
import { BottomTabBar } from '@react-navigation/bottom-tabs';
import { Tabs, useRouter } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import ActiveBookingBar from '../../components/ActiveBookingBar';

function TabIcon({ name, color, focused }: { name: React.ComponentProps<typeof Ionicons>['name']; color: string; focused: boolean }) {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: withSpring(focused ? 1.15 : 1, { damping: 10, stiffness: 100 }) }],
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      <Ionicons name={name} size={22} color={color} />
    </Animated.View>
  );
}


// ─── Custom Tab Bar with Active Booking Strip ──────────────────────────────────
function CustomTabBar(props: React.ComponentProps<typeof BottomTabBar>) {
  return (
    <View>
      <ActiveBookingBar />
      <BottomTabBar {...props} />
    </View>
  );
}

export default function TabLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomPadding = insets.bottom > 0 ? insets.bottom : 10;
  const tabHeight = 55 + bottomPadding;

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        animation: 'shift',
        tabBarActiveTintColor: '#16A34A',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          paddingBottom: bottomPadding + 2,
          paddingTop: 8,
          height: tabHeight + 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: 0.08,
          shadowRadius: 14,
          elevation: 16,
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter-SemiBold',
          fontSize: 11,
          marginTop: 2,
        },
        tabBarItemStyle: {
          borderRadius: 16,
          marginHorizontal: 2,
        },
      }}>
      <Tabs.Screen
        name="Home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'home' : 'home-outline'} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="Trips"
        options={{
          title: 'Trips',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'compass' : 'compass-outline'} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="HotelListings"
        options={{
          title: 'Hotels',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'bed' : 'bed-outline'} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="Bookings"
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'calendar' : 'calendar-outline'} color={color} focused={focused} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.push('/more/MyBookings');
          },
        }}
      />
      <Tabs.Screen
        name="Community"
        options={{
          title: 'Community',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'people' : 'people-outline'} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="AllGuides"
        options={{
          title: 'Guides',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'people' : 'people-outline'} color={color} focused={focused} />
          ),
        }}
      />

    </Tabs>
  );
}
