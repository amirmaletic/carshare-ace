import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type ModuleModus = "autoverhuur" | "wagenpark";

/**
 * Haalt de module-modus op van de organisatie van de ingelogde gebruiker.
 * Default = 'autoverhuur' (volledige functionaliteit).
 * In 'wagenpark'-modus zijn klant-/verhuur-gerelateerde modules verborgen.
 */
export function useModuleModus() {
  const { user, loading } = useAuth();
  return useQuery({
    queryKey: ["module-modus", user?.id],
    enabled: !loading && !!user,
    queryFn: async (): Promise<ModuleModus> => {
      const { data, error } = await supabase.rpc("get_module_modus" as any);
      if (error) throw error;
      return ((data as string) ?? "autoverhuur") as ModuleModus;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Modules die verborgen worden in 'wagenpark' modus. */
export const WAGENPARK_HIDDEN_PATHS = new Set<string>([
  "/contracten",
  "/klanten",
  "/rijbewijzen",
  "/reserveringen",
  "/terugmelden",
]);

/** Instellingen-tabs die verborgen worden in 'wagenpark' modus. */
export const WAGENPARK_HIDDEN_SETTINGS_TABS = new Set<string>([
  "portaal",       // Klantportaal is alleen voor verhuur
  "goedkeuringen", // workflow voor verhuur-acties
]);

export function isPathToegestaan(path: string, modus: ModuleModus | undefined): boolean {
  if (!modus || modus === "autoverhuur") return true;
  // wagenpark: blokkeer hidden paths (en sub-routes daarvan)
  for (const hidden of WAGENPARK_HIDDEN_PATHS) {
    if (path === hidden || path.startsWith(hidden + "/")) return false;
  }
  return true;
}