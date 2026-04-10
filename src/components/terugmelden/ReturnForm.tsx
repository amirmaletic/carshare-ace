import { useState } from "react";
import {
  Car, Upload, Gauge, FileText, Loader2, RotateCcw, Search, Image as ImageIcon, X, AlertTriangle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { VehicleDamageSketch, type DamagePoint } from "@/components/VehicleDamageSketch";

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
  fotos: File[];
  setFotos: (f: File[]) => void;
  schadePunten: DamagePoint[];
  setSchadePunten: (p: DamagePoint[]) => void;
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
  fotos,
  setFotos,
  schadePunten,
  setSchadePunten,
  uploading,
  onSubmit,
}: ReturnFormProps) {
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const handleFileChange = (f: File | null) => {
    setFile(f);
    if (f && f.type.startsWith("image/")) {
      const url = URL.createObjectURL(f);
      setFilePreview(url);
    } else {
      setFilePreview(null);
    }
  };

  const clearFile = () => {
    setFile(null);
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
              </div>
            )}
            <input
              id="bon-upload"
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={e => handleFileChange(e.target.files?.[0] || null)}
            />
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

          {/* Visuele schadeschets */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              Schadeschets (optioneel)
            </Label>
            <p className="text-xs text-muted-foreground">Klik op de auto-afbeelding om schade te markeren</p>
            <VehicleDamageSketch points={schadePunten} onChange={setSchadePunten} />
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

          {schadePunten.length > 0 && schadePunten.some(p => !p.label.trim()) && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" />
              Vul bij elke gemarkeerde schade een beschrijving in
            </p>
          )}

          <Button type="submit" disabled={uploading || !!kmError || !kilometerstand || (schadePunten.length > 0 && schadePunten.some(p => !p.label.trim()))} className="gap-2">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
            {uploading ? "Bezig met verwerken..." : "Terugmelden"}
          </Button>
        </form>
      )}
    </div>
  );
}
