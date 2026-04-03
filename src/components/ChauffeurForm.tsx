import { useState } from "react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChauffeurs, type ChauffeurInsert, type Chauffeur } from "@/hooks/useChauffeurs";
import { useVoertuigen } from "@/hooks/useVoertuigen";

interface ChauffeurFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chauffeur?: Chauffeur | null;
}

const rijbewijsCategorieen = ["AM", "A1", "A2", "A", "B", "BE", "C1", "C", "CE", "D1", "D", "DE"];

export function ChauffeurForm({ open, onOpenChange, chauffeur }: ChauffeurFormProps) {
  const { addChauffeur, updateChauffeur } = useChauffeurs();
  const { voertuigen } = useVoertuigen();
  const isEdit = !!chauffeur;

  const [form, setForm] = useState({
    voornaam: chauffeur?.voornaam ?? "",
    achternaam: chauffeur?.achternaam ?? "",
    email: chauffeur?.email ?? "",
    telefoon: chauffeur?.telefoon ?? "",
    rijbewijs_categorie: chauffeur?.rijbewijs_categorie ?? "B",
    rijbewijs_nummer: chauffeur?.rijbewijs_nummer ?? "",
    rijbewijs_verloopt: chauffeur?.rijbewijs_verloopt ? new Date(chauffeur.rijbewijs_verloopt) : undefined as Date | undefined,
    geboortedatum: chauffeur?.geboortedatum ? new Date(chauffeur.geboortedatum) : undefined as Date | undefined,
    adres: chauffeur?.adres ?? "",
    postcode: chauffeur?.postcode ?? "",
    plaats: chauffeur?.plaats ?? "",
    notities: chauffeur?.notities ?? "",
    status: chauffeur?.status ?? "actief",
    voertuig_id: chauffeur?.voertuig_id ?? "",
  });

  // Reset form when chauffeur changes
  useState(() => {
    if (chauffeur) {
      setForm({
        voornaam: chauffeur.voornaam,
        achternaam: chauffeur.achternaam,
        email: chauffeur.email ?? "",
        telefoon: chauffeur.telefoon ?? "",
        rijbewijs_categorie: chauffeur.rijbewijs_categorie,
        rijbewijs_nummer: chauffeur.rijbewijs_nummer ?? "",
        rijbewijs_verloopt: chauffeur.rijbewijs_verloopt ? new Date(chauffeur.rijbewijs_verloopt) : undefined,
        geboortedatum: chauffeur.geboortedatum ? new Date(chauffeur.geboortedatum) : undefined,
        adres: chauffeur.adres ?? "",
        postcode: chauffeur.postcode ?? "",
        plaats: chauffeur.plaats ?? "",
        notities: chauffeur.notities ?? "",
        status: chauffeur.status,
        voertuig_id: chauffeur.voertuig_id ?? "",
      });
    }
  });

  const handleSubmit = () => {
    if (!form.voornaam.trim() || !form.achternaam.trim()) return;

    const payload: ChauffeurInsert = {
      voornaam: form.voornaam.trim(),
      achternaam: form.achternaam.trim(),
      email: form.email.trim() || null,
      telefoon: form.telefoon.trim() || null,
      rijbewijs_categorie: form.rijbewijs_categorie,
      rijbewijs_nummer: form.rijbewijs_nummer.trim() || null,
      rijbewijs_verloopt: form.rijbewijs_verloopt ? format(form.rijbewijs_verloopt, "yyyy-MM-dd") : null,
      geboortedatum: form.geboortedatum ? format(form.geboortedatum, "yyyy-MM-dd") : null,
      adres: form.adres.trim() || null,
      postcode: form.postcode.trim() || null,
      plaats: form.plaats.trim() || null,
      notities: form.notities.trim() || null,
      status: form.status,
      voertuig_id: form.voertuig_id || null,
    };

    if (isEdit && chauffeur) {
      updateChauffeur.mutate({ id: chauffeur.id, ...payload }, {
        onSuccess: () => onOpenChange(false),
      });
    } else {
      addChauffeur.mutate(payload, {
        onSuccess: () => {
          onOpenChange(false);
          setForm({
            voornaam: "", achternaam: "", email: "", telefoon: "",
            rijbewijs_categorie: "B", rijbewijs_nummer: "",
            rijbewijs_verloopt: undefined, geboortedatum: undefined,
            adres: "", postcode: "", plaats: "", notities: "",
            status: "actief", voertuig_id: "",
            heeft_trailer: false, trailer_plekken: null,
          });
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Chauffeur bewerken" : "Chauffeur toevoegen"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Naam */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Voornaam *</Label>
              <Input value={form.voornaam} onChange={(e) => setForm({ ...form, voornaam: e.target.value })} placeholder="Jan" />
            </div>
            <div className="space-y-1.5">
              <Label>Achternaam *</Label>
              <Input value={form.achternaam} onChange={(e) => setForm({ ...form, achternaam: e.target.value })} placeholder="de Vries" />
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jan@bedrijf.nl" />
            </div>
            <div className="space-y-1.5">
              <Label>Telefoon</Label>
              <Input value={form.telefoon} onChange={(e) => setForm({ ...form, telefoon: e.target.value })} placeholder="+31 6 12345678" />
            </div>
          </div>

          {/* Rijbewijs */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Rijbewijs cat.</Label>
              <Select value={form.rijbewijs_categorie} onValueChange={(v) => setForm({ ...form, rijbewijs_categorie: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {rijbewijsCategorieen.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Rijbewijsnummer</Label>
              <Input value={form.rijbewijs_nummer} onChange={(e) => setForm({ ...form, rijbewijs_nummer: e.target.value })} placeholder="1234567890" />
            </div>
            <div className="space-y-1.5">
              <Label>Verloopt</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("w-full justify-start text-left font-normal h-10", !form.rijbewijs_verloopt && "text-muted-foreground")}>
                    <CalendarIcon className="w-3.5 h-3.5 mr-1.5" />
                    {form.rijbewijs_verloopt ? format(form.rijbewijs_verloopt, "d MMM yyyy", { locale: nl }) : "Datum"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={form.rijbewijs_verloopt} onSelect={(d) => setForm({ ...form, rijbewijs_verloopt: d })} initialFocus className="p-3 pointer-events-auto" locale={nl} />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Geboortedatum */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Geboortedatum</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("w-full justify-start text-left font-normal h-10", !form.geboortedatum && "text-muted-foreground")}>
                    <CalendarIcon className="w-3.5 h-3.5 mr-1.5" />
                    {form.geboortedatum ? format(form.geboortedatum, "d MMM yyyy", { locale: nl }) : "Datum"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={form.geboortedatum} onSelect={(d) => setForm({ ...form, geboortedatum: d })} initialFocus className="p-3 pointer-events-auto" locale={nl} captionLayout="dropdown-buttons" fromYear={1950} toYear={2010} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="actief">Actief</SelectItem>
                  <SelectItem value="inactief">Inactief</SelectItem>
                  <SelectItem value="verlof">Verlof</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Adres */}
          <div className="space-y-1.5">
            <Label>Adres</Label>
            <Input value={form.adres} onChange={(e) => setForm({ ...form, adres: e.target.value })} placeholder="Straatnaam 123" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Postcode</Label>
              <Input value={form.postcode} onChange={(e) => setForm({ ...form, postcode: e.target.value })} placeholder="1234 AB" />
            </div>
            <div className="space-y-1.5">
              <Label>Plaats</Label>
              <Input value={form.plaats} onChange={(e) => setForm({ ...form, plaats: e.target.value })} placeholder="Utrecht" />
            </div>
          </div>

          {/* Voertuig koppeling */}
          {/* Trailer */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="heeft_trailer"
                checked={form.heeft_trailer}
                onCheckedChange={(checked) => setForm({ ...form, heeft_trailer: !!checked, trailer_plekken: checked ? (form.trailer_plekken ?? 1) : null })}
              />
              <Label htmlFor="heeft_trailer" className="flex items-center gap-1.5 cursor-pointer">
                <Truck className="w-3.5 h-3.5" /> Heeft trailer
              </Label>
            </div>
            {form.heeft_trailer && (
              <div className="space-y-1.5 pl-6">
                <Label>Aantal plekken op trailer</Label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={form.trailer_plekken ?? ""}
                  onChange={(e) => setForm({ ...form, trailer_plekken: e.target.value ? Number(e.target.value) : null })}
                  placeholder="Bijv. 6"
                />
              </div>
            )}
          </div>

          {/* Voertuig koppeling */}
          <div className="space-y-1.5">
            <Label>Gekoppeld voertuig</Label>
            <Select value={form.voertuig_id || "__none__"} onValueChange={(v) => setForm({ ...form, voertuig_id: v === "__none__" ? "" : v })}>
              <SelectTrigger><SelectValue placeholder="Geen voertuig" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Geen voertuig</SelectItem>
                {voertuigen.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.merk} {v.model} — {v.kenteken}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notities */}
          <div className="space-y-1.5">
            <Label>Notities</Label>
            <Textarea value={form.notities} onChange={(e) => setForm({ ...form, notities: e.target.value })} placeholder="Eventuele opmerkingen..." rows={3} />
          </div>

          <Button onClick={handleSubmit} className="w-full gap-2" disabled={!form.voornaam.trim() || !form.achternaam.trim()}>
            <Save className="w-4 h-4" />
            {isEdit ? "Opslaan" : "Chauffeur toevoegen"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
