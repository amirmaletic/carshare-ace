import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CalendarRange, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

const statusColors: Record<string, "success" | "warning" | "info" | "muted" | "destructive"> = {
  bevestigd: "success",
  actief: "info",
  aangevraagd: "warning",
  voltooid: "muted",
  geannuleerd: "destructive",
};

export default function MijnReserveringen() {
  const { user } = useAuth();

  const { data: reserveringen = [], isLoading } = useQuery({
    queryKey: ["klant-reserveringen", user?.id],
    queryFn: async () => {
      // First get klant_id
      const { data: klant } = await supabase
        .from("klanten")
        .select("id")
        .eq("auth_user_id", user!.id)
        .maybeSingle();

      if (!klant) return [];

      const { data, error } = await supabase
        .from("reserveringen")
        .select("*")
        .eq("klant_id", klant.id)
        .order("start_datum", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mijn Reserveringen</h1>
          <p className="text-muted-foreground mt-1">
            {reserveringen.length} reservering{reserveringen.length !== 1 ? "en" : ""}
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link to="/portaal/reserveren">
            <Plus className="w-4 h-4" />
            Nieuwe reservering
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : reserveringen.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <CalendarRange className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">Je hebt nog geen reserveringen</p>
          <Button asChild>
            <Link to="/portaal/reserveren">Reserveer een voertuig</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {reserveringen.map((r: any) => (
            <div key={r.id} className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-medium text-foreground">
                    {format(new Date(r.start_datum), "d MMM yyyy", { locale: nl })} tot {format(new Date(r.eind_datum), "d MMM yyyy", { locale: nl })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Totaal: €{Number(r.totaalprijs).toLocaleString("nl-NL", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <StatusBadge
                  status={r.status}
                  variant={statusColors[r.status] ?? "muted"}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
