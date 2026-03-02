import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useCreateContract, useUpdateContract, type ContractWithInvoices, type CreateContractInput } from "@/hooks/useContracts";
import { vehicles } from "@/data/mockData";

const contractSchema = z.object({
  contract_nummer: z.string().min(1, "Contractnummer is verplicht").max(50),
  type: z.enum(["lease", "verhuur", "fietslease", "ev-lease"]),
  klant_naam: z.string().min(1, "Klantnaam is verplicht").max(100),
  klant_email: z.string().email("Ongeldig e-mailadres").max(255),
  bedrijf: z.string().max(100).nullable(),
  voertuig_id: z.string().nullable(),
  start_datum: z.string().min(1, "Startdatum is verplicht"),
  eind_datum: z.string().min(1, "Einddatum is verplicht"),
  maandprijs: z.number().min(0, "Prijs moet positief zijn"),
  km_per_jaar: z.number().nullable(),
  inclusief: z.array(z.string()),
  notities: z.string().max(1000).nullable(),
});

const serviceOptions = ["Onderhoud", "Verzekering", "Pechhulp", "Winterbanden", "Banden", "Laadpas"];

interface ContractFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editContract?: ContractWithInvoices | null;
}

export function ContractForm({ open, onOpenChange, editContract }: ContractFormProps) {
  const isEdit = !!editContract;
  const createMutation = useCreateContract();
  const updateMutation = useUpdateContract();

  const [form, setForm] = useState(() => getInitialForm(editContract));

  function getInitialForm(c?: ContractWithInvoices | null) {
    return {
      contract_nummer: c?.contract_nummer ?? "",
      type: c?.type ?? "lease" as const,
      klant_naam: c?.klant_naam ?? "",
      klant_email: c?.klant_email ?? "",
      bedrijf: c?.bedrijf ?? "",
      voertuig_id: c?.voertuig_id ?? "",
      start_datum: c?.start_datum ?? "",
      eind_datum: c?.eind_datum ?? "",
      maandprijs: c?.maandprijs ?? 0,
      km_per_jaar: c?.km_per_jaar ?? 0,
      inclusief: c?.inclusief ?? [],
      notities: c?.notities ?? "",
    };
  }

  // Reset form when editContract changes
  const [prevEdit, setPrevEdit] = useState(editContract?.id);
  if (editContract?.id !== prevEdit) {
    setPrevEdit(editContract?.id);
    setForm(getInitialForm(editContract));
  }

  const update = (key: string, value: unknown) => setForm((f) => ({ ...f, [key]: value }));

  const toggleService = (service: string) => {
    setForm((f) => ({
      ...f,
      inclusief: f.inclusief.includes(service)
        ? f.inclusief.filter((s) => s !== service)
        : [...f.inclusief, service],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const input: CreateContractInput = {
      contract_nummer: form.contract_nummer.trim(),
      type: form.type as CreateContractInput["type"],
      klant_naam: form.klant_naam.trim(),
      klant_email: form.klant_email.trim(),
      bedrijf: form.bedrijf.trim() || null,
      voertuig_id: form.voertuig_id || null,
      start_datum: form.start_datum,
      eind_datum: form.eind_datum,
      maandprijs: form.maandprijs,
      status: isEdit ? (editContract!.status as CreateContractInput["status"]) : "concept",
      km_per_jaar: form.km_per_jaar || null,
      inclusief: form.inclusief,
      notities: form.notities.trim() || null,
    };

    const result = contractSchema.safeParse(input);
    if (!result.success) {
      toast({ title: "Validatiefout", description: result.error.issues[0].message, variant: "destructive" });
      return;
    }

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: editContract!.id, ...input });
        toast({ title: "Contract bijgewerkt" });
      } else {
        await createMutation.mutateAsync(input);
        toast({ title: "Contract aangemaakt" });
      }
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Fout", description: err.message, variant: "destructive" });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">
            {isEdit ? "Contract bewerken" : "Nieuw contract"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Contractnummer</Label>
              <Input value={form.contract_nummer} onChange={(e) => update("contract_nummer", e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => update("type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lease">Autolease</SelectItem>
                  <SelectItem value="verhuur">Verhuur</SelectItem>
                  <SelectItem value="fietslease">Fietslease</SelectItem>
                  <SelectItem value="ev-lease">EV Lease</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Klantnaam</Label>
              <Input value={form.klant_naam} onChange={(e) => update("klant_naam", e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>E-mailadres</Label>
              <Input type="email" value={form.klant_email} onChange={(e) => update("klant_email", e.target.value)} required />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Bedrijf (optioneel)</Label>
            <Input value={form.bedrijf} onChange={(e) => update("bedrijf", e.target.value)} />
          </div>

          {form.type !== "fietslease" && (
            <div className="space-y-1.5">
              <Label>Voertuig</Label>
              <Select value={form.voertuig_id} onValueChange={(v) => update("voertuig_id", v)}>
                <SelectTrigger><SelectValue placeholder="Selecteer voertuig" /></SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.merk} {v.model} — {v.kenteken}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Startdatum</Label>
              <Input type="date" value={form.start_datum} onChange={(e) => update("start_datum", e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Einddatum</Label>
              <Input type="date" value={form.eind_datum} onChange={(e) => update("eind_datum", e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Maandprijs (€)</Label>
              <Input type="number" min={0} value={form.maandprijs} onChange={(e) => update("maandprijs", Number(e.target.value))} required />
            </div>
            <div className="space-y-1.5">
              <Label>Km/jaar</Label>
              <Input type="number" min={0} value={form.km_per_jaar} onChange={(e) => update("km_per_jaar", Number(e.target.value))} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Inclusief</Label>
            <div className="flex flex-wrap gap-3">
              {serviceOptions.map((s) => (
                <label key={s} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={form.inclusief.includes(s)}
                    onCheckedChange={() => toggleService(s)}
                  />
                  {s}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notities</Label>
            <Textarea value={form.notities} onChange={(e) => update("notities", e.target.value)} rows={3} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuleren
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Opslaan..." : isEdit ? "Bijwerken" : "Aanmaken"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
