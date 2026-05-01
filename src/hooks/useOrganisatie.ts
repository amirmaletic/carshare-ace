import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useOrganisatie() {
  const { user, loading: authLoading } = useAuth();

  const { data: organisatieId, isLoading } = useQuery({
    queryKey: ["organisatie_id", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_user_organisatie_id", {
        _user_id: user!.id,
      });
      if (error) throw error;
      return data as string | null;
    },
    enabled: !authLoading && !!user,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  return { organisatieId: organisatieId ?? null, isLoading: authLoading || (!!user && isLoading) };
}
