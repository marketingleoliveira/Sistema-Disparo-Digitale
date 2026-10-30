import { create } from 'zustand';
import {
  loginDisparo,
  logoutDisparo,
  getDisparoSession,
} from '@/lib/disparo-auth.functions';

export type UserRole =
  'Desenvolvedor' | 'Diretoria' | 'Gerência' | 'Marketing' | 'SDK';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  initials: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  acceptSession: (user: User) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  acceptSession: (user) => {
    set({
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  login: async (email, password) => {
    const user = await loginDisparo({
      data: { email, password },
    });

    set({
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logout: async () => {
    await logoutDisparo();
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('digitale-auth-storage');
    }
  },

  initialize: async () => {
    set({ isLoading: true });

    try {
      const user = await getDisparoSession();

      set({
        user,
        isAuthenticated: Boolean(user),
        isLoading: false,
      });
    } catch {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
}));
