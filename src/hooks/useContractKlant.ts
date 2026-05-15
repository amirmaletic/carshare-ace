import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ContractKlant {
  id: string;
  voornaam: string;
  achternaam: string;
  email: string;
  telefoon: string | null;
  adres: string | null;
  rijbewijs_nummer: string | null;
  rijbewijs_verloopt: string | null;
}

export function useContractKlant(email: string | null | undefined) {
  return useQuery({
    queryKey: ["contract-klant", (email ?? "").toLowerCase()],
    enabled: !!email,
    queryFn: async (): Promise<ContractKlant | null> => {
      const { data, error } = await supabase
        .from("klanten")
        .select("id, voornaam, achternaam, email, telefoon, adres, rijbewijs_nummer, rijbewijs_verloopt")
        .ilike("email", (email ?? "").trim())
        .maybeSingle();
      if (error) throw error;
      return (data as ContractKlant) ?? null;
    },
  });
}