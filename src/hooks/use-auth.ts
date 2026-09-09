import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from "@/integrations/supabase/client";

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
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      login: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        const sessionUser = data.user;
        if (!sessionUser) throw new Error('Não foi possível autenticar.');

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', sessionUser.id)
          .single();

        set({
          user: {
            id: sessionUser.id,
            email: sessionUser.email || email,
            name: profile?.full_name || 'Usuário',
            role: profile?.role || 'Marketing',
            initials: (profile?.full_name || sessionUser.email || 'U').slice(0, 2).toUpperCase(),
          },
          isAuthenticated: true,
          isLoading: false,
        });
      },
      logout: async () => {
        try {
          await supabase.auth.signOut();
        } catch {
          // sessão local: ignora falha de rede ao encerrar sessão remota
        }
        set({ user: null, isAuthenticated: false, isLoading: false });
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("digitale-auth-storage");
        }
      },
      initialize: async () => {
        set({ isLoading: true });
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (profile) {
            set({
              user: {
                id: session.user.id,
                email: session.user.email || '',
                name: profile.full_name || 'Usuário',
                role: profile.role,
                initials: (profile.full_name || 'U').slice(0, 2).toUpperCase(),
              },
              isAuthenticated: true,
            });
          }
        }
        set({ isLoading: false });
      },
    }),
    {
      name: 'digitale-auth-storage',
    }
  )
);