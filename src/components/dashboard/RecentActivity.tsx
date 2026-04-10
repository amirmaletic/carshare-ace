import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { RotateCcw, FileText, Car, Wrench } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { nl } from "date-fns/locale";

interface ActivityItem {
  id: string;
  type: "terugmelding" | "contract" | "voertuig" | "service";
  label: string;
  detail: string;
  time: string;
}

const iconMap = {
  terugmelding: RotateCcw,
  contract: FileText,
  voertuig: Car,
  service: Wrench,
};

const colorMap = {
  terugmelding: "bg-warning/10 text-warning",
  contract: "bg-primary/10 text-primary",
  voertuig: "bg-success/10 text-success",
  service: "bg-info/10 text-info",
};

export function RecentActivity() {
  const { user } = useAuth();

  const { data: activities = [] } = useQuery({
    queryKey: ["dashboard-activity"],
    queryFn: async () => {
      const items: ActivityItem[] = [];

      const [tmRes, conRes, vehRes, srvRes] = await Promise.all([
        supabase.from("terugmeldingen").select("id, voertuig_naam, voertuig_kenteken, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("contracts").select("id, contract_nummer, klant_naam, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("voertuigen").select("id, merk, model, kenteken, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("service_historie").select("id, omschrijving, voertuig_id, created_at").order("created_at", { ascending: false }).limit(5),
      ]);

      tmRes.data?.forEach((t) => items.push({ id: `tm-${t.id}`, type: "terugmelding", label: "Terugmelding", detail: `${t.voertuig_naam} (${t.voertuig_kenteken})`, time: t.created_at }));
      conRes.data?.forEach((c) => items.push({ id: `con-${c.id}`, type: "contract", label: "Contract aangemaakt", detail: `${c.contract_nummer} · ${c.klant_naam}`, time: c.created_at }));
      vehRes.data?.forEach((v) => items.push({ id: `veh-${v.id}`, type: "voertuig", label: "Voertuig toegevoegd", detail: `${v.merk} ${v.model} (${v.kenteken})`, time: v.created_at }));
      srvRes.data?.forEach((s) => items.push({ id: `srv-${s.id}`, type: "service", label: "Service geregistreerd", detail: s.omschrijving, time: s.created_at }));

      return items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 8);
    },
    enabled: !!user,
  });

  return (
    <div className="clean-card p-5">
      <h3 className="font-semibold text-foreground mb-3">Recente activiteit</h3>
      {activities.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nog geen activiteit</p>
      ) : (
        <div className="space-y-3 max-h-[280px] overflow-y-auto">
          {activities.map((a) => {
            const Icon = iconMap[a.type];
            return (
              <div key={a.id} className="flex items-start gap-3">
                <div className={`p-1.5 rounded-lg ${colorMap[a.type]} mt-0.5`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{a.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{a.detail}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(parseISO(a.time), { addSuffix: true, locale: nl })}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
