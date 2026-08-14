import { create } from 'zustand';

export type UserRole = 'Desenvolvedor' | 'Diretoria' | 'Gerência' | 'Marketing';

interface AuthState {
  user: {
    name: string;
    role: UserRole;
    initials: string;
  };
  setUser: (user: AuthState['user']) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: {
    name: 'Leonardo Oliveira',
    role: 'Desenvolvedor',
    initials: 'LO',
  },
  setUser: (user) => set({ user }),
}));
