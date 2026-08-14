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
        
        const localPart = email.split('@')[0] || 'usuario';
        const nameParts = localPart.split('.');
        const name = nameParts.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
        const initials = nameParts.length > 0 && nameParts[0]
          ? nameParts.map(n => (n ? n[0] : '')).join('').toUpperCase().slice(0, 2)
          : (localPart[0] || 'U').toUpperCase();

        set({
          user: {
            id: crypto.randomUUID(),
            email,
            name: email.toLowerCase().includes('leonardo') ? 'Leonardo Oliveira' : name,
            role,
            initials: email.toLowerCase().includes('leonardo') ? 'LO' : initials,
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
