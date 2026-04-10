import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface KilometerRegistratie {
  id: string;
  contract_id: string;
  user_id: string;
  datum: string;
  kilometerstand: number;
  notitie: string | null;
  created_at: string;
}

export function useKilometerRegistraties(contractId: string | null) {
  return useQuery({
    queryKey: ["kilometer_registraties", contractId],
    enabled: !!contractId,
    queryFn: async (): Promise<KilometerRegistratie[]> => {
      const { data, error } = await supabase
        .from("kilometer_registraties")
        .select("*")
        .eq("contract_id", contractId!)
        .order("datum", { ascending: true });
      if (error) throw error;
      return data as KilometerRegistratie[];
    },
  });
}

export function useCreateKilometerRegistratie() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { contract_id: string; datum: string; kilometerstand: number; notitie?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Niet ingelogd");
      const { data: orgId } = await supabase.rpc("get_user_organisatie_id", { _user_id: user.id });
      const { data, error } = await supabase
        .from("kilometer_registraties")
        .insert({ ...input, user_id: user.id, organisatie_id: orgId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["kilometer_registraties", vars.contract_id] }),
  });
}

export function useDeleteKilometerRegistratie() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, contractId }: { id: string; contractId: string }) => {
      const { error } = await supabase.from("kilometer_registraties").delete().eq("id", id);
      if (error) throw error;
      return contractId;
    },
    onSuccess: (contractId) => qc.invalidateQueries({ queryKey: ["kilometer_registraties", contractId] }),
  });
}
