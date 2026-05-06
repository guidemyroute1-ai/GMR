import { View, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/colors';

// This file exists so expo-router has a root "/" route.
// All auth-based routing is handled by _layout.tsx.
export default function Index() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary }}>
      <ActivityIndicator size="large" color={Colors.white} />
    </View>
  );
}
