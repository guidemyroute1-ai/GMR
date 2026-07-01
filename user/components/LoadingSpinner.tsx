import React from 'react';
import { View, ViewStyle, ActivityIndicator, StyleSheet, Text } from 'react-native';

interface LoadingSpinnerProps {
  color?: string; // Kept for backwards compatibility
  size?: number | 'small' | 'large';
  style?: ViewStyle;
}

export default function LoadingSpinner({ size = 'large', color = '#10B981', style }: LoadingSpinnerProps) {
  const isSmall = size === 'small';

  // React Native ActivityIndicator accepts 'small' or 'large' (and numbers on some platforms)
  const indicatorSize = typeof size === 'number' ? size : size;

  if (isSmall) {
    return (
      <View style={[styles.smallContainer, style]}>
        <ActivityIndicator size={indicatorSize as any} color={color} />
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={indicatorSize as any} color={color} />
      <Text style={styles.loadingText}>Loading, just a sec...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    letterSpacing: 0.3,
  },
});
