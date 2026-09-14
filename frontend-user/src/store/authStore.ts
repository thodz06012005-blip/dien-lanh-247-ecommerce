import { create } from 'zustand';
import api from '../services/api';
import { clearCustomerQueries } from '../lib/queryClient';

export type AuthStatus = 'unknown' | 'loading' | 'authenticated' | 'anonymous';
export interface User { id: number; email: string; role: string; firstName?: string; lastName?: string; phone?: string; city?: string; district?: string; addressDetail?: string; }
interface AuthState {
  user: User | null; status: AuthStatus; isAuthenticated: boolean; isLoading: boolean;
  bootstrap: () => Promise<void>; setUser: (user: User | null) => void; setLoading: (value: boolean) => void; logout: () => Promise<void>; clearAuth: () => void;
}
let bootstrapPromise: Promise<void> | null = null;
const cacheUser = (user: User | null) => user ? localStorage.setItem('dl247_user', JSON.stringify(user)) : localStorage.removeItem('dl247_user');

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null, status: 'unknown', isAuthenticated: false, isLoading: true,
  bootstrap: () => {
    if (!bootstrapPromise) {
      set({ status: 'loading', isLoading: true });
      bootstrapPromise = api.get('/auth/me').then(response => {
        const user = response.data.data as User; cacheUser(user);
        set({ user, status: 'authenticated', isAuthenticated: true, isLoading: false });
      }).catch(() => {
        cacheUser(null); clearCustomerQueries();
        set({ user: null, status: 'anonymous', isAuthenticated: false, isLoading: false });
      }).finally(() => { bootstrapPromise = null; });
    }
    return bootstrapPromise;
  },
  setUser: (user) => { cacheUser(user); set({ user, status: user ? 'authenticated' : 'anonymous', isAuthenticated: !!user, isLoading: false }); },
  setLoading: (isLoading) => set({ isLoading, status: isLoading ? 'loading' : get().status }),
  logout: async () => { try { await api.post('/auth/logout'); } finally { get().clearAuth(); } },
  clearAuth: () => { cacheUser(null); clearCustomerQueries(); set({ user: null, status: 'anonymous', isAuthenticated: false, isLoading: false }); },
}));
