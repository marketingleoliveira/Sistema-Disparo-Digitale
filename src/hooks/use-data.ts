import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  addContact: (contact: Omit<Contact, 'id' | 'createdAt' | 'initials' | 'engagement' | 'lastActivity'>) => void;
  deleteContact: (id: string) => void;
  addCampaign: (campaign: Omit<Campaign, 'id' | 'createdAt'>) => void;
  deleteCampaign: (id: string) => void;
}

export const useDataStore = create<DataState>()(
  persist(
    (set) => ({
      contacts: [],
      campaigns: [],
      addContact: (data) => set((state) => {
        const initials = data.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        const newContact: Contact = {
          ...data,
          id: crypto.randomUUID(),
          initials,
          engagement: 0,
          lastActivity: 'Recém adicionado',
          createdAt: new Date().toISOString(),
        };
        return { contacts: [newContact, ...state.contacts] };
      }),
      deleteContact: (id) => set((state) => ({
        contacts: state.contacts.filter(c => c.id !== id)
      })),
      addCampaign: (data) => set((state) => {
        const newCampaign: Campaign = {
          ...data,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        };
        return { campaigns: [newCampaign, ...state.campaigns] };
      }),
      deleteCampaign: (id) => set((state) => ({
        campaigns: state.campaigns.filter(c => c.id !== id)
      })),
    }),
    {
      name: 'digitale-data-storage',
    }
  )
);
