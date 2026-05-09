import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import type { DatatypeSpec } from "@/lib/migratie-types";

interface Props {
  spec: DatatypeSpec;
  headers: string[];
  mapping: Record<string, string | null>;
  onChange: (header: string, target: string | null) => void;
  aiSuggested?: Record<string, string | null>;
  confidence?: number;
}

export function ColumnMapper({ spec, headers, mapping, onChange, aiSuggested, confidence }: Props) {
  const usedTargets = new Set(Object.values(mapping).filter(Boolean) as string[]);
  const requiredCovered = spec.required.every((r) => usedTargets.has(r));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="font-medium">Kolommen koppelen</span>
          {confidence !== undefined && (
            <Badge variant="outline" className="text-xs">
              AI zekerheid: {Math.round(confidence * 100)}%
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          {requiredCovered ? (
            <><CheckCircle2 className="w-3.5 h-3.5 text-success" /><span className="text-success">Alle verplichte velden gekoppeld</span></>
          ) : (
            <><AlertCircle className="w-3.5 h-3.5 text-destructive" /><span className="text-destructive">Verplichte velden ontbreken</span></>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="p-2.5 text-left font-medium text-muted-foreground w-1/2">Kolom in bestand</th>
              <th className="p-2.5 text-left font-medium text-muted-foreground">Doelveld in FleeFlo</th>
            </tr>
          </thead>
          <tbody>
            {headers.map((h) => {
              const current = mapping[h];
              const aiHit = aiSuggested?.[h];
              return (
                <tr key={h} className="border-b border-border last:border-0">
                  <td className="p-2.5 font-mono text-xs">
                    <div className="flex items-center gap-2">
                      <span>{h}</span>
                      {aiHit && current === aiHit && (
                        <Sparkles className="w-3 h-3 text-primary" />
                      )}
                    </div>
                  </td>
                  <td className="p-2.5">
                    <Select value={current ?? "__skip"} onValueChange={(v) => onChange(h, v === "__skip" ? null : v)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        <SelectItem value="__skip">Negeren</SelectItem>
                        {spec.fields.map((f) => (
                          <SelectItem key={f.key} value={f.key} disabled={usedTargets.has(f.key) && current !== f.key}>
                            {f.label}{f.required ? " *" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-muted-foreground">
        Verplicht: {spec.required.map((r) => spec.fields.find((f) => f.key === r)?.label).join(", ")}
      </div>
    </div>
  );
}