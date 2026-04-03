import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, X, Download } from "lucide-react";
import { useVoertuigen } from "@/hooks/useVoertuigen";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ImportRow {
  kenteken: string;
  merk: string;
  model: string;
  bouwjaar: number;
  brandstof?: string;
  kilometerstand?: number;
  categorie?: string;
  kleur?: string;
  dagprijs?: number;
  locatie?: string;
}

interface ParsedResult {
  valid: ImportRow[];
  errors: { row: number; message: string }[];
}

const REQUIRED_FIELDS = ["kenteken", "merk", "model", "bouwjaar"];
const ALL_FIELDS = ["kenteken", "merk", "model", "bouwjaar", "brandstof", "kilometerstand", "categorie", "kleur", "dagprijs", "locatie"];

function parseCSV(text: string): ParsedResult {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { valid: [], errors: [{ row: 0, message: "Bestand bevat geen data" }] };

  const separator = lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(separator).map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));

  const missing = REQUIRED_FIELDS.filter((f) => !headers.includes(f));
  if (missing.length > 0) {
    return { valid: [], errors: [{ row: 0, message: `Verplichte kolommen ontbreken: ${missing.join(", ")}` }] };
  }

  const valid: ImportRow[] = [];
  const errors: { row: number; message: string }[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(separator).map((v) => v.trim().replace(/^["']|["']$/g, ""));
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => { obj[h] = values[idx] ?? ""; });

    const rowNum = i + 1;

    if (!obj.kenteken) { errors.push({ row: rowNum, message: "Kenteken ontbreekt" }); continue; }
    if (!obj.merk) { errors.push({ row: rowNum, message: "Merk ontbreekt" }); continue; }
    if (!obj.model) { errors.push({ row: rowNum, message: "Model ontbreekt" }); continue; }

    const bouwjaar = parseInt(obj.bouwjaar, 10);
    if (isNaN(bouwjaar) || bouwjaar < 1900 || bouwjaar > new Date().getFullYear() + 1) {
      errors.push({ row: rowNum, message: `Ongeldig bouwjaar: ${obj.bouwjaar}` });
      continue;
    }

    valid.push({
      kenteken: obj.kenteken.toUpperCase().replace(/[^A-Z0-9]/g, ""),
      merk: obj.merk.toUpperCase(),
      model: obj.model.toUpperCase(),
      bouwjaar,
      brandstof: obj.brandstof || "Benzine",
      kilometerstand: obj.kilometerstand ? parseInt(obj.kilometerstand, 10) || 0 : 0,
      categorie: obj.categorie || "Stadsauto",
      kleur: obj.kleur || "Zwart",
      dagprijs: obj.dagprijs ? parseFloat(obj.dagprijs) || 0 : 0,
      locatie: obj.locatie || null,
    });
  }

  return { valid, errors };
}

interface VehicleImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VehicleImport({ open, onOpenChange }: VehicleImportProps) {
  const { addVoertuig } = useVoertuigen();
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<ParsedResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState("");

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const text = await file.text();
    const result = parseCSV(text);
    setParsed(result);
  };

  const handleImport = async () => {
    if (!parsed || parsed.valid.length === 0) return;
    setImporting(true);

    let success = 0;
    let failed = 0;

    for (const row of parsed.valid) {
      try {
        await addVoertuig.mutateAsync({
          kenteken: row.kenteken,
          merk: row.merk,
          model: row.model,
          bouwjaar: row.bouwjaar,
          brandstof: row.brandstof || "Benzine",
          kilometerstand: row.kilometerstand || 0,
          categorie: row.categorie || "Stadsauto",
          kleur: row.kleur || "Zwart",
          dagprijs: row.dagprijs || 0,
          status: "beschikbaar",
          apk_vervaldatum: null,
          verzekering_vervaldatum: null,
          locatie: row.locatie || null,
        });
        success++;
      } catch {
        failed++;
      }
    }

    setImporting(false);
    toast.success(`${success} voertuig${success !== 1 ? "en" : ""} geïmporteerd${failed > 0 ? `, ${failed} mislukt` : ""}`);
    setParsed(null);
    setFileName("");
    onOpenChange(false);
  };

  const handleClose = () => {
    setParsed(null);
    setFileName("");
    onOpenChange(false);
  };

  const downloadTemplate = () => {
    const csv = [ALL_FIELDS.join(";"), "AB123CD;VOLKSWAGEN;POLO;2020;Benzine;50000;Stadsauto;Grijs;35;Gouda"].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "voertuigen_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Voertuigen importeren</DialogTitle>
          <DialogDescription>Upload een CSV-bestand met voertuiggegevens.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Required fields info */}
          <div className="rounded-lg border border-border p-3 space-y-2">
            <p className="text-sm font-medium text-foreground">Verplichte kolommen:</p>
            <div className="flex flex-wrap gap-1.5">
              {REQUIRED_FIELDS.map((f) => (
                <Badge key={f} variant="default" className="text-xs">{f}</Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Optioneel: brandstof, kilometerstand, categorie, kleur, dagprijs, locatie</p>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={downloadTemplate}>
              <Download className="w-3 h-3" /> Download template
            </Button>
          </div>

          {/* Upload area */}
          <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFile} />
          <button
            onClick={() => fileRef.current?.click()}
            className={cn(
              "w-full border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              "hover:border-primary hover:bg-primary/5",
              fileName ? "border-primary bg-primary/5" : "border-border"
            )}
          >
            {fileName ? (
              <div className="flex items-center justify-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-foreground">{fileName}</span>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Klik om een CSV-bestand te selecteren</p>
              </div>
            )}
          </button>

          {/* Results */}
          {parsed && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {parsed.valid.length > 0 && (
                  <div className="flex items-center gap-1.5 text-sm text-success">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{parsed.valid.length} geldig</span>
                  </div>
                )}
                {parsed.errors.length > 0 && (
                  <div className="flex items-center gap-1.5 text-sm text-destructive">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{parsed.errors.length} fout{parsed.errors.length !== 1 ? "en" : ""}</span>
                  </div>
                )}
              </div>

              {/* Preview valid rows */}
              {parsed.valid.length > 0 && (
                <div className="rounded-lg border border-border overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border">
                        <th className="p-2 text-left font-medium text-muted-foreground">Kenteken</th>
                        <th className="p-2 text-left font-medium text-muted-foreground">Merk</th>
                        <th className="p-2 text-left font-medium text-muted-foreground">Model</th>
                        <th className="p-2 text-left font-medium text-muted-foreground">Bouwjaar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsed.valid.slice(0, 10).map((r, i) => (
                        <tr key={i} className="border-b border-border last:border-0">
                          <td className="p-2 font-mono">{r.kenteken}</td>
                          <td className="p-2">{r.merk}</td>
                          <td className="p-2">{r.model}</td>
                          <td className="p-2">{r.bouwjaar}</td>
                        </tr>
                      ))}
                      {parsed.valid.length > 10 && (
                        <tr><td colSpan={4} className="p-2 text-center text-muted-foreground">+ {parsed.valid.length - 10} meer...</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Errors */}
              {parsed.errors.length > 0 && (
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {parsed.errors.slice(0, 5).map((err, i) => (
                    <p key={i} className="text-xs text-destructive">
                      Rij {err.row}: {err.message}
                    </p>
                  ))}
                  {parsed.errors.length > 5 && (
                    <p className="text-xs text-muted-foreground">+ {parsed.errors.length - 5} meer fouten...</p>
                  )}
                </div>
              )}

              <Button
                className="w-full"
                disabled={parsed.valid.length === 0 || importing}
                onClick={handleImport}
              >
                {importing ? "Importeren..." : `${parsed.valid.length} voertuig${parsed.valid.length !== 1 ? "en" : ""} importeren`}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}