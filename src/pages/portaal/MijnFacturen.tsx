import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { FileText } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

const statusColors: Record<string, "success" | "warning" | "destructive" | "muted"> = {
  betaald: "success",
  openstaand: "warning",
  te_laat: "destructive",
  herinnering_verstuurd: "warning",
};

export default function MijnFacturen() {
  const { user } = useAuth();

  const { data: facturen = [], isLoading } = useQuery({
    queryKey: ["klant-facturen", user?.id],
    queryFn: async () => {
      // Get contracts linked to this user's email
      const { data: klant } = await supabase
        .from("klanten")
        .select("email")
        .eq("auth_user_id", user!.id)
        .maybeSingle();

      if (!klant) return [];

      // Find contracts by klant email
      const { data: contracts } = await supabase
        .from("contracts")
        .select("id")
        .eq("klant_email", klant.email);

      if (!contracts || contracts.length === 0) return [];

      const contractIds = contracts.map((c) => c.id);

      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .in("contract_id", contractIds)
        .order("datum", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mijn Facturen</h1>
        <p className="text-muted-foreground mt-1">{facturen.length} factuur/facturen</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : facturen.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">Geen facturen gevonden</p>
        </div>
      ) : (
        <div className="space-y-3">
          {facturen.map((f: any) => (
            <div key={f.id} className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">
                  {format(new Date(f.datum), "d MMMM yyyy", { locale: nl })}
                </p>
                <p className="text-lg font-bold text-foreground">
                  €{Number(f.bedrag).toLocaleString("nl-NL", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <StatusBadge
                status={f.status.replace("_", " ")}
                variant={statusColors[f.status] ?? "muted"}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
