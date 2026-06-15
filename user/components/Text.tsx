import React from 'react';
import { StyleSheet, Text as RNText, TextProps, TextStyle } from 'react-native';
import { rs } from '../utils/typography';

function getInterFamily(style?: TextStyle) {
  if (style?.fontFamily) return style.fontFamily;

  const weight = String(style?.fontWeight || '400');
  if (weight === '900' || weight === 'black') return 'Inter-Black';
  if (weight === '800' || weight === 'extrabold') return 'Inter-ExtraBold';
  if (weight === '700' || weight === 'bold') return 'Inter-Bold';
  if (weight === '600' || weight === 'semibold') return 'Inter-SemiBold';
  if (weight === '500' || weight === 'medium') return 'Inter-Medium';
  return 'Inter-Regular';
}

/**
 * Drop-in replacement for React Native's <Text>.
 *
 * Automatically:
 *  - Applies the Inter font family based on fontWeight
 *  - Scales every fontSize through the global responsive scaler (utils/typography.ts)
 *    so fonts look "medium" and adapt to the phone screen width.
 *
 * To adjust the global size, change GLOBAL_SCALE in utils/typography.ts.
 */
export function Text(props: TextProps) {
  const flatStyle = StyleSheet.flatten(props.style) as TextStyle | undefined;

  // Scale fontSize if one is provided in the style; otherwise leave it undefined
  // so React Native uses its default (~14).
  const scaledFontSize =
    flatStyle?.fontSize !== undefined ? rs(flatStyle.fontSize) : undefined;

  return (
    <RNText
      {...props}
      style={[
        styles.defaultText,
        props.style,
        {
          fontFamily: getInterFamily(flatStyle),
          ...(scaledFontSize !== undefined ? { fontSize: scaledFontSize } : {}),
        },
      ]}
    />
  );
}

export default Text;

const styles = StyleSheet.create({
  defaultText: {
    fontFamily: 'Inter-Regular',
    includeFontPadding: false,
  },
});
