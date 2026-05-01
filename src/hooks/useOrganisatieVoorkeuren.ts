import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganisatie } from "./useOrganisatie";

export interface Voorkeuren {
  apk_herinnering: boolean;
  apk_dagen_vooraf: number;
  verzekering_herinnering: boolean;
  onderhoud_herinnering: boolean;
  contract_verloop: boolean;
  contract_dagen_vooraf: number;
  factuur_herinnering: boolean;
  km_overschrijding: boolean;
  standaard_btw: string;
  valuta: string;
  datum_formaat: string;
  km_registratie_interval: string;
  standaard_contract_duur: string;
}

const defaults: Voorkeuren = {
  apk_herinnering: true, apk_dagen_vooraf: 30,
  verzekering_herinnering: true, onderhoud_herinnering: true,
  contract_verloop: true, contract_dagen_vooraf: 60,
  factuur_herinnering: true, km_overschrijding: true,
  standaard_btw: "21", valuta: "EUR", datum_formaat: "dd-mm-yyyy",
  km_registratie_interval: "maandelijks", standaard_contract_duur: "12",
};

export function useOrganisatieVoorkeuren() {
  const { organisatieId, isLoading: organisatieLoading } = useOrganisatie();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["org_voorkeuren", organisatieId],
    enabled: !!organisatieId,
    queryFn: async (): Promise<Voorkeuren> => {
      const { data, error } = await supabase
        .from("organisatie_voorkeuren")
        .select("*")
        .eq("organisatie_id", organisatieId!)
        .maybeSingle();
      if (error) throw error;
      if (!data) return defaults;
      return {
        apk_herinnering: data.apk_herinnering,
        apk_dagen_vooraf: data.apk_dagen_vooraf,
        verzekering_herinnering: data.verzekering_herinnering,
        onderhoud_herinnering: data.onderhoud_herinnering,
        contract_verloop: data.contract_verloop,
        contract_dagen_vooraf: data.contract_dagen_vooraf,
        factuur_herinnering: data.factuur_herinnering,
        km_overschrijding: data.km_overschrijding,
        standaard_btw: data.standaard_btw,
        valuta: data.valuta,
        datum_formaat: data.datum_formaat,
        km_registratie_interval: data.km_registratie_interval,
        standaard_contract_duur: data.standaard_contract_duur,
      };
    },
  });

  const save = useMutation({
    mutationFn: async (v: Voorkeuren) => {
      if (!organisatieId) throw new Error("Geen organisatie gevonden");
      const { error } = await supabase
        .from("organisatie_voorkeuren")
        .upsert({ organisatie_id: organisatieId, ...v }, { onConflict: "organisatie_id" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["org_voorkeuren"] }),
  });

  return { data: query.data ?? defaults, isLoading: organisatieLoading || query.isLoading, save };
}