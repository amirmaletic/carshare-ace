import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOrganisatie } from "@/hooks/useOrganisatie";
import { toast } from "sonner";

export interface DbAanvraag {
  id: string;
  user_id: string;
  klant_naam: string;
  klant_email: string | null;
  klant_telefoon: string | null;
  gewenst_type: string | null;
  gewenste_categorie: string | null;
  gewenste_brandstof: string | null;
  gewenste_periode_start: string | null;
  gewenste_periode_eind: string | null;
  budget_max: number | null;
  notitie: string | null;
  status: string;
  gekoppeld_voertuig_id: string | null;
  ai_motivatie: string | null;
  created_at: string;
  updated_at: string;
}

export type AanvraagInsert = Omit<DbAanvraag, "id" | "user_id" | "created_at" | "updated_at" | "status" | "gekoppeld_voertuig_id" | "ai_motivatie">;

export function useAanvragen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["aanvragen"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("aanvragen")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as DbAanvraag[];
    },
    enabled: !!user,
  });

  const addAanvraag = useMutation({
    mutationFn: async (aanvraag: AanvraagInsert) => {
      if (!user) throw new Error("Niet ingelogd");

      // 1. Insert the request
      const { data: newAanvraag, error: insertError } = await supabase
        .from("aanvragen")
        .insert({ ...aanvraag, user_id: user.id })
        .select()
        .single();
      if (insertError) throw insertError;

      // 2. Get available vehicles
      const { data: voertuigen, error: vError } = await supabase
        .from("voertuigen")
        .select("*")
        .eq("status", "beschikbaar");
      if (vError) throw vError;

      // 3. Call AI matching
      try {
        const { data: matchData, error: matchError } = await supabase.functions.invoke("match-vehicle", {
          body: {
            aanvraag: newAanvraag,
            beschikbare_voertuigen: voertuigen || [],
          },
        });

        if (matchError) throw matchError;

        if (matchData?.voertuig_id) {
          // 4. Update the request with matched vehicle
          await supabase
            .from("aanvragen")
            .update({
              gekoppeld_voertuig_id: matchData.voertuig_id,
              ai_motivatie: matchData.motivatie,
              status: "gekoppeld",
            })
            .eq("id", newAanvraag.id);
        }

        return { ...newAanvraag, ...matchData };
      } catch (aiError) {
        console.error("AI matching failed:", aiError);
        // Return the request without matching
        return newAanvraag;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["aanvragen"] });
      if (data?.voertuig_id) {
        toast.success("Aanvraag ingediend en voertuig automatisch gekoppeld!");
      } else {
        toast.success("Aanvraag ingediend. Geen passend voertuig gevonden.");
      }
    },
    onError: (error) => {
      toast.error("Fout bij indienen: " + error.message);
    },
  });

  const deleteAanvraag = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("aanvragen").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aanvragen"] });
      toast.success("Aanvraag verwijderd");
    },
    onError: (error) => {
      toast.error("Fout bij verwijderen: " + error.message);
    },
  });

  return {
    aanvragen: query.data ?? [],
    isLoading: query.isLoading,
    addAanvraag,
    deleteAanvraag,
  };
}
