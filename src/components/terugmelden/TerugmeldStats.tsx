import { Car, RotateCcw, Calendar, TrendingUp } from "lucide-react";
import { format, isToday, isThisWeek, isThisMonth } from "date-fns";
import { nl } from "date-fns/locale";

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

interface TerugmeldStatsProps {
  terugmeldingen: Terugmelding[];
}

export default function TerugmeldStats({ terugmeldingen }: TerugmeldStatsProps) {
  const validDates = terugmeldingen.filter(t => !isNaN(new Date(t.created_at).getTime()));
  const vandaag = validDates.filter(t => isToday(new Date(t.created_at))).length;
  const dezeWeek = validDates.filter(t => isThisWeek(new Date(t.created_at), { weekStartsOn: 1 })).length;
  const dezeMaand = validDates.filter(t => isThisMonth(new Date(t.created_at))).length;

  const uniqueVehicles = new Set(terugmeldingen.map(t => t.voertuig_id)).size;

  const stats = [
    { label: "Vandaag", value: vandaag, icon: RotateCcw, color: "text-primary" },
    { label: "Deze week", value: dezeWeek, icon: Calendar, color: "text-success" },
    { label: "Deze maand", value: dezeMaand, icon: TrendingUp, color: "text-warning" },
    { label: "Unieke voertuigen", value: uniqueVehicles, icon: Car, color: "text-info" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className="clean-card p-4 flex items-center gap-3 animate-fade-in"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="p-2.5 rounded-lg bg-muted">
            <stat.icon className={`w-4 h-4 ${stat.color}`} />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
