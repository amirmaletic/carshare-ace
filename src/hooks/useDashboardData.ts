import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface DashboardPeriod {
  start: Date;
  end: Date;
  /** Vorige periode van gelijke lengte voor trend-vergelijking */
  prevStart: Date;
  prevEnd: Date;
  label: string;
}

/**
 * Eén centrale hook die alle relevante data ophaalt voor de dashboarding.
 * Filtert client-side op periode zodat we trend-vergelijkingen kunnen doen.
 */
export function useDashboardData() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["dashboard-data-all"],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const [
        voertuigenRes,
        contractsRes,
        invoicesRes,
        overdrachtenRes,
        schadesRes,
        kmRes,
        klantenRes,
        ritRes,
        aanvragenRes,
        serviceRes,
      ] = await Promise.all([
        supabase.from("voertuigen").select("*"),
        supabase.from("contracts").select("*"),
        supabase.from("invoices").select("*"),
        supabase.from("overdrachten").select("*"),
        supabase.from("schade_rapporten").select("*"),
        supabase.from("kilometer_registraties").select("*"),
        supabase.from("klanten").select("*"),
        supabase.from("ritten").select("*"),
        supabase.from("aanvragen").select("*"),
        supabase.from("service_historie").select("*"),
      ]);

      return {
        voertuigen: voertuigenRes.data ?? [],
        contracts: contractsRes.data ?? [],
        invoices: invoicesRes.data ?? [],
        overdrachten: overdrachtenRes.data ?? [],
        schades: schadesRes.data ?? [],
        kilometers: kmRes.data ?? [],
        klanten: klantenRes.data ?? [],
        ritten: ritRes.data ?? [],
        aanvragen: aanvragenRes.data ?? [],
        services: serviceRes.data ?? [],
      };
    },
  });
}
