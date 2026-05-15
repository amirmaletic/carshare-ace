import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePlanningBlokken, type PlanningBlok } from "@/hooks/usePlanningBlokken";
import { useVoertuigen } from "@/hooks/useVoertuigen";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const KLEUREN = [
  { naam: "Blauw", waarde: "#3B82F6" },
  { naam: "Groen", waarde: "#10B981" },
  { naam: "Oranje", waarde: "#F59E0B" },
  { naam: "Rood", waarde: "#EF4444" },
  { naam: "Paars", waarde: "#8B5CF6" },
  { naam: "Grijs", waarde: "#6B7280" },
];

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  blok?: PlanningBlok | null;
  prefillVoertuigId?: string | null;
  prefillStart?: string | null;
  prefillEind?: string | null;
}

export function PlanningBlokDialog({ open, onOpenChange, blok, prefillVoertuigId, prefillStart, prefillEind }: Props) {
  const { create, update, remove } = usePlanningBlokken();
  const { voertuigen } = useVoertuigen();

  const [voertuigId, setVoertuigId] = useState("");
  const [start, setStart] = useState("");
  const [eind, setEind] = useState("");
  const [titel, setTitel] = useState("");
  const [kleur, setKleur] = useState(KLEUREN[0].waarde);
  const [notitie, setNotitie] = useState("");

  useEffect(() => {
    if (!open) return;
    setVoertuigId(blok?.voertuig_id ?? prefillVoertuigId ?? "");
    setStart(blok?.start_datum ?? prefillStart ?? "");
    setEind(blok?.eind_datum ?? prefillEind ?? prefillStart ?? "");
    setTitel(blok?.titel ?? "");
    setKleur(blok?.kleur ?? KLEUREN[0].waarde);
    setNotitie(blok?.notitie ?? "");
  }, [open, blok, prefillVoertuigId, prefillStart, prefillEind]);

  const handleSave = async () => {
    if (!voertuigId || !start || !eind || !titel.trim()) return;
    const input = { voertuig_id: voertuigId, start_datum: start, eind_datum: eind, titel: titel.trim(), kleur, notitie: notitie.trim() || null };
    if (blok) await update.mutateAsync({ id: blok.id, ...input });
    else await create.mutateAsync(input);
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!blok) return;
    if (!confirm("Blokje verwijderen?")) return;
    await remove.mutateAsync(blok.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{blok ? "Blokje bewerken" : "Blokje toevoegen"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Voertuig</Label>
            <Select value={voertuigId} onValueChange={setVoertuigId}>
              <SelectTrigger><SelectValue placeholder="Kies voertuig" /></SelectTrigger>
              <SelectContent>
                {voertuigen.map((v) => (
                  <SelectItem key={v.id} value={v.id}>{v.kenteken} · {v.merk} {v.model}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Start</Label>
              <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Einde</Label>
              <Input type="date" value={eind} onChange={(e) => setEind(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Titel</Label>
            <Input value={titel} onChange={(e) => setTitel(e.target.value)} placeholder="Bijv. Eigen gebruik, Gereserveerd Jan" />
          </div>
          <div className="space-y-2">
            <Label>Kleur</Label>
            <div className="flex gap-2 flex-wrap">
              {KLEUREN.map((k) => (
                <button
                  key={k.waarde}
                  type="button"
                  onClick={() => setKleur(k.waarde)}
                  className={cn("w-8 h-8 rounded-full border-2 transition-all", kleur === k.waarde ? "border-foreground scale-110" : "border-transparent")}
                  style={{ background: k.waarde }}
                  title={k.naam}
                />
              ))}
              <Input type="color" value={kleur} onChange={(e) => setKleur(e.target.value)} className="w-12 h-8 p-1" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notitie (optioneel)</Label>
            <Textarea value={notitie} onChange={(e) => setNotitie(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter className="flex-row justify-between sm:justify-between">
          {blok ? (
            <Button variant="ghost" onClick={handleDelete} className="gap-2 text-destructive hover:text-destructive">
              <Trash2 className="w-4 h-4" />Verwijderen
            </Button>
          ) : <span />}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Annuleren</Button>
            <Button onClick={handleSave} disabled={!voertuigId || !start || !eind || !titel.trim()}>Opslaan</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}