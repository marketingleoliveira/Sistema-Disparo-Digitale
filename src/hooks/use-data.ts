import { create } from 'zustand';
import { supabase } from "@/integrations/supabase/client";

export interface Contact {
  id: string;
  name: string;
  email: string;
  company: string;
  lists: string[];
  tags: string[];
  engagement: number;
  lastActivity: string;
  status: 'Ativo' | 'Pendente' | 'Descadastrado';
  initials: string;
  phone?: string;
  createdAt: string;
}

export interface ContactList {
  id: string;
  name: string;
  description: string;
  contactCount?: number;
  createdAt: string;
}

export interface ContactSegment {
  id: string;
  name: string;
  description: string;
  filters: any;
  contactCount?: number;
  createdAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  type: string;
  date: string;
  recipients: number;
  open: string;
  clicks: string;
  status: 'Enviada' | 'Agendada' | 'Rascunho' | 'Em andamento';
  subject?: string;
  createdAt: string;
  /** Conteúdo do disparo: html, listas, remetente, agendamento. */
  content?: Record<string, unknown>;
}

interface DataState {
  contacts: Contact[];
  campaigns: Campaign[];
  lists: ContactList[];
  segments: ContactSegment[];
  isLoading: boolean;
  fetchContacts: () => Promise<void>;
  fetchCampaigns: () => Promise<void>;
  fetchLists: () => Promise<void>;
  fetchSegments: () => Promise<void>;
  addContact: (contact: Omit<Contact, 'id' | 'createdAt' | 'initials' | 'engagement' | 'lastActivity'>) => Promise<void>;
  importContacts: (
    contacts: Array<Omit<Contact, 'id' | 'createdAt' | 'initials' | 'engagement' | 'lastActivity'>>
  ) => Promise<{ inserted: number; skipped: number; error?: string }>;
  deleteContact: (id: string) => Promise<void>;
  addCampaign: (campaign: Omit<Campaign, 'id' | 'createdAt'>) => Promise<string | null>;
  deleteCampaign: (id: string) => Promise<void>;
  addList: (name: string, description: string) => Promise<void>;
  deleteList: (id: string) => Promise<void>;
  addSegment: (name: string, description: string, filters: any) => Promise<void>;
  deleteSegment: (id: string) => Promise<void>;
}

export const useDataStore = create<DataState>((set, get) => ({
  contacts: [],
  campaigns: [],
  lists: [],
  segments: [],
  isLoading: false,

  fetchContacts: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching contacts:", error);
      } else if (data) {
        const mapped = data.map(c => ({
          id: c.id,
          name: c.name,
          email: c.email,
          company: c.company || '',
          status: (c.status as any) || 'Ativo',
          lists: (c.lists as any) || [],
          tags: (c.tags as any) || [],
          engagement: c.engagement || 0,
          lastActivity: c.last_activity || '',
          phone: c.phone || '',
          initials: c.name.slice(0, 2).toUpperCase(),
          createdAt: c.created_at || '',
        }));
        set({ contacts: mapped });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  fetchCampaigns: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching campaigns:", error);
      } else if (data) {
        const mapped = data.map(c => ({
          id: c.id,
          name: c.name,
          type: c.type || 'E-mail',
          date: c.created_at || '',
          recipients: c.recipients || 0,
          open: c.open_rate || '0%',
          clicks: c.click_rate || '0%',
          status: (c.status as any) || 'Rascunho',
          subject: c.subject || '',
          createdAt: c.created_at || '',
          content: (c.content as any) || undefined,
        }));
        set({ campaigns: mapped });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  fetchLists: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('contact_lists')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching lists:", error);
      } else if (data) {
        const allContacts = get().contacts;
        const mapped = data.map(l => ({
          id: l.id,
          name: l.name,
          description: l.description || '',
          createdAt: l.created_at,
          contactCount: allContacts.filter(c => c.lists.includes(l.name)).length
        }));
        set({ lists: mapped });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  fetchSegments: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('contact_segments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching segments:", error);
      } else if (data) {
        const mapped = data.map(s => ({
          id: s.id,
          name: s.name,
          description: s.description || '',
          filters: s.filters,
          createdAt: s.created_at,
        }));
        set({ segments: mapped });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  addContact: async (data) => {
    try {
      const { error } = await supabase.from('contacts').insert([{
        name: data.name,
        email: data.email,
        company: data.company || null,
        status: data.status,
        lists: Array.isArray(data.lists) ? data.lists : [],
        tags: Array.isArray(data.tags) ? data.tags : [],
        phone: data.phone || null,
        last_activity: 'Recém adicionado',
        engagement: 0
      }]);

      if (error) {
        console.error("Supabase contact insert failed:", error);
        throw new Error(error.message || "Falha ao inserir contato no banco de dados.");
      }
      await get().fetchContacts();
    } catch (err) {
      console.error("addContact exception:", err);
      throw err;
    }
  },

  deleteContact: async (id) => {
    const { error } = await supabase.from('contacts').delete().eq('id', id);
    if (!error) await get().fetchContacts();
  },

  importContacts: async (incoming) => {
    if (incoming.length === 0) return { inserted: 0, skipped: 0 };
    const { data: existingData } = await supabase.from('contacts').select('email');
    const existingEmails = new Set((existingData || []).map(c => c.email.toLowerCase()));
    
    const seen = new Set<string>();
    const rows = incoming.filter((c) => {
      const email = c.email.toLowerCase();
      if (!email || existingEmails.has(email) || seen.has(email)) return false;
      seen.add(email);
      return true;
    });

    const skipped = incoming.length - rows.length;
    if (rows.length === 0) return { inserted: 0, skipped };

    const CHUNK = 100;
    let inserted = 0;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const chunk = rows.slice(i, i + CHUNK).map((c) => ({
        name: c.name,
        email: c.email.toLowerCase(),
        company: c.company || null,
        status: c.status,
        lists: c.lists as any,
        tags: c.tags as any,
        phone: c.phone || null,
        last_activity: 'Importado',
        engagement: 0
      }));
      
      const { error } = await supabase.from('contacts').insert(chunk);
      if (error) {
        await get().fetchContacts();
        return { inserted, skipped, error: error.message };
      }
      inserted += chunk.length;
    }

    await get().fetchContacts();
    return { inserted, skipped };
  },

  addCampaign: async (data) => {
    const { data: inserted, error } = await supabase.from('campaigns').insert([{
      name: data.name,
      subject: data.subject || null,
      type: data.type,
      status: data.status,
      recipients: data.recipients,
      open_rate: data.open,
      click_rate: data.clicks,
      content: (data.content ?? null) as any,
    }]).select('id').maybeSingle();

    if (error) return null;
    await get().fetchCampaigns();
    return inserted?.id ?? null;
  },

  deleteCampaign: async (id) => {
    const { error } = await supabase.from('campaigns').delete().eq('id', id);
    if (!error) await get().fetchCampaigns();
  },

  addList: async (name, description) => {
    const { error } = await supabase.from('contact_lists').insert([{ name, description }]);
    if (error) throw error;
    await get().fetchLists();
  },

  deleteList: async (id) => {
    const { error } = await supabase.from('contact_lists').delete().eq('id', id);
    if (error) throw error;
    await get().fetchLists();
  },

  addSegment: async (name, description, filters) => {
    const { error } = await supabase.from('contact_segments').insert([{ name, description, filters }]);
    if (error) throw error;
    await get().fetchSegments();
  },

  deleteSegment: async (id) => {
    const { error } = await supabase.from('contact_segments').delete().eq('id', id);
    if (error) throw error;
    await get().fetchSegments();
  },
}));