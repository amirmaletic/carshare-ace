import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Fuel, Trash2 } from "lucide-react";

type Row = { id: string; datum: string; kenteken_input: string; liters: number | null; bedrag: number; prijs_per_liter: number | null; brandstoftype: string | null; station: string | null; kilometerstand: number | null; bron: string };

export default function Tankbeurten() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["tankbeurten"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tankbeurten" as any).select("*").order("datum", { ascending: false }).limit(200);
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });

  const verwijder = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("tankbeurten" as any).delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tankbeurten"] }); },
  });

  const totaal = rows.reduce((s, r) => s + Number(r.bedrag || 0), 0);
  const totaalLiters = rows.reduce((s, r) => s + Number(r.liters || 0), 0);

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight flex items-center gap-2"><Fuel className="w-6 h-6 text-primary" /> Tankbeurten</h1>
          <p className="text-sm text-muted-foreground">Brandstofkosten per voertuig en chauffeur.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-1.5"><Plus className="w-4 h-4" /> Tankbeurt</Button></DialogTrigger>
          <NieuweDialog onClose={() => setOpen(false)} onSaved={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["tankbeurten"] }); toast({ title: "Tankbeurt toegevoegd" }); }} />
        </Dialog>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="p-4"><p className="text-xs text-muted-foreground">Totaal kosten</p><p className="text-2xl font-semibold">€ {totaal.toFixed(2)}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Totaal liters</p><p className="text-2xl font-semibold">{totaalLiters.toFixed(1)}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Aantal beurten</p><p className="text-2xl font-semibold">{rows.length}</p></Card>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">Laden...</p>
        ) : rows.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">Nog geen tankbeurten geregistreerd.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="text-left p-3">Datum</th><th className="text-left p-3">Kenteken</th><th className="text-right p-3">Liters</th><th className="text-right p-3">Prijs/L</th><th className="text-right p-3">Bedrag</th><th className="text-left p-3">Station</th><th className="text-left p-3">Bron</th><th></th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/20">
                    <td className="p-3">{new Date(r.datum).toLocaleDateString("nl-NL")}</td>
                    <td className="p-3 font-mono">{r.kenteken_input}</td>
                    <td className="p-3 text-right">{r.liters ? Number(r.liters).toFixed(2) : "-"}</td>
                    <td className="p-3 text-right">{r.prijs_per_liter ? `€ ${Number(r.prijs_per_liter).toFixed(3)}` : "-"}</td>
                    <td className="p-3 text-right font-medium">€ {Number(r.bedrag).toFixed(2)}</td>
                    <td className="p-3 text-muted-foreground">{r.station ?? "-"}</td>
                    <td className="p-3 text-xs text-muted-foreground">{r.bron}</td>
                    <td className="p-3"><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => verwijder.mutate(r.id)}><Trash2 className="w-3.5 h-3.5" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function NieuweDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ datum: new Date().toISOString().slice(0, 10), kenteken_input: "", liters: "", bedrag: "", brandstoftype: "", station: "", kilometerstand: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: org } = await supabase.from("user_roles").select("organisatie_id").eq("user_id", user!.id).limit(1).maybeSingle();
      const organisatie_id = (org as any)?.organisatie_id;
      const liters = form.liters ? Number(form.liters) : null;
      const bedrag = Number(form.bedrag);
      const ppl = liters && liters > 0 ? bedrag / liters : null;
      // Probeer voertuig op kenteken te koppelen
      const { data: v } = await supabase.from("voertuigen").select("id").ilike("kenteken", form.kenteken_input).maybeSingle();
      const { error } = await supabase.from("tankbeurten" as any).insert({
        organisatie_id, user_id: user!.id, voertuig_id: (v as any)?.id ?? null,
        kenteken_input: form.kenteken_input.toUpperCase(), datum: form.datum,
        liters, bedrag, prijs_per_liter: ppl, brandstoftype: form.brandstoftype || null,
        station: form.station || null, kilometerstand: form.kilometerstand ? Number(form.kilometerstand) : null, bron: "handmatig",
      });
      if (error) throw error;
      onSaved();
    } catch (err: any) {
      toast({ title: "Fout", description: err.message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Nieuwe tankbeurt</DialogTitle></DialogHeader>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>Datum</Label><Input type="date" value={form.datum} onChange={(e) => setForm({ ...form, datum: e.target.value })} required /></div>
          <div className="space-y-1.5"><Label>Kenteken</Label><Input value={form.kenteken_input} onChange={(e) => setForm({ ...form, kenteken_input: e.target.value })} placeholder="AB-123-C" required /></div>
          <div className="space-y-1.5"><Label>Liters</Label><Input type="number" step="0.01" value={form.liters} onChange={(e) => setForm({ ...form, liters: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Bedrag (€)</Label><Input type="number" step="0.01" value={form.bedrag} onChange={(e) => setForm({ ...form, bedrag: e.target.value })} required /></div>
          <div className="space-y-1.5"><Label>Brandstof</Label><Input value={form.brandstoftype} onChange={(e) => setForm({ ...form, brandstoftype: e.target.value })} placeholder="benzine, diesel..." /></div>
          <div className="space-y-1.5"><Label>Station</Label><Input value={form.station} onChange={(e) => setForm({ ...form, station: e.target.value })} placeholder="Shell A2" /></div>
          <div className="space-y-1.5 col-span-2"><Label>Kilometerstand</Label><Input type="number" value={form.kilometerstand} onChange={(e) => setForm({ ...form, kilometerstand: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>Annuleren</Button>
          <Button type="submit" disabled={busy}>{busy ? "Opslaan..." : "Opslaan"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}