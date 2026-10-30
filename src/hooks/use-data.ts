import { listDisparoCampaigns, createDisparoCampaign, deleteDisparoCampaign } from "@/lib/disparo-campaigns.functions";
import { create } from 'zustand';
import { supabase } from "@/integrations/supabase/client";
import {
  getDisparoFolders,
  createDisparoFolder,
  deleteDisparoFolder
} from "@/lib/disparo-lists.functions";

import {
  listDisparoContacts,
  createDisparoContact,
  updateDisparoContact,
  deleteDisparoContact,
  importDisparoContacts
} from "@/lib/disparo-contacts.functions";


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
  status: 'Enviada' | 'Agendada' | 'Rascunho' | 'Em andamento' | "Processando" | "Simulada" | "Parcial" | "Falha";
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
  fetchCampaigns: (silent?: boolean) => Promise<void>;
  fetchLists: () => Promise<void>;
  fetchSegments: () => Promise<void>;
  addContact: (contact: Omit<Contact, 'id' | 'createdAt' | 'initials' | 'engagement' | 'lastActivity'>) => Promise<void>;
  importContacts: (
    contacts: Array<Omit<Contact, 'id' | 'createdAt' | 'initials' | 'engagement' | 'lastActivity'>>
  ) => Promise<{ inserted: number; skipped: number; error?: string }>;

  updateContact: (
    id: string,
    contact: Omit<Contact, 'id' | 'createdAt' | 'initials' | 'engagement' | 'lastActivity'>
  ) => Promise<void>;
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
      const contacts = await listDisparoContacts();
      set({ contacts });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchCampaigns: async (silent = false) => {
    if (!silent) set({ isLoading: true });

    try {
      const raw = await listDisparoCampaigns();

      const campaigns = raw.map(
        ({ contentJson, ...campaign }) => {
          let content: Record<string, unknown> = {};

          try {
            const parsed: unknown = JSON.parse(contentJson);

            if (
              parsed !== null &&
              typeof parsed === "object" &&
              !Array.isArray(parsed)
            ) {
              content = parsed as Record<string, unknown>;
            }
          } catch {
            // Preserva a campanha mesmo com JSON antigo invalido.
          }

          return { ...campaign, content };
        }
      );

      set({ campaigns });
    } finally {
      if (!silent) set({ isLoading: false });
    }
  },

  fetchLists: async () => {
    set({ isLoading: true });
    try {
      const lists = await getDisparoFolders();
      set({ lists });
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
    await createDisparoContact({
      data: {
        name: data.name,
        email: data.email,
        company: data.company ?? "",
        phone: data.phone ?? "",
        status: data.status,
        lists: data.lists ?? [],
        tags: data.tags ?? []
      }
    });
    await get().fetchContacts();
  },

  updateContact: async (id, data) => {
    await updateDisparoContact({
      data: {
        id,
        contact: {
          name: data.name,
          email: data.email,
          company: data.company ?? "",
          phone: data.phone ?? "",
          status: data.status,
          lists: data.lists ?? [],
          tags: data.tags ?? []
        }
      }
    });
    await get().fetchContacts();
  },

  deleteContact: async (id) => {
    await deleteDisparoContact({ data: { id } });
    await get().fetchContacts();
  },

  importContacts: async (incoming) => {
    if (incoming.length === 0) {
      return { inserted: 0, skipped: 0 };
    }

    // DIGITALE_IMPORT_COMPLETA_V2
    let inserted = 0;
    let skipped = 0;
    let linked = 0;
    let rejected = 0;
    const details: Array<{
      email: string;
      result: string;
      reason: string;
    }> = [];

    for (let i = 0; i < incoming.length; i += 100) {
      const batch = incoming.slice(i, i + 100).map(c => ({
        name: c.name,
        email: c.email,
        company: c.company ?? "",
        phone: c.phone ?? "",
        status: c.status,
        lists: c.lists ?? [],
        tags: c.tags ?? []
      }));

      try {
        const result = await importDisparoContacts({ data: batch });
        inserted += result.inserted;
        skipped += result.skipped;
        linked += result.linked;
        rejected += result.rejected;
        details.push(...result.details);
      } catch (error) {
        // Falha do lote: tenta cada linha separadamente.
        // Não interrompe os lotes seguintes.
        for (const contact of batch) {
          try {
            const single = await importDisparoContacts({
              data: [contact]
            });
            inserted += single.inserted;
            skipped += single.skipped;
            linked += single.linked;
            rejected += single.rejected;
            details.push(...single.details);
          } catch (singleError) {
            rejected++;
            details.push({
              email: contact.email,
              result: "erro",
              reason: singleError instanceof Error
                ? singleError.message
                : "Falha de comunicação com o servidor"
            });
          }
        }
      }
    }

    await get().fetchContacts().catch(() => undefined);

    return {
      inserted,
      skipped,
      linked,
      rejected,
      details
    };
  },

  addCampaign: async (data) => {
    const id = await createDisparoCampaign({
      data: {
        name: data.name,
        subject: data.subject || "",
        type: data.type,
        status: data.status,
        recipients: data.recipients,
        contentJson: JSON.stringify(data.content ?? {})
      }
    });

    await get().fetchCampaigns();
    return id;
  },

  deleteCampaign: async (id) => {
    await deleteDisparoCampaign({ data: { id } });
    await get().fetchCampaigns();
  },

  addList: async (name, description) => {
    await createDisparoFolder({
      data: { name, description }
    });
    await get().fetchLists();
  },

  deleteList: async (id) => {
    await deleteDisparoFolder({ data: { id } });
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