import { useSyncExternalStore } from 'react';

export interface OnboardingData {
  role?: string;
  name?: string;
  email?: string;
  phone?: string;
  businessName?: string;
  businessAddress?: string;
  city?: string;
  experience?: string;
  languages?: string;
  description?: string;
  documents?: { title: string; uri: string; type?: string }[];
  profilePhoto?: string;
  [key: string]: any;
}

interface OnboardingState {
  data: OnboardingData;
}

let state: OnboardingState = {
  data: {},
};

const listeners = new Set<() => void>();

function setState(patch: Partial<OnboardingState>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const updateData = (newData: Partial<OnboardingData>) => {
  setState({ data: { ...state.data, ...newData } });
};

const reset = () => {
  setState({ data: {} });
};

export const useOnboardingStore = () => {
  const storeState = useSyncExternalStore(subscribe, () => state);
  return {
    ...storeState,
    updateData,
    reset,
  };
};
