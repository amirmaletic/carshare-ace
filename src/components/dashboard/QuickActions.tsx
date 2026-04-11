import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Car, FileText, RotateCcw, UserPlus, CalendarPlus, Wrench, Plus, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const actions = [
  { icon: Car, label: "Voertuig", sub: "toevoegen", path: "/voertuigen", gradient: "from-primary/20 to-primary/5", ring: "ring-primary/20", iconColor: "text-primary" },
  { icon: FileText, label: "Contract", sub: "aanmaken", path: "/contracten", gradient: "from-success/20 to-success/5", ring: "ring-success/20", iconColor: "text-success" },
  { icon: RotateCcw, label: "Terug-", sub: "melden", path: "/terugmelden", gradient: "from-warning/20 to-warning/5", ring: "ring-warning/20", iconColor: "text-warning" },
  { icon: UserPlus, label: "Chauffeur", sub: "toevoegen", path: "/chauffeurs", gradient: "from-info/20 to-info/5", ring: "ring-info/20", iconColor: "text-info" },
  { icon: CalendarPlus, label: "Rit", sub: "plannen", path: "/ritten", gradient: "from-primary/15 to-accent/10", ring: "ring-primary/15", iconColor: "text-primary" },
  { icon: Wrench, label: "Onderhoud", sub: "melden", path: "/onderhoud", gradient: "from-destructive/15 to-destructive/5", ring: "ring-destructive/15", iconColor: "text-destructive" },
];

export function QuickActions() {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const handleClick = (path: string, index: number) => {
    setActiveIndex(index);
    // Brief pulse animation before navigating
    setTimeout(() => {
      navigate(path);
      setActiveIndex(null);
    }, 150);
  };

  return (
    <div className="clean-card p-5 overflow-hidden relative">
      {/* Subtle grid background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
          backgroundSize: '20px 20px',
        }}
      />

      <div className="flex items-center gap-2 mb-4 relative">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <Plus className="w-4 h-4 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground text-sm tracking-tight">Snelacties</h3>
        <div className="flex-1" />
        <span className="text-[10px] text-muted-foreground/60 font-mono uppercase tracking-widest">Quick</span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 relative">
        {actions.map((a, i) => (
          <button
            key={a.label}
            onClick={() => handleClick(a.path, i)}
            className={cn(
              "group relative flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200",
              "hover:scale-[1.04] active:scale-95",
              "border border-transparent hover:border-border/60",
              "hover:shadow-md hover:shadow-primary/5",
              activeIndex === i && "scale-95 opacity-80"
            )}
          >
            {/* Glow backdrop on hover */}
            <div className={cn(
              "absolute inset-0 rounded-xl bg-gradient-to-b opacity-0 group-hover:opacity-100 transition-opacity duration-300",
              a.gradient
            )} />

            {/* Icon container */}
            <div className={cn(
              "relative z-10 p-2.5 rounded-xl bg-gradient-to-b transition-all duration-200",
              a.gradient,
              "ring-1 ring-inset",
              a.ring,
              "group-hover:ring-2 group-hover:shadow-lg group-hover:shadow-primary/5"
            )}>
              <a.icon className={cn("w-5 h-5 transition-transform duration-200 group-hover:scale-110", a.iconColor)} />
            </div>

            {/* Label */}
            <div className="relative z-10 text-center">
              <p className="text-[11px] font-semibold text-foreground leading-tight">{a.label}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{a.sub}</p>
            </div>

            {/* Hover arrow indicator */}
            <ArrowRight className="absolute top-2 right-2 w-3 h-3 text-muted-foreground/0 group-hover:text-muted-foreground/40 transition-all duration-200 group-hover:translate-x-0 -translate-x-1" />
          </button>
        ))}
      </div>
    </div>
  );
}
