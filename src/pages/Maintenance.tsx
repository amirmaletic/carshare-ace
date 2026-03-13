import { Wrench, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { maintenanceRecords, getVehicleById } from "@/data/mockData";

function getMaintenanceStatusVariant(status: string) {
  switch (status) {
    case 'voltooid': return 'success' as const;
    case 'in_uitvoering': return 'warning' as const;
    case 'gepland': return 'info' as const;
    default: return 'muted' as const;
  }
}

const statusLabels: Record<string, string> = {
  'voltooid': 'Voltooid',
  'in_uitvoering': 'In uitvoering',
  'gepland': 'Gepland',
};

export default function Maintenance() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Onderhoud</h1>
          <p className="text-muted-foreground mt-1">Plan en beheer onderhoud, APK en reparaties</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Onderhoud inplannen
        </Button>
      </div>

      <div className="grid gap-4">
        {maintenanceRecords.map((m, i) => {
          const vehicle = getVehicleById(m.voertuigId);
          return (
            <div key={m.id} className="clean-card p-5 flex flex-col sm:flex-row sm:items-center gap-4 animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="p-2.5 rounded-lg bg-warning/10 self-start">
                <Wrench className="w-5 h-5 text-warning" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-medium text-foreground">{m.type}</h3>
                  <span className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground font-mono">{vehicle?.kenteken}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{vehicle?.merk} {vehicle?.model} — {m.beschrijving}</p>
                <p className="text-xs text-muted-foreground mt-1">Datum: {m.datum}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-medium text-foreground">€{m.kosten}</span>
                <StatusBadge status={statusLabels[m.status] || m.status} variant={getMaintenanceStatusVariant(m.status)} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
