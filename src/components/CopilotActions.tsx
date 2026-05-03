import { ChevronRight, Car } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface CopilotActionVehicle {
  id?: string;
  kenteken: string;
  label?: string;
  sub?: string;
  status?: string;
}

export interface CopilotActionPrimary {
  type: "reserveer" | "open_voertuig" | "link";
  href?: string;
  label: string;
  kenteken?: string;
  voertuig_id?: string;
  klant_id?: string;
  klant_naam?: string;
  start_datum?: string;
  eind_datum?: string;
}

export interface CopilotActionsData {
  intro?: string;
  vehicles?: CopilotActionVehicle[];
  primary?: CopilotActionPrimary;
}

interface Props {
  data: CopilotActionsData;
  onOpenVehicle: (v: CopilotActionVehicle) => void;
  onPrimary: (p: CopilotActionPrimary) => void;
}

export function CopilotActions({ data, onOpenVehicle, onPrimary }: Props) {
  return (
    <div className="space-y-2 mt-2">
      {data.intro && (
        <p className="text-sm text-foreground">{data.intro}</p>
      )}
      {data.vehicles && data.vehicles.length > 0 && (
        <div className="space-y-1.5">
          {data.vehicles.map((v, i) => (
            <button
              key={`${v.kenteken}-${i}`}
              onClick={() => onOpenVehicle(v)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-background border border-border hover:border-primary/40 hover:bg-accent/40 transition-colors text-left group"
            >
              <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-yellow-300 text-black font-mono text-xs font-bold tracking-wider whitespace-nowrap">
                {v.kenteken}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {v.label || (
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Car className="w-3 h-3" /> Voertuig
                    </span>
                  )}
                </p>
                {v.sub && (
                  <p className="text-xs text-muted-foreground truncate">{v.sub}</p>
                )}
              </div>
              {v.status && (
                <span className="text-xs text-emerald-600 font-medium whitespace-nowrap">
                  · {v.status}
                </span>
              )}
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
            </button>
          ))}
        </div>
      )}
      {data.primary && (
        <div className="pt-1">
          <Button
            onClick={() => onPrimary(data.primary!)}
            className="w-full"
            size="sm"
          >
            {data.primary.label}
          </Button>
        </div>
      )}
    </div>
  );
}

const ACTION_REGEX = /\[\[fleeflo:actions\s*([\s\S]*?)\]\]/;

export function parseCopilotMessage(content: string): {
  text: string;
  actions: CopilotActionsData | null;
} {
  const match = content.match(ACTION_REGEX);
  if (!match) return { text: content, actions: null };
  const text = content.replace(ACTION_REGEX, "").trim();
  try {
    const json = JSON.parse(match[1].trim());
    return { text, actions: json };
  } catch {
    return { text: content, actions: null };
  }
}