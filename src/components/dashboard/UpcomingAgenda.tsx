import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Calendar, FileText, Wrench, Truck, ChevronRight } from "lucide-react";
import { format, parseISO, isAfter, addDays } from "date-fns";
import { nl } from "date-fns/locale";

interface AgendaItem {
  id: string;
  type: "contract_eind" | "rit" | "service";
  label: string;
  detail: string;
  date: string;
  path: string;
}

const iconMap = { contract_eind: FileText, rit: Truck, service: Wrench };
const colorMap = { contract_eind: "bg-primary/10 text-primary", rit: "bg-info/10 text-info", service: "bg-warning/10 text-warning" };

export function UpcomingAgenda() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const today = new Date();
  const horizon = addDays(today, 30);

  const { data: items = [] } = useQuery({
    queryKey: ["dashboard-agenda"],
    queryFn: async () => {
      const result: AgendaItem[] = [];
      const todayStr = format(today, "yyyy-MM-dd");
      const horizonStr = format(horizon, "yyyy-MM-dd");

      const [conRes, ritRes, srvRes] = await Promise.all([
        supabase.from("contracts").select("id, contract_nummer, klant_naam, eind_datum").eq("status", "actief").gte("eind_datum", todayStr).lte("eind_datum", horizonStr),
        supabase.from("ritten").select("id, van_locatie, naar_locatie, datum, status").eq("status", "gepland").gte("datum", todayStr).lte("datum", horizonStr).order("datum"),
        supabase.from("service_historie").select("id, omschrijving, datum").gte("datum", todayStr).lte("datum", horizonStr).order("datum"),
      ]);

      conRes.data?.forEach((c) => result.push({ id: `ce-${c.id}`, type: "contract_eind", label: `Contract ${c.contract_nummer} verloopt`, detail: c.klant_naam, date: c.eind_datum, path: "/contracts" }));
      ritRes.data?.forEach((r) => result.push({ id: `rit-${r.id}`, type: "rit", label: `${r.van_locatie} → ${r.naar_locatie}`, detail: "Geplande rit", date: r.datum, path: "/ritten" }));
      srvRes.data?.forEach((s) => result.push({ id: `srv-${s.id}`, type: "service", label: s.omschrijving, detail: "Gepland onderhoud", date: s.datum, path: "/maintenance" }));

      return result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 8);
    },
    enabled: !!user,
  });

  return (
    <div className="clean-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-foreground">Komende 30 dagen</h3>
        <Calendar className="w-4 h-4 text-muted-foreground" />
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Geen geplande items</p>
      ) : (
        <div className="space-y-2 max-h-[280px] overflow-y-auto">
          {items.map((item) => {
            const Icon = iconMap[item.type];
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left"
              >
                <div className={`p-1.5 rounded-lg ${colorMap[item.type]}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.detail}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-medium text-foreground">
                    {format(parseISO(item.date), "d MMM", { locale: nl })}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
