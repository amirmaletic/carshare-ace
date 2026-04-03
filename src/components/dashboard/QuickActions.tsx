import { useNavigate } from "react-router-dom";
import { Car, FileText, RotateCcw, UserPlus, CalendarPlus, Wrench } from "lucide-react";

const actions = [
  { icon: Car, label: "Voertuig toevoegen", path: "/vehicles", color: "bg-primary/10 text-primary" },
  { icon: FileText, label: "Contract aanmaken", path: "/contracts", color: "bg-success/10 text-success" },
  { icon: RotateCcw, label: "Terugmelden", path: "/terugmelden", color: "bg-warning/10 text-warning" },
  { icon: UserPlus, label: "Chauffeur toevoegen", path: "/chauffeurs", color: "bg-info/10 text-info" },
  { icon: CalendarPlus, label: "Rit plannen", path: "/ritten", color: "bg-accent/10 text-accent-foreground" },
  { icon: Wrench, label: "Onderhoud melden", path: "/maintenance", color: "bg-destructive/10 text-destructive" },
];

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="clean-card p-5">
      <h3 className="font-semibold text-foreground mb-3">Snelknoppen</h3>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {actions.map((a) => (
          <button
            key={a.label}
            onClick={() => navigate(a.path)}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-muted/50 transition-colors group"
          >
            <div className={`p-2.5 rounded-xl ${a.color} group-hover:scale-110 transition-transform`}>
              <a.icon className="w-5 h-5" />
            </div>
            <span className="text-xs text-muted-foreground font-medium text-center leading-tight">{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
