import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SignaturePad } from "@/components/SignaturePad";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Car, CheckCircle, Clock, PenLine } from "lucide-react";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import { toast } from "sonner";

interface Overdracht {
  id: string;
  voertuig_kenteken: string;
  voertuig_naam: string;
  klant_naam: string;
  klant_email: string | null;
  type: string;
  datum: string;
  status: string;
  kilometerstand: number | null;
  handtekening: string | null;
  opmerkingen: string | null;
  ondertekend_op: string | null;
  contract_id: string | null;
}

export function TodayPickups() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedOverdracht, setSelectedOverdracht] = useState<Overdracht | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [kilometerstand, setKilometerstand] = useState("");
  const [opmerkingen, setOpmerkingen] = useState("");

  const today = format(new Date(), "yyyy-MM-dd");

  const { data: overdrachten = [], isLoading } = useQuery({
    queryKey: ["overdrachten-vandaag", today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("overdrachten")
        .select("*")
        .eq("datum", today)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Overdracht[];
    },
    enabled: !!user,
  });

  // Also auto-create overdrachten from contracts starting today
  const { data: contractPickups = [] } = useQuery({
    queryKey: ["contract-pickups-today", today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select("id, voertuig_id, klant_naam, klant_email, contract_nummer, start_datum")
        .eq("start_datum", today)
        .in("status", ["actief", "concept"]);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const createOverdrachtMutation = useMutation({
    mutationFn: async (contract: typeof contractPickups[0]) => {
      // Check if overdracht already exists for this contract
      const { data: existing } = await supabase
        .from("overdrachten")
        .select("id")
        .eq("contract_id", contract.id)
        .eq("type", "ophalen")
        .maybeSingle();
      if (existing) return;

      // Get vehicle info
      const { data: vehicle } = await supabase
        .from("voertuigen")
        .select("kenteken, merk, model")
        .eq("id", contract.voertuig_id ?? "")
        .maybeSingle();

      const { error } = await supabase.from("overdrachten").insert({
        user_id: user!.id,
        contract_id: contract.id,
        voertuig_id: contract.voertuig_id ?? "",
        voertuig_kenteken: vehicle?.kenteken ?? "Onbekend",
        voertuig_naam: vehicle ? `${vehicle.merk} ${vehicle.model}` : "Onbekend",
        klant_naam: contract.klant_naam,
        klant_email: contract.klant_email,
        type: "ophalen",
        datum: today,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["overdrachten-vandaag"] }),
  });

  // Auto-create overdrachten for contracts starting today
  useState(() => {
    contractPickups.forEach((c) => {
      if (c.voertuig_id) createOverdrachtMutation.mutate(c);
    });
  });

  const signMutation = useMutation({
    mutationFn: async () => {
      if (!selectedOverdracht || !signature) return;
      const { error } = await supabase
        .from("overdrachten")
        .update({
          handtekening: signature,
          status: "ondertekend",
          ondertekend_op: new Date().toISOString(),
          kilometerstand: kilometerstand ? parseInt(kilometerstand) : null,
          opmerkingen: opmerkingen || null,
        })
        .eq("id", selectedOverdracht.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Overdracht ondertekend!");
      queryClient.invalidateQueries({ queryKey: ["overdrachten-vandaag"] });
      setSelectedOverdracht(null);
      setSignature(null);
      setKilometerstand("");
      setOpmerkingen("");
    },
    onError: () => toast.error("Er ging iets mis bij het opslaan"),
  });

  const openSignDialog = (o: Overdracht) => {
    setSelectedOverdracht(o);
    setKilometerstand(o.kilometerstand?.toString() ?? "");
    setOpmerkingen(o.opmerkingen ?? "");
    setSignature(null);
  };

  const allItems = overdrachten;

  if (isLoading) return null;
  if (allItems.length === 0 && contractPickups.length === 0) return null;

  return (
    <>
      <div className="clean-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground">Ophaalafspraken vandaag</h3>
          <Car className="w-4 h-4 text-muted-foreground" />
        </div>

        {allItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">Geen overdrachten vandaag</p>
        ) : (
          <div className="space-y-2">
            {allItems.map((o) => (
              <div
                key={o.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border"
              >
                <div className={`p-2 rounded-lg ${o.status === "ondertekend" ? "bg-success/10" : "bg-warning/10"}`}>
                  {o.status === "ondertekend" ? (
                    <CheckCircle className="w-4 h-4 text-success" />
                  ) : (
                    <Clock className="w-4 h-4 text-warning" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {o.voertuig_naam} <span className="text-muted-foreground">({o.voertuig_kenteken})</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {o.klant_naam} • {o.type === "ophalen" ? "Ophalen" : "Terugbrengen"}
                  </p>
                </div>
                {o.status === "ondertekend" ? (
                  <span className="text-xs font-medium text-success px-2 py-1 rounded-full bg-success/10">
                    Getekend
                  </span>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => openSignDialog(o)}>
                    <PenLine className="w-3.5 h-3.5 mr-1" /> Ondertekenen
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Signature Dialog */}
      <Dialog open={!!selectedOverdracht} onOpenChange={(open) => !open && setSelectedOverdracht(null)}>
        <DialogContent className="max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Overdracht ondertekenen</DialogTitle>
          </DialogHeader>

          {selectedOverdracht && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                <p className="text-sm font-medium text-foreground">
                  {selectedOverdracht.voertuig_naam}
                </p>
                <p className="text-xs text-muted-foreground">
                  Kenteken: {selectedOverdracht.voertuig_kenteken}
                </p>
                <p className="text-xs text-muted-foreground">
                  Klant: {selectedOverdracht.klant_naam}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Kilometerstand
                </label>
                <Input
                  type="number"
                  placeholder="bijv. 45230"
                  value={kilometerstand}
                  onChange={(e) => setKilometerstand(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Opmerkingen
                </label>
                <Textarea
                  placeholder="Eventuele opmerkingen over de staat van het voertuig..."
                  value={opmerkingen}
                  onChange={(e) => setOpmerkingen(e.target.value)}
                  rows={2}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Handtekening klant
                </label>
                <SignaturePad
                  onSignatureChange={setSignature}
                  width={370}
                  height={160}
                />
              </div>

              <Button
                className="w-full"
                disabled={!signature || signMutation.isPending}
                onClick={() => signMutation.mutate()}
              >
                {signMutation.isPending ? "Opslaan..." : "Bevestig overdracht"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
