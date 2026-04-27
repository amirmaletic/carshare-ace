import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ShieldCheck, Wrench } from "lucide-react";
import { Link } from "react-router-dom";
import { differenceInDays, parseISO, format } from "date-fns";
import { nl } from "date-fns/locale";

interface Vervalitem {
  id: string;
  kenteken: string;
  merk: string;
  model: string;
  type: "apk" | "verzekering";
  vervaldatum: string;
  dagen: number;
}

const HORIZON_DAGEN = 60;

export function VervaldatumWaarschuwingen() {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["vervaldatum-waarschuwingen"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("voertuigen")
        .select("id, kenteken, merk, model, apk_vervaldatum, verzekering_vervaldatum");
      if (error) throw error;
      const now = new Date();
      const result: Vervalitem[] = [];
      (data ?? []).forEach((v) => {
        if (v.apk_vervaldatum) {
          const dagen = differenceInDays(parseISO(v.apk_vervaldatum), now);
          if (dagen <= HORIZON_DAGEN) {
            result.push({ id: v.id, kenteken: v.kenteken, merk: v.merk, model: v.model, type: "apk", vervaldatum: v.apk_vervaldatum, dagen });
          }
        }
        if (v.verzekering_vervaldatum) {
          const dagen = differenceInDays(parseISO(v.verzekering_vervaldatum), now);
          if (dagen <= HORIZON_DAGEN) {
            result.push({ id: v.id, kenteken: v.kenteken, merk: v.merk, model: v.model, type: "verzekering", vervaldatum: v.verzekering_vervaldatum, dagen });
          }
        }
      });
      return result.sort((a, b) => a.dagen - b.dagen);
    },
    staleTime: 5 * 60 * 1000,
  });

  const getBadge = (dagen: number) => {
    if (dagen < 0) return <Badge variant="destructive">Verlopen</Badge>;
    if (dagen <= 7) return <Badge variant="destructive">{dagen}d</Badge>;
    if (dagen <= 30) return <Badge className="bg-amber-500 hover:bg-amber-600 text-white">{dagen}d</Badge>;
    return <Badge variant="secondary">{dagen}d</Badge>;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          APK & verzekering vervalt
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Laden...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Geen aankomende vervaldatums binnen {HORIZON_DAGEN} dagen.</p>
        ) : (
          <ul className="space-y-2">
            {items.slice(0, 8).map((item) => (
              <li key={`${item.id}-${item.type}`}>
                <Link
                  to="/voertuigen"
                  className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {item.type === "apk" ? (
                      <Wrench className="w-4 h-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.kenteken} · {item.merk} {item.model}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {item.type} · {format(parseISO(item.vervaldatum), "d MMM yyyy", { locale: nl })}
                      </p>
                    </div>
                  </div>
                  {getBadge(item.dagen)}
                </Link>
              </li>
            ))}
            {items.length > 8 && (
              <li className="text-xs text-muted-foreground pt-1 text-center">
                +{items.length - 8} meer
              </li>
            )}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
