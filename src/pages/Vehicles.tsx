import { useState } from "react";
import { Search, Plus, Car, Fuel, Gauge, CalendarRange, X, List, MapPin } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { StatusBadge } from "@/components/StatusBadge";
import { KentekenSearch } from "@/components/KentekenSearch";
import { VehicleDetail } from "@/components/VehicleDetail";
import { VehicleForm } from "@/components/VehicleForm";
import { VehicleKanban } from "@/components/VehicleKanban";
import { vehicles as mockVehicles, reservations, getStatusColor, getVehicleImageUrl, type Vehicle } from "@/data/mockData";
import { useVoertuigen } from "@/hooks/useVoertuigen";
import { cn } from "@/lib/utils";

const categories = ['Alle', 'Stadsauto', 'SUV', 'Bestelwagen', 'Luxe', 'Elektrisch'] as const;

function isVehicleAvailable(vehicleId: string, from: Date, to: Date): boolean {
  return !reservations.some(r => {
    if (r.voertuigId !== vehicleId) return false;
    if (r.status === 'voltooid' || r.status === 'geannuleerd') return false;
    const rStart = new Date(r.startDatum);
    const rEnd = new Date(r.eindDatum);
    return rStart <= to && rEnd >= from;
  });
}

type ViewMode = "lijst" | "locaties";

export default function Vehicles() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("Alle");
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [viewMode, setViewMode] = useState<ViewMode>("lijst");

  const { voertuigen: dbVoertuigen } = useVoertuigen();

  const dbAsVehicles: Vehicle[] = dbVoertuigen.map((v) => ({
    id: v.id,
    kenteken: v.kenteken,
    merk: v.merk,
    model: v.model,
    bouwjaar: v.bouwjaar,
    brandstof: v.brandstof as Vehicle["brandstof"],
    kilometerstand: v.kilometerstand,
    status: v.status as Vehicle["status"],
    apkVervaldatum: v.apk_vervaldatum || "",
    verzekeringsVervaldatum: v.verzekering_vervaldatum || "",
    dagprijs: Number(v.dagprijs),
    categorie: v.categorie as Vehicle["categorie"],
    kleur: v.kleur,
  }));

  const allVehicles = [...mockVehicles, ...dbAsVehicles];
  const hasDateFilter = dateFrom && dateTo && dateFrom <= dateTo;

  const filtered = allVehicles.filter(v => {
    const matchesSearch =
      v.kenteken.toLowerCase().includes(search.toLowerCase()) ||
      v.merk.toLowerCase().includes(search.toLowerCase()) ||
      v.model.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "Alle" || v.categorie === activeCategory;
    const matchesAvailability = !hasDateFilter || (
      v.status !== 'onderhoud' && isVehicleAvailable(v.id, dateFrom, dateTo)
    );
    return matchesSearch && matchesCategory && matchesAvailability;
  });

  const openVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Voertuigen</h1>
            <p className="text-muted-foreground mt-1">{allVehicles.length} voertuigen in je vloot</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <KentekenSearch />
            <Button className="gap-2 w-full sm:w-auto" onClick={() => setFormOpen(true)}>
              <Plus className="w-4 h-4" />
              Voertuig toevoegen
            </Button>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-muted p-1 rounded-lg w-fit">
          <button
            onClick={() => setViewMode("lijst")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              viewMode === "lijst"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <List className="w-4 h-4" />
            Lijst
          </button>
          <button
            onClick={() => setViewMode("locaties")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              viewMode === "locaties"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MapPin className="w-4 h-4" />
            Locaties
          </button>
        </div>
      </div>

      {viewMode === "locaties" ? (
        <VehicleKanban onSelectVehicle={openVehicle} />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Zoek op kenteken, merk of model..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    activeCategory === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-accent"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Date range filter */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <CalendarRange className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Beschikbaar van</span>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("w-[150px] justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                  {dateFrom ? format(dateFrom, "d MMM yyyy", { locale: nl }) : "Startdatum"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className="p-3 pointer-events-auto" locale={nl} />
              </PopoverContent>
            </Popover>
            <span className="text-sm text-muted-foreground">t/m</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("w-[150px] justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                  {dateTo ? format(dateTo, "d MMM yyyy", { locale: nl }) : "Einddatum"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateTo} onSelect={setDateTo} disabled={(date) => dateFrom ? date < dateFrom : false} initialFocus className="p-3 pointer-events-auto" locale={nl} />
              </PopoverContent>
            </Popover>
            {hasDateFilter && (
              <Button variant="ghost" size="sm" onClick={() => { setDateFrom(undefined); setDateTo(undefined); }} className="gap-1 text-muted-foreground">
                <X className="w-3 h-3" />
                Wis periode
              </Button>
            )}
            {hasDateFilter && (
              <span className="text-sm text-muted-foreground ml-auto">{filtered.length} beschikbaar</span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((vehicle, i) => (
              <div
                key={vehicle.id}
                onClick={() => openVehicle(vehicle)}
                className="clean-card overflow-hidden hover:shadow-md transition-all cursor-pointer hover:-translate-y-0.5 animate-fade-in"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="h-36 bg-muted relative overflow-hidden">
                  <img
                    src={getVehicleImageUrl(vehicle.merk, vehicle.model)}
                    alt={`${vehicle.merk} ${vehicle.model}`}
                    className="absolute inset-0 w-full h-full object-contain object-center p-3"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                  <div className="absolute inset-0 items-center justify-center hidden">
                    <Car className="w-12 h-12 text-muted-foreground/40" />
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{vehicle.merk} {vehicle.model}</h3>
                      <p className="text-sm text-muted-foreground font-mono">{vehicle.kenteken}</p>
                    </div>
                    <StatusBadge status={vehicle.status} variant={getStatusColor(vehicle.status)} />
                  </div>
                  <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border">
                    <div className="text-center">
                      <Fuel className="w-3.5 h-3.5 text-muted-foreground mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">{vehicle.brandstof}</p>
                    </div>
                    <div className="text-center">
                      <Gauge className="w-3.5 h-3.5 text-muted-foreground mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">{(vehicle.kilometerstand / 1000).toFixed(0)}k km</p>
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-medium text-primary">€{vehicle.dagprijs}/dag</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12">
              <Car className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground">Geen voertuigen gevonden</p>
            </div>
          )}
        </div>
      )}

      <VehicleDetail vehicle={selectedVehicle} open={detailOpen} onOpenChange={setDetailOpen} />
      <VehicleForm open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
