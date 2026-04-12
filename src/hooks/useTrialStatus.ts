import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOrganisatie } from "@/hooks/useOrganisatie";

export interface TrialStatus {
  isActive: boolean;
  trialEndsAt: Date | null;
  daysRemaining: number;
  isExpired: boolean;
}

export function useTrialStatus() {
  const { user } = useAuth();
  const { organisatieId } = useOrganisatie();

  return useQuery({
    queryKey: ["trial-status", organisatieId],
    queryFn: async (): Promise<TrialStatus> => {
      if (!organisatieId) {
        return { isActive: false, trialEndsAt: null, daysRemaining: 0, isExpired: true };
      }

      const { data, error } = await supabase
        .from("organisaties")
        .select("trial_ends_at, is_active")
        .eq("id", organisatieId)
        .single();

      if (error || !data) {
        return { isActive: false, trialEndsAt: null, daysRemaining: 0, isExpired: true };
      }

      const trialEndsAt = data.trial_ends_at ? new Date(data.trial_ends_at) : null;
      const now = new Date();
      const daysRemaining = trialEndsAt
        ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
        : 0;
      const isExpired = !data.is_active || (trialEndsAt !== null && trialEndsAt < now);

      return {
        isActive: data.is_active && !isExpired,
        trialEndsAt,
        daysRemaining,
        isExpired,
      };
    },
    enabled: !!user && !!organisatieId,
    staleTime: 5 * 60 * 1000,
  });
}
