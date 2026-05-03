import { useState, useEffect } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { useCreateContract, useUpdateContract, type ContractWithInvoices, type CreateContractInput } from "@/hooks/useContracts";
import { useVoertuigen, type DbVoertuig } from "@/hooks/useVoertuigen";
import { useKlanten } from "@/hooks/useKlanten";
import { RdwLookup, type RdwVehicleInfo } from "@/components/RdwLookup";
import { KvkSearch } from "@/components/KvkSearch";
import { FileText, User, Car, Euro, Shield, ScrollText, Zap, Settings2, Sparkles, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

const contractSchema = z.object({
  contract_nummer: z.string().min(1).max(50),
  type: z.enum(["lease", "verhuur", "fietslease", "ev-lease"]),
  klant_naam: z.string().min(1, "Klantnaam is verplicht").max(100),
  klant_email: z.string().email("Ongeldig e-mailadres").max(255),
  klant_telefoon: z.string().max(20).nullable(),
  klant_adres: z.string().max(255).nullable(),
  bedrijf: z.string().max(100).nullable(),
  kvk_nummer: z.string().max(20).nullable(),
  bedrijf_adres: z.string().max(255).nullable(),
  voertuig_id: z.string().nullable(),
  start_datum: z.string().min(1, "Startdatum is verplicht"),
  eind_datum: z.string().min(1, "Einddatum is verplicht"),
  maandprijs: z.number().min(0),
  borg: z.number().min(0),
  km_per_jaar: z.number().nullable(),
  inclusief: z.array(z.string()),
  notities: z.string().max(1000).nullable(),
  boeteclausule: z.string().max(500).nullable(),
  verlengbaar: z.boolean(),
  verlengings_termijn: z.string().max(50).nullable(),
});

const defaultKmPerDayByCategory: Record<string, number> = {
  Stadsauto: 100, SUV: 150, Bestelwagen: 200, Luxe: 120, Elektrisch: 130,
};

const typePrefixMap: Record<string, string> = {
  lease: "LC", verhuur: "VC", fietslease: "FC", "ev-lease": "EV",
};

function generateContractNummer(type: string): string {
  const prefix = typePrefixMap[type] || "XX";
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 900 + 100);
  return `${prefix}-${year}-${rand}`;
}

const serviceOptions = ["Onderhoud", "Verzekering", "Pechhulp", "Winterbanden", "Banden", "Laadpas", "Gratis km/dag"];
const defaultServices = ["Onderhoud", "Verzekering"];

interface ContractFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editContract?: ContractWithInvoices | null;
  prefilledVehicleId?: string | null;
  prefilledStartDatum?: string | null;
  prefilledEindDatum?: string | null;
}

export function ContractForm({ open, onOpenChange, editContract, prefilledVehicleId, prefilledStartDatum, prefilledEindDatum }: ContractFormProps) {
  const isEdit = !!editContract;
  const createMutation = useCreateContract();
  const updateMutation = useUpdateContract();
  const { voertuigen: vehicles } = useVoertuigen();
  const { data: klanten = [] } = useKlanten();

  const [mode, setMode] = useState<"snel" | "geavanceerd">(isEdit ? "geavanceerd" : "snel");
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(() => getInitialForm(editContract));
  const [freeKmPerDay, setFreeKmPerDay] = useState(0);
  const [rdwInfo, setRdwInfo] = useState<RdwVehicleInfo | null>(null);
  const [kvkNummer, setKvkNummer] = useState(editContract?.kvk_nummer ?? "");
  const [bedrijfAdres, setBedrijfAdres] = useState(editContract?.bedrijf_adres ?? "");
  const [klantPickerOpen, setKlantPickerOpen] = useState(false);

  function getInitialForm(c?: ContractWithInvoices | null) {
    return {
      contract_nummer: c?.contract_nummer ?? generateContractNummer("lease"),
      type: c?.type ?? ("lease" as const),
      klant_naam: c?.klant_naam ?? "",
      klant_email: c?.klant_email ?? "",
      klant_telefoon: c?.klant_telefoon ?? "",
      klant_adres: c?.klant_adres ?? "",
      bedrijf: c?.bedrijf ?? "",
      voertuig_id: c?.voertuig_id ?? prefilledVehicleId ?? "",
      start_datum: c?.start_datum ?? prefilledStartDatum ?? "",
      eind_datum: c?.eind_datum ?? prefilledEindDatum ?? "",
      maandprijs: c?.maandprijs ?? 0,
      borg: c?.borg ?? 0,
      km_per_jaar: c?.km_per_jaar ?? 0,
      inclusief: c?.inclusief ?? [...defaultServices],
      notities: c?.notities ?? "",
      boeteclausule: c?.boeteclausule ?? "",
      verlengbaar: c?.verlengbaar ?? false,
      verlengings_termijn: c?.verlengings_termijn ?? "",
    };
  }

  const [prevEdit, setPrevEdit] = useState(editContract?.id);
  if (editContract?.id !== prevEdit) {
    setPrevEdit(editContract?.id);
    setForm(getInitialForm(editContract));
    setStep(0);
  }

  useEffect(() => {
    if (!isEdit) {
      setForm((f) => ({ ...f, contract_nummer: generateContractNummer(f.type) }));
    }
  }, [form.type, isEdit]);

  useEffect(() => {
    const vehicle = vehicles.find((v) => v.id === form.voertuig_id);
    if (vehicle) {
      setFreeKmPerDay(defaultKmPerDayByCategory[vehicle.categorie] ?? 100);
    } else if (form.type === "fietslease") {
      setFreeKmPerDay(50);
    } else {
      setFreeKmPerDay(0);
    }
  }, [form.voertuig_id, form.type]);

  // Auto-fill maandprijs based on selected vehicle when empty
  useEffect(() => {
    if (isEdit) return;
    const vehicle = vehicles.find((v) => v.id === form.voertuig_id);
    if (!vehicle || form.maandprijs > 0) return;
    const suggested = form.type === "verhuur"
      ? Math.round(vehicle.dagprijs)
      : Math.round(vehicle.dagprijs * 22);
    setForm((f) => ({ ...f, maandprijs: suggested }));
  }, [form.voertuig_id, form.type, vehicles, isEdit]);

  // Auto-fill end date based on type when start changes
  useEffect(() => {
    if (isEdit || !form.start_datum || form.eind_datum) return;
    const start = new Date(form.start_datum);
    if (isNaN(start.getTime())) return;
    const end = new Date(start);
    if (form.type === "verhuur") end.setDate(end.getDate() + 7);
    else end.setMonth(end.getMonth() + 12);
    setForm((f) => ({ ...f, eind_datum: end.toISOString().slice(0, 10) }));
  }, [form.start_datum, form.type, isEdit]);

  const update = (key: string, value: unknown) => setForm((f) => ({ ...f, [key]: value }));

  const pickKlant = (k: typeof klanten[number]) => {
    setForm((f) => ({
      ...f,
      klant_naam: `${k.voornaam} ${k.achternaam}`.trim(),
      klant_email: k.email,
      klant_telefoon: k.telefoon ?? "",
      klant_adres: [k.adres, k.postcode, k.plaats].filter(Boolean).join(", "),
      bedrijf: k.bedrijfsnaam ?? f.bedrijf,
    }));
    if (k.kvk_nummer) setKvkNummer(k.kvk_nummer);
    setKlantPickerOpen(false);
  };

  const toggleService = (service: string) => {
    setForm((f) => ({
      ...f,
      inclusief: f.inclusief.includes(service)
        ? f.inclusief.filter((s) => s !== service)
        : [...f.inclusief, service],
    }));
  };

  const handleSubmit = async () => {
    const inclusiefFinal = [...form.inclusief];
    const hasKm = inclusiefFinal.includes("Gratis km/dag");
    if (hasKm) {
      const idx = inclusiefFinal.indexOf("Gratis km/dag");
      inclusiefFinal[idx] = `Gratis ${freeKmPerDay} km/dag`;
    }

    const input: CreateContractInput = {
      contract_nummer: form.contract_nummer.trim(),
      type: form.type as CreateContractInput["type"],
      klant_naam: form.klant_naam.trim(),
      klant_email: form.klant_email.trim(),
      klant_telefoon: form.klant_telefoon?.trim() || null,
      klant_adres: form.klant_adres?.trim() || null,
      bedrijf: form.bedrijf.trim() || null,
      kvk_nummer: kvkNummer.trim() || null,
      bedrijf_adres: bedrijfAdres.trim() || null,
      voertuig_id: form.voertuig_id || null,
      start_datum: form.start_datum,
      eind_datum: form.eind_datum,
      maandprijs: form.maandprijs,
      borg: form.borg,
      status: isEdit ? (editContract!.status as CreateContractInput["status"]) : "concept",
      km_per_jaar: form.km_per_jaar || null,
      inclusief: inclusiefFinal,
      notities: form.notities.trim() || null,
      boeteclausule: form.boeteclausule?.trim() || null,
      verlengbaar: form.verlengbaar,
      verlengings_termijn: form.verlengings_termijn?.trim() || null,
      ondertekend: isEdit ? editContract!.ondertekend : false,
      ondertekend_op: isEdit ? editContract!.ondertekend_op : null,
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
      setStep(0);
    } catch (err: any) {
      toast({ title: "Fout", description: err.message, variant: "destructive" });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const selectedVehicle = vehicles.find((v) => v.id === form.voertuig_id);

  const steps = [
    { label: "Type & Klant", icon: <User className="w-4 h-4" /> },
    { label: "Voertuig & Looptijd", icon: <Car className="w-4 h-4" /> },
    { label: "Financiën & Services", icon: <Euro className="w-4 h-4" /> },
    { label: "Voorwaarden", icon: <ScrollText className="w-4 h-4" /> },
  ];

  const canQuickSubmit = !!form.klant_naam.trim() && !!form.klant_email.trim() && !!form.start_datum && !!form.eind_datum && form.maandprijs > 0;

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setStep(0); }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {isEdit ? "Contract bewerken" : "Nieuw contract"}
            </DialogTitle>
            {!isEdit && (
              <button
                type="button"
                onClick={() => setMode(mode === "snel" ? "geavanceerd" : "snel")}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1 rounded-md border border-border bg-muted/40"
                title="Wissel modus"
              >
                {mode === "snel" ? <Settings2 className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
                {mode === "snel" ? "Alle opties" : "Snel mode"}
              </button>
            )}
          </div>
        </DialogHeader>

        {mode === "snel" && !isEdit ? (
          <QuickContractForm
            form={form}
            update={update}
            klanten={klanten}
            vehicles={vehicles}
            klantPickerOpen={klantPickerOpen}
            setKlantPickerOpen={setKlantPickerOpen}
            pickKlant={pickKlant}
            selectedVehicle={selectedVehicle}
            onCancel={() => onOpenChange(false)}
            onSubmit={handleSubmit}
            canSubmit={canQuickSubmit}
            isPending={isPending}
          />
        ) : (
        <>
        {/* Step indicator */}
        <div className="flex items-center gap-1 mb-2">
          {steps.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setStep(i)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                i === step
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : i < step
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {s.icon}
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          ))}
        </div>

        <Separator />

        <div className="min-h-[320px]">
          {/* Step 0: Type & Klant */}
          {step === 0 && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Contractnummer</Label>
                  <Input value={form.contract_nummer} readOnly className="bg-muted/50 font-mono text-muted-foreground" />
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
                  <Label>Klantnaam *</Label>
                  <Input value={form.klant_naam} onChange={(e) => update("klant_naam", e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>E-mailadres *</Label>
                  <Input type="email" value={form.klant_email} onChange={(e) => update("klant_email", e.target.value)} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Telefoon</Label>
                  <Input value={form.klant_telefoon} onChange={(e) => update("klant_telefoon", e.target.value)} placeholder="+31 6..." />
                </div>
                <div className="space-y-1.5">
                  <Label>Adres</Label>
                  <Input value={form.klant_adres} onChange={(e) => update("klant_adres", e.target.value)} placeholder="Straat, Postcode, Plaats" />
                </div>
              </div>

              <KvkSearch
                value={form.bedrijf}
                kvkNummer={kvkNummer}
                bedrijfAdres={bedrijfAdres}
                onChange={(bedrijf, kvk, adres) => {
                  update("bedrijf", bedrijf);
                  setKvkNummer(kvk);
                  setBedrijfAdres(adres);
                }}
              />
            </div>
          )}

          {/* Step 1: Voertuig & Looptijd */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              {form.type !== "fietslease" && (
                <div className="space-y-3">
                  <RdwLookup onVehicleFound={(info) => {
                    setRdwInfo(info);
                    const match = vehicles.find((v) => v.kenteken.replace(/[\s-]/g, "").toUpperCase() === info.kenteken);
                    if (match) update("voertuig_id", match.id);
                  }} />
                  <div className="space-y-1.5">
                    <Label>Voertuig</Label>
                    <Select value={form.voertuig_id} onValueChange={(v) => update("voertuig_id", v)}>
                      <SelectTrigger><SelectValue placeholder="Selecteer voertuig" /></SelectTrigger>
                      <SelectContent>
                        {vehicles.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.merk} {v.model} · {v.kenteken}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Startdatum *</Label>
                  <Input type="date" value={form.start_datum} onChange={(e) => update("start_datum", e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Einddatum *</Label>
                  <Input type="date" value={form.eind_datum} onChange={(e) => update("eind_datum", e.target.value)} required />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Km/jaar</Label>
                <Input type="number" min={0} value={form.km_per_jaar} onChange={(e) => update("km_per_jaar", Number(e.target.value))} />
              </div>
            </div>
          )}

          {/* Step 2: Financiën & Services */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Maandprijs (€) *</Label>
                  <Input type="number" min={0} value={form.maandprijs} onChange={(e) => update("maandprijs", Number(e.target.value))} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Borg (€)</Label>
                  <Input type="number" min={0} value={form.borg} onChange={(e) => update("borg", Number(e.target.value))} />
                  <p className="text-xs text-muted-foreground">Eenmalige borgsom bij aanvang</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Inclusief</Label>
                <div className="flex flex-wrap gap-3">
                  {serviceOptions.map((s) => {
                    const isDefault = defaultServices.includes(s);
                    const isKm = s === "Gratis km/dag";
                    return (
                      <label key={s} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={form.inclusief.includes(s)}
                          onCheckedChange={() => toggleService(s)}
                          disabled={isDefault && !isEdit}
                        />
                        <span>
                          {isKm && form.inclusief.includes(s) && freeKmPerDay > 0
                            ? `Gratis ${freeKmPerDay} km/dag`
                            : s}
                          {isDefault && !isEdit && (
                            <span className="text-xs text-muted-foreground ml-1">(standaard)</span>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
                {form.inclusief.includes("Gratis km/dag") && (
                  <div className="flex items-center gap-2 mt-2">
                    <Label className="text-xs">Gratis km/dag:</Label>
                    <Input
                      type="number"
                      min={0}
                      value={freeKmPerDay}
                      onChange={(e) => setFreeKmPerDay(Number(e.target.value))}
                      className="w-24 h-8 text-sm"
                    />
                    {selectedVehicle && (
                      <span className="text-xs text-muted-foreground">
                        Standaard voor {selectedVehicle.categorie}: {defaultKmPerDayByCategory[selectedVehicle.categorie]} km
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Voorwaarden */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <Label>Verlengbaar contract</Label>
                  <p className="text-xs text-muted-foreground">Kan dit contract worden verlengd na afloop?</p>
                </div>
                <Switch checked={form.verlengbaar} onCheckedChange={(v) => update("verlengbaar", v)} />
              </div>

              {form.verlengbaar && (
                <div className="space-y-1.5">
                  <Label>Verlengingstermijn</Label>
                  <Select value={form.verlengings_termijn || ""} onValueChange={(v) => update("verlengings_termijn", v)}>
                    <SelectTrigger><SelectValue placeholder="Kies termijn" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3 maanden">3 maanden</SelectItem>
                      <SelectItem value="6 maanden">6 maanden</SelectItem>
                      <SelectItem value="12 maanden">12 maanden</SelectItem>
                      <SelectItem value="24 maanden">24 maanden</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Boeteclausule</Label>
                <Textarea
                  value={form.boeteclausule}
                  onChange={(e) => update("boeteclausule", e.target.value)}
                  rows={3}
                  placeholder="Bijv. bij vroegtijdige beëindiging is 3x maandprijs verschuldigd..."
                />
              </div>

              <div className="space-y-1.5">
                <Label>Notities</Label>
                <Textarea value={form.notities} onChange={(e) => update("notities", e.target.value)} rows={3} />
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Navigation */}
        <div className="flex justify-between pt-2">
          <Button type="button" variant="outline" onClick={() => step === 0 ? onOpenChange(false) : setStep(step - 1)}>
            {step === 0 ? "Annuleren" : "Vorige"}
          </Button>
          {step < steps.length - 1 ? (
            <Button type="button" onClick={() => setStep(step + 1)}>
              Volgende
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? "Opslaan..." : isEdit ? "Bijwerken" : "Aanmaken"}
            </Button>
          )}
        </div>
        </>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface QuickProps {
  form: any;
  update: (k: string, v: unknown) => void;
  klanten: any[];
  vehicles: DbVoertuig[];
  klantPickerOpen: boolean;
  setKlantPickerOpen: (b: boolean) => void;
  pickKlant: (k: any) => void;
  selectedVehicle: DbVoertuig | undefined;
  onCancel: () => void;
  onSubmit: () => void;
  canSubmit: boolean;
  isPending: boolean;
}

function QuickContractForm({
  form, update, klanten, vehicles, klantPickerOpen, setKlantPickerOpen, pickKlant,
  selectedVehicle, onCancel, onSubmit, canSubmit, isPending,
}: QuickProps) {
  const days = form.start_datum && form.eind_datum
    ? Math.max(1, Math.round((new Date(form.eind_datum).getTime() - new Date(form.start_datum).getTime()) / 86400000))
    : 0;
  const maanden = days > 0 ? (days / 30).toFixed(1) : "0";
  const totaal = form.type === "verhuur"
    ? days * Number(form.maandprijs || 0)
    : Number(maanden) * Number(form.maandprijs || 0);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <div className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Snel mode</span> · vul alleen het hoognodige in. Standaard waarden vullen automatisch in.
        </div>
      </div>

      {/* Type chips */}
      <div className="space-y-1.5">
        <Label className="text-xs">Type contract</Label>
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { v: "lease", l: "Lease" },
            { v: "verhuur", l: "Verhuur" },
            { v: "fietslease", l: "Fiets" },
            { v: "ev-lease", l: "EV" },
          ].map((t) => (
            <button
              key={t.v}
              type="button"
              onClick={() => update("type", t.v)}
              className={`px-2 py-2 rounded-lg text-xs font-medium border transition-all ${
                form.type === t.v
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-background border-border text-muted-foreground hover:border-primary/40"
              }`}
            >
              {t.l}
            </button>
          ))}
        </div>
      </div>

      {/* Klant picker */}
      <div className="space-y-1.5">
        <Label className="text-xs">Klant *</Label>
        <div className="grid grid-cols-[auto_1fr] gap-2">
          <Popover open={klantPickerOpen} onOpenChange={setKlantPickerOpen}>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" size="icon" className="h-10 w-10 shrink-0">
                <Search className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Zoek bestaande klant..." />
                <CommandList>
                  <CommandEmpty>Geen klant gevonden</CommandEmpty>
                  <CommandGroup>
                    {klanten.slice(0, 50).map((k) => (
                      <CommandItem
                        key={k.id}
                        value={`${k.voornaam} ${k.achternaam} ${k.email}`}
                        onSelect={() => pickKlant(k)}
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{k.voornaam} {k.achternaam}</span>
                          <span className="text-xs text-muted-foreground">{k.email}</span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <Input
            value={form.klant_naam}
            onChange={(e) => update("klant_naam", e.target.value)}
            placeholder="Naam klant"
            className="h-10"
          />
        </div>
        <Input
          type="email"
          value={form.klant_email}
          onChange={(e) => update("klant_email", e.target.value)}
          placeholder="email@klant.nl *"
          className="h-10"
        />
      </div>

      {/* Voertuig */}
      <div className="space-y-1.5">
        <Label className="text-xs">Voertuig</Label>
        <Select value={form.voertuig_id || ""} onValueChange={(v) => update("voertuig_id", v)}>
          <SelectTrigger className="h-10"><SelectValue placeholder="Selecteer voertuig" /></SelectTrigger>
          <SelectContent>
            {vehicles.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.merk} {v.model} · {v.kenteken} · €{v.dagprijs}/dag
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Datums */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Startdatum *</Label>
          <Input type="date" value={form.start_datum} onChange={(e) => update("start_datum", e.target.value)} className="h-10" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Einddatum *</Label>
          <Input type="date" value={form.eind_datum} onChange={(e) => update("eind_datum", e.target.value)} className="h-10" />
        </div>
      </div>

      {/* Prijs */}
      <div className="space-y-1.5">
        <Label className="text-xs">{form.type === "verhuur" ? "Dagprijs (€) *" : "Maandprijs (€) *"}</Label>
        <Input
          type="number"
          min={0}
          value={form.maandprijs}
          onChange={(e) => update("maandprijs", Number(e.target.value))}
          className="h-10 text-base"
        />
        {selectedVehicle && (
          <p className="text-[11px] text-muted-foreground">
            Voorgesteld op basis van €{selectedVehicle.dagprijs}/dag
          </p>
        )}
      </div>

      {/* Samenvatting */}
      {totaal > 0 && (
        <div className="rounded-xl bg-muted/50 border border-border p-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Looptijd</span>
            <span>{form.type === "verhuur" ? `${days} dagen` : `${maanden} maanden`}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Geschatte totaalwaarde</span>
            <span className="text-lg font-bold text-primary">€{totaal.toFixed(0)}</span>
          </div>
        </div>
      )}

      <Separator />

      <div className="flex justify-between gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Annuleren</Button>
        <Button onClick={onSubmit} disabled={!canSubmit || isPending} className="gap-1.5">
          <Zap className="w-4 h-4" />
          {isPending ? "Aanmaken..." : "Contract aanmaken"}
        </Button>
      </div>
    </div>
  );
}
