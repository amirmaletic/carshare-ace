import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Car, Wrench, AlertTriangle, RotateCcw, FileText, Clock, User, MapPin,
} from "lucide-react";

interface TimelineEvent {
  id: string;
  datum: string;
  type: "eigendom" | "service" | "schade" | "terugmelding" | "contract";
  titel: string;
  beschrijving: string;
  icon: React.ElementType;
  kleur: string;
}

export function VehicleTimeline({ voertuigId }: { voertuigId: string }) {
  const { user } = useAuth();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["vehicle-timeline", voertuigId],
    enabled: !!user && !!voertuigId,
    queryFn: async () => {
      const timeline: TimelineEvent[] = [];

      // Eigendom historie
      const { data: eigendom } = await supabase
        .from("eigendom_historie")
        .select("*")
        .eq("voertuig_id", voertuigId)
        .order("start_datum", { ascending: true });

      eigendom?.forEach((e) => {
        timeline.push({
          id: `eig-${e.id}`,
          datum: e.start_datum,
          type: "eigendom",
          titel: `Eigenaar: ${e.eigenaar_naam}`,
          beschrijving: `${e.eigenaar_type}${e.eind_datum ? ` — tot ${e.eind_datum}` : " — huidig"}${e.notitie ? ` • ${e.notitie}` : ""}`,
          icon: User,
          kleur: "text-primary",
        });
      });

      // Service historie
      const { data: services } = await supabase
        .from("service_historie")
        .select("*")
        .eq("voertuig_id", voertuigId)
        .order("datum", { ascending: true });

      services?.forEach((s) => {
        timeline.push({
          id: `srv-${s.id}`,
          datum: s.datum,
          type: "service",
          titel: s.omschrijving,
          beschrijving: `${s.type}${s.garage ? ` bij ${s.garage}` : ""}${s.kosten ? ` — €${s.kosten}` : ""}${s.kilometerstand ? ` • ${s.kilometerstand.toLocaleString("nl-NL")} km` : ""}`,
          icon: Wrench,
          kleur: "text-warning",
        });
      });

      // Schade rapporten
      const { data: schades } = await supabase
        .from("schade_rapporten")
        .select("*")
        .eq("voertuig_id", voertuigId)
        .order("datum", { ascending: true });

      schades?.forEach((s) => {
        timeline.push({
          id: `sch-${s.id}`,
          datum: s.datum,
          type: "schade",
          titel: s.omschrijving,
          beschrijving: `Ernst: ${s.ernst}${s.locatie_schade ? ` • ${s.locatie_schade}` : ""}${s.kosten ? ` — €${s.kosten}` : ""}${s.hersteld ? " ✓ Hersteld" : ""}`,
          icon: AlertTriangle,
          kleur: "text-destructive",
        });
      });

      // Terugmeldingen
      const { data: retouren } = await supabase
        .from("terugmeldingen")
        .select("*")
        .eq("voertuig_id", voertuigId)
        .order("datum", { ascending: true });

      retouren?.forEach((t) => {
        timeline.push({
          id: `ret-${t.id}`,
          datum: t.datum,
          type: "terugmelding",
          titel: "Terugmelding",
          beschrijving: `${t.kilometerstand.toLocaleString("nl-NL")} km${t.notitie ? ` • ${t.notitie}` : ""}`,
          icon: RotateCcw,
          kleur: "text-info",
        });
      });

      // Contracten
      const { data: contracten } = await supabase
        .from("contracts")
        .select("*")
        .eq("voertuig_id", voertuigId)
        .order("start_datum", { ascending: true });

      contracten?.forEach((c) => {
        timeline.push({
          id: `con-${c.id}`,
          datum: c.start_datum,
          type: "contract",
          titel: `Contract ${c.contract_nummer}`,
          beschrijving: `${c.klant_naam} • ${c.type} • €${c.maandprijs}/mnd • ${c.start_datum} t/m ${c.eind_datum}`,
          icon: FileText,
          kleur: "text-success",
        });
      });

      // Sort by date descending (newest first)
      timeline.sort((a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime());

      return timeline;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Nog geen geschiedenis voor dit voertuig</p>
      </div>
    );
  }

  return (
    <div className="relative pl-6">
      {/* Vertical line */}
      <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />

      <div className="space-y-4">
        {events.map((event, i) => {
          const Icon = event.icon;
          return (
            <div key={event.id} className="relative animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
              {/* Dot on the line */}
              <div className={`absolute -left-6 top-1.5 w-[22px] h-[22px] rounded-full bg-background border-2 border-border flex items-center justify-center`}>
                <Icon className={`w-3 h-3 ${event.kleur}`} />
              </div>

              <div className="p-3 rounded-lg bg-muted/50 ml-2">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="font-medium text-sm text-foreground">{event.titel}</p>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{event.datum}</span>
                </div>
                <p className="text-xs text-muted-foreground">{event.beschrijving}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
