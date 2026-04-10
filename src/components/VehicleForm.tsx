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
import { Car } from "lucide-react";
import { getVehicleImageUrl } from "@/data/mockData";

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
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

interface VehicleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const merken = [
  "Volkswagen", "Audi", "Škoda", "SEAT", "CUPRA", "Porsche",
];

export function VehicleForm({ open, onOpenChange }: VehicleFormProps) {
  const { addVoertuig } = useVoertuigen();
  const [preview, setPreview] = useState({ merk: "", model: "" });

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
    };
    addVoertuig.mutate(insert, {
      onSuccess: () => {
        form.reset();
        setPreview({ merk: "", model: "" });
        onOpenChange(false);
      },
    });
  };

  const imageUrl = preview.merk && preview.model
    ? getVehicleImageUrl(preview.merk, preview.model)
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Voertuig toevoegen</DialogTitle>
          <DialogDescription>Voeg een nieuw voertuig toe aan het wagenpark.</DialogDescription>
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
            {/* Row 1: Kenteken + Merk */}
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="kenteken" render={({ field }) => (
                <FormItem>
                  <FormLabel>Kenteken</FormLabel>
                  <FormControl>
                    <Input placeholder="AB-123-CD" {...field} onChange={(e) => field.onChange(e.target.value.toUpperCase())} maxLength={12} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="merk" render={({ field }) => (
                <FormItem>
                  <FormLabel>Merk</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(val) => {
                      field.onChange(val);
                      setPreview(p => ({ ...p, merk: val }));
                    }}
                  >
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Selecteer merk" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {merken.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Row 2: Model + Bouwjaar */}
            <div className="grid grid-cols-2 gap-3">
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
              <FormField control={form.control} name="bouwjaar" render={({ field }) => (
                <FormItem>
                  <FormLabel>Bouwjaar</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} min={1990} max={new Date().getFullYear() + 1} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Row 3: Brandstof + Categorie */}
            <div className="grid grid-cols-2 gap-3">
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
            </div>

            {/* Row 4: Kleur + Kilometerstand + Dagprijs */}
            <div className="grid grid-cols-3 gap-3">
              <FormField control={form.control} name="kleur" render={({ field }) => (
                <FormItem>
                  <FormLabel>Kleur</FormLabel>
                  <FormControl>
                    <Input placeholder="Zwart" {...field} maxLength={30} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
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
            </div>

            {/* Row 5: APK + Verzekering */}
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
