import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useKlanten } from "@/hooks/useKlanten";
import { useVoertuigen } from "@/hooks/useVoertuigen";
import { toast } from "sonner";
import { differenceInDays } from "date-fns";

interface ReservationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefilledVehicleId?: string;
  prefilledKlantId?: string;
}

export function ReservationForm({ open, onOpenChange, prefilledVehicleId, prefilledKlantId }: ReservationFormProps) {
  const qc = useQueryClient();
  const { data: klanten = [] } = useKlanten();
  const { voertuigen } = useVoertuigen();

  const [klantId, setKlantId] = useState<string>(prefilledKlantId ?? "");
  const [voertuigId, setVoertuigId] = useState<string>(prefilledVehicleId ?? "");
  const [startDatum, setStartDatum] = useState<string>("");
  const [eindDatum, setEindDatum] = useState<string>("");
  const [notities, setNotities] = useState<string>("");

  const selectedVoertuig = useMemo(
    () => voertuigen.find((v) => v.id === voertuigId),
    [voertuigen, voertuigId]
  );

  const dagen = useMemo(() => {
    if (!startDatum || !eindDatum) return 0;
    const d = differenceInDays(new Date(eindDatum), new Date(startDatum)) + 1;
    return Math.max(d, 1);
  }, [startDatum, eindDatum]);

  const dagprijs = Number(selectedVoertuig?.dagprijs ?? 0);
  const totaal = dagen * dagprijs;

  const create = useMutation({
    mutationFn: async () => {
      if (!klantId) throw new Error("Selecteer een klant");
      if (!voertuigId) throw new Error("Selecteer een voertuig");
      if (!startDatum || !eindDatum) throw new Error("Vul start- en einddatum in");
      if (new Date(eindDatum) < new Date(startDatum)) throw new Error("Einddatum moet na startdatum liggen");

      const { error } = await supabase.from("reserveringen").insert({
        klant_id: klantId,
        voertuig_id: voertuigId,
        start_datum: startDatum,
        eind_datum: eindDatum,
        dagprijs,
        totaalprijs: totaal,
        status: "bevestigd",
        notities: notities || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Reservering aangemaakt");
      qc.invalidateQueries({ queryKey: ["reserveringen-page"] });
      qc.invalidateQueries({ queryKey: ["vehicle-reserveringen"] });
      qc.invalidateQueries({ queryKey: ["gantt-contracts"] });
      qc.invalidateQueries({ queryKey: ["vehicle-availability"] });
      onOpenChange(false);
      setKlantId(prefilledKlantId ?? "");
      setVoertuigId(prefilledVehicleId ?? "");
      setStartDatum("");
      setEindDatum("");
      setNotities("");
    },
    onError: (e: any) => toast.error(e?.message ?? "Aanmaken mislukt"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nieuwe reservering</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Klant</Label>
            <Select value={klantId} onValueChange={setKlantId}>
              <SelectTrigger><SelectValue placeholder="Kies een klant" /></SelectTrigger>
              <SelectContent>
                {klanten.map((k) => (
                  <SelectItem key={k.id} value={k.id}>
                    {k.voornaam} {k.achternaam} · {k.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Voertuig</Label>
            <Select value={voertuigId} onValueChange={setVoertuigId} disabled={!!prefilledVehicleId}>
              <SelectTrigger><SelectValue placeholder="Kies een voertuig" /></SelectTrigger>
              <SelectContent>
                {voertuigen.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.merk} {v.model} · {v.kenteken} · €{v.dagprijs}/dag
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Startdatum</Label>
              <Input type="date" value={startDatum} onChange={(e) => setStartDatum(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Einddatum</Label>
              <Input type="date" value={eindDatum} onChange={(e) => setEindDatum(e.target.value)} />
            </div>
          </div>

          {selectedVoertuig && dagen > 0 && (
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{dagen} dagen × €{dagprijs}</span>
                <span className="font-semibold text-foreground">€{totaal.toFixed(2)}</span>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Notities (optioneel)</Label>
            <Textarea value={notities} onChange={(e) => setNotities(e.target.value)} rows={3} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuleren</Button>
          <Button onClick={() => create.mutate()} disabled={create.isPending}>
            {create.isPending ? "Aanmaken..." : "Reservering aanmaken"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}