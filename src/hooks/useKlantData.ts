import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type KlantProfiel = {
  id: string;
  voornaam: string | null;
  achternaam: string | null;
  email: string | null;
  telefoon: string | null;
  adres: string | null;
  postcode: string | null;
  plaats: string | null;
  rijbewijs_nummer: string | null;
  rijbewijs_verloopt: string | null;
  type: string | null;
  bedrijfsnaam: string | null;
  kvk_nummer: string | null;
  organisatie_id: string;
};

/** Profiel van de ingelogde klant. */
export function useKlantProfiel() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["klant-profiel", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<KlantProfiel | null> => {
      const { data, error } = await supabase
        .from("klanten")
        .select("*")
        .eq("auth_user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data as KlantProfiel | null) ?? null;
    },
  });
}

/** Reserveringen + voertuig van de klant. */
export function useKlantReserveringen() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["klant-reserveringen", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: klant } = await supabase
        .from("klanten")
        .select("id")
        .eq("auth_user_id", user!.id)
        .maybeSingle();
      if (!klant) return [];

      const { data, error } = await supabase
        .from("reserveringen")
        .select(
          `id, start_datum, eind_datum, dagprijs, totaalprijs, status, notities, created_at, voertuig_id,
           voertuig:voertuigen(id, merk, model, kenteken, image_url, brandstof, categorie, kleur)`
        )
        .eq("klant_id", klant.id)
        .order("start_datum", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Lopende huur (status actief of bevestigd en periode omvat vandaag). */
export function useLopendeHuur() {
  const reserveringen = useKlantReserveringen();
  const today = new Date().toISOString().slice(0, 10);
  const lopend = (reserveringen.data ?? []).find((r: any) => {
    const actief = ["actief", "lopend", "bevestigd"].includes(r.status);
    return actief && r.start_datum <= today && r.eind_datum >= today;
  });
  const komend = (reserveringen.data ?? []).find((r: any) => {
    return ["bevestigd", "aangevraagd"].includes(r.status) && r.start_datum > today;
  });
  return { lopend, komend, isLoading: reserveringen.isLoading };
}

/** Facturen van de klant. */
export function useKlantFacturen() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["klant-facturen", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .order("datum", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Rijbewijs status van de klant. */
export function useRijbewijsStatus() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["klant-rijbewijs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: klant } = await supabase
        .from("klanten")
        .select("id")
        .eq("auth_user_id", user!.id)
        .maybeSingle();
      if (!klant) return null;
      const { data } = await supabase
        .from("rijbewijs_verificaties")
        .select("id, status, ai_vervaldatum, created_at, upload_token, token_expires_at")
        .eq("klant_id", klant.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data ?? null;
    },
  });
}

/** Overdrachten van de klant. */
export function useKlantOverdrachten() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["klant-overdrachten", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("overdrachten")
        .select("*")
        .order("datum", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Schade rapporten gekoppeld aan voertuigen die de klant huurt of huurde. */
export function useKlantSchade() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["klant-schade", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schade_rapporten")
        .select("id, datum, omschrijving, locatie_schade, ernst, hersteld, fotos, voertuig_id")
        .order("datum", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}
