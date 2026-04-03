import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Route, Clock, MapPin, Loader2 } from "lucide-react";
import { useRitten, type RitInsert } from "@/hooks/useRitten";
import { useVoertuigen } from "@/hooks/useVoertuigen";
import { useChauffeurs } from "@/hooks/useChauffeurs";
import { useLocaties } from "@/hooks/useLocaties";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RitFormProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface RouteInfo {
  distance_km: number;
  distance_text: string;
  duration_minutes: number;
  duration_text: string;
  start_address: string;
  end_address: string;
}

export function RitForm({ open, onOpenChange }: RitFormProps) {
  const { addRit } = useRitten();
  const { voertuigen } = useVoertuigen();
  const { chauffeurs } = useChauffeurs();
  const { locaties } = useLocaties();
  const [isOpen, setIsOpen] = useState(false);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [calculating, setCalculating] = useState(false);

  const dialogOpen = open ?? isOpen;
  const setDialogOpen = onOpenChange ?? setIsOpen;

  const [form, setForm] = useState<Partial<RitInsert>>({
    van_locatie: "",
    naar_locatie: "",
    datum: new Date().toISOString().split("T")[0],
    vertrek_tijd: "",
    aankomst_tijd: "",
    afstand_km: 0,
    km_tarief: 0.35,
    kosten: 0,
    status: "gepland",
    type: "transport",
    voertuig_id: null,
    chauffeur_id: null,
    notitie: "",
  });

  const beschikbareVoertuigen = voertuigen.filter((v) => v.status === "beschikbaar" || v.status === "verhuurd");
  const actieveChauffeurs = chauffeurs.filter((c) => c.status === "actief");

  const berekenKosten = (km: number, tarief: number) => Math.round(km * tarief * 100) / 100;

  const calculateRoute = async () => {
    if (!form.van_locatie || !form.naar_locatie) {
      toast.error("Vul eerst vertrek- en aankomstlocatie in");
      return;
    }
    setCalculating(true);
    setRouteInfo(null);
    try {
      const { data, error } = await supabase.functions.invoke("calculate-route", {
        body: { origin: form.van_locatie, destination: form.naar_locatie },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setRouteInfo(data);
      const km = data.distance_km;
      const kosten = berekenKosten(km, form.km_tarief || 0.35);
      setForm((prev) => ({ ...prev, afstand_km: km, kosten }));
      toast.success(`Route berekend: ${data.distance_text}, ${data.duration_text}`);
    } catch (e: any) {
      toast.error(e.message || "Fout bij routeberekening");
    } finally {
      setCalculating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.van_locatie || !form.naar_locatie || !form.datum) return;

    const kosten = berekenKosten(form.afstand_km || 0, form.km_tarief || 0.35);

    addRit.mutate(
      {
        van_locatie: form.van_locatie!,
        naar_locatie: form.naar_locatie!,
        datum: form.datum!,
        vertrek_tijd: form.vertrek_tijd || null,
        aankomst_tijd: form.aankomst_tijd || null,
        afstand_km: form.afstand_km || 0,
        km_tarief: form.km_tarief || 0.35,
        kosten,
        status: form.status || "gepland",
        type: form.type || "transport",
        voertuig_id: form.voertuig_id || null,
        chauffeur_id: form.chauffeur_id || null,
        notitie: form.notitie || null,
      },
      {
        onSuccess: () => {
          setDialogOpen(false);
          setRouteInfo(null);
          setForm({
            van_locatie: "", naar_locatie: "",
            datum: new Date().toISOString().split("T")[0],
            vertrek_tijd: "", aankomst_tijd: "",
            afstand_km: 0, km_tarief: 0.35, kosten: 0,
            status: "gepland", type: "transport",
            voertuig_id: null, chauffeur_id: null, notitie: "",
          });
        },
      }
    );
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-1" /> Nieuwe rit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nieuwe rit plannen</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Locaties */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Van locatie *</Label>
              {locaties.length > 0 ? (
                <Select value={form.van_locatie} onValueChange={(v) => { setForm({ ...form, van_locatie: v }); setRouteInfo(null); }}>
                  <SelectTrigger><SelectValue placeholder="Kies vertrekpunt" /></SelectTrigger>
                  <SelectContent>
                    {locaties.map((l) => (
                      <SelectItem key={l.id} value={l.naam}>{l.naam}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={form.van_locatie} onChange={(e) => { setForm({ ...form, van_locatie: e.target.value }); setRouteInfo(null); }} placeholder="Bijv. Utrecht" />
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Naar locatie *</Label>
              {locaties.length > 0 ? (
                <Select value={form.naar_locatie} onValueChange={(v) => { setForm({ ...form, naar_locatie: v }); setRouteInfo(null); }}>
                  <SelectTrigger><SelectValue placeholder="Kies bestemming" /></SelectTrigger>
                  <SelectContent>
                    {locaties.map((l) => (
                      <SelectItem key={l.id} value={l.naam}>{l.naam}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={form.naar_locatie} onChange={(e) => { setForm({ ...form, naar_locatie: e.target.value }); setRouteInfo(null); }} placeholder="Bijv. Den Bosch" />
              )}
            </div>
          </div>

          {/* Route calculation button */}
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            onClick={calculateRoute}
            disabled={calculating || !form.van_locatie || !form.naar_locatie}
          >
            {calculating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Route berekenen...</>
            ) : (
              <><Route className="w-4 h-4" /> Route berekenen via Google Maps</>
            )}
          </Button>

          {/* Route info */}
          {routeInfo && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-1.5">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-sm">
                  <Route className="w-3.5 h-3.5 text-primary" />
                  <span className="font-medium text-foreground">{routeInfo.distance_text}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span className="font-medium text-foreground">{routeInfo.duration_text}</span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <div className="flex items-start gap-1.5">
                  <MapPin className="w-3 h-3 mt-0.5 text-success shrink-0" />
                  <span>{routeInfo.start_address}</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <MapPin className="w-3 h-3 mt-0.5 text-destructive shrink-0" />
                  <span>{routeInfo.end_address}</span>
                </div>
              </div>
            </div>
          )}

          {/* Datum & tijden */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Datum *</Label>
              <Input type="date" value={form.datum} onChange={(e) => setForm({ ...form, datum: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Vertrek</Label>
              <Input type="time" value={form.vertrek_tijd || ""} onChange={(e) => setForm({ ...form, vertrek_tijd: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Aankomst</Label>
              <Input type="time" value={form.aankomst_tijd || ""} onChange={(e) => setForm({ ...form, aankomst_tijd: e.target.value })} />
            </div>
          </div>

          {/* Voertuig & chauffeur */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Voertuig</Label>
              <Select value={form.voertuig_id || "none"} onValueChange={(v) => setForm({ ...form, voertuig_id: v === "none" ? null : v })}>
                <SelectTrigger><SelectValue placeholder="Kies voertuig" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Geen —</SelectItem>
                  {beschikbareVoertuigen.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.merk} {v.model} ({v.kenteken})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Chauffeur</Label>
              <Select value={form.chauffeur_id || "none"} onValueChange={(v) => setForm({ ...form, chauffeur_id: v === "none" ? null : v })}>
                <SelectTrigger><SelectValue placeholder="Kies chauffeur" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Geen —</SelectItem>
                  {actieveChauffeurs.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.voornaam} {c.achternaam}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Kosten */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Afstand (km)</Label>
              <Input type="number" value={form.afstand_km || ""} onChange={(e) => {
                const km = Number(e.target.value);
                setForm({ ...form, afstand_km: km, kosten: berekenKosten(km, form.km_tarief || 0.35) });
              }} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label>Tarief/km (€)</Label>
              <Input type="number" step="0.01" value={form.km_tarief || ""} onChange={(e) => {
                const tarief = Number(e.target.value);
                setForm({ ...form, km_tarief: tarief, kosten: berekenKosten(form.afstand_km || 0, tarief) });
              }} placeholder="0.35" />
            </div>
            <div className="space-y-1.5">
              <Label>Kosten (€)</Label>
              <Input type="number" step="0.01" value={form.kosten || ""} onChange={(e) => setForm({ ...form, kosten: Number(e.target.value) })} />
            </div>
          </div>

          {/* Type & status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="transport">Transport</SelectItem>
                  <SelectItem value="vestiging">Tussen vestigingen</SelectItem>
                  <SelectItem value="klant">Klantrit</SelectItem>
                  <SelectItem value="prive">Privé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gepland">Gepland</SelectItem>
                  <SelectItem value="onderweg">Onderweg</SelectItem>
                  <SelectItem value="afgerond">Afgerond</SelectItem>
                  <SelectItem value="geannuleerd">Geannuleerd</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notitie</Label>
            <Textarea value={form.notitie || ""} onChange={(e) => setForm({ ...form, notitie: e.target.value })} placeholder="Optionele opmerking..." rows={2} />
          </div>

          <Button type="submit" className="w-full" disabled={addRit.isPending}>
            {addRit.isPending ? "Opslaan..." : "Rit plannen"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
