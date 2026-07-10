# Partner App - Agent Guidelines

## Tech Stack
- **Framework:** React Native + Expo (App Router)
- **Language:** TypeScript
- **Backend:** Supabase (Auth, Database, Storage)
- **Styling:** Custom StyleSheet (No Tailwind/NativeWind currently)
- **State Management:** Zustand (`useAuthStore`, `useOnboardingStore`)
- **Animations:** `react-native-reanimated`

## UI Rules & Conventions
- **Colors:** Use the `Colors` object from `../constants/colors.ts`. Primary brand color is green (`#16A34A`).
- **Alerts:** DO NOT use React Native's `Alert.alert`. Instead, use `AlertService.alert` imported from `@/contexts/AlertContext` (or `../contexts/AlertContext`), which renders a branded, custom UI modal.
- **Routing:** Use `expo-router` for all navigation (`router.push`, `router.replace`).
- **Components:** Reusable UI components (like `Text`, `Button`) should be imported from `../components/` when possible.

## Known Architecture
- The app uses `_layout.tsx` for global providers (like `AlertProvider`) and route guarding based on the user's auth state and `isOnboarded` status.
- Partners include 'Tour Guide', 'Hotel Owner', and 'Vehicle Rental' roles.
