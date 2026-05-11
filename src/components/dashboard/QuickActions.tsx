import { useNavigate } from "react-router-dom";
import { CalendarPlus, Car, FileText, ShieldAlert, UserPlus, Wrench } from "lucide-react";

const actions = [
  { icon: CalendarPlus, label: "Nieuwe reservering", path: "/reserveringen?nieuw=1" },
  { icon: Car, label: "Voertuig toevoegen", path: "/voertuigen?nieuw=1" },
  { icon: FileText, label: "Contract opstellen", path: "/contracten?nieuw=1" },
  { icon: ShieldAlert, label: "Schade melden", path: "/terugmelden" },
  { icon: UserPlus, label: "Chauffeur toevoegen", path: "/chauffeurs?nieuw=1" },
  { icon: Wrench, label: "Onderhoud plannen", path: "/onderhoud" },
];

export function QuickActions() {
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
      {actions.map((a) => (
        <button
          key={a.label}
          onClick={() => navigate(a.path)}
          className="group flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-all text-left"
        >
          <div className="flex-shrink-0 w-10 h-10 rounded-lg border border-border bg-background flex items-center justify-center group-hover:border-primary/30 group-hover:bg-primary/10 transition-colors">
            <a.icon className="w-5 h-5 text-primary" />
          </div>
          <span className="text-sm font-medium text-foreground leading-tight">
            {a.label}
          </span>
        </button>
      ))}
    </div>
  );
}
