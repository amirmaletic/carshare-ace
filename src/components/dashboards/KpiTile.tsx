import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { TrendBadge } from "./PeriodFilter";

interface KpiTileProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  subtitle?: string;
  current?: number;
  previous?: number;
  inverse?: boolean;
  className?: string;
}

export function KpiTile({ icon: Icon, title, value, subtitle, current, previous, inverse, className }: KpiTileProps) {
  return (
    <div className={cn("clean-card p-5", className)}>
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-lg bg-primary/8">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        {current !== undefined && previous !== undefined && (
          <TrendBadge current={current} previous={previous} inverse={inverse} />
        )}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground mt-1">{title}</p>
      {subtitle && <p className="text-xs text-muted-foreground/70 mt-0.5">{subtitle}</p>}
    </div>
  );
}
