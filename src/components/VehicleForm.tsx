import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useVoertuigen, type VoertuigInsert } from "@/hooks/useVoertuigen";
import { Car, Loader2, Sparkles } from "lucide-react";
import { getVehicleImageUrl } from "@/data/mockData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const vehicleSchema = z.object({
  kenteken: z.string().trim().min(1, "Kenteken is verplicht").max(12, "Kenteken mag max 12 tekens zijn")
    .regex(/^[A-Z0-9-]+$/i, "Ongeldig kenteken formaat"),
  merk: z.string().trim().min(1, "Merk is verplicht").max(50),
  model: z.string().trim().min(1, "Model is verplicht").max(50),
  bouwjaar: z.coerce.number().min(1990, "Min. 1990").max(new Date().getFullYear() + 1, "Ongeldig bouwjaar"),
  brandstof: z.enum(["Benzine", "Diesel", "Elektrisch", "Hybride"]),
  kilometerstand: z.coerce.number().min(0, "Kan niet negatief zijn").max(999999),
  dagprijs: z.coerce.number().min(0, "Kan niet negatief zijn").max(9999),
  categorie: z.enum(["Stadsauto", "SUV", "Bestelwagen", "Luxe", "Elektrisch"]),
  kleur: z.string().trim().min(1, "Kleur is verplicht").max(30),
  apk_vervaldatum: z.string().optional().nullable(),
  verzekering_vervaldatum: z.string().optional().nullable(),
  status: z.enum(["beschikbaar", "verhuurd", "onderhoud", "gereserveerd"]).default("beschikbaar"),
  catalogusprijs: z.coerce.number().min(0).optional().nullable(),
  cilinderinhoud: z.coerce.number().min(0).optional().nullable(),
  co2_uitstoot: z.coerce.number().min(0).optional().nullable(),
  massa_ledig: z.coerce.number().min(0).optional().nullable(),
  eerste_toelating: z.string().optional().nullable(),
  voertuigsoort: z.string().optional().nullable(),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

interface VehicleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VehicleForm({ open, onOpenChange }: VehicleFormProps) {
  const { addVoertuig } = useVoertuigen();
  const [preview, setPreview] = useState({ merk: "", model: "" });
  const [rdwLoading, setRdwLoading] = useState(false);

  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      kenteken: "",
      merk: "",
      model: "",
      bouwjaar: new Date().getFullYear(),
      brandstof: "Benzine",
      kilometerstand: 0,
      dagprijs: 0,
      categorie: "Stadsauto",
      kleur: "Zwart",
      status: "beschikbaar",
      apk_vervaldatum: null,
      verzekering_vervaldatum: null,
      catalogusprijs: null,
      cilinderinhoud: null,
      co2_uitstoot: null,
      massa_ledig: null,
      eerste_toelating: null,
      voertuigsoort: null,
    },
  });

  const onSubmit = (values: VehicleFormValues) => {
    const insert: VoertuigInsert = {
      kenteken: values.kenteken.toUpperCase(),
      merk: values.merk,
      model: values.model,
      bouwjaar: values.bouwjaar,
      brandstof: values.brandstof,
      kilometerstand: values.kilometerstand,
      dagprijs: values.dagprijs,
      categorie: values.categorie,
      kleur: values.kleur,
      status: values.status,
      apk_vervaldatum: values.apk_vervaldatum || null,
      verzekering_vervaldatum: values.verzekering_vervaldatum || null,
      image_url: getVehicleImageUrl(values.merk, values.model),
      catalogusprijs: values.catalogusprijs ?? null,
      cilinderinhoud: values.cilinderinhoud ?? null,
      co2_uitstoot: values.co2_uitstoot ?? null,
      massa_ledig: values.massa_ledig ?? null,
      eerste_toelating: values.eerste_toelating || null,
      voertuigsoort: values.voertuigsoort || null,
    } as VoertuigInsert;
    addVoertuig.mutate(insert, {
      onSuccess: () => {
        form.reset();
        setPreview({ merk: "", model: "" });
        onOpenChange(false);
      },
    });
  };

  const handleRdwLookup = async () => {
    const kenteken = form.getValues("kenteken");
    if (!kenteken || kenteken.length < 4) {
      toast.error("Vul eerst een geldig kenteken in");
      return;
    }
    setRdwLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("rdw-lookup", {
        body: { kenteken },
      });
      if (error) throw error;
      if (!data || data.error) throw new Error(data?.error || "Geen data");

      // Normaliseer enkele bekende merknamen
      let merk = data.merk || "";
      const upper = merk.toUpperCase();
      if (upper === "SKODA") merk = "Škoda";
      else if (upper === "SEAT") merk = "SEAT";
      else if (upper === "CUPRA") merk = "CUPRA";
      else if (upper === "BMW") merk = "BMW";
      else if (upper === "MG") merk = "MG";

      form.setValue("merk", merk, { shouldValidate: true });
      form.setValue("model", data.model || "", { shouldValidate: true });
      if (data.bouwjaar) form.setValue("bouwjaar", data.bouwjaar, { shouldValidate: true });
      if (data.brandstof) form.setValue("brandstof", data.brandstof, { shouldValidate: true });
      if (data.kleur) form.setValue("kleur", data.kleur, { shouldValidate: true });
      if (data.apk_vervaldatum) form.setValue("apk_vervaldatum", data.apk_vervaldatum);
      if (data.eerste_toelating) form.setValue("eerste_toelating", data.eerste_toelating);
      if (data.voertuigsoort) form.setValue("voertuigsoort", data.voertuigsoort);
      if (data.catalogusprijs != null) form.setValue("catalogusprijs", data.catalogusprijs);
      if (data.cilinderinhoud != null) form.setValue("cilinderinhoud", data.cilinderinhoud);
      if (data.co2_uitstoot != null) form.setValue("co2_uitstoot", data.co2_uitstoot);
      if (data.massa_ledig != null) form.setValue("massa_ledig", data.massa_ledig);
      setPreview({ merk, model: data.model || "" });

      toast.success(`${merk} ${data.model} opgehaald van RDW`);
    } catch (err: any) {
      toast.error(err?.message || "Ophalen mislukt");
    } finally {
      setRdwLoading(false);
    }
  };

  const imageUrl = preview.merk && preview.model
    ? getVehicleImageUrl(preview.merk, preview.model)
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Voertuig toevoegen</DialogTitle>
          <DialogDescription>Vul het kenteken in en haal alle gegevens automatisch op uit het RDW-register.</DialogDescription>
        </DialogHeader>

        {/* Image preview */}
        {imageUrl && (
          <div className="h-32 bg-muted rounded-lg overflow-hidden relative">
            <img
              src={imageUrl}
              alt="Preview"
              className="absolute inset-0 w-full h-full object-contain object-center p-3"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Row 1: Kenteken met RDW knop */}
            <FormField control={form.control} name="kenteken" render={({ field }) => (
              <FormItem>
                <FormLabel>Kenteken</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input
                      placeholder="AB-123-CD"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleRdwLookup();
                        }
                      }}
                      maxLength={12}
                      className="font-mono uppercase"
                    />
                  </FormControl>
                  <Button type="button" variant="secondary" onClick={handleRdwLookup} disabled={rdwLoading} className="gap-1.5 shrink-0">
                    {rdwLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Ophalen RDW
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Vul het kenteken in en klik 'Ophalen RDW' voor automatische invulling.</p>
                <FormMessage />
              </FormItem>
            )} />

            {/* Row 2: Merk + Model */}
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="merk" render={({ field }) => (
                <FormItem>
                  <FormLabel>Merk</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Bv. Volkswagen, BMW, Toyota..."
                      {...field}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        setPreview(p => ({ ...p, merk: e.target.value }));
                      }}
                      maxLength={50}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="model" render={({ field }) => (
                <FormItem>
                  <FormLabel>Model</FormLabel>
                  <FormControl>
                    <Input placeholder="Golf 8" {...field} onChange={(e) => {
                      field.onChange(e.target.value);
                      setPreview(p => ({ ...p, model: e.target.value }));
                    }} maxLength={50} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Row 3: Bouwjaar + Brandstof */}
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="bouwjaar" render={({ field }) => (
                <FormItem>
                  <FormLabel>Bouwjaar</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} min={1990} max={new Date().getFullYear() + 1} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="brandstof" render={({ field }) => (
                <FormItem>
                  <FormLabel>Brandstof</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {["Benzine", "Diesel", "Elektrisch", "Hybride"].map(b => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Row 4: Categorie + Kleur */}
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="categorie" render={({ field }) => (
                <FormItem>
                  <FormLabel>Categorie</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {["Stadsauto", "SUV", "Bestelwagen", "Luxe", "Elektrisch"].map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="kleur" render={({ field }) => (
                <FormItem>
                  <FormLabel>Kleur</FormLabel>
                  <FormControl>
                    <Input placeholder="Zwart" {...field} maxLength={30} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Row 5: Kilometerstand + Dagprijs + Catalogusprijs */}
            <div className="grid grid-cols-3 gap-3">
              <FormField control={form.control} name="kilometerstand" render={({ field }) => (
                <FormItem>
                  <FormLabel>Kilometerstand</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} min={0} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="dagprijs" render={({ field }) => (
                <FormItem>
                  <FormLabel>Dagprijs (€)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} min={0} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="catalogusprijs" render={({ field }) => (
                <FormItem>
                  <FormLabel>Fiscale waarde (€)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Row 6: APK + Verzekering */}
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="apk_vervaldatum" render={({ field }) => (
                <FormItem>
                  <FormLabel>APK vervaldatum</FormLabel>
                  <FormControl>
                    <Input type="date" value={field.value || ""} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="verzekering_vervaldatum" render={({ field }) => (
                <FormItem>
                  <FormLabel>Verzekering vervaldatum</FormLabel>
                  <FormControl>
                    <Input type="date" value={field.value || ""} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* RDW techniek (samenvatting, alleen als ingevuld) */}
            {(form.watch("cilinderinhoud") || form.watch("co2_uitstoot") || form.watch("massa_ledig") || form.watch("eerste_toelating")) && (
              <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2 text-muted-foreground">
                {form.watch("eerste_toelating") && <div><span className="block font-medium text-foreground">{form.watch("eerste_toelating")}</span>Eerste toelating</div>}
                {form.watch("cilinderinhoud") ? <div><span className="block font-medium text-foreground">{form.watch("cilinderinhoud")} cc</span>Cilinderinhoud</div> : null}
                {form.watch("co2_uitstoot") ? <div><span className="block font-medium text-foreground">{form.watch("co2_uitstoot")} g/km</span>CO₂</div> : null}
                {form.watch("massa_ledig") ? <div><span className="block font-medium text-foreground">{form.watch("massa_ledig")} kg</span>Leeggewicht</div> : null}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuleren
              </Button>
              <Button type="submit" disabled={addVoertuig.isPending}>
                {addVoertuig.isPending ? "Toevoegen..." : "Toevoegen"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
