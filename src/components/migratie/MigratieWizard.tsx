import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, Loader2, ArrowLeft, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOrganisatie } from "@/hooks/useOrganisatie";
import { FileDropzone, type ParsedSheet } from "./FileDropzone";
import { ColumnMapper } from "./ColumnMapper";
import {
  DATATYPES,
  type MigratieDatatype,
  type DatatypeSpec,
  normalizeRow,
  validateRow,
  insertRow,
  type InsertContext,
  normalizeKenteken,
} from "@/lib/migratie-types";
import { useQueryClient } from "@tanstack/react-query";

type Step = "upload" | "mapping" | "valideren" | "klaar";

interface Props {
  datatype: MigratieDatatype;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MigratieWizard({ datatype, open, onOpenChange }: Props) {
  const spec = DATATYPES[datatype];
  const { user } = useAuth();
  const { organisatieId } = useOrganisatie();
  const qc = useQueryClient();

  const [step, setStep] = useState<Step>("upload");
  const [sheet, setSheet] = useState<ParsedSheet | null>(null);
  const [mapping, setMapping] = useState<Record<string, string | null>>({});
  const [aiMapping, setAiMapping] = useState<Record<string, string | null>>({});
  const [aiConfidence, setAiConfidence] = useState<number | undefined>();
  const [aiLoading, setAiLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState<{ success: number; failed: { row: number; error: string }[] }>({ success: 0, failed: [] });

  const handleParsed = async (parsed: ParsedSheet) => {
    setSheet(parsed);
    setStep("mapping");
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("migration-automap", {
        body: {
          datatype,
          headers: parsed.headers,
          sample_rows: parsed.rows.slice(0, 5).map((r) => parsed.headers.map((h) => r[h])),
          target_fields: spec.fields.map((f) => ({ key: f.key, label: f.label, required: f.required })),
        },
      });
      if (error) throw error;
      const m = (data?.mapping ?? {}) as Record<string, string | null>;
      setAiMapping(m);
      setMapping(m);
      setAiConfidence(data?.confidence);
    } catch (e) {
      console.error("auto-map error", e);
      toast.error("Auto-mapping mislukt, koppel kolommen handmatig");
    } finally {
      setAiLoading(false);
    }
  };

  const validation = useMemo(() => {
    if (!sheet) return null;
    const normalized: Record<string, unknown>[] = [];
    const errors: { row: number; messages: string[] }[] = [];
    for (let i = 0; i < sheet.rows.length; i++) {
      const raw = sheet.rows[i];
      const mapped: Record<string, unknown> = {};
      for (const [header, target] of Object.entries(mapping)) {
        if (target) mapped[target] = raw[header];
      }
      const norm = normalizeRow(spec, mapped);
      const errs = validateRow(spec, norm);
      if (errs.length === 0) normalized.push(norm);
      else errors.push({ row: i + 2, messages: errs });
    }
    return { normalized, errors };
  }, [sheet, mapping, spec]);

  const handleImport = async () => {
    if (!validation || !user || !organisatieId) return;
    setImporting(true);
    setStep("valideren");
    setResults({ success: 0, failed: [] });
    setProgress({ done: 0, total: validation.normalized.length });

    // Build caches voor cross-references
    const ctx: InsertContext = {
      organisatieId,
      userId: user.id,
      voertuigByKenteken: new Map(),
      klantByEmail: new Map(),
    };
    if (datatype === "contracten" || datatype === "kilometer" || datatype === "schade") {
      const { data: vs } = await supabase.from("voertuigen").select("id, kenteken").eq("organisatie_id", organisatieId);
      vs?.forEach((v) => ctx.voertuigByKenteken.set(normalizeKenteken(v.kenteken), v.id));
    }
    if (datatype === "contracten") {
      const { data: ks } = await supabase.from("klanten").select("id, email").eq("organisatie_id", organisatieId);
      ks?.forEach((k) => ctx.klantByEmail.set((k.email ?? "").toLowerCase(), k.id));
    }

    let success = 0;
    const failed: { row: number; error: string }[] = [];
    for (let i = 0; i < validation.normalized.length; i++) {
      const r = validation.normalized[i];
      const res = await insertRow(datatype, r, ctx);
      if (res.success) success++;
      else failed.push({ row: i + 2, error: res.error ?? "Onbekend" });
      setProgress({ done: i + 1, total: validation.normalized.length });
    }
    setResults({ success, failed });
    setImporting(false);
    setStep("klaar");
    qc.invalidateQueries();
    if (success > 0) toast.success(`${success} ${spec.label.toLowerCase()} geïmporteerd`);
    if (failed.length > 0 && success === 0) toast.error(`Import mislukt: ${failed[0].error}`);
  };

  const reset = () => {
    setStep("upload");
    setSheet(null);
    setMapping({});
    setAiMapping({});
    setAiConfidence(undefined);
    setProgress({ done: 0, total: 0 });
    setResults({ success: 0, failed: [] });
  };

  const handleClose = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {spec.label} migreren
          </DialogTitle>
          <DialogDescription>{spec.beschrijving}</DialogDescription>
        </DialogHeader>

        {/* Stappen indicator */}
        <div className="flex items-center gap-2 text-xs">
          {(["upload", "mapping", "valideren", "klaar"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center font-semibold ${
                step === s ? "bg-primary text-primary-foreground" :
                ["upload","mapping","valideren","klaar"].indexOf(step) > i ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
              }`}>{i + 1}</div>
              <span className={step === s ? "font-medium" : "text-muted-foreground"}>
                {s === "upload" ? "Bestand" : s === "mapping" ? "Kolommen" : s === "valideren" ? "Importeren" : "Klaar"}
              </span>
              {i < 3 && <div className="w-4 h-px bg-border mx-1" />}
            </div>
          ))}
        </div>

        {step === "upload" && <FileDropzone onParsed={handleParsed} />}

        {step === "mapping" && sheet && (
          <div className="space-y-4">
            {aiLoading && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 flex items-center gap-2 text-sm">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span>AI analyseert je bestand en herkent kolommen...</span>
              </div>
            )}
            <ColumnMapper
              spec={spec}
              headers={sheet.headers}
              mapping={mapping}
              onChange={(h, t) => setMapping((prev) => ({ ...prev, [h]: t }))}
              aiSuggested={aiMapping}
              confidence={aiConfidence}
            />
            {validation && (
              <div className="flex items-center gap-3 text-sm">
                <Badge variant="outline" className="gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                  {validation.normalized.length} geldig
                </Badge>
                {validation.errors.length > 0 && (
                  <Badge variant="outline" className="gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                    {validation.errors.length} met fouten
                  </Badge>
                )}
              </div>
            )}
            {validation && validation.errors.length > 0 && (
              <div className="rounded-lg border border-border max-h-32 overflow-y-auto p-2 space-y-1 text-xs">
                {validation.errors.slice(0, 5).map((e, i) => (
                  <p key={i} className="text-destructive">Rij {e.row}: {e.messages.join(", ")}</p>
                ))}
                {validation.errors.length > 5 && (
                  <p className="text-muted-foreground">+ {validation.errors.length - 5} meer fouten</p>
                )}
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={reset} className="gap-1.5">
                <ArrowLeft className="w-4 h-4" /> Ander bestand
              </Button>
              <Button
                onClick={handleImport}
                disabled={!validation || validation.normalized.length === 0 || aiLoading}
                className="flex-1"
              >
                {validation?.normalized.length ?? 0} {spec.label.toLowerCase()} importeren
              </Button>
            </div>
          </div>
        )}

        {step === "valideren" && (
          <div className="space-y-4 py-8 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            <div>
              <p className="text-sm font-medium">Bezig met importeren...</p>
              <p className="text-xs text-muted-foreground mt-1">{progress.done} van {progress.total}</p>
            </div>
            <div className="w-full max-w-xs mx-auto h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${(progress.done / Math.max(progress.total, 1)) * 100}%` }} />
            </div>
          </div>
        )}

        {step === "klaar" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-success/30 bg-success/5 p-4 text-center">
              <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-2" />
              <p className="text-lg font-semibold">{results.success} geïmporteerd</p>
              {results.failed.length > 0 && (
                <p className="text-sm text-destructive mt-1">{results.failed.length} mislukt</p>
              )}
            </div>
            {results.failed.length > 0 && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 max-h-40 overflow-y-auto space-y-1 text-xs">
                {results.failed.slice(0, 10).map((f, i) => (
                  <p key={i} className="text-destructive">Rij {f.row}: {f.error}</p>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={reset} className="flex-1">Nog een import</Button>
              <Button onClick={() => handleClose(false)} className="flex-1">Klaar</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}