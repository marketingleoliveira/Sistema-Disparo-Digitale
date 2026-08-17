import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type DomainConfig = Tables<"email_domain_config">;
export type DomainConfigInsert = TablesInsert<"email_domain_config">;
export type DomainConfigUpdate = TablesUpdate<"email_domain_config">;

const QUERY_KEY = ["email-domain-config"] as const;

export function useDomainConfigs() {
  return useQuery({
    queryKey: QUERY_KEY,
    staleTime: 30_000,
    queryFn: async (): Promise<DomainConfig[]> => {
      const { data, error } = await supabase
        .from("email_domain_config")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

export function useDomainMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });

  const create = useMutation({
    mutationFn: async (payload: DomainConfigInsert): Promise<DomainConfig> => {
      const { data, error } = await supabase
        .from("email_domain_config")
        .insert(payload)
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: DomainConfigUpdate }): Promise<DomainConfig> => {
      const { data, error } = await supabase
        .from("email_domain_config")
        .update(patch)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from("email_domain_config").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });

  return { create, update, remove };
}