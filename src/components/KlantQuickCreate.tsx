import { useState } from "react";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useOrganisatie } from "@/hooks/useOrganisatie";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, UserPlus } from "lucide-react";

const klantSchema = z.object({
  voornaam: z.string().trim().min(1, "Voornaam is verplicht").max(60),
  achternaam: z.string().trim().min(1, "Achternaam is verplicht").max(80),
  email: z.string().trim().email("Ongeldig e-mailadres").max(255),
  telefoon: z.string().trim().min(8, "Telefoon is verplicht").max(20),
  type: z.enum(["particulier", "zakelijk"]),
  bedrijfsnaam: z.string().trim().max(120).optional().or(z.literal("")),
  kvk_nummer: z.string().trim().max(20).optional().or(z.literal("")),
  adres: z.string().trim().max(255).optional().or(z.literal("")),
  postcode: z.string().trim().max(10).optional().or(z.literal("")),
  plaats: z.string().trim().max(80).optional().or(z.literal("")),
  rijbewijs_nummer: z.string().trim().max(20).optional().or(z.literal("")),
  notities: z.string().trim().max(1000).optional().or(z.literal("")),
}).refine((d) => d.type !== "zakelijk" || !!d.bedrijfsnaam, {
  message: "Bedrijfsnaam is verplicht bij zakelijke klant",
  path: ["bedrijfsnaam"],
});

type KlantInput = z.infer<typeof klantSchema>;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Optionele context: voor welk voertuig wordt deze klant aangemaakt */
  voertuigKenteken?: string;
  /** Callback met de aangemaakte klant id (voor bv. doorgaan naar contract) */
  onCreated?: (klantId: string) => void;
}

export function KlantQuickCreate({ open, onOpenChange, voertuigKenteken, onCreated }: Props) {
  const { organisatieId } = useOrganisatie();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<KlantInput>({
    voornaam: "",
    achternaam: "",
    email: "",
    telefoon: "",
    type: "particulier",
    bedrijfsnaam: "",
    kvk_nummer: "",
    adres: "",
    postcode: "",
    plaats: "",
    rijbewijs_nummer: "",
    notities: "",
  });

  const set = <K extends keyof KlantInput>(k: K, v: KlantInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = klantSchema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const i of parsed.error.issues) errs[String(i.path[0])] = i.message;
      setErrors(errs);
      return;
    }
    setErrors({});
    if (!organisatieId) {
      toast({ title: "Geen organisatie", description: "Probeer opnieuw in te loggen.", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const payload = {
        voornaam: parsed.data.voornaam,
        achternaam: parsed.data.achternaam,
        email: parsed.data.email.toLowerCase(),
        telefoon: parsed.data.telefoon,
        type: parsed.data.type,
        bedrijfsnaam: parsed.data.bedrijfsnaam || null,
        kvk_nummer: parsed.data.kvk_nummer || null,
        adres: parsed.data.adres || null,
        postcode: parsed.data.postcode || null,
        plaats: parsed.data.plaats || null,
        rijbewijs_nummer: parsed.data.rijbewijs_nummer || null,
        notities: parsed.data.notities || null,
        organisatie_id: organisatieId,
      };
      const { data, error } = await supabase.from("klanten").insert(payload).select("id").single();
      if (error) throw error;
      toast({ title: "Klant aangemaakt", description: `${parsed.data.voornaam} ${parsed.data.achternaam}` });
      qc.invalidateQueries({ queryKey: ["klanten"] });
      onCreated?.(data.id);
      onOpenChange(false);
      setForm({
        voornaam: "", achternaam: "", email: "", telefoon: "", type: "particulier",
        bedrijfsnaam: "", kvk_nummer: "", adres: "", postcode: "", plaats: "",
        rijbewijs_nummer: "", notities: "",
      });
    } catch (e: any) {
      toast({ title: "Aanmaken mislukt", description: e?.message || "Onbekende fout", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-primary" />
            Nieuwe klant
          </DialogTitle>
          {voertuigKenteken && (
            <DialogDescription>
              Wordt straks gekoppeld aan voertuig <span className="font-mono font-semibold">{voertuigKenteken}</span>.
            </DialogDescription>
          )}
        </DialogHeader>

        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Voornaam" required error={errors.voornaam}>
              <Input value={form.voornaam} onChange={(e) => set("voornaam", e.target.value)} autoFocus />
            </Field>
            <Field label="Achternaam" required error={errors.achternaam}>
              <Input value={form.achternaam} onChange={(e) => set("achternaam", e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="E-mail" required error={errors.email}>
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </Field>
            <Field label="Telefoon" required error={errors.telefoon}>
              <Input type="tel" value={form.telefoon} onChange={(e) => set("telefoon", e.target.value)} placeholder="06..." />
            </Field>
          </div>
          <Field label="Type klant" required>
            <Select value={form.type} onValueChange={(v) => set("type", v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="particulier">Particulier</SelectItem>
                <SelectItem value="zakelijk">Zakelijk</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          {form.type === "zakelijk" && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Bedrijfsnaam" required error={errors.bedrijfsnaam}>
                <Input value={form.bedrijfsnaam} onChange={(e) => set("bedrijfsnaam", e.target.value)} />
              </Field>
              <Field label="KvK nummer">
                <Input value={form.kvk_nummer} onChange={(e) => set("kvk_nummer", e.target.value)} />
              </Field>
            </div>
          )}
          <div className="grid grid-cols-3 gap-3">
            <Field label="Adres" className="col-span-3 sm:col-span-1">
              <Input value={form.adres} onChange={(e) => set("adres", e.target.value)} />
            </Field>
            <Field label="Postcode">
              <Input value={form.postcode} onChange={(e) => set("postcode", e.target.value)} />
            </Field>
            <Field label="Plaats">
              <Input value={form.plaats} onChange={(e) => set("plaats", e.target.value)} />
            </Field>
          </div>
          <Field label="Rijbewijsnummer">
            <Input value={form.rijbewijs_nummer} onChange={(e) => set("rijbewijs_nummer", e.target.value)} />
          </Field>
          <Field label="Notities">
            <Textarea value={form.notities} onChange={(e) => set("notities", e.target.value)} rows={2} />
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
              Annuleren
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Bezig...</> : "Klant aanmaken"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, required, error, children, className }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={className}>
      <Label className="text-xs">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      <div className="mt-1">{children}</div>
      {error && <p className="text-[11px] text-destructive mt-0.5">{error}</p>}
    </div>
  );
}
