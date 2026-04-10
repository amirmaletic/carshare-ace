import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOrganisatie } from "@/hooks/useOrganisatie";

interface Activiteit {
  id: string;
  user_id: string;
  actie: string;
  beschrijving: string;
  entiteit_type: string | null;
  entiteit_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export function useActiviteitenLog(limit = 50) {
  const { user } = useAuth();

  const { data: activiteiten = [], isLoading } = useQuery({
    queryKey: ["activiteiten-log", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activiteiten_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as Activiteit[];
    },
    enabled: !!user,
  });

  return { activiteiten, isLoading };
}

export function useLogActiviteit() {
  const { user } = useAuth();
  const { organisatieId } = useOrganisatie();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      actie: string;
      beschrijving: string;
      entiteit_type?: string;
      entiteit_id?: string;
      metadata?: Record<string, unknown>;
    }) => {
      if (!user) return;
      const { error } = await supabase.from("activiteiten_log").insert([{
        user_id: user.id,
        organisatie_id: organisatieId,
        actie: params.actie,
        beschrijving: params.beschrijving,
        entiteit_type: params.entiteit_type || null,
        entiteit_id: params.entiteit_id || null,
        metadata: (params.metadata || {}) as any,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activiteiten-log"] });
    },
  });
}
