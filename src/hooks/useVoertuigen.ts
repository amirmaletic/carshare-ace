import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOrganisatie } from "@/hooks/useOrganisatie";
import { toast } from "sonner";
import { useApprovalGuard } from "@/hooks/useGoedkeuringen";

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

export type VoertuigInsert = Omit<DbVoertuig, "id" | "user_id" | "created_at" | "updated_at" | "locatie" | "image_url"> & { locatie?: string | null; image_url?: string | null };

export function useVoertuigen() {
  const { user } = useAuth();
  const { organisatieId } = useOrganisatie();
  const queryClient = useQueryClient();
  const { checkAndRequest } = useApprovalGuard();

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
      if (!organisatieId) throw new Error("Geen organisatie gevonden");
      const { data, error } = await supabase
        .from("voertuigen")
        .insert({ ...voertuig, user_id: user.id, organisatie_id: organisatieId })
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
    mutationFn: async (input: string | { id: string; kenteken?: string; merk?: string; model?: string }) => {
      const id = typeof input === "string" ? input : input.id;
      const beschrijving = typeof input === "string"
        ? `Voertuig ${id} verwijderen`
        : `Voertuig ${input.kenteken ?? ""} (${input.merk ?? ""} ${input.model ?? ""}) verwijderen`;
      const mayProceed = await checkAndRequest({
        actie_type: "voertuig.verwijderen",
        beschrijving,
        entiteit_type: "voertuig",
        entiteit_id: id,
      });
      if (!mayProceed) {
        toast.info("Verzoek tot verwijderen ingediend voor goedkeuring");
        return;
      }
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
