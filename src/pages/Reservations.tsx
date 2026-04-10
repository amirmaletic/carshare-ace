import { useState } from "react";
import { Search, Plus, CalendarRange } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { reservations, getVehicleById, getReservationStatusColor } from "@/data/mockData";

const statusFilters = ['Alle', 'actief', 'bevestigd', 'voltooid', 'geannuleerd'] as const;

export default function Reservations() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("Alle");

  const filtered = reservations.filter(r => {
    const vehicle = getVehicleById(r.voertuigId);
    const matchesSearch =
      r.klantNaam.toLowerCase().includes(search.toLowerCase()) ||
      r.klantEmail.toLowerCase().includes(search.toLowerCase()) ||
      (vehicle && vehicle.kenteken.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === "Alle" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reserveringen</h1>
          <p className="text-muted-foreground mt-1">{reservations.length} totale reserveringen</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nieuwe reservering
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Zoek op klant of kenteken..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {statusFilters.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                statusFilter === s ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="clean-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Klant</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Voertuig</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Periode</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Extras</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Totaal</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((r, i) => {
                const vehicle = getVehicleById(r.voertuigId);
                return (
                  <tr key={r.id} className="hover:bg-muted/50 transition-colors animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                    <td className="px-5 py-4">
                      <p className="font-medium text-sm text-foreground">{r.klantNaam}</p>
                      <p className="text-xs text-muted-foreground">{r.klantEmail}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-foreground">{vehicle?.merk} {vehicle?.model}</p>
                      <p className="text-xs text-muted-foreground font-mono">{vehicle?.kenteken}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-foreground">{r.startDatum}</p>
                      <p className="text-xs text-muted-foreground">t/m {r.eindDatum}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-1 flex-wrap">
                        {r.extras.length > 0 ? r.extras.map(e => (
                          <span key={e} className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground">{e}</span>
                        )) : <span className="text-xs text-muted-foreground">-</span>}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="font-medium text-foreground">€{r.totaalPrijs}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <StatusBadge status={r.status} variant={getReservationStatusColor(r.status)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <CalendarRange className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">Geen reserveringen gevonden</p>
          </div>
        )}
      </div>
    </div>
  );
}
