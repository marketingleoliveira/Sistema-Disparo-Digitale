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
}

interface DataState {
  contacts: Contact[];
  campaigns: Campaign[];
  isLoading: boolean;
  fetchContacts: () => Promise<void>;
  fetchCampaigns: () => Promise<void>;
  addContact: (contact: Omit<Contact, 'id' | 'createdAt' | 'initials' | 'engagement' | 'lastActivity'>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  addCampaign: (campaign: Omit<Campaign, 'id' | 'createdAt'>) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;
}

export const useDataStore = create<DataState>((set, get) => ({
  contacts: [],
  campaigns: [],
  isLoading: false,

  fetchContacts: async () => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
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
    set({ isLoading: false });
  },

  fetchCampaigns: async () => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
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
      }));
      set({ campaigns: mapped });
    }
    set({ isLoading: false });
  },

  addContact: async (data) => {
    const { error } = await supabase.from('contacts').insert([{
      name: data.name,
      email: data.email,
      company: data.company || null,
      status: data.status,
      lists: data.lists as any,
      tags: data.tags as any,
      phone: data.phone || null,
    }]);

    if (!error) await get().fetchContacts();
  },

  deleteContact: async (id) => {
    const { error } = await supabase.from('contacts').delete().eq('id', id);
    if (!error) await get().fetchContacts();
  },

  addCampaign: async (data) => {
    const { error } = await supabase.from('campaigns').insert([{
      name: data.name,
      subject: data.subject || null,
      type: data.type,
      status: data.status,
      recipients: data.recipients,
      open_rate: data.open,
      click_rate: data.clicks,
    }]);

    if (!error) await get().fetchCampaigns();
  },

  deleteCampaign: async (id) => {
    const { error } = await supabase.from('campaigns').delete().eq('id', id);
    if (!error) await get().fetchCampaigns();
  },
}));
