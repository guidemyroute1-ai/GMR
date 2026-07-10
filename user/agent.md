# User App - Agent Guidelines

## Tech Stack
- **Framework:** React Native + Expo (App Router)
- **Language:** TypeScript
- **Backend:** Supabase (Auth, Database, Storage)
- **Styling:** Custom StyleSheet (No Tailwind/NativeWind currently)
- **State Management:** Context API (`AuthContext`), Local State

## UI Rules & Conventions
- **Colors:** Use the common color palette. Primary brand color is green (`#16A34A`).
- **Date Pickers:** Use the custom `CalendarPickerModal` located in `components/` instead of `@react-native-community/datetimepicker` for a branded, modern UI on Android.
- **Routing:** Use `expo-router` for all navigation (`router.push`, `router.replace`).
- **Components:** Reusable UI components (like `Text`) should be imported from `../components/` when possible to maintain consistent fonts and styling.

## Known Architecture
- The user app is for travelers (end users) to discover tours, hotels, and rentals provided by partners in the `partner` app ecosystem.
- Authentication relies on Supabase.
