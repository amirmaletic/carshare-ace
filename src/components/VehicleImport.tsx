import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, X, Download, Search, Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

function formatKenteken(input: string): string {
  return input.replace(/[\s-]/g, "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

const BRANDSTOF_MAP: Record<string, string> = {
  "Benzine": "Benzine",
  "Diesel": "Diesel",
  "Elektriciteit": "Elektrisch",
  "LPG": "LPG",
  "CNG": "CNG",
  "Waterstof": "Waterstof",
};

async function fetchRdwVehicle(kenteken: string): Promise<ImportRow | null> {
  const [vehicleRes, brandstofRes] = await Promise.all([
    fetch(`https://opendata.rdw.nl/resource/m9d7-ebf2.json?kenteken=${kenteken}`),
    fetch(`https://opendata.rdw.nl/resource/8ys7-d773.json?kenteken=${kenteken}`),
  ]);
  const vehicles = await vehicleRes.json();
  const brandstoffen = await brandstofRes.json();
  if (!Array.isArray(vehicles) || vehicles.length === 0) return null;
  const v = vehicles[0];
  const b = Array.isArray(brandstoffen) && brandstoffen.length > 0 ? brandstoffen[0] : null;
  const bouwjaarStr: string = v.datum_eerste_toelating || "";
  const bouwjaar = bouwjaarStr.length >= 4 ? parseInt(bouwjaarStr.slice(0, 4), 10) : new Date().getFullYear();
  const rawBrandstof = b?.brandstof_omschrijving || v.brandstof_omschrijving || "Benzine";
  const brandstof = BRANDSTOF_MAP[rawBrandstof] || "Benzine";
  return {
    kenteken: v.kenteken,
    merk: (v.merk || "").toUpperCase(),
    model: (v.handelsbenaming || "").toUpperCase(),
    bouwjaar,
    brandstof,
    kilometerstand: 0,
    categorie: brandstof === "Elektrisch" ? "Elektrisch" : "Stadsauto",
    kleur: v.eerste_kleur || "Onbekend",
    dagprijs: 0,
  };
}

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
  const { addVoertuig, voertuigen } = useVoertuigen();
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<ParsedResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState("");
  const [tab, setTab] = useState<"kenteken" | "csv">("kenteken");
  const [kentekenInput, setKentekenInput] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupProgress, setLookupProgress] = useState({ done: 0, total: 0 });
  const [importProgress, setImportProgress] = useState({ done: 0, total: 0 });
  const [importErrors, setImportErrors] = useState<{ kenteken: string; message: string }[]>([]);
  const [bulkDagprijs, setBulkDagprijs] = useState<string>("");

  const handleKentekenLookup = async () => {
    const lines = kentekenInput
      .split(/[\n,;]+/)
      .map((l) => formatKenteken(l))
      .filter((l) => l.length >= 4);
    const unique = Array.from(new Set(lines));
    if (unique.length === 0) {
      toast.error("Voer minstens één kenteken in");
      return;
    }
    setLookingUp(true);
    setLookupProgress({ done: 0, total: unique.length });
    const valid: ImportRow[] = [];
    const errors: { row: number; message: string }[] = [];
    for (let i = 0; i < unique.length; i++) {
      const k = unique[i];
      try {
        const row = await fetchRdwVehicle(k);
        if (!row) {
          errors.push({ row: i + 1, message: `${k}: niet gevonden bij RDW` });
        } else if (!row.merk || !row.model) {
          errors.push({ row: i + 1, message: `${k}: onvolledige RDW-gegevens` });
        } else {
          valid.push(row);
        }
      } catch {
        errors.push({ row: i + 1, message: `${k}: fout bij ophalen` });
      }
      setLookupProgress({ done: i + 1, total: unique.length });
    }
    setParsed({ valid, errors });
    setLookingUp(false);
    if (bulkDagprijs && !isNaN(parseFloat(bulkDagprijs))) {
      const prijs = parseFloat(bulkDagprijs);
      valid.forEach((r) => { r.dagprijs = prijs; });
      setParsed({ valid: [...valid], errors });
    }
    if (valid.length > 0) {
      toast.success(`${valid.length} kenteken${valid.length !== 1 ? "s" : ""} opgehaald via RDW`);
    }
  };

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
    setImportErrors([]);
    setImportProgress({ done: 0, total: parsed.valid.length });

    let success = 0;
    const failures: { kenteken: string; message: string }[] = [];
    const existingKentekens = new Set(
      (voertuigen ?? []).map((v) => (v.kenteken || "").toUpperCase().replace(/[^A-Z0-9]/g, ""))
    );

    for (let i = 0; i < parsed.valid.length; i++) {
      const row = parsed.valid[i];
      const cleanKenteken = (row.kenteken || "").toUpperCase().replace(/[^A-Z0-9]/g, "");

      if (existingKentekens.has(cleanKenteken)) {
        failures.push({ kenteken: row.kenteken, message: "Bestaat al in je vloot" });
        setImportProgress({ done: i + 1, total: parsed.valid.length });
        continue;
      }

      try {
        await addVoertuig.mutateAsync({
          kenteken: cleanKenteken,
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
        existingKentekens.add(cleanKenteken);
        success++;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Onbekende fout";
        failures.push({ kenteken: row.kenteken, message: msg });
      }
      setImportProgress({ done: i + 1, total: parsed.valid.length });
    }

    setImporting(false);
    setImportErrors(failures);
    if (success > 0) {
      toast.success(`${success} voertuig${success !== 1 ? "en" : ""} geïmporteerd${failures.length > 0 ? `, ${failures.length} mislukt` : ""}`);
    } else if (failures.length > 0) {
      toast.error(`Import mislukt: ${failures[0].message}`);
    }
    if (failures.length === 0) {
      setParsed(null);
      setFileName("");
      setKentekenInput("");
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setParsed(null);
    setFileName("");
    setKentekenInput("");
    setLookupProgress({ done: 0, total: 0 });
    setImportProgress({ done: 0, total: 0 });
    setImportErrors([]);
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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Voertuigen importeren</DialogTitle>
          <DialogDescription>Importeer via kenteken (automatisch via RDW) of upload een CSV.</DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => { setTab(v as "kenteken" | "csv"); setParsed(null); }}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="kenteken" className="gap-1.5"><Search className="w-3.5 h-3.5" /> Via kenteken</TabsTrigger>
            <TabsTrigger value="csv" className="gap-1.5"><FileSpreadsheet className="w-3.5 h-3.5" /> Via CSV</TabsTrigger>
          </TabsList>

          <TabsContent value="kenteken" className="space-y-4 mt-4">
            <div className="rounded-lg border border-border p-3 space-y-1.5 bg-muted/30">
              <p className="text-sm font-medium text-foreground">Snelle import via RDW</p>
              <p className="text-xs text-muted-foreground">
                Plak één kenteken per regel. Merk, model, bouwjaar, brandstof, kleur en APK-datum worden automatisch opgehaald. De voertuigfoto wordt op basis van merk en model gegenereerd.
              </p>
            </div>
            <Textarea
              placeholder={"AB-123-CD\n12-XY-Z3\nNL-001-A"}
              value={kentekenInput}
              onChange={(e) => setKentekenInput(e.target.value)}
              rows={6}
              className="font-mono uppercase tracking-wider text-sm"
            />
            <Button
              onClick={handleKentekenLookup}
              disabled={lookingUp || importing || kentekenInput.trim().length === 0}
              className="w-full gap-2"
            >
              {lookingUp ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Ophalen {lookupProgress.done}/{lookupProgress.total}...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Gegevens ophalen via RDW
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="csv" className="space-y-4 mt-4">
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
          </TabsContent>
        </Tabs>

        <div className="space-y-4 mt-4">
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
                {importing ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importeren {importProgress.done}/{importProgress.total}...
                  </span>
                ) : (
                  `${parsed.valid.length} voertuig${parsed.valid.length !== 1 ? "en" : ""} importeren`
                )}
              </Button>

              {importErrors.length > 0 && !importing && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-1 max-h-40 overflow-y-auto">
                  <p className="text-xs font-medium text-destructive mb-1">
                    {importErrors.length} voertuig{importErrors.length !== 1 ? "en" : ""} niet geïmporteerd:
                  </p>
                  {importErrors.map((err, i) => (
                    <p key={i} className="text-xs text-destructive">
                      <span className="font-mono">{err.kenteken}</span>: {err.message}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}