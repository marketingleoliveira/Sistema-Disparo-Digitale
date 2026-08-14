import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'Desenvolvedor' | 'Diretoria' | 'Gerência' | 'Marketing';

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
  login: (email: string, role: UserRole) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: async (email, role) => {
        // Simulação de delay de rede
        await new Promise((resolve) => setTimeout(resolve, 800));
        
        const name = email.split('@')[0].split('.').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

        set({
          user: {
            id: crypto.randomUUID(),
            email,
            name: email.includes('leonardo') ? 'Leonardo Oliveira' : name,
            role,
            initials: email.includes('leonardo') ? 'LO' : initials,
          },
          isAuthenticated: true,
        });
      },
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'digitale-auth-storage',
    }
  )
);
