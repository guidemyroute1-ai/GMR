import React, { useEffect } from 'react';
import { View, ViewStyle, Image, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface LoadingSpinnerProps {
  color?: string; // Kept for backwards compatibility
  size?: number | 'small' | 'large';
  style?: ViewStyle;
}

export default function LoadingSpinner({ size = 'large', style }: LoadingSpinnerProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    // Heartbeat animation: lub-dub
    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 150, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 150, easing: Easing.in(Easing.ease) }),
        withTiming(1.2, { duration: 150, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 600, easing: Easing.in(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const numericSize = size === 'small' ? 24 : size === 'large' ? 64 : (typeof size === 'number' ? size : 48);

  return (
    <View style={[{ justifyContent: 'center', alignItems: 'center' }, style]}>
      <Animated.View style={[animatedStyle, { width: numericSize, height: numericSize }]}>
        <Image 
          source={require('../assets/images/gmr_logo.png')} 
          style={{ width: '100%', height: '100%', borderRadius: numericSize / 4 }}
          resizeMode="contain"
        />
      </Animated.View>
      {size !== 'small' && (
        <Text style={{ marginTop: 16, fontSize: 15, fontWeight: '600', color: '#6B7280' }}>
          Loading, just a sec...
        </Text>
      )}
    </View>
  );
}
