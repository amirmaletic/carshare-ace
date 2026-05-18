import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganisatie } from "@/hooks/useOrganisatie";
import { usePermissions } from "@/hooks/usePermissions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Sparkles, X } from "lucide-react";
import { useState } from "react";

const STEPS: { key: "bedrijf" | "voertuigen" | "team" | "modus"; label: string; sub: string }[] = [
  { key: "bedrijf",    label: "Bedrijfsgegevens",     sub: "KVK, logo, locaties, voorwaarden" },
  { key: "voertuigen", label: "Eerste voertuig",      sub: "RDW-lookup of bulk-import" },
  { key: "team",       label: "Team & integraties",   sub: "Collega's en koppelingen" },
  { key: "modus",      label: "Modus & klantportaal", sub: "Verhuur of wagenpark" },
];

interface Props {
  onResume: (step: "bedrijf" | "voertuigen" | "team" | "modus") => void;
}

export default function OnboardingChecklist({ onResume }: Props) {
  const { organisatieId } = useOrganisatie();
  const { isAdmin } = usePermissions();
  const [hidden, setHidden] = useState(false);

  const { data } = useQuery({
    queryKey: ["onboarding-state", organisatieId],
    enabled: !!organisatieId && isAdmin,
    queryFn: async () => {
      const { data } = await supabase.from("organisaties")
        .select("onboarding_steps_completed")
        .eq("id", organisatieId!).maybeSingle();
      return (data?.onboarding_steps_completed as Record<string, any>) || {};
    },
  });

  if (!isAdmin || hidden) return null;
  if (!data) return null;
  const open = STEPS.filter((s) => !data[s.key]);
  if (open.length === 0) return null;

  const total = STEPS.length;
  const done = total - open.length;

  return (
    <Card className="border-primary/30 bg-primary/[0.03]">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">Maak je setup af</p>
              <p className="text-xs text-muted-foreground">{done} van {total} stappen voltooid</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setHidden(true)}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 gap-2">
          {STEPS.map((s) => {
            const isDone = !!data[s.key];
            return (
              <button
                key={s.key}
                disabled={isDone}
                onClick={() => onResume(s.key)}
                className={`text-left rounded-lg border px-3 py-2.5 flex items-start gap-2.5 transition-colors ${
                  isDone ? "border-success/30 bg-success/5 cursor-default" : "border-border hover:bg-accent"
                }`}
              >
                {isDone
                  ? <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                  : <Circle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />}
                <div className="min-w-0">
                  <p className={`text-sm font-medium ${isDone ? "text-muted-foreground line-through" : ""}`}>{s.label}</p>
                  <p className="text-xs text-muted-foreground">{s.sub}</p>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}