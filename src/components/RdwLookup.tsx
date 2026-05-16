import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search, Loader2, Car } from "lucide-react";

export interface RdwVehicleInfo {
  kenteken: string;
  merk: string;
  model: string;
  brandstof: string;
  kleur: string;
  apkVervaldatum: string;
  catalogusprijs: string;
  co2: string;
}

function formatKenteken(input: string): string {
  return input.replace(/[\s-]/g, "").toUpperCase();
}

function formatDate(dateStr: string): string {
  if (!dateStr || dateStr.length !== 8) return dateStr || "-";
  return `${dateStr.slice(6, 8)}-${dateStr.slice(4, 6)}-${dateStr.slice(0, 4)}`;
}

interface RdwLookupProps {
  onVehicleFound?: (info: RdwVehicleInfo) => void;
}

export function RdwLookup({ onVehicleFound }: RdwLookupProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RdwVehicleInfo | null>(null);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    const kenteken = formatKenteken(query);
    if (kenteken.length < 4) { setError("Voer een geldig kenteken in"); return; }
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const [vRes, bRes] = await Promise.all([
        fetch(`https://opendata.rdw.nl/resource/m9d7-ebf2.json?kenteken=${kenteken}`),
        fetch(`https://opendata.rdw.nl/resource/8ys7-d773.json?kenteken=${kenteken}`),
      ]);
      const vehicles = await vRes.json();
      const brandstoffen = await bRes.json();

      if (vehicles.length === 0) { setError("Geen voertuig gevonden"); setLoading(false); return; }

      const v = vehicles[0];
      const b = brandstoffen[0] || {};
      const info: RdwVehicleInfo = {
        kenteken: v.kenteken,
        merk: v.merk || "",
        model: v.handelsbenaming || "",
        brandstof: b.brandstof_omschrijving || v.brandstof_omschrijving || "",
        kleur: v.eerste_kleur || "",
        apkVervaldatum: formatDate(v.vervaldatum_apk),
        catalogusprijs: v.catalogusprijs ? `€${Number(v.catalogusprijs).toLocaleString("nl-NL")}` : "-",
        co2: b.co2_uitstoot_gecombineerd ? `${b.co2_uitstoot_gecombineerd} g/km` : "-",
      };
      setResult(info);
      onVehicleFound?.(info);
    } catch {
      setError("Fout bij ophalen RDW data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>Kenteken opzoeken (RDW)</Label>
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
          placeholder="AB-123-CD"
          className="uppercase font-mono tracking-wider flex-1"
        />
        <Button type="button" size="icon" variant="outline" onClick={handleSearch} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {result && (
        <div className="p-3 rounded-lg bg-muted/50 space-y-1 animate-fade-in">
          <div className="flex items-center gap-2 mb-1">
            <Car className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">{result.merk} {result.model}</span>
            <span className="text-xs text-muted-foreground font-mono">{result.kenteken}</span>
          </div>
          <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
            <span>Brandstof: {result.brandstof}</span>
            <span>Kleur: {result.kleur}</span>
            <span>APK: {result.apkVervaldatum}</span>
            <span>Prijs: {result.catalogusprijs}</span>
            <span>CO₂: {result.co2}</span>
          </div>
        </div>
      )}
    </div>
  );
}
