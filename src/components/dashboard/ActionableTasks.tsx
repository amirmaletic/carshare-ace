import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AlertTriangle, FileText, Clock, ChevronRight } from "lucide-react";
import { isPast, parseISO, addDays, isBefore } from "date-fns";

interface TaskItem {
  id: string;
  type: "apk" | "factuur" | "contract" | "rijbewijs";
  label: string;
  detail: string;
  severity: "destructive" | "warning" | "info";
  path: string;
}

export function ActionableTasks() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: tasks = [] } = useQuery({
    queryKey: ["dashboard-tasks"],
    queryFn: async () => {
      const items: TaskItem[] = [];
      const soon = addDays(new Date(), 30);

      // APK verlopen / bijna verlopen
      const { data: vehicles } = await supabase
        .from("voertuigen")
        .select("id, kenteken, merk, model, apk_vervaldatum")
        .not("apk_vervaldatum", "is", null);

      vehicles?.forEach((v) => {
        if (!v.apk_vervaldatum) return;
        const d = parseISO(v.apk_vervaldatum);
        if (isPast(d)) {
          items.push({ id: `apk-${v.id}`, type: "apk", label: "APK verlopen", detail: `${v.kenteken} — ${v.merk} ${v.model}`, severity: "destructive", path: "/vehicles" });
        } else if (isBefore(d, soon)) {
          items.push({ id: `apk-${v.id}`, type: "apk", label: "APK verloopt binnenkort", detail: `${v.kenteken} — ${v.merk} ${v.model}`, severity: "warning", path: "/vehicles" });
        }
      });

      // Openstaande / te late facturen
      const { data: invoices } = await supabase
        .from("invoices")
        .select("id, bedrag, status, datum")
        .in("status", ["te_laat", "herinnering_verstuurd", "openstaand"]);

      invoices?.forEach((f) => {
        const sev = f.status === "te_laat" || f.status === "herinnering_verstuurd" ? "destructive" : "warning";
        items.push({ id: `fac-${f.id}`, type: "factuur", label: f.status === "te_laat" ? "Factuur te laat" : "Factuur openstaand", detail: `€${f.bedrag} — ${f.datum}`, severity: sev, path: "/contracts" });
      });

      // Contracten die binnenkort verlopen
      const { data: contracts } = await supabase
        .from("contracts")
        .select("id, contract_nummer, klant_naam, eind_datum, status")
        .eq("status", "actief");

      contracts?.forEach((c) => {
        const d = parseISO(c.eind_datum);
        if (isBefore(d, soon)) {
          items.push({ id: `con-${c.id}`, type: "contract", label: "Contract verloopt", detail: `${c.contract_nummer} — ${c.klant_naam}`, severity: "warning", path: "/contracts" });
        }
      });

      // Rijbewijzen die verlopen
      const { data: chauffeurs } = await supabase
        .from("chauffeurs")
        .select("id, voornaam, achternaam, rijbewijs_verloopt")
        .not("rijbewijs_verloopt", "is", null);

      chauffeurs?.forEach((ch) => {
        if (!ch.rijbewijs_verloopt) return;
        const d = parseISO(ch.rijbewijs_verloopt);
        if (isPast(d)) {
          items.push({ id: `rb-${ch.id}`, type: "rijbewijs", label: "Rijbewijs verlopen", detail: `${ch.voornaam} ${ch.achternaam}`, severity: "destructive", path: "/chauffeurs" });
        } else if (isBefore(d, soon)) {
          items.push({ id: `rb-${ch.id}`, type: "rijbewijs", label: "Rijbewijs verloopt", detail: `${ch.voornaam} ${ch.achternaam}`, severity: "warning", path: "/chauffeurs" });
        }
      });

      // Sort: destructive first
      return items.sort((a, b) => (a.severity === "destructive" ? -1 : 1) - (b.severity === "destructive" ? -1 : 1));
    },
    enabled: !!user,
  });

  const iconMap = { apk: AlertTriangle, factuur: FileText, contract: FileText, rijbewijs: Clock };

  return (
    <div className="clean-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-foreground">Openstaande taken</h3>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
          {tasks.length}
        </span>
      </div>
      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">Alles is op orde 🎉</p>
      ) : (
        <div className="space-y-2 max-h-[280px] overflow-y-auto">
          {tasks.slice(0, 8).map((t) => {
            const Icon = iconMap[t.type];
            return (
              <button
                key={t.id}
                onClick={() => navigate(t.path)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors hover:bg-muted/50
                  ${t.severity === "destructive" ? "bg-destructive/5 border-destructive/10" : t.severity === "warning" ? "bg-warning/5 border-warning/10" : "bg-info/5 border-info/10"}`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${t.severity === "destructive" ? "text-destructive" : t.severity === "warning" ? "text-warning" : "text-info"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{t.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{t.detail}</p>
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
