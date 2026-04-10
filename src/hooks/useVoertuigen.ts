import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface DbVoertuig {
  id: string;
  user_id: string;
  kenteken: string;
  merk: string;
  model: string;
  bouwjaar: number;
  brandstof: string;
  kilometerstand: number;
  status: string;
  apk_vervaldatum: string | null;
  verzekering_vervaldatum: string | null;
  dagprijs: number;
  categorie: string;
  kleur: string;
  locatie: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export type VoertuigInsert = Omit<DbVoertuig, "id" | "user_id" | "created_at" | "updated_at" | "locatie"> & { locatie?: string | null };

export function useVoertuigen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["voertuigen"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("voertuigen")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as DbVoertuig[];
    },
    enabled: !!user,
  });

  const addVoertuig = useMutation({
    mutationFn: async (voertuig: VoertuigInsert) => {
      if (!user) throw new Error("Niet ingelogd");
      const { data, error } = await supabase
        .from("voertuigen")
        .insert({ ...voertuig, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voertuigen"] });
      toast.success("Voertuig toegevoegd aan het wagenpark");
    },
    onError: (error) => {
      toast.error("Fout bij toevoegen: " + error.message);
    },
  });

  const deleteVoertuig = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("voertuigen").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voertuigen"] });
      toast.success("Voertuig verwijderd");
    },
    onError: (error) => {
      toast.error("Fout bij verwijderen: " + error.message);
    },
  });

  return {
    voertuigen: query.data ?? [],
    isLoading: query.isLoading,
    addVoertuig,
    deleteVoertuig,
  };
}
