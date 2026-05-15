import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { parseISO } from "date-fns";

/**
 * Geeft een Set met voertuig_ids terug die in de gegeven periode bezet zijn
 * (door reserveringen, contracten, of planning blokken zoals onderhoud).
 * Wanneer start of eind ontbreekt is de Set leeg.
 */
export function useBezetteVoertuigen(startDatum?: string | null, eindDatum?: string | null) {
  return useQuery({
    queryKey: ["bezette-voertuigen", startDatum, eindDatum],
    enabled: !!startDatum && !!eindDatum,
    queryFn: async (): Promise<Set<string>> => {
      if (!startDatum || !eindDatum) return new Set();
      const sStart = parseISO(startDatum);
      const sEnd = parseISO(eindDatum);

      const overlap = (rs: string, re: string) => {
        const a = parseISO(rs);
        const b = parseISO(re);
        return !(sStart > b || sEnd < a);
      };

      const bezet = new Set<string>();

      // Reserveringen
      const { data: reserveringen } = await supabase
        .from("reserveringen")
        .select("voertuig_id, start_datum, eind_datum, status")
        .in("status", ["aangevraagd", "bevestigd", "actief"]);
      (reserveringen ?? []).forEach((r: any) => {
        if (r.voertuig_id && overlap(r.start_datum, r.eind_datum)) bezet.add(r.voertuig_id);
      });

      // Contracten (voertuig_id is text: id of kenteken)
      const { data: contracten } = await supabase
        .from("contracts")
        .select("voertuig_id, start_datum, eind_datum, status")
        .in("status", ["actief", "concept"]);
      const contractKeys: string[] = [];
      (contracten ?? []).forEach((c: any) => {
        if (c.voertuig_id && overlap(c.start_datum, c.eind_datum)) {
          contractKeys.push(c.voertuig_id);
          bezet.add(c.voertuig_id);
        }
      });

      // Resolve kenteken -> voertuig_id
      if (contractKeys.length) {
        const { data: matches } = await supabase
          .from("voertuigen")
          .select("id, kenteken")
          .or(`id.in.(${contractKeys.filter((k) => /^[0-9a-f-]{36}$/i.test(k)).join(",") || "00000000-0000-0000-0000-000000000000"}),kenteken.in.(${contractKeys.filter((k) => !/^[0-9a-f-]{36}$/i.test(k)).map((k) => `"${k}"`).join(",") || '""'})`);
        (matches ?? []).forEach((v: any) => bezet.add(v.id));
      }

      // Planning blokken
      const { data: blokken } = await supabase
        .from("planning_blokken")
        .select("voertuig_id, start_datum, eind_datum");
      (blokken ?? []).forEach((p: any) => {
        if (p.voertuig_id && overlap(p.start_datum, p.eind_datum)) bezet.add(p.voertuig_id);
      });

      return bezet;
    },
    staleTime: 30_000,
  });
}