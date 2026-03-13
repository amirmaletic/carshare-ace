import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  variant?: 'success' | 'info' | 'warning' | 'destructive' | 'primary' | 'muted';
}

const variantStyles: Record<string, string> = {
  success: "bg-success/10 text-success border-success/15",
  info: "bg-info/10 text-info border-info/15",
  warning: "bg-warning/10 text-warning border-warning/15",
  destructive: "bg-destructive/10 text-destructive border-destructive/15",
  primary: "bg-primary/10 text-primary border-primary/15",
  muted: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ status, variant = 'muted' }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize",
        variantStyles[variant]
      )}
    >
      <span className={cn(
        "w-1.5 h-1.5 rounded-full",
        variant === 'success' && "bg-success",
        variant === 'info' && "bg-info",
        variant === 'warning' && "bg-warning",
        variant === 'destructive' && "bg-destructive",
        variant === 'primary' && "bg-primary",
        variant === 'muted' && "bg-muted-foreground",
      )} />
      {status}
    </span>
  );
}
