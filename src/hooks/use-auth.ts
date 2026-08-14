import { create } from 'zustand';

export type UserRole = 'Desenvolvedor' | 'Diretoria' | 'Gerência' | 'Marketing';

interface User {
  name: string;
  role: UserRole;
  initials: string;
}

interface AuthState {
  user: User;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: {
    name: 'Leonardo Oliveira',
    role: 'Desenvolvedor',
    initials: 'LO',
  },
  setUser: (user: User) => set({ user }),
}));
