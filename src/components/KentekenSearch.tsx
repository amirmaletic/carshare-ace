import { useState } from "react";
import { Search, Car, Loader2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useVoertuigen } from "@/hooks/useVoertuigen";
import { useAuth } from "@/hooks/useAuth";

interface RDWVehicleData {
  kenteken: string;
  merk: string;
  handelsbenaming: string;
  eerste_kleur: string;
  brandstof_omschrijving?: string;
  datum_eerste_toelating: string;
  vervaldatum_apk: string;
  cilinderinhoud?: string;
  aantal_zitplaatsen?: string;
  massa_rijklaar?: string;
  catalogusprijs?: string;
  vermogen_massarijklaar?: string;
  zuinigheidslabel?: string;
  inrichting?: string;
  voertuigsoort?: string;
  aantal_cilinders?: string;
  lengte?: string;
  breedte?: string;
  europese_voertuigcategorie?: string;
  taxi_indicator?: string;
  export_indicator?: string;
  wam_verzekerd?: string;
  vervaldatum_tachograaf?: string;
  tenaamstellen_mogelijk?: string;
}

interface RDWBrandstofData {
  kenteken: string;
  brandstof_omschrijving?: string;
  emissieklasse?: string;
  co2_uitstoot_gecombineerd?: string;
  brandstofverbruik_gecombineerd?: string;
  milieuklasse_eg_goedkeuring_zwaar?: string;
}

function formatKenteken(input: string): string {
  return input.replace(/[\s-]/g, "").toUpperCase();
}

function formatDate(dateStr: string): string {
  if (!dateStr || dateStr.length !== 8) return dateStr || "—";
  return `${dateStr.slice(6, 8)}-${dateStr.slice(4, 6)}-${dateStr.slice(0, 4)}`;
}

function displayKenteken(kenteken: string): string {
  if (kenteken.length === 6) {
    return `${kenteken.slice(0, 2)}-${kenteken.slice(2, 4)}-${kenteken.slice(4, 6)}`;
  }
  return kenteken;
}

export function KentekenSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [vehicleData, setVehicleData] = useState<RDWVehicleData | null>(null);
  const [brandstofData, setBrandstofData] = useState<RDWBrandstofData | null>(null);

  const handleSearch = async () => {
    const kenteken = formatKenteken(query);
    if (kenteken.length < 4) {
      toast.error("Voer een geldig kenteken in");
      return;
    }

    setLoading(true);
    setVehicleData(null);
    setBrandstofData(null);

    try {
      const [vehicleRes, brandstofRes] = await Promise.all([
        fetch(`https://opendata.rdw.nl/resource/m9d7-ebf2.json?kenteken=${kenteken}`),
        fetch(`https://opendata.rdw.nl/resource/8ys7-d773.json?kenteken=${kenteken}`),
      ]);

      const vehicles: RDWVehicleData[] = await vehicleRes.json();
      const brandstoffen: RDWBrandstofData[] = await brandstofRes.json();

      if (vehicles.length === 0) {
        toast.error("Geen voertuig gevonden voor dit kenteken");
        setLoading(false);
        return;
      }

      setVehicleData(vehicles[0]);
      if (brandstoffen.length > 0) {
        setBrandstofData(brandstoffen[0]);
      }
    } catch {
      toast.error("Fout bij ophalen voertuiggegevens");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const brandstof = brandstofData?.brandstof_omschrijving || vehicleData?.brandstof_omschrijving;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Search className="w-4 h-4" />
          RDW Kenteken zoeken
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="w-5 h-5 text-primary" />
            Kenteken opzoeken
          </DialogTitle>
        </DialogHeader>

        {/* Search bar */}
        <div className="flex gap-2 mt-2">
          <div className="relative flex-1">
            <Input
              placeholder="Bijv. AB-123-CD"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="uppercase font-mono tracking-wider"
            />
          </div>
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>

        {/* Results */}
        {vehicleData && (
          <div className="mt-4 space-y-4 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-sidebar text-sidebar-accent-foreground">
              <div className="p-3 bg-primary/20 rounded-lg">
                <Car className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-bold text-lg">
                  {vehicleData.merk} {vehicleData.handelsbenaming}
                </p>
                <p className="font-mono text-sm text-sidebar-foreground">
                  {displayKenteken(vehicleData.kenteken)}
                </p>
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-3">
              <InfoItem label="Voertuigsoort" value={vehicleData.voertuigsoort} />
              <InfoItem label="Inrichting" value={vehicleData.inrichting} />
              <InfoItem label="Kleur" value={vehicleData.eerste_kleur} />
              <InfoItem label="Brandstof" value={brandstof} />
              <InfoItem label="Eerste toelating" value={formatDate(vehicleData.datum_eerste_toelating)} />
              <InfoItem label="APK vervaldatum" value={formatDate(vehicleData.vervaldatum_apk)} />
              <InfoItem label="Cilinderinhoud" value={vehicleData.cilinderinhoud ? `${vehicleData.cilinderinhoud} cc` : undefined} />
              <InfoItem label="Aantal cilinders" value={vehicleData.aantal_cilinders} />
              <InfoItem label="Zitplaatsen" value={vehicleData.aantal_zitplaatsen} />
              <InfoItem label="Massa rijklaar" value={vehicleData.massa_rijklaar ? `${vehicleData.massa_rijklaar} kg` : undefined} />
              <InfoItem label="Catalogusprijs" value={vehicleData.catalogusprijs ? `€${Number(vehicleData.catalogusprijs).toLocaleString('nl-NL')}` : undefined} />
              <InfoItem label="Zuinigheidslabel" value={vehicleData.zuinigheidslabel} />
              <InfoItem label="WAM verzekerd" value={vehicleData.wam_verzekerd === "Ja" ? "✅ Ja" : vehicleData.wam_verzekerd} />
              <InfoItem label="Export indicator" value={vehicleData.export_indicator} />
              {brandstofData?.co2_uitstoot_gecombineerd && (
                <InfoItem label="CO₂ uitstoot" value={`${brandstofData.co2_uitstoot_gecombineerd} g/km`} />
              )}
              {brandstofData?.emissieklasse && (
                <InfoItem label="Emissieklasse" value={brandstofData.emissieklasse} />
              )}
            </div>

            {/* Add to fleet button */}
            <Button className="w-full gap-2 mt-2">
              <Plus className="w-4 h-4" />
              Toevoegen aan wagenpark
            </Button>
          </div>
        )}

        {!vehicleData && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            <Car className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Voer een kenteken in om voertuiggegevens op te halen via de RDW</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function InfoItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="p-2.5 rounded-lg bg-muted/50">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground mt-0.5">{value || "—"}</p>
    </div>
  );
}
