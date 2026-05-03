import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface VergelijkingResultaat {
  samenvatting: string;
  nieuwe_schades: Array<{
    terugmeld_punt_id?: string;
    locatie: string;
    type: string;
    ernst: "licht" | "middel" | "zwaar";
    confidence: number;
    uitleg: string;
  }>;
  reeds_bestaande: Array<{ terugmeld_punt_id?: string; uitleg: string }>;
}

export interface SchadeVergelijking {
  id: string;
  terugmelding_id: string;
  ophaal_overdracht_id: string | null;
  voertuig_id: string;
  status: string;
  ai_resultaat: VergelijkingResultaat;
  ai_model: string | null;
  beoordeeld_door: string | null;
  beoordeeld_op: string | null;
  notitie: string | null;
  created_at: string;
}

export function useStartVergelijking() {
  return useMutation({
    mutationFn: async (terugmelding_id: string): Promise<{ vergelijking: SchadeVergelijking; ophaal_aanwezig: boolean }> => {
      const { data, error } = await supabase.functions.invoke("vergelijk-schade", {
        body: { terugmelding_id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
  });
}
