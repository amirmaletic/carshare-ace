import { Wrench, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useVoertuigen } from "@/hooks/useVoertuigen";

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
  const { user } = useAuth();
  const { voertuigen } = useVoertuigen();

  const { data: serviceRecords = [], isLoading } = useQuery({
    queryKey: ["all-service-historie"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_historie")
        .select("*")
        .order("datum", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const getVehicle = (id: string) => voertuigen.find(v => v.id === id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Onderhoud</h1>
          <p className="text-muted-foreground mt-1">Plan en beheer onderhoud, APK en reparaties</p>
        </div>
        <Button className="gap-2"><Plus className="w-4 h-4" />Onderhoud inplannen</Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : serviceRecords.length === 0 ? (
        <div className="text-center py-16">
          <Wrench className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-1">Geen onderhoudsrecords</h3>
          <p className="text-muted-foreground text-sm">Onderhoudsrecords verschijnen hier zodra ze zijn aangemaakt.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {serviceRecords.map((m: any, i: number) => {
            const vehicle = getVehicle(m.voertuig_id);
            return (
              <div key={m.id} className="clean-card p-5 flex flex-col sm:flex-row sm:items-center gap-4 animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="p-2.5 rounded-lg bg-warning/10 self-start"><Wrench className="w-5 h-5 text-warning" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-foreground">{m.type}</h3>
                    <span className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground font-mono">{vehicle?.kenteken ?? "-"}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{vehicle ? `${vehicle.merk} ${vehicle.model} · ` : ""}{m.omschrijving}</p>
                  <p className="text-xs text-muted-foreground mt-1">Datum: {m.datum}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-medium text-foreground">€{m.kosten ?? 0}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
