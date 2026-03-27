import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface Chauffeur {
  id: string;
  user_id: string;
  voornaam: string;
  achternaam: string;
  email: string | null;
  telefoon: string | null;
  rijbewijs_categorie: string;
  rijbewijs_nummer: string | null;
  rijbewijs_verloopt: string | null;
  geboortedatum: string | null;
  adres: string | null;
  postcode: string | null;
  plaats: string | null;
  notities: string | null;
  status: string;
  voertuig_id: string | null;
  created_at: string;
  updated_at: string;
}

export type ChauffeurInsert = Omit<Chauffeur, "id" | "user_id" | "created_at" | "updated_at">;

export function useChauffeurs() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["chauffeurs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chauffeurs")
        .select("*")
        .order("achternaam", { ascending: true });
      if (error) throw error;
      return data as Chauffeur[];
    },
    enabled: !!user,
  });

  const addChauffeur = useMutation({
    mutationFn: async (chauffeur: ChauffeurInsert) => {
      if (!user) throw new Error("Niet ingelogd");
      const { data, error } = await supabase
        .from("chauffeurs")
        .insert({ ...chauffeur, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chauffeurs"] });
      toast.success("Chauffeur toegevoegd");
    },
    onError: (e) => toast.error("Fout: " + e.message),
  });

  const updateChauffeur = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ChauffeurInsert> & { id: string }) => {
      const { error } = await supabase
        .from("chauffeurs")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chauffeurs"] });
      toast.success("Chauffeur bijgewerkt");
    },
    onError: (e) => toast.error("Fout: " + e.message),
  });

  const deleteChauffeur = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("chauffeurs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chauffeurs"] });
      toast.success("Chauffeur verwijderd");
    },
    onError: (e) => toast.error("Fout: " + e.message),
  });

  return {
    chauffeurs: query.data ?? [],
    isLoading: query.isLoading,
    addChauffeur,
    updateChauffeur,
    deleteChauffeur,
  };
}
