import { useState } from "react";
import { Search, Plus, Filter, Car, Fuel, Gauge } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { vehicles, getStatusColor } from "@/data/mockData";
import { cn } from "@/lib/utils";

const categories = ['Alle', 'Stadsauto', 'SUV', 'Bestelwagen', 'Luxe', 'Elektrisch'] as const;

export default function Vehicles() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("Alle");

  const filtered = vehicles.filter(v => {
    const matchesSearch =
      v.kenteken.toLowerCase().includes(search.toLowerCase()) ||
      v.merk.toLowerCase().includes(search.toLowerCase()) ||
      v.model.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "Alle" || v.categorie === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Voertuigen</h1>
          <p className="text-muted-foreground mt-1">{vehicles.length} voertuigen in je vloot</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Voertuig toevoegen
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Zoek op kenteken, merk of model..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
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

      {/* Vehicle grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((vehicle, i) => (
          <div
            key={vehicle.id}
            className="glass-card rounded-xl overflow-hidden hover:shadow-md transition-shadow animate-fade-in"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            {/* Header with gradient */}
            <div className="h-28 bg-gradient-to-br from-sidebar to-sidebar-accent flex items-center justify-center">
              <Car className="w-12 h-12 text-sidebar-foreground/40" />
            </div>

            <div className="p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display font-semibold text-foreground">{vehicle.merk} {vehicle.model}</h3>
                  <p className="text-sm text-muted-foreground font-mono">{vehicle.kenteken}</p>
                </div>
                <StatusBadge status={vehicle.status} variant={getStatusColor(vehicle.status)} />
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border/50">
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
  );
}
