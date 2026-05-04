import { useState } from "react";
import {
  Car, Upload, Gauge, FileText, Loader2, RotateCcw, Search, Image as ImageIcon, X, AlertTriangle, ShieldCheck, Fuel, Sparkles, Euro,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { VehicleDamageSketch, type DamagePoint } from "@/components/VehicleDamageSketch";
import { KentekenScanner } from "@/components/KentekenScanner";
import { VehicleSchadeOverzicht } from "@/components/VehicleSchadeOverzicht";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BonAnalyse {
  liters: number | null;
  brandstof: string | null;
  bedrag: number | null;
  btw: number | null;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // strip data: prefix
      const idx = result.indexOf(",");
      resolve(idx >= 0 ? result.slice(idx + 1) : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface MatchedVehicle {
  id: string;
  label: string;
  kenteken: string;
  laatsteKm: number;
}

interface ReturnFormProps {
  kentekenQuery: string;
  setKentekenQuery: (v: string) => void;
  matchedVehicle: MatchedVehicle | null;
  onSearch: () => void;
  kilometerstand: string;
  onKmChange: (v: string) => void;
  kmError: string;
  notitie: string;
  setNotitie: (v: string) => void;
  file: File | null;
  setFile: (f: File | null) => void;
  bonAnalyse: BonAnalyse | null;
  setBonAnalyse: (b: BonAnalyse | null) => void;
  fotos: File[];
  setFotos: (f: File[]) => void;
  schadePunten: DamagePoint[];
  setSchadePunten: (p: DamagePoint[]) => void;
  schadevrij: boolean;
  setSchadevrij: (v: boolean) => void;
  uploading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export default function ReturnForm({
  kentekenQuery,
  setKentekenQuery,
  matchedVehicle,
  onSearch,
  kilometerstand,
  onKmChange,
  kmError,
  notitie,
  setNotitie,
  file,
  setFile,
  bonAnalyse,
  setBonAnalyse,
  fotos,
  setFotos,
  schadePunten,
  setSchadePunten,
  schadevrij,
  setSchadevrij,
  uploading,
  onSubmit,
}: ReturnFormProps) {
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const handleFileChange = async (f: File | null) => {
    setFile(f);
    setBonAnalyse(null);
    if (f && f.type.startsWith("image/")) {
      const url = URL.createObjectURL(f);
      setFilePreview(url);
      analyzeBon(f);
    } else {
      setFilePreview(null);
    }
  };

  const analyzeBon = async (f: File) => {
    try {
      setAnalyzing(true);
      const base64 = await fileToBase64(f);
      const { data, error } = await supabase.functions.invoke("analyze-bon", {
        body: { image_base64: base64 },
      });
      if (error) throw error;
      if (data?.result) {
        const r = data.result;
        setBonAnalyse({
          liters: typeof r.liters === "number" ? r.liters : null,
          brandstof: r.brandstof || null,
          bedrag: typeof r.bedrag === "number" ? r.bedrag : null,
          btw: typeof r.btw === "number" ? r.btw : null,
        });
        toast.success("Bon geanalyseerd");
      }
    } catch (err: any) {
      toast.error("Kon bon niet automatisch lezen", { description: err.message });
    } finally {
      setAnalyzing(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setBonAnalyse(null);
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFilePreview(null);
  };

  return (
    <div className="clean-card p-6 space-y-5 animate-fade-in">
      <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <Search className="w-5 h-5 text-primary" />
        Voertuig zoeken op kenteken
      </h2>

      <div className="flex gap-2 max-w-md">
        <Input
          placeholder="Bijv. AB-123-CD"
          value={kentekenQuery}
          onChange={e => setKentekenQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && (e.preventDefault(), onSearch())}
          className="uppercase font-mono tracking-wider"
        />
        <KentekenScanner
          iconOnly
          onDetected={(k) => { setKentekenQuery(k); setTimeout(onSearch, 50); }}
        />
        <Button type="button" onClick={onSearch}>
          <Search className="w-4 h-4" />
        </Button>
      </div>

      {matchedVehicle && (
        <form onSubmit={onSubmit} className="space-y-4 animate-fade-in">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 border border-border">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Car className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">{matchedVehicle.label}</p>
              <p className="text-sm text-muted-foreground font-mono">{matchedVehicle.kenteken}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Laatste km-stand: {matchedVehicle.laatsteKm.toLocaleString("nl-NL")} km
              </p>
            </div>
          </div>

          {/* Kilometerstand */}
          <div className="space-y-2 max-w-md">
            <Label>Kilometerstand *</Label>
            <div className="relative">
              <Gauge className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="number"
                placeholder={`Min. ${matchedVehicle.laatsteKm.toLocaleString("nl-NL")}`}
                value={kilometerstand}
                onChange={e => onKmChange(e.target.value)}
                className={cn("pl-10", kmError && "border-destructive focus-visible:ring-destructive")}
                min={matchedVehicle.laatsteKm}
                max={999999}
                required
              />
            </div>
            {kmError && <p className="text-xs text-destructive">{kmError}</p>}
          </div>

          {/* Receipt upload with preview */}
          <div className="space-y-2">
            <Label>Bon uploaden</Label>
            {file && filePreview ? (
              <div className="relative rounded-lg border border-primary/30 bg-primary/5 p-3 animate-fade-in">
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); clearFile(); }}
                  className="absolute top-2 right-2 p-1 rounded-full bg-background/80 hover:bg-background border border-border shadow-sm transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                <div className="flex items-start gap-3">
                  <img
                    src={filePreview}
                    alt="Bon preview"
                    className="w-20 h-20 object-cover rounded-md border border-border"
                  />
                  <div className="pt-1">
                    <p className="text-sm font-medium text-foreground truncate max-w-[200px]">{file.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {(file.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                </div>
              </div>
            ) : file ? (
              <div className="flex items-center gap-3 p-3 rounded-lg border border-primary/30 bg-primary/5 animate-fade-in">
                <FileText className="w-5 h-5 text-primary shrink-0" />
                <span className="text-sm font-medium text-foreground truncate">{file.name}</span>
                <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(0)} KB)</span>
                <Button type="button" variant="ghost" size="sm" className="ml-auto" onClick={clearFile}>
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <div
                className="relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer border-border hover:border-primary/30 hover:bg-muted/50"
                onClick={() => document.getElementById("bon-upload")?.click()}
              >
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Klik om een bon te uploaden</p>
                <p className="text-xs text-muted-foreground mt-1">Afbeelding of PDF · max 10 MB</p>
                <p className="text-[11px] text-primary mt-1 flex items-center justify-center gap-1">
                  <Sparkles className="w-3 h-3" /> AI leest liters, brandstof en bedrag automatisch
                </p>
              </div>
            )}
            <input
              id="bon-upload"
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={e => handleFileChange(e.target.files?.[0] || null)}
            />

            {/* Bon analyse */}
            {(analyzing || bonAnalyse) && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 animate-fade-in space-y-3">
                <div className="flex items-center gap-2 text-xs font-medium text-primary">
                  {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  {analyzing ? "Bon wordt gelezen..." : "Automatisch herkend (pas aan indien nodig)"}
                </div>
                {bonAnalyse && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <Label className="text-[11px] flex items-center gap-1 mb-1">
                        <Fuel className="w-3 h-3" /> Liters
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={bonAnalyse.liters ?? ""}
                        onChange={(e) => setBonAnalyse({ ...bonAnalyse, liters: e.target.value ? parseFloat(e.target.value) : null })}
                        placeholder="0"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] mb-1 block">Brandstof</Label>
                      <select
                        value={bonAnalyse.brandstof ?? ""}
                        onChange={(e) => setBonAnalyse({ ...bonAnalyse, brandstof: e.target.value || null })}
                        className="w-full h-8 rounded-md border border-input bg-background px-2 text-sm"
                      >
                        <option value="">Onbekend</option>
                        <option value="Benzine">Benzine</option>
                        <option value="Diesel">Diesel</option>
                        <option value="LPG">LPG</option>
                        <option value="Elektrisch">Elektrisch</option>
                        <option value="AdBlue">AdBlue</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-[11px] flex items-center gap-1 mb-1">
                        <Euro className="w-3 h-3" /> Totaal
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={bonAnalyse.bedrag ?? ""}
                        onChange={(e) => setBonAnalyse({ ...bonAnalyse, bedrag: e.target.value ? parseFloat(e.target.value) : null })}
                        placeholder="0,00"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] flex items-center gap-1 mb-1">
                        <Euro className="w-3 h-3" /> BTW
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={bonAnalyse.btw ?? ""}
                        onChange={(e) => setBonAnalyse({ ...bonAnalyse, btw: e.target.value ? parseFloat(e.target.value) : null })}
                        placeholder="0,00"
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                )}
                {bonAnalyse?.bedrag != null && (
                  <div className="rounded-md border border-border bg-background/60 p-2 text-xs space-y-1">
                    <div className="flex justify-between"><span className="text-muted-foreground">Brandstof (incl. BTW)</span><span className="font-mono">€ {bonAnalyse.bedrag.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Aftankkosten</span><span className="font-mono">€ 7,50</span></div>
                    <div className="flex justify-between font-medium border-t border-border pt-1"><span>Te verrekenen met borg</span><span className="font-mono text-primary">€ {(bonAnalyse.bedrag + 7.5).toFixed(2)}</span></div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Schadefoto's upload */}
          <div className="space-y-2">
            <Label>Schadefoto's (optioneel)</Label>
            <div
              className="relative border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer border-border hover:border-primary/30 hover:bg-muted/50"
              onClick={() => document.getElementById("fotos-upload")?.click()}
            >
              <ImageIcon className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
              <p className="text-sm text-muted-foreground">Klik om foto's toe te voegen</p>
              <p className="text-xs text-muted-foreground mt-0.5">Max 5 afbeeldingen</p>
            </div>
            <input
              id="fotos-upload"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={e => {
                const files = Array.from(e.target.files || []).slice(0, 5 - fotos.length);
                if (files.length > 0) setFotos([...fotos, ...files].slice(0, 5));
                e.target.value = "";
              }}
            />
            {fotos.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-2">
                {fotos.map((foto, i) => (
                  <div key={i} className="relative group rounded-lg overflow-hidden border border-border">
                    <img
                      src={URL.createObjectURL(foto)}
                      alt={`Foto ${i + 1}`}
                      className="w-full h-20 object-cover"
                    />
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setFotos(fotos.filter((_, j) => j !== i)); }}
                      className="absolute top-1 right-1 p-0.5 rounded-full bg-background/80 hover:bg-background border border-border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Schade sectie */}
          <div className="space-y-3">
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-warning" />
                <Label className="font-medium">Reeds bekende schade</Label>
              </div>
              <VehicleSchadeOverzicht
                voertuigId={matchedVehicle.id}
                kenteken={matchedVehicle.kenteken}
              />
            </div>

            <div className={cn(
              "flex items-start gap-3 p-4 rounded-xl border transition-colors",
              schadevrij ? "border-green-500/30 bg-green-50/50 dark:bg-green-950/20" : "border-border bg-muted/30"
            )}>
              <Checkbox
                id="schadevrij"
                checked={schadevrij}
                onCheckedChange={(checked) => {
                  setSchadevrij(!!checked);
                  if (checked) setSchadePunten([]);
                }}
                className="mt-0.5"
              />
              <div className="flex-1">
                <Label htmlFor="schadevrij" className="flex items-center gap-2 cursor-pointer font-medium">
                  <ShieldCheck className="w-4 h-4 text-green-600" />
                  Geen nieuwe schade waargenomen
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Vink aan om te bevestigen dat er geen nieuwe schade is geconstateerd
                </p>
              </div>
            </div>

            {!schadevrij && (
              <>
                <Label className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  Schadeschets
                </Label>
                <p className="text-xs text-muted-foreground">Markeer de schade op de auto, of vink hierboven aan dat er geen schade is</p>
                <VehicleDamageSketch points={schadePunten} onChange={setSchadePunten} />
              </>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notitie (optioneel)</Label>
            <Textarea
              placeholder="Opmerkingen bij terugmelding..."
              value={notitie}
              onChange={e => setNotitie(e.target.value)}
              rows={2}
              maxLength={500}
            />
            {notitie.length > 0 && (
              <p className="text-xs text-muted-foreground text-right">{notitie.length}/500</p>
            )}
          </div>

          {!schadevrij && schadePunten.length === 0 && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" />
              Markeer schade op de schets of vink 'schadevrij' aan
            </p>
          )}

          {!schadevrij && schadePunten.length > 0 && schadePunten.some(p => !p.label.trim()) && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" />
              Vul bij elke gemarkeerde schade een beschrijving in
            </p>
          )}

          <Button type="submit" disabled={
            uploading || !!kmError || !kilometerstand ||
            (!schadevrij && schadePunten.length === 0) ||
            (!schadevrij && schadePunten.some(p => !p.label.trim()))
          } className="gap-2">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
            {uploading ? "Bezig met verwerken..." : "Terugmelden"}
          </Button>
        </form>
      )}
    </div>
  );
}
