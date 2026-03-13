import { Car, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

interface Terugmelding {
  id: string;
  voertuig_id: string;
  voertuig_kenteken: string;
  voertuig_naam: string;
  kilometerstand: number;
  datum: string;
  bon_url: string | null;
  notitie: string | null;
  created_at: string;
  medewerker_email?: string | null;
}

interface Vehicle {
  id: string;
  label: string;
  kenteken: string;
  km: number;
}

interface RecentReturnsProps {
  terugmeldingen: Terugmelding[];
  allVehicles: Vehicle[];
  onSelectVehicle: (vehicle: Vehicle) => void;
  getMinKm: (vehicleId: string, baseKm: number) => number;
}

export default function RecentReturns({
  terugmeldingen,
  allVehicles,
  onSelectVehicle,
  getMinKm,
}: RecentReturnsProps) {
  const terugmeldingenByDate = terugmeldingen.reduce<Record<string, Terugmelding[]>>((acc, t) => {
    const dateKey = format(new Date(t.created_at), "yyyy-MM-dd");
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(t);
    return acc;
  }, {});

  const sortedDates = Object.keys(terugmeldingenByDate)
    .sort((a, b) => b.localeCompare(a))
    .slice(0, 7);

  if (sortedDates.length === 0) return null;

  const handleClick = (t: Terugmelding) => {
    const found = allVehicles.find(
      v => v.kenteken.replace(/[\s-]/g, "").toUpperCase() === t.voertuig_kenteken.replace(/[\s-]/g, "").toUpperCase()
    );
    if (found) onSelectVehicle(found);
  };

  return (
    <div className="clean-card overflow-hidden animate-fade-in">
      <div className="p-5 border-b border-border">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <Car className="w-5 h-5 text-primary" />
          Recent teruggekomen voertuigen
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">Klik om opnieuw terug te melden</p>
      </div>

      <div className="divide-y divide-border">
        {sortedDates.map(dateKey => (
          <div key={dateKey} className="p-4">
            <div className="flex items-center gap-2 mb-2.5">
              <Badge variant="secondary" className="text-xs font-medium capitalize">
                {format(new Date(dateKey), "EEEE", { locale: nl })}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {format(new Date(dateKey), "d MMMM yyyy", { locale: nl })}
              </span>
              <Badge variant="outline" className="ml-auto text-xs">
                {terugmeldingenByDate[dateKey].length} voertuig{terugmeldingenByDate[dateKey].length !== 1 ? "en" : ""}
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {terugmeldingenByDate[dateKey].map(t => (
                <button
                  key={t.id}
                  type="button"
                  className="group flex items-center gap-3 p-3 rounded-lg border border-border bg-background hover:bg-muted/60 hover:border-primary/20 transition-all text-left"
                  onClick={() => handleClick(t)}
                >
                  <div className="p-2 rounded-md bg-primary/10 group-hover:bg-primary/15 transition-colors">
                    <Car className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{t.voertuig_naam}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {t.voertuig_kenteken} · {(t.kilometerstand ?? 0).toLocaleString("nl-NL")} km
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
