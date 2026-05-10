import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useLocaties } from "@/hooks/useLocaties";
import { useVoertuigen } from "@/hooks/useVoertuigen";
import { Plus, ArrowRight, MapPin, Trash2 } from "lucide-react";

type Row = { id: string; voertuig_id: string; van_locatie_id: string | null; naar_locatie_id: string; datum: string; kilometerstand: number | null; notitie: string | null };

export default function Verplaatsingen() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { locaties = [] } = useLocaties();
  const { voertuigen = [] } = useVoertuigen();

  const lookupLocatie = (id: string | null) => locaties.find((l: any) => l.id === id)?.naam ?? "-";
  const lookupVoertuig = (id: string) => {
    const v = voertuigen.find((v: any) => v.id === id);
    return v ? `${v.kenteken} · ${v.merk} ${v.model}` : id;
  };

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["verplaatsingen"],
    queryFn: async () => {
      const { data, error } = await supabase.from("voertuig_verplaatsingen" as any).select("*").order("datum", { ascending: false }).limit(200);
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });

  const verwijder = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("voertuig_verplaatsingen" as any).delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["verplaatsingen"] }),
  });

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight flex items-center gap-2"><MapPin className="w-6 h-6 text-primary" /> Voertuigverplaatsingen</h1>
          <p className="text-sm text-muted-foreground">Voertuigen verplaatsen tussen locaties of vestigingen.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-1.5"><Plus className="w-4 h-4" /> Verplaatsing</Button></DialogTrigger>
          <NieuweDialog locaties={locaties as any[]} voertuigen={voertuigen as any[]} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["verplaatsingen"] }); qc.invalidateQueries({ queryKey: ["voertuigen"] }); toast({ title: "Verplaatsing opgeslagen" }); }} />
        </Dialog>
      </header>

      <Card className="overflow-hidden">
        {isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">Laden...</p>
        ) : rows.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">Nog geen verplaatsingen geregistreerd.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="text-left p-3">Datum</th><th className="text-left p-3">Voertuig</th><th className="text-left p-3">Van</th><th></th><th className="text-left p-3">Naar</th><th className="text-right p-3">Km-stand</th><th className="text-left p-3">Notitie</th><th></th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/20">
                    <td className="p-3">{new Date(r.datum).toLocaleDateString("nl-NL")}</td>
                    <td className="p-3">{lookupVoertuig(r.voertuig_id)}</td>
                    <td className="p-3 text-muted-foreground">{lookupLocatie(r.van_locatie_id)}</td>
                    <td className="p-2 text-muted-foreground"><ArrowRight className="w-4 h-4" /></td>
                    <td className="p-3 font-medium">{lookupLocatie(r.naar_locatie_id)}</td>
                    <td className="p-3 text-right">{r.kilometerstand?.toLocaleString("nl-NL") ?? "-"}</td>
                    <td className="p-3 text-muted-foreground truncate max-w-[200px]">{r.notitie ?? "-"}</td>
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

function NieuweDialog({ locaties, voertuigen, onClose, onSaved }: { locaties: any[]; voertuigen: any[]; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ voertuig_id: "", van_locatie_id: "", naar_locatie_id: "", datum: new Date().toISOString().slice(0, 10), kilometerstand: "", notitie: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.voertuig_id || !form.naar_locatie_id) return;
    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: org } = await supabase.from("user_roles").select("organisatie_id").eq("user_id", user!.id).limit(1).maybeSingle();
      const organisatie_id = (org as any)?.organisatie_id;
      const { error } = await supabase.from("voertuig_verplaatsingen" as any).insert({
        organisatie_id, user_id: user!.id, voertuig_id: form.voertuig_id,
        van_locatie_id: form.van_locatie_id || null, naar_locatie_id: form.naar_locatie_id,
        datum: form.datum, kilometerstand: form.kilometerstand ? Number(form.kilometerstand) : null,
        notitie: form.notitie || null,
      });
      if (error) throw error;
      // Update voertuig huidige locatie
      await supabase.from("voertuigen").update({ locatie_id: form.naar_locatie_id }).eq("id", form.voertuig_id);
      onSaved();
    } catch (err: any) {
      toast({ title: "Fout", description: err.message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  const SelectInput = ({ label, value, onChange, options, required }: any) => (
    <div className="space-y-1.5"><Label>{label}</Label>
      <select required={required} value={value} onChange={(e) => onChange(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
        <option value="">{required ? "Kies..." : "(leeg)"}</option>
        {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Nieuwe verplaatsing</DialogTitle></DialogHeader>
      <form onSubmit={submit} className="space-y-3">
        <SelectInput label="Voertuig" value={form.voertuig_id} onChange={(v: string) => setForm({ ...form, voertuig_id: v })} required options={voertuigen.map((v) => ({ value: v.id, label: `${v.kenteken} · ${v.merk} ${v.model}` }))} />
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Van locatie" value={form.van_locatie_id} onChange={(v: string) => setForm({ ...form, van_locatie_id: v })} options={locaties.map((l) => ({ value: l.id, label: l.naam }))} />
          <SelectInput label="Naar locatie" value={form.naar_locatie_id} onChange={(v: string) => setForm({ ...form, naar_locatie_id: v })} required options={locaties.map((l) => ({ value: l.id, label: l.naam }))} />
          <div className="space-y-1.5"><Label>Datum</Label><Input type="date" value={form.datum} onChange={(e) => setForm({ ...form, datum: e.target.value })} required /></div>
          <div className="space-y-1.5"><Label>Kilometerstand</Label><Input type="number" value={form.kilometerstand} onChange={(e) => setForm({ ...form, kilometerstand: e.target.value })} /></div>
        </div>
        <div className="space-y-1.5"><Label>Notitie</Label><Input value={form.notitie} onChange={(e) => setForm({ ...form, notitie: e.target.value })} /></div>
        <DialogFooter><Button type="button" variant="ghost" onClick={onClose}>Annuleren</Button><Button type="submit" disabled={busy}>{busy ? "Opslaan..." : "Opslaan"}</Button></DialogFooter>
      </form>
    </DialogContent>
  );
}