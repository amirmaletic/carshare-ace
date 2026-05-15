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
        .select("id, voornaam, achternaam, email, telefoon, adres, rijbewijs_nummer, rijbewijs_verloopt, updated_at")
        .ilike("email", (email ?? "").trim())
        .order("updated_at", { ascending: false, nullsFirst: false })
        .limit(10);
      if (error) throw error;
      const rows = (data ?? []) as (ContractKlant & { updated_at?: string | null })[];
      // Voorkeur: de meest recent bijgewerkte rij die rijbewijsgegevens bevat
      const best = rows.find((r) => r.rijbewijs_nummer) ?? rows[0] ?? null;
      return best;
    },
  });
}