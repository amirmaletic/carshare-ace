import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganisatie } from "./useOrganisatie";

export interface Bedrijfsgegevens {
  bedrijfsnaam: string;
  kvk_nummer: string;
  btw_nummer: string;
  adres: string;
  postcode: string;
  plaats: string;
  telefoon: string;
  email: string;
  standaard_handtekening: string | null;
  overdracht_kopie_email: string;
}

const empty: Bedrijfsgegevens = {
  bedrijfsnaam: "", kvk_nummer: "", btw_nummer: "", adres: "",
  postcode: "", plaats: "", telefoon: "", email: "", standaard_handtekening: null,
  overdracht_kopie_email: "",
};

export function useBedrijfsgegevens() {
  const { organisatieId, isLoading: organisatieLoading } = useOrganisatie();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["bedrijfsgegevens", organisatieId],
    enabled: !!organisatieId,
    queryFn: async (): Promise<Bedrijfsgegevens> => {
      const { data, error } = await supabase
        .from("organisaties")
        .select("naam, kvk_nummer, btw_nummer, adres, postcode, plaats, telefoon, email, standaard_handtekening, overdracht_kopie_email")
        .eq("id", organisatieId!)
        .maybeSingle();
      if (error) throw error;
      return {
        bedrijfsnaam: data?.naam ?? "",
        kvk_nummer: data?.kvk_nummer ?? "",
        btw_nummer: data?.btw_nummer ?? "",
        adres: data?.adres ?? "",
        postcode: data?.postcode ?? "",
        plaats: data?.plaats ?? "",
        telefoon: data?.telefoon ?? "",
        email: data?.email ?? "",
        standaard_handtekening: (data as any)?.standaard_handtekening ?? null,
        overdracht_kopie_email: (data as any)?.overdracht_kopie_email ?? "",
      };
    },
  });

  const save = useMutation({
    mutationFn: async (b: Bedrijfsgegevens) => {
      if (!organisatieId) throw new Error("Geen organisatie gevonden");
      const { error } = await supabase
        .from("organisaties")
        .update({
          naam: b.bedrijfsnaam || "Mijn Bedrijf",
          kvk_nummer: b.kvk_nummer || null,
          btw_nummer: b.btw_nummer || null,
          adres: b.adres || null,
          postcode: b.postcode || null,
          plaats: b.plaats || null,
          telefoon: b.telefoon || null,
          email: b.email || null,
          standaard_handtekening: b.standaard_handtekening || null,
          overdracht_kopie_email: b.overdracht_kopie_email || null,
        })
        .eq("id", organisatieId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bedrijfsgegevens"] }),
  });

  return { data: query.data ?? empty, isLoading: organisatieLoading || query.isLoading, save };
}