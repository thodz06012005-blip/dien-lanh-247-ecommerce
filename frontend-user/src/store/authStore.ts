import { create } from 'zustand';

export interface User {
  id: number;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  city?: string;
  district?: string;
  addressDetail?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  logout: () => void;
}

const getStoredUser = (): User | null => {
  try {
    const userStr = localStorage.getItem('dl247_user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    return null;
  }
};

const initialUser = getStoredUser();

export const useAuthStore = create<AuthState>((set) => ({
  user: initialUser,
  isAuthenticated: !!initialUser,
  isLoading: false,
  setUser: (user) => {
    if (user) {
      localStorage.setItem('dl247_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('dl247_user');
    }
    set({ user, isAuthenticated: !!user, isLoading: false });
  },
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => {
    localStorage.removeItem('dl247_user');
    set({ user: null, isAuthenticated: false, isLoading: false });
  },
}));
