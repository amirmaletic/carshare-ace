import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOrganisatie } from "@/hooks/useOrganisatie";
import { toast } from "sonner";

export interface PlanningBlok {
  id: string;
  organisatie_id: string;
  user_id: string;
  voertuig_id: string;
  start_datum: string;
  eind_datum: string;
  titel: string;
  kleur: string;
  notitie: string | null;
  created_at: string;
  updated_at: string;
}

export type PlanningBlokInput = Pick<PlanningBlok, "voertuig_id" | "start_datum" | "eind_datum" | "titel" | "kleur"> & { notitie?: string | null };

export function usePlanningBlokken() {
  const { user } = useAuth();
  const { organisatieId } = useOrganisatie();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["planning-blokken"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("planning_blokken")
        .select("*")
        .order("start_datum", { ascending: true });
      if (error) throw error;
      return (data ?? []) as PlanningBlok[];
    },
  });

  const create = useMutation({
    mutationFn: async (input: PlanningBlokInput) => {
      if (!user || !organisatieId) throw new Error("Niet ingelogd");
      const { data, error } = await supabase
        .from("planning_blokken")
        .insert({ ...input, user_id: user.id, organisatie_id: organisatieId })
        .select()
        .single();
      if (error) throw error;
      return data as PlanningBlok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planning-blokken"] });
      toast.success("Blokje toegevoegd");
    },
    onError: (e: any) => toast.error("Fout: " + e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...input }: PlanningBlokInput & { id: string }) => {
      const { error } = await supabase.from("planning_blokken").update(input).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planning-blokken"] });
      toast.success("Blokje bijgewerkt");
    },
    onError: (e: any) => toast.error("Fout: " + e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("planning_blokken").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planning-blokken"] });
      toast.success("Blokje verwijderd");
    },
    onError: (e: any) => toast.error("Fout: " + e.message),
  });

  return { blokken: query.data ?? [], isLoading: query.isLoading, create, update, remove };
}