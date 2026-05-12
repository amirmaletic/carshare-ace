import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { DbAanvraag } from "@/hooks/useAanvragen";

export interface MatchVoertuig {
  id: string;
  kenteken: string;
  merk: string;
  model: string;
  bouwjaar: number | null;
  brandstof: string | null;
  categorie: string | null;
  kleur: string | null;
  dagprijs: number;
  image_url: string | null;
  status: string;
  score: number;
  redenen: string[];
}

function norm(s: string | null | undefined) {
  return (s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function dateOverlap(aStart: string, aEind: string, bStart: string, bEind: string) {
  return aStart <= bEind && bStart <= aEind;
}

/**
 * Geeft per aanvraag een gesorteerde lijst beschikbare voertuigen voor de gewenste periode.
 * Eerste voertuig is de top-suggestie.
 */
export function useAanvraagMatching(aanvraag: DbAanvraag | null) {
  const { user } = useAuth();
  const start = aanvraag?.gewenste_periode_start ?? null;
  const eind = aanvraag?.gewenste_periode_eind ?? start;

  return useQuery({
    queryKey: ["aanvraag-matching", aanvraag?.id, start, eind],
    enabled: !!user && !!aanvraag,
    queryFn: async (): Promise<MatchVoertuig[]> => {
      if (!aanvraag) return [];
      const periodeStart = start ?? new Date().toISOString().slice(0, 10);
      const periodeEind = eind ?? periodeStart;

      const [{ data: voertuigen }, { data: contracts }, { data: reserveringen }, { data: onderhoud }] =
        await Promise.all([
          supabase
            .from("voertuigen")
            .select("id, kenteken, merk, model, bouwjaar, brandstof, categorie, kleur, dagprijs, image_url, status"),
          supabase
            .from("contracts")
            .select("voertuig_id, start_datum, eind_datum, status")
            .in("status", ["actief", "concept"]),
          supabase
            .from("reserveringen")
            .select("voertuig_id, start_datum, eind_datum, status")
            .in("status", ["aangevraagd", "bevestigd", "actief"]),
          supabase
            .from("service_historie")
            .select("voertuig_id, datum, status")
            .gte("datum", periodeStart)
            .lte("datum", periodeEind),
        ]);

      const wensType = norm(aanvraag.gewenst_type);
      const wensCat = norm(aanvraag.gewenste_categorie);
      const wensBrand = norm(aanvraag.gewenste_brandstof);
      const budget = aanvraag.budget_max ?? null;

      const isBezet = (vId: string) => {
        if ((contracts ?? []).some((c: any) =>
          c.voertuig_id && String(c.voertuig_id) === vId &&
          dateOverlap(periodeStart, periodeEind, c.start_datum, c.eind_datum)
        )) return "Contract loopt in deze periode";
        if ((reserveringen ?? []).some((r: any) =>
          r.voertuig_id && String(r.voertuig_id) === vId &&
          dateOverlap(periodeStart, periodeEind, r.start_datum, r.eind_datum)
        )) return "Andere reservering";
        if ((onderhoud ?? []).some((o: any) =>
          o.voertuig_id && String(o.voertuig_id) === vId
        )) return "Onderhoud gepland";
        return null;
      };

      const kandidaten: MatchVoertuig[] = [];
      for (const v of (voertuigen ?? []) as any[]) {
        if (["onderhoud", "schade", "verkocht", "uit_dienst"].includes(v.status)) continue;
        const bezet = isBezet(v.id);
        if (bezet) continue;

        let score = 0;
        const redenen: string[] = [];
        const merkModel = norm(`${v.merk} ${v.model}`);

        if (wensType) {
          const wens = wensType;
          if (merkModel.includes(wens) || wens.includes(norm(v.model)) || wens.includes(norm(v.merk))) {
            score += 50;
            redenen.push("Match op merk/model");
          } else {
            // niet exacte merk/model match: lichte penalty maar nog meedoen
            score -= 10;
          }
        }
        if (wensCat && norm(v.categorie) === wensCat) {
          score += 20;
          redenen.push("Zelfde categorie");
        }
        if (wensBrand && norm(v.brandstof) === wensBrand) {
          score += 15;
          redenen.push("Zelfde brandstof");
        }
        if (budget != null) {
          if (Number(v.dagprijs) <= Number(budget)) {
            score += 10;
            redenen.push("Binnen budget");
          } else {
            score -= 25;
            redenen.push("Boven budget");
          }
        }
        // basis: beschikbaar
        score += 5;
        if (redenen.length === 0) redenen.push("Beschikbaar in periode");

        kandidaten.push({
          id: v.id,
          kenteken: v.kenteken,
          merk: v.merk,
          model: v.model,
          bouwjaar: v.bouwjaar,
          brandstof: v.brandstof,
          categorie: v.categorie,
          kleur: v.kleur,
          dagprijs: Number(v.dagprijs ?? 0),
          image_url: v.image_url,
          status: v.status,
          score,
          redenen,
        });
      }
      kandidaten.sort((a, b) => b.score - a.score || a.dagprijs - b.dagprijs);
      return kandidaten;
    },
  });
}