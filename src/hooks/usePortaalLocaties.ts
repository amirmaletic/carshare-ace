import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PortaalLocatie {
  id: string;
  naam: string;
}

export function usePortaalLocaties(organisatieId: string | null | undefined) {
  return useQuery({
    queryKey: ["portaal-locaties", organisatieId],
    queryFn: async (): Promise<PortaalLocatie[]> => {
      if (!organisatieId) return [];
      const { data, error } = await supabase.rpc("get_portaal_locaties", {
        _organisatie_id: organisatieId,
      });
      if (error) throw error;
      return (data ?? []) as PortaalLocatie[];
    },
    enabled: !!organisatieId,
    staleTime: 5 * 60 * 1000,
  });
}
