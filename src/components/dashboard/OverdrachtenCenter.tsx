import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SignaturePad } from "@/components/SignaturePad";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Car, CheckCircle, Clock, PenLine, RotateCcw, CalendarClock } from "lucide-react";
import { format, addDays, parseISO } from "date-fns";
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

export function OverdrachtenCenter() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedOverdracht, setSelectedOverdracht] = useState<Overdracht | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [kilometerstand, setKilometerstand] = useState("");
  const [opmerkingen, setOpmerkingen] = useState("");
  const [tab, setTab] = useState("vandaag");

  const today = format(new Date(), "yyyy-MM-dd");
  const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");

  // Alle overdrachten van vandaag, morgen en recent (laatste 10 ondertekende)
  const { data: vandaag = [] } = useQuery({
    queryKey: ["overdrachten", today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("overdrachten").select("*").eq("datum", today)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Overdracht[];
    },
    enabled: !!user,
  });

  const { data: morgen = [] } = useQuery({
    queryKey: ["overdrachten", tomorrow],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("overdrachten").select("*").eq("datum", tomorrow)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Overdracht[];
    },
    enabled: !!user,
  });

  const { data: recent = [] } = useQuery({
    queryKey: ["overdrachten-recent"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("overdrachten").select("*")
        .order("created_at", { ascending: false }).limit(10);
      if (error) throw error;
      return data as Overdracht[];
    },
    enabled: !!user,
  });

  // Contracts die vandaag/morgen starten of eindigen
  const { data: contractEvents = [] } = useQuery({
    queryKey: ["contract-overdracht-events", today, tomorrow],
    queryFn: async () => {
      const { data: starts } = await supabase
        .from("contracts")
        .select("id, voertuig_id, klant_naam, klant_email, start_datum, eind_datum, status")
        .in("start_datum", [today, tomorrow])
        .in("status", ["actief", "concept"]);
      const { data: ends } = await supabase
        .from("contracts")
        .select("id, voertuig_id, klant_naam, klant_email, start_datum, eind_datum, status")
        .in("eind_datum", [today, tomorrow])
        .eq("status", "actief");
      const events: Array<{ contract: any; type: "ophalen" | "terugbrengen"; datum: string }> = [];
      (starts ?? []).forEach((c) => events.push({ contract: c, type: "ophalen", datum: c.start_datum }));
      (ends ?? []).forEach((c) => events.push({ contract: c, type: "terugbrengen", datum: c.eind_datum }));
      return events;
    },
    enabled: !!user,
  });

  const createOverdrachtMutation = useMutation({
    mutationFn: async ({ contract, type, datum }: { contract: any; type: "ophalen" | "terugbrengen"; datum: string }) => {
      const { data: existing } = await supabase
        .from("overdrachten").select("id")
        .eq("contract_id", contract.id).eq("type", type).eq("datum", datum)
        .maybeSingle();
      if (existing) return;
      const { data: vehicle } = await supabase
        .from("voertuigen").select("kenteken, merk, model")
        .eq("id", contract.voertuig_id ?? "").maybeSingle();
      const { error } = await supabase.from("overdrachten").insert({
        user_id: user!.id,
        contract_id: contract.id,
        voertuig_id: contract.voertuig_id ?? "",
        voertuig_kenteken: vehicle?.kenteken ?? "Onbekend",
        voertuig_naam: vehicle ? `${vehicle.merk} ${vehicle.model}` : "Onbekend",
        klant_naam: contract.klant_naam,
        klant_email: contract.klant_email,
        type,
        datum,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["overdrachten", today] });
      queryClient.invalidateQueries({ queryKey: ["overdrachten", tomorrow] });
      queryClient.invalidateQueries({ queryKey: ["overdrachten-recent"] });
    },
  });

  // Auto-create overdrachten voor contracten die vandaag/morgen starten of eindigen
  useEffect(() => {
    contractEvents.forEach((ev) => {
      if (ev.contract.voertuig_id) createOverdrachtMutation.mutate(ev);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractEvents.length]);

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
      queryClient.invalidateQueries({ queryKey: ["overdrachten", today] });
      queryClient.invalidateQueries({ queryKey: ["overdrachten", tomorrow] });
      queryClient.invalidateQueries({ queryKey: ["overdrachten-recent"] });
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

  const getConfirmationText = (o: Overdracht) => {
    if (o.type === "ophalen") {
      return `Ik, ${o.klant_naam}, bevestig dat ik de auto met kenteken ${o.voertuig_kenteken} (${o.voertuig_naam}) in ontvangst heb genomen op ${format(new Date(), "d MMMM yyyy")}.`;
    }
    return `Ik, ${o.klant_naam}, bevestig dat ik de auto met kenteken ${o.voertuig_kenteken} (${o.voertuig_naam}) in goede staat heb teruggebracht op ${format(new Date(), "d MMMM yyyy")}.`;
  };

  const renderList = (items: Overdracht[], emptyText: string, allowSign: boolean) => {
    if (items.length === 0) {
      return <p className="text-sm text-muted-foreground py-4 text-center">{emptyText}</p>;
    }
    return (
      <div className="space-y-2">
        {items.map((o) => (
          <div key={o.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
            <div className={`p-2 rounded-lg ${o.status === "ondertekend" ? "bg-success/10" : o.type === "terugbrengen" ? "bg-info/10" : "bg-warning/10"}`}>
              {o.status === "ondertekend" ? (
                <CheckCircle className="w-4 h-4 text-success" />
              ) : o.type === "terugbrengen" ? (
                <RotateCcw className="w-4 h-4 text-info" />
              ) : (
                <Clock className="w-4 h-4 text-warning" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {o.voertuig_naam} <span className="text-muted-foreground">({o.voertuig_kenteken})</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {o.klant_naam} · {o.type === "ophalen" ? "Ophalen" : "Terugbrengen"} · {format(parseISO(o.datum), "d MMM", { locale: nl })}
              </p>
            </div>
            {o.status === "ondertekend" ? (
              <span className="text-xs font-medium text-success px-2 py-1 rounded-full bg-success/10">
                Getekend
              </span>
            ) : allowSign ? (
              <Button size="sm" variant="outline" onClick={() => openSignDialog(o)}>
                <PenLine className="w-3.5 h-3.5 mr-1" /> Ondertekenen
              </Button>
            ) : (
              <span className="text-xs font-medium text-muted-foreground px-2 py-1 rounded-full bg-muted">
                Wacht
              </span>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="clean-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground">Overdrachten</h3>
          </div>
          <Car className="w-4 h-4 text-muted-foreground" />
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="vandaag">
              Vandaag {vandaag.length > 0 && <span className="ml-1.5 text-xs opacity-70">({vandaag.length})</span>}
            </TabsTrigger>
            <TabsTrigger value="morgen">
              Morgen {morgen.length > 0 && <span className="ml-1.5 text-xs opacity-70">({morgen.length})</span>}
            </TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
          </TabsList>
          <TabsContent value="vandaag" className="mt-4">
            {renderList(vandaag, "Geen overdrachten vandaag", true)}
          </TabsContent>
          <TabsContent value="morgen" className="mt-4">
            {renderList(morgen, "Geen geplande overdrachten morgen", false)}
          </TabsContent>
          <TabsContent value="recent" className="mt-4">
            {renderList(recent, "Nog geen overdrachten", false)}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!selectedOverdracht} onOpenChange={(open) => !open && setSelectedOverdracht(null)}>
        <DialogContent className="max-w-[420px]">
          <DialogHeader>
            <DialogTitle>
              {selectedOverdracht?.type === "ophalen" ? "Ophaaloverdracht" : "Terugbrengoverdracht"} ondertekenen
            </DialogTitle>
          </DialogHeader>

          {selectedOverdracht && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                <p className="text-sm font-medium text-foreground">{selectedOverdracht.voertuig_naam}</p>
                <p className="text-xs text-muted-foreground">Kenteken: {selectedOverdracht.voertuig_kenteken}</p>
                <p className="text-xs text-muted-foreground">Klant: {selectedOverdracht.klant_naam}</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-sm text-foreground italic leading-relaxed">"{getConfirmationText(selectedOverdracht)}"</p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Kilometerstand</label>
                <Input type="number" placeholder="bijv. 45230" value={kilometerstand} onChange={(e) => setKilometerstand(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Opmerkingen</label>
                <Textarea
                  placeholder={selectedOverdracht.type === "terugbrengen"
                    ? "Staat van het voertuig, eventuele schade, tankinhoud..."
                    : "Eventuele opmerkingen over de staat van het voertuig..."}
                  value={opmerkingen} onChange={(e) => setOpmerkingen(e.target.value)} rows={2}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Handtekening klant</label>
                <SignaturePad onSignatureChange={setSignature} width={370} height={160} />
              </div>
              <p className="text-[11px] text-muted-foreground text-center">
                Door te ondertekenen gaat u akkoord met bovenstaande verklaring
              </p>
              <Button className="w-full" disabled={!signature || signMutation.isPending} onClick={() => signMutation.mutate()}>
                {signMutation.isPending ? "Opslaan..." : "Bevestig overdracht"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}