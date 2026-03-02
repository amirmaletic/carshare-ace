import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Users, Wrench, AlertTriangle, Camera, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

import { toast } from "@/hooks/use-toast";
import {
  useEigendomHistorie, useCreateEigendom, useDeleteEigendom,
  useServiceHistorie, useCreateService, useDeleteService,
  useSchadeRapporten, useCreateSchade, useDeleteSchade,
} from "@/hooks/useVehicleReports";

interface VehicleReportTabsProps {
  voertuigId: string;
}

export function VehicleReportTabs({ voertuigId }: VehicleReportTabsProps) {
  return (
    <Tabs defaultValue="eigendom" className="w-full">
      <TabsList className="w-full grid grid-cols-3">
        <TabsTrigger value="eigendom" className="gap-1.5 text-xs">
          <Users className="w-3.5 h-3.5" />
          Eigendom
        </TabsTrigger>
        <TabsTrigger value="service" className="gap-1.5 text-xs">
          <Wrench className="w-3.5 h-3.5" />
          Service
        </TabsTrigger>
        <TabsTrigger value="schade" className="gap-1.5 text-xs">
          <AlertTriangle className="w-3.5 h-3.5" />
          Schade
        </TabsTrigger>
      </TabsList>

      <TabsContent value="eigendom" className="mt-4">
        <EigendomTab voertuigId={voertuigId} />
      </TabsContent>
      <TabsContent value="service" className="mt-4">
        <ServiceTab voertuigId={voertuigId} />
      </TabsContent>
      <TabsContent value="schade" className="mt-4">
        <SchadeTab voertuigId={voertuigId} />
      </TabsContent>
    </Tabs>
  );
}

function EigendomTab({ voertuigId }: { voertuigId: string }) {
  const { data: items = [], isLoading } = useEigendomHistorie(voertuigId);
  const createMut = useCreateEigendom();
  const deleteMut = useDeleteEigendom();
  const [showForm, setShowForm] = useState(false);
  const [naam, setNaam] = useState("");
  const [type, setType] = useState("particulier");
  const [startDatum, setStartDatum] = useState("");
  const [eindDatum, setEindDatum] = useState("");
  const [notitie, setNotitie] = useState("");

  const handleAdd = async () => {
    if (!naam.trim() || !startDatum) {
      toast({ title: "Vul naam en startdatum in", variant: "destructive" });
      return;
    }
    try {
      await createMut.mutateAsync({
        voertuig_id: voertuigId,
        eigenaar_naam: naam.trim(),
        eigenaar_type: type,
        start_datum: startDatum,
        eind_datum: eindDatum || null,
        notitie: notitie.trim() || null,
      });
      toast({ title: "Eigenaar toegevoegd" });
      setShowForm(false);
      setNaam(""); setStartDatum(""); setEindDatum(""); setNotitie("");
    } catch (err: any) {
      toast({ title: "Fout", description: err.message, variant: "destructive" });
    }
  };

  const typeLabels: Record<string, string> = { particulier: "Particulier", bedrijf: "Bedrijf", lease: "Lease" };

  return (
    <div className="space-y-3">
      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowForm(!showForm)}>
        <Plus className="w-3 h-3" /> Eigenaar toevoegen
      </Button>

      {showForm && (
        <div className="p-3 rounded-lg border border-border space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">Naam</Label><Input value={naam} onChange={(e) => setNaam(e.target.value)} className="h-8 text-sm" /></div>
            <div><Label className="text-xs">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="particulier">Particulier</SelectItem>
                  <SelectItem value="bedrijf">Bedrijf</SelectItem>
                  <SelectItem value="lease">Lease</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">Vanaf</Label><Input type="date" value={startDatum} onChange={(e) => setStartDatum(e.target.value)} className="h-8 text-sm" /></div>
            <div><Label className="text-xs">Tot (optioneel)</Label><Input type="date" value={eindDatum} onChange={(e) => setEindDatum(e.target.value)} className="h-8 text-sm" /></div>
          </div>
          <div><Label className="text-xs">Notitie</Label><Input value={notitie} onChange={(e) => setNotitie(e.target.value)} className="h-8 text-sm" /></div>
          <Button size="sm" onClick={handleAdd} disabled={createMut.isPending}>Opslaan</Button>
        </div>
      )}

      {isLoading ? <p className="text-sm text-muted-foreground">Laden...</p> : items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">Geen eigendomshistorie</p>
      ) : (
        items.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <p className="text-sm font-medium text-foreground">{item.eigenaar_naam}</p>
              <p className="text-xs text-muted-foreground">
                {typeLabels[item.eigenaar_type] || item.eigenaar_type} • {item.start_datum}{item.eind_datum ? ` — ${item.eind_datum}` : " — heden"}
              </p>
              {item.notitie && <p className="text-xs text-muted-foreground mt-0.5">{item.notitie}</p>}
            </div>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => deleteMut.mutate({ id: item.id, voertuigId })}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        ))
      )}
    </div>
  );
}

function ServiceTab({ voertuigId }: { voertuigId: string }) {
  const { data: items = [], isLoading } = useServiceHistorie(voertuigId);
  const createMut = useCreateService();
  const deleteMut = useDeleteService();
  const [showForm, setShowForm] = useState(false);
  const [datum, setDatum] = useState(new Date().toISOString().split("T")[0]);
  const [type, setType] = useState("onderhoud");
  const [omschrijving, setOmschrijving] = useState("");
  const [kosten, setKosten] = useState("");
  const [garage, setGarage] = useState("");
  const [km, setKm] = useState("");

  const handleAdd = async () => {
    if (!omschrijving.trim()) {
      toast({ title: "Vul een omschrijving in", variant: "destructive" });
      return;
    }
    try {
      await createMut.mutateAsync({
        voertuig_id: voertuigId,
        datum,
        type,
        omschrijving: omschrijving.trim(),
        kosten: Number(kosten) || 0,
        garage: garage.trim() || null,
        kilometerstand: km ? parseInt(km) : null,
        notitie: null,
      });
      toast({ title: "Service toegevoegd" });
      setShowForm(false);
      setOmschrijving(""); setKosten(""); setGarage(""); setKm("");
    } catch (err: any) {
      toast({ title: "Fout", description: err.message, variant: "destructive" });
    }
  };

  const typeLabels: Record<string, string> = { onderhoud: "Onderhoud", apk: "APK", reparatie: "Reparatie", bandenwissel: "Bandenwissel", overig: "Overig" };
  const totalKosten = items.reduce((sum, i) => sum + Number(i.kosten), 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-3 h-3" /> Service toevoegen
        </Button>
        {items.length > 0 && <span className="text-xs text-muted-foreground">Totaal: €{totalKosten.toLocaleString("nl-NL")}</span>}
      </div>

      {showForm && (
        <div className="p-3 rounded-lg border border-border space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">Datum</Label><Input type="date" value={datum} onChange={(e) => setDatum(e.target.value)} className="h-8 text-sm" /></div>
            <div><Label className="text-xs">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label className="text-xs">Omschrijving</Label><Input value={omschrijving} onChange={(e) => setOmschrijving(e.target.value)} className="h-8 text-sm" /></div>
          <div className="grid grid-cols-3 gap-2">
            <div><Label className="text-xs">Kosten (€)</Label><Input type="number" value={kosten} onChange={(e) => setKosten(e.target.value)} className="h-8 text-sm" /></div>
            <div><Label className="text-xs">Garage</Label><Input value={garage} onChange={(e) => setGarage(e.target.value)} className="h-8 text-sm" /></div>
            <div><Label className="text-xs">Km-stand</Label><Input type="number" value={km} onChange={(e) => setKm(e.target.value)} className="h-8 text-sm" /></div>
          </div>
          <Button size="sm" onClick={handleAdd} disabled={createMut.isPending}>Opslaan</Button>
        </div>
      )}

      {isLoading ? <p className="text-sm text-muted-foreground">Laden...</p> : items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">Geen servicehistorie</p>
      ) : (
        items.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{typeLabels[item.type] || item.type}</span>
                <span className="text-sm font-medium text-foreground">{item.omschrijving}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {item.datum} • €{Number(item.kosten).toLocaleString("nl-NL")}
                {item.garage ? ` • ${item.garage}` : ""}
                {item.kilometerstand ? ` • ${item.kilometerstand.toLocaleString("nl-NL")} km` : ""}
              </p>
            </div>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => deleteMut.mutate({ id: item.id, voertuigId })}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        ))
      )}
    </div>
  );
}

function SchadeTab({ voertuigId }: { voertuigId: string }) {
  const { data: items = [], isLoading } = useSchadeRapporten(voertuigId);
  const createMut = useCreateSchade();
  const deleteMut = useDeleteSchade();
  const [showForm, setShowForm] = useState(false);
  const [datum, setDatum] = useState(new Date().toISOString().split("T")[0]);
  const [omschrijving, setOmschrijving] = useState("");
  const [locatie, setLocatie] = useState("");
  const [ernst, setErnst] = useState("licht");
  const [kosten, setKosten] = useState("");
  const [verzekerd, setVerzekerd] = useState(false);
  const [hersteld, setHersteld] = useState(false);
  const [fotos, setFotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadPhoto = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${voertuigId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("schade-fotos").upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("schade-fotos").getPublicUrl(path);
      setFotos((prev) => [...prev, publicUrl]);
    } catch (err: any) {
      toast({ title: "Upload mislukt", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) Array.from(files).forEach(uploadPhoto);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (url: string) => {
    setFotos((prev) => prev.filter((f) => f !== url));
  };

  const handleAdd = async () => {
    if (!omschrijving.trim()) {
      toast({ title: "Vul een omschrijving in", variant: "destructive" });
      return;
    }
    try {
      await createMut.mutateAsync({
        voertuig_id: voertuigId,
        datum,
        omschrijving: omschrijving.trim(),
        locatie_schade: locatie.trim() || null,
        ernst,
        kosten: Number(kosten) || 0,
        verzekerd,
        hersteld,
        herstel_datum: hersteld ? datum : null,
        notitie: null,
        fotos,
      });
      toast({ title: "Schaderapport toegevoegd" });
      setShowForm(false);
      setOmschrijving(""); setLocatie(""); setKosten(""); setVerzekerd(false); setHersteld(false); setFotos([]);
    } catch (err: any) {
      toast({ title: "Fout", description: err.message, variant: "destructive" });
    }
  };

  const ernstLabels: Record<string, { label: string; color: string }> = {
    licht: { label: "Licht", color: "bg-success/10 text-success" },
    matig: { label: "Matig", color: "bg-warning/10 text-warning" },
    zwaar: { label: "Zwaar", color: "bg-destructive/10 text-destructive" },
    total_loss: { label: "Total loss", color: "bg-destructive/20 text-destructive" },
  };

  return (
    <div className="space-y-3">
      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowForm(!showForm)}>
        <Plus className="w-3 h-3" /> Schade melden
      </Button>

      {showForm && (
        <div className="p-3 rounded-lg border border-border space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">Datum</Label><Input type="date" value={datum} onChange={(e) => setDatum(e.target.value)} className="h-8 text-sm" /></div>
            <div><Label className="text-xs">Ernst</Label>
              <Select value={ernst} onValueChange={setErnst}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="licht">Licht</SelectItem>
                  <SelectItem value="matig">Matig</SelectItem>
                  <SelectItem value="zwaar">Zwaar</SelectItem>
                  <SelectItem value="total_loss">Total loss</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label className="text-xs">Omschrijving</Label><Input value={omschrijving} onChange={(e) => setOmschrijving(e.target.value)} className="h-8 text-sm" /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">Locatie schade</Label><Input value={locatie} onChange={(e) => setLocatie(e.target.value)} placeholder="bijv. links voor" className="h-8 text-sm" /></div>
            <div><Label className="text-xs">Kosten (€)</Label><Input type="number" value={kosten} onChange={(e) => setKosten(e.target.value)} className="h-8 text-sm" /></div>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={verzekerd} onCheckedChange={(v) => setVerzekerd(!!v)} />Verzekerd</label>
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={hersteld} onCheckedChange={(v) => setHersteld(!!v)} />Hersteld</label>
          </div>

          {/* Photo upload */}
          <div className="space-y-1.5">
            <Label className="text-xs">Foto's</Label>
            <div className="flex flex-wrap gap-2">
              {fotos.map((url) => (
                <div key={url} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border group">
                  <img src={url} alt="Schade" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(url)}
                    className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-destructive/80 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-16 h-16 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center transition-colors"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : <Camera className="w-4 h-4 text-muted-foreground" />}
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <Button size="sm" onClick={handleAdd} disabled={createMut.isPending}>Opslaan</Button>
        </div>
      )}

      {isLoading ? <p className="text-sm text-muted-foreground">Laden...</p> : items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">Geen schaderapporten</p>
      ) : (
        items.map((item) => {
          const e = ernstLabels[item.ernst] || { label: item.ernst, color: "bg-muted text-muted-foreground" };
          return (
            <div key={item.id} className="p-3 rounded-lg bg-muted/50 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${e.color}`}>{e.label}</span>
                    <span className="text-sm font-medium text-foreground">{item.omschrijving}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.datum} • €{Number(item.kosten).toLocaleString("nl-NL")}
                    {item.locatie_schade ? ` • ${item.locatie_schade}` : ""}
                    {item.verzekerd ? " • ✓ verzekerd" : ""}
                    {item.hersteld ? " • ✓ hersteld" : " • ✗ niet hersteld"}
                  </p>
                </div>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => deleteMut.mutate({ id: item.id, voertuigId })}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              {item.fotos && item.fotos.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {item.fotos.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block w-20 h-20 rounded-lg overflow-hidden border border-border hover:ring-2 ring-primary transition-all">
                      <img src={url} alt={`Schade foto ${i + 1}`} className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
