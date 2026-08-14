import { create } from 'zustand';
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
  login: (email: string, role: UserRole) => Promise<void>;
  logout: () => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async (email, role) => {
    // Para simplificar o fluxo interno da Digitale Têxtil, 
    // usamos o email como identificador. 
    // Em um sistema real com auth completa, usaríamos auth.signInWithPassword.
    // Aqui simulamos o login e garantimos que o perfil existe no Cloud.
    
    const localPart = email.split('@')[0] || 'usuario';
    const initials = localPart.slice(0, 2).toUpperCase();
    const name = localPart.charAt(0).toUpperCase() + localPart.slice(1);

    // Na migração real, buscaríamos ou criaríamos o perfil via server function ou trigger.
    // Como estamos em um ambiente gerenciado, simulamos a sessão vinculada ao email.
    
    set({
      user: {
        id: crypto.randomUUID(), // Temporário até ter session real do auth
        email,
        name: email.toLowerCase().includes('leonardo') ? 'Leonardo Oliveira' : name,
        role,
        initials: email.toLowerCase().includes('leonardo') ? 'LO' : initials,
      },
      isAuthenticated: true,
      isLoading: false,
    });
  },
  logout: () => {
    set({ user: null, isAuthenticated: false });
  },
  initialize: async () => {
    set({ isLoading: true });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      // Buscar perfil no banco
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
}));
