import { create } from 'zustand';

export interface User {
  id: number;
  email: string;
  role: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  passwordChangedAt?: string | null;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  linkedServiceRequests?: number;
  // Legacy optional fields keep Phase 1–6 autofill screens type-compatible.
  // Phase 7's source of truth is the protected Address API.
  city?: string;
  district?: string;
  addressDetail?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  setInitialized: (isInitialized: boolean) => void;
  clearSession: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isInitialized: false,
  setUser: (user) => set({ user, isAuthenticated: Boolean(user), isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  setInitialized: (isInitialized) => set({ isInitialized, isLoading: false }),
  clearSession: () => set({ user: null, isAuthenticated: false, isLoading: false, isInitialized: true }),
  logout: () => set({ user: null, isAuthenticated: false, isLoading: false, isInitialized: true }),
}));
