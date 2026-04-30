import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface KlantAccount {
  id: string;
  voornaam: string;
  achternaam: string;
  email: string;
  telefoon: string | null;
  adres: string | null;
  postcode: string | null;
  plaats: string | null;
  type: string;
  bedrijfsnaam: string | null;
  kvk_nummer: string | null;
  rijbewijs_nummer: string | null;
  rijbewijs_verloopt: string | null;
  notities: string | null;
  auth_user_id: string | null;
  created_at: string;
  updated_at: string;
  organisatie_id: string | null;
}

export function useKlanten() {
  return useQuery({
    queryKey: ["klanten"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("klanten")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as KlantAccount[];
    },
  });
}

export function useKlantReserveringen(klantId: string | null) {
  return useQuery({
    queryKey: ["klant-reserveringen", klantId],
    enabled: !!klantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reserveringen")
        .select("*")
        .eq("klant_id", klantId!)
        .order("start_datum", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useKlantFacturen(klantEmail: string | null) {
  return useQuery({
    queryKey: ["klant-facturen", klantEmail],
    enabled: !!klantEmail,
    queryFn: async () => {
      // Facturen via contracts -> klant_email koppeling
      const { data: contracten, error: cErr } = await supabase
        .from("contracts")
        .select("id, contract_nummer, klant_email, type, status, start_datum, eind_datum, maandprijs")
        .eq("klant_email", klantEmail!);
      if (cErr) throw cErr;
      const contractIds = (contracten ?? []).map((c) => c.id);
      if (contractIds.length === 0) return { contracten: [], facturen: [] };

      const { data: facturen, error: fErr } = await supabase
        .from("invoices")
        .select("*")
        .in("contract_id", contractIds)
        .order("datum", { ascending: false });
      if (fErr) throw fErr;

      return { contracten: contracten ?? [], facturen: facturen ?? [] };
    },
  });
}