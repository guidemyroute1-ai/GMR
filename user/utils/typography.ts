import { Dimensions, PixelRatio } from 'react-native';

// ─── Responsive Font Scale ─────────────────────────────────────────────────────
//
// Base design width is 390px (iPhone 14 / standard mobile width).
// All font sizes in the app are authored for that width.
// On wider screens fonts scale up slightly; on narrower ones they scale down.
// The scale is capped so fonts never become unreadably small or unusably large.
//
// Global reduction: We apply an extra 0.88 multiplier so that every font in the
// app is a bit smaller than authored — matching the "medium" feel the user wants.
// Adjust GLOBAL_SCALE (range 0.80 – 1.0) to taste.

const BASE_WIDTH = 390;
const GLOBAL_SCALE = 0.92; // ← tweak this one value to make all text larger/smaller

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Width-based scale factor (clamped between 0.85 and 1.15)
const widthScale = Math.min(1.15, Math.max(0.85, SCREEN_WIDTH / BASE_WIDTH));

/**
 * Returns a font size that is:
 *  1. Scaled proportionally to the current screen width
 *  2. Globally reduced by GLOBAL_SCALE for a "medium" feel
 *  3. Snapped to the nearest pixel for crisp rendering
 *
 * Usage: fontSize: rs(16)   →  renders as ~14 on a 390-wide screen
 */
export function rs(size: number): number {
  const scaled = size * widthScale * GLOBAL_SCALE;
  return Math.round(PixelRatio.roundToNearestPixel(scaled));
}

// Convenience aliases
export const fontScale = rs;
