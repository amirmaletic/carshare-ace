import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, AlertCircle, CalendarClock } from "lucide-react";
import { Link } from "react-router-dom";
import { differenceInDays, parseISO, format } from "date-fns";
import { nl } from "date-fns/locale";

/**
 * Contract End-of-Lease Radar.
 *
 * Bewaakt actieve lease- en huurcontracten op:
 *  - aankomende einddatum (binnen 90 dagen)
 *  - kilometerprognose vs km_per_jaar limiet (extrapolatie op basis van looptijd)
 *
 * Sluit het 'gat' uit het marktonderzoek: end-of-lease bewaking
 * ontbreekt vrijwel volledig in de markt.
 */

const HORIZON_DAGEN = 90;

interface RadarItem {
  id: string;
  contract_nummer: string;
  klant_naam: string;
  voertuig_id: string | null;
  eind_datum: string;
  dagen_resterend: number;
  km_overschrijding_pct: number | null;
}

export function ContractRadar() {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["contract-radar"],
    queryFn: async (): Promise<RadarItem[]> => {
      const { data: contracts } = await supabase
        .from("contracts")
        .select("id, contract_nummer, klant_naam, voertuig_id, start_datum, eind_datum, km_per_jaar, type, status")
        .eq("status", "actief");

      if (!contracts || contracts.length === 0) return [];

      // Haal voertuigen voor km-prognose
      const voertuigIds = contracts.map((c) => c.voertuig_id).filter(Boolean) as string[];
      const { data: voertuigen } = voertuigIds.length
        ? await supabase.from("voertuigen").select("id, kilometerstand").in("id", voertuigIds)
        : { data: [] as any[] };

      const now = new Date();
      const result: RadarItem[] = [];

      contracts.forEach((c) => {
        const eind = parseISO(c.eind_datum);
        const dagen = differenceInDays(eind, now);

        // km overschrijding: alleen voor leasecontracten met km_per_jaar
        let kmPct: number | null = null;
        if (c.km_per_jaar && c.start_datum && c.voertuig_id) {
          const v = (voertuigen ?? []).find((x: any) => String(x.id) === String(c.voertuig_id));
          if (v) {
            const start = parseISO(c.start_datum);
            const looptijdJaren = Math.max(differenceInDays(now, start) / 365, 0.01);
            const totaalLooptijd = differenceInDays(eind, start) / 365;
            const verwachtTotEnd = c.km_per_jaar * totaalLooptijd;
            const huidigeProgessie = (v.kilometerstand / looptijdJaren) * totaalLooptijd;
            kmPct = (huidigeProgessie / verwachtTotEnd - 1) * 100;
          }
        }

        // Toon alleen items die aandacht vragen
        const aandacht = dagen <= HORIZON_DAGEN || (kmPct !== null && kmPct > 5);
        if (aandacht) {
          result.push({
            id: c.id,
            contract_nummer: c.contract_nummer,
            klant_naam: c.klant_naam,
            voertuig_id: c.voertuig_id,
            eind_datum: c.eind_datum,
            dagen_resterend: dagen,
            km_overschrijding_pct: kmPct,
          });
        }
      });

      return result.sort((a, b) => a.dagen_resterend - b.dagen_resterend);
    },
    staleTime: 5 * 60 * 1000,
  });

  const dagenBadge = (dagen: number) => {
    if (dagen < 0) return <Badge variant="destructive">Verlopen</Badge>;
    if (dagen <= 30) return <Badge variant="destructive">{dagen}d</Badge>;
    if (dagen <= 60) return <Badge className="bg-amber-500 hover:bg-amber-600 text-white">{dagen}d</Badge>;
    return <Badge variant="secondary">{dagen}d</Badge>;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-primary" />
          Contract Radar
          {items.length > 0 && (
            <Badge variant="outline" className="ml-1">
              {items.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Laden...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Geen contracten die actie vragen binnen {HORIZON_DAGEN} dagen.
          </p>
        ) : (
          <ul className="space-y-2">
            {items.slice(0, 6).map((item) => (
              <li key={item.id}>
                <Link
                  to="/contracten"
                  className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.contract_nummer} · {item.klant_naam}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        Eindigt {format(parseISO(item.eind_datum), "d MMM yyyy", { locale: nl })}
                        {item.km_overschrijding_pct !== null && item.km_overschrijding_pct > 5 && (
                          <span className="ml-2 inline-flex items-center gap-1 text-destructive">
                            <AlertCircle className="w-3 h-3" />
                            {Math.round(item.km_overschrijding_pct)}% boven km-limiet
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  {dagenBadge(item.dagen_resterend)}
                </Link>
              </li>
            ))}
            {items.length > 6 && (
              <li className="text-xs text-muted-foreground pt-1 text-center">
                +{items.length - 6} meer
              </li>
            )}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}