import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  variant?: 'success' | 'info' | 'warning' | 'destructive' | 'primary' | 'muted';
}

const variantStyles: Record<string, string> = {
  success: "bg-success/15 text-success border-success/20",
  info: "bg-info/15 text-info border-info/20",
  warning: "bg-warning/15 text-warning border-warning/20",
  destructive: "bg-destructive/15 text-destructive border-destructive/20",
  primary: "bg-primary/15 text-primary border-primary/20",
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
