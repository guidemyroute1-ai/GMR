import { useSyncExternalStore } from 'react';
import type { PartnerAuthUser, PartnerProfile } from '../services/auth';
import { getUserDoc } from '../services/auth';

type State = {
  user: PartnerAuthUser | null;
  profile: PartnerProfile | null;
  isInitialized: boolean;
  isProfileLoading: boolean;
};

let state: State = {
  user: null,
  profile: null,
  isInitialized: false,
  isProfileLoading: false,
};

const listeners = new Set<() => void>();

function setState(patch: Partial<State>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// ── Stable setter references (defined once at module level) ──────────────────
// These never change identity, so they're safe as useEffect dependencies.
const setUser = (user: PartnerAuthUser | null) => setState({ user });
const setProfile = (profile: PartnerProfile | null) => setState({ profile });
const setInitialized = (isInitialized: boolean) => setState({ isInitialized });
const setProfileLoading = (isProfileLoading: boolean) => setState({ isProfileLoading });
const reset = () => setState({ user: null, profile: null, isInitialized: true, isProfileLoading: false });
const refreshProfile = async () => {
  if (!state.user) return null;
  const profile = await getUserDoc(state.user.uid);
  setState({ profile });
  return profile;
};

export function useAuthStore() {
  const snapshot = useSyncExternalStore(subscribe, () => state, () => state);
  return {
    ...snapshot,
    setUser,
    setProfile,
    setInitialized,
    setProfileLoading,
    reset,
    refreshProfile,
  };
}
