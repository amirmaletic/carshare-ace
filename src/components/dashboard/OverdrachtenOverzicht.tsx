import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PenLine, CheckCircle, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";

interface Overdracht {
  id: string;
  voertuig_kenteken: string;
  voertuig_naam: string;
  klant_naam: string;
  type: string;
  datum: string;
  status: string;
  handtekening: string | null;
  ondertekend_op: string | null;
  kilometerstand: number | null;
  opmerkingen: string | null;
}

export function OverdrachtenOverzicht() {
  const { user } = useAuth();

  const { data: overdrachten = [] } = useQuery({
    queryKey: ["overdrachten-overzicht"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("overdrachten")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as Overdracht[];
    },
    enabled: !!user,
  });

  // Always show, even when empty

  return (
    <div className="clean-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Overdrachten & Handtekeningen</h3>
        <PenLine className="w-4 h-4 text-muted-foreground" />
      </div>
      {overdrachten.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nog geen overdrachten. Maak er een aan bij "Ophaalafspraken vandaag" hierboven.</p>
      ) : (
      <div className="space-y-3">
        {overdrachten.map((o) => (
          <div key={o.id} className="flex items-start gap-3 p-3 rounded-lg border border-border">
            {/* Signature preview or status icon */}
            <div className="flex-shrink-0">
              {o.handtekening ? (
                <div className="w-20 h-12 rounded-lg border border-border bg-muted/30 overflow-hidden">
                  <img
                    src={o.handtekening}
                    alt="Handtekening"
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-20 h-12 rounded-lg border border-dashed border-border bg-muted/20 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground truncate">
                  {o.voertuig_naam}
                </p>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                  o.status === "ondertekend"
                    ? "bg-success/10 text-success"
                    : "bg-warning/10 text-warning"
                }`}>
                  {o.status === "ondertekend" ? "Getekend" : "Wacht"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {o.voertuig_kenteken} • {o.klant_naam}
              </p>
              <p className="text-xs text-muted-foreground">
                {o.type === "ophalen" ? "Ophalen" : "Terugbrengen"} — {format(parseISO(o.datum), "d MMM yyyy", { locale: nl })}
                {o.kilometerstand ? ` • ${o.kilometerstand.toLocaleString("nl-NL")} km` : ""}
              </p>
              {o.opmerkingen && (
                <p className="text-xs text-muted-foreground/70 mt-0.5 italic truncate">"{o.opmerkingen}"</p>
              )}
            </div>

            {/* Signed timestamp */}
            {o.ondertekend_op && (
              <div className="flex-shrink-0 text-right">
                <CheckCircle className="w-3.5 h-3.5 text-success mb-0.5 ml-auto" />
                <p className="text-[10px] text-muted-foreground">
                  {format(parseISO(o.ondertekend_op), "HH:mm")}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
