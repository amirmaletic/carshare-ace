import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOrganisatie } from "@/hooks/useOrganisatie";
import { toast } from "sonner";

export interface DbRit {
  id: string;
  user_id: string;
  voertuig_id: string | null;
  chauffeur_id: string | null;
  van_locatie: string;
  naar_locatie: string;
  datum: string;
  vertrek_tijd: string | null;
  aankomst_tijd: string | null;
  afstand_km: number;
  kosten: number;
  km_tarief: number;
  status: string;
  type: string;
  notitie: string | null;
  created_at: string;
  updated_at: string;
}

export type RitInsert = Omit<DbRit, "id" | "user_id" | "created_at" | "updated_at">;

export function useRitten() {
  const { user } = useAuth();
  const { organisatieId } = useOrganisatie();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["ritten"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ritten")
        .select("*")
        .order("datum", { ascending: false });
      if (error) throw error;
      return data as DbRit[];
    },
    enabled: !!user,
  });

  const addRit = useMutation({
    mutationFn: async (rit: RitInsert) => {
      if (!user) throw new Error("Niet ingelogd");
      const { data, error } = await supabase
        .from("ritten")
        .insert({ ...rit, user_id: user.id, organisatie_id: organisatieId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ritten"] });
      toast.success("Rit aangemaakt");
    },
    onError: (error) => {
      toast.error("Fout bij aanmaken: " + error.message);
    },
  });

  const updateRit = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DbRit> & { id: string }) => {
      const { error } = await supabase
        .from("ritten")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ritten"] });
      toast.success("Rit bijgewerkt");
    },
    onError: (error) => {
      toast.error("Fout bij bijwerken: " + error.message);
    },
  });

  const deleteRit = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ritten").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ritten"] });
      toast.success("Rit verwijderd");
    },
    onError: (error) => {
      toast.error("Fout bij verwijderen: " + error.message);
    },
  });

  return {
    ritten: query.data ?? [],
    isLoading: query.isLoading,
    addRit,
    updateRit,
    deleteRit,
  };
}
