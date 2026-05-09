import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  className?: string;
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, className }: StatCardProps) {
  return (
    <div className={cn("premium-card p-5 animate-fade-in group", className)}>
      <div className="relative flex items-start justify-between mb-3">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/15 shadow-sm group-hover:shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.4)] transition-shadow">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        {trend && (
          <span className={cn(
            "text-xs font-semibold px-2 py-0.5 rounded-full backdrop-blur",
            trend.value >= 0 ? "bg-success/15 text-success border border-success/20" : "bg-destructive/15 text-destructive border border-destructive/20"
          )}>
            {trend.value >= 0 ? '+' : ''}{trend.value}%
          </span>
        )}
      </div>
      <p className="relative text-2xl font-bold tracking-tight text-foreground">{value}</p>
      <p className="relative text-sm text-muted-foreground mt-1">{title}</p>
      {subtitle && <p className="relative text-xs text-muted-foreground/70 mt-0.5">{subtitle}</p>}
    </div>
  );
}
