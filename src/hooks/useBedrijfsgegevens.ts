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
}

const empty: Bedrijfsgegevens = {
  bedrijfsnaam: "", kvk_nummer: "", btw_nummer: "", adres: "",
  postcode: "", plaats: "", telefoon: "", email: "",
};

export function useBedrijfsgegevens() {
  const { organisatieId } = useOrganisatie();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["bedrijfsgegevens", organisatieId],
    enabled: !!organisatieId,
    queryFn: async (): Promise<Bedrijfsgegevens> => {
      const { data, error } = await supabase
        .from("organisaties")
        .select("naam, kvk_nummer, btw_nummer, adres, postcode, plaats, telefoon, email")
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
        })
        .eq("id", organisatieId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bedrijfsgegevens"] }),
  });

  return { data: query.data ?? empty, isLoading: query.isLoading, save };
}