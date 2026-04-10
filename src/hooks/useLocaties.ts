import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOrganisatie } from "@/hooks/useOrganisatie";
import { toast } from "sonner";

export interface Locatie {
  id: string;
  user_id: string;
  naam: string;
  created_at: string;
}

export function useLocaties() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["locaties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("locaties")
        .select("*")
        .order("naam", { ascending: true });
      if (error) throw error;
      return data as Locatie[];
    },
    enabled: !!user,
  });

  const addLocatie = useMutation({
    mutationFn: async (naam: string) => {
      if (!user) throw new Error("Niet ingelogd");
      const { data, error } = await supabase
        .from("locaties")
        .insert({ naam, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locaties"] });
      toast.success("Locatie toegevoegd");
    },
    onError: (e) => toast.error("Fout: " + e.message),
  });

  const deleteLocatie = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("locaties").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locaties"] });
      toast.success("Locatie verwijderd");
    },
    onError: (e) => toast.error("Fout: " + e.message),
  });

  return {
    locaties: query.data ?? [],
    isLoading: query.isLoading,
    addLocatie,
    deleteLocatie,
  };
}
