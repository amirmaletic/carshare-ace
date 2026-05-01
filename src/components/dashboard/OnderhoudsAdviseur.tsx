import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Wrench, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { differenceInDays, parseISO } from "date-fns";

/**
 * AI Onderhoudsadviseur (regel-gebaseerd, geen LLM-call).
 *
 * Genereert proactieve onderhoudsaanbevelingen op basis van:
 *  - kilometerstand sinds laatste onderhoudsbeurt (>15.000 km = beurt aanbevolen)
 *  - tijd sinds laatste onderhoudsbeurt (>365 dagen = beurt aanbevolen)
 *  - openstaande schaderapporten zonder herstel
 *
 * Sluit het 'gat' uit het marktonderzoek: voorspellend onderhoud
 * ontbreekt bij Nederlandse spelers.
 */

const KM_THRESHOLD = 15000;
const DAYS_THRESHOLD = 365;

interface Aanbeveling {
  voertuig_id: string;
  kenteken: string;
  merk: string;
  model: string;
  reden: string;
  prioriteit: "hoog" | "gemiddeld" | "laag";
  score: number;
}

export function OnderhoudsAdviseur() {
  const { data: aanbevelingen = [], isLoading } = useQuery({
    queryKey: ["onderhouds-adviseur"],
    queryFn: async (): Promise<Aanbeveling[]> => {
      const [vehRes, servRes, schadeRes] = await Promise.all([
        supabase.from("voertuigen").select("id, kenteken, merk, model, kilometerstand, bouwjaar, status"),
        supabase.from("service_historie").select("voertuig_id, datum, kilometerstand, type"),
        supabase.from("schade_rapporten").select("voertuig_id, hersteld, ernst").eq("hersteld", false),
      ]);
      const voertuigen = vehRes.data ?? [];
      const services = servRes.data ?? [];
      const schades = schadeRes.data ?? [];
      const now = new Date();

      const result: Aanbeveling[] = [];

      voertuigen.forEach((v) => {
        const eigenServices = services
          .filter((s) => String(s.voertuig_id) === String(v.id) && s.type === "onderhoud")
          .sort((a, b) => (b.datum > a.datum ? 1 : -1));
        const laatste = eigenServices[0];

        const redenen: string[] = [];
        let prioriteit: Aanbeveling["prioriteit"] = "laag";
        let score = 0;

        // 1) km sinds laatste beurt
        if (laatste && laatste.kilometerstand && v.kilometerstand) {
          const kmDelta = v.kilometerstand - laatste.kilometerstand;
          if (kmDelta > KM_THRESHOLD * 1.5) {
            redenen.push(`${kmDelta.toLocaleString("nl-NL")} km sinds laatste beurt`);
            prioriteit = "hoog";
            score += 100;
          } else if (kmDelta > KM_THRESHOLD) {
            redenen.push(`${kmDelta.toLocaleString("nl-NL")} km sinds laatste beurt`);
            prioriteit = prioriteit === "hoog" ? "hoog" : "gemiddeld";
            score += 60;
          }
        } else if (!laatste && v.kilometerstand && v.kilometerstand > KM_THRESHOLD) {
          redenen.push("Geen onderhoudshistorie bekend");
          prioriteit = "gemiddeld";
          score += 50;
        }

        // 2) tijd sinds laatste beurt
        if (laatste) {
          const dagen = differenceInDays(now, parseISO(laatste.datum));
          if (dagen > DAYS_THRESHOLD * 1.5) {
            redenen.push(`${Math.round(dagen / 30)} maanden sinds laatste beurt`);
            prioriteit = "hoog";
            score += 80;
          } else if (dagen > DAYS_THRESHOLD) {
            redenen.push(`${Math.round(dagen / 30)} maanden sinds laatste beurt`);
            prioriteit = prioriteit === "hoog" ? "hoog" : "gemiddeld";
            score += 40;
          }
        }

        // 3) openstaande schade
        const openSchade = schades.filter((s) => String(s.voertuig_id) === String(v.id));
        if (openSchade.length > 0) {
          const ernstig = openSchade.some((s) => s.ernst === "ernstig" || s.ernst === "matig");
          redenen.push(`${openSchade.length} open schadepunt${openSchade.length > 1 ? "en" : ""}`);
          if (ernstig) {
            prioriteit = "hoog";
            score += 90;
          } else {
            score += 30;
          }
        }

        if (redenen.length > 0) {
          result.push({
            voertuig_id: v.id,
            kenteken: v.kenteken,
            merk: v.merk,
            model: v.model,
            reden: redenen.join(" · "),
            prioriteit,
            score,
          });
        }
      });

      return result.sort((a, b) => b.score - a.score);
    },
    staleTime: 5 * 60 * 1000,
  });

  const prioriteitsBadge = (p: Aanbeveling["prioriteit"]) => {
    if (p === "hoog") return <Badge variant="destructive">Hoog</Badge>;
    if (p === "gemiddeld") return <Badge className="bg-amber-500 hover:bg-amber-600 text-white">Gemiddeld</Badge>;
    return <Badge variant="secondary">Laag</Badge>;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          AI Onderhoudsadviseur
          {aanbevelingen.length > 0 && (
            <Badge variant="outline" className="ml-1">
              {aanbevelingen.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Analyseren...</p>
        ) : aanbevelingen.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="w-4 h-4 text-success" />
            Geen onderhoudsadviezen, je vloot is goed bij.
          </div>
        ) : (
          <ul className="space-y-2">
            {aanbevelingen.slice(0, 6).map((a) => (
              <li key={a.voertuig_id}>
                <Link
                  to="/voertuigen"
                  className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Wrench className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {a.kenteken} · {a.merk} {a.model}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{a.reden}</p>
                    </div>
                  </div>
                  {prioriteitsBadge(a.prioriteit)}
                </Link>
              </li>
            ))}
            {aanbevelingen.length > 6 && (
              <li className="text-xs text-muted-foreground pt-1 text-center">
                +{aanbevelingen.length - 6} meer
              </li>
            )}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}