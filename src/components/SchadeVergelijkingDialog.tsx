import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, CheckCircle2, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SchadeVergelijking } from "@/hooks/useSchadeVergelijking";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vergelijking: SchadeVergelijking | null;
  isLoading: boolean;
  ophaalAanwezig: boolean;
  onClose: () => void;
}

const ernstColor = {
  licht: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
  middel: "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30",
  zwaar: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
} as const;

export function SchadeVergelijkingDialog({ open, onOpenChange, vergelijking, isLoading, ophaalAanwezig, onClose }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI schade-vergelijking
          </DialogTitle>
          <DialogDescription>
            Resultaat van vergelijking tussen ophaal- en inlever-inspectie
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">AI vergelijkt foto's en schadepunten...</p>
            <p className="text-xs text-muted-foreground">Dit kan 10 tot 30 seconden duren</p>
          </div>
        )}

        {!isLoading && vergelijking && (
          <div className="space-y-4">
            {!ophaalAanwezig && (
              <div className="p-3 rounded-lg border border-warning/40 bg-warning/10 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                <p className="text-xs text-foreground">
                  Geen ondertekende ophaal-overdracht gevonden voor dit voertuig. AI vergeleek alleen op de inlever-inspectie zonder referentie.
                </p>
              </div>
            )}

            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm text-foreground font-medium">{vergelijking.ai_resultaat.samenvatting}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                Nieuwe schades ({vergelijking.ai_resultaat.nieuwe_schades.length})
              </h3>
              {vergelijking.ai_resultaat.nieuwe_schades.length === 0 ? (
                <div className="p-3 rounded-lg border border-success/40 bg-success/10 text-sm text-foreground flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  Geen nieuwe schade gedetecteerd
                </div>
              ) : (
                <div className="space-y-2">
                  {vergelijking.ai_resultaat.nieuwe_schades.map((s, i) => (
                    <div key={i} className="p-3 rounded-lg border border-border bg-card space-y-1.5">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="text-sm font-medium text-foreground">{s.locatie}</p>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px]">{s.type}</Badge>
                          <Badge className={cn("text-[10px] border", ernstColor[s.ernst])}>{s.ernst}</Badge>
                          <Badge variant="secondary" className="text-[10px]">
                            {Math.round(s.confidence * 100)}% zeker
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{s.uitleg}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {vergelijking.ai_resultaat.reeds_bestaande.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  Reeds bestaande schade ({vergelijking.ai_resultaat.reeds_bestaande.length})
                </h3>
                <div className="space-y-1.5">
                  {vergelijking.ai_resultaat.reeds_bestaande.map((s, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                      {s.uitleg}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button onClick={onClose}>Sluiten</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
