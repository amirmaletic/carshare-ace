import { useRef, useState } from "react";
import { Upload, FileSpreadsheet, ClipboardPaste } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ExcelJS from "exceljs";

export interface ParsedSheet {
  headers: string[];
  rows: Record<string, unknown>[];
  fileName: string;
}

interface Props {
  onParsed: (sheet: ParsedSheet) => void;
}

export function FileDropzone({ onParsed }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pasted, setPasted] = useState("");
  const [fileName, setFileName] = useState("");

  const handleFile = async (file: File) => {
    setFileName(file.name);
    const buf = await file.arrayBuffer();
    const isCsv = /\.(csv|txt)$/i.test(file.name);
    if (isCsv) {
      const text = new TextDecoder().decode(buf);
      const sep = text.includes("\t") ? "\t" : text.includes(";") ? ";" : ",";
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) return;
      const headers = lines[0].split(sep).map((h) => h.trim().replace(/^["']|["']$/g, ""));
      const rows: Record<string, unknown>[] = [];
      for (let i = 1; i < lines.length; i++) {
        const vals = lines[i].split(sep).map((v) => v.trim().replace(/^["']|["']$/g, ""));
        const obj: Record<string, unknown> = {};
        headers.forEach((h, idx) => { obj[h] = vals[idx] ?? ""; });
        rows.push(obj);
      }
      onParsed({ headers, rows, fileName: file.name });
      return;
    }
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf);
    const ws = wb.worksheets[0];
    if (!ws || ws.rowCount < 2) return;
    const headerRow = ws.getRow(1);
    const headers: string[] = [];
    headerRow.eachCell({ includeEmpty: false }, (cell) => {
      headers.push(String(cell.value ?? "").trim());
    });
    const rows: Record<string, unknown>[] = [];
    for (let r = 2; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      const obj: Record<string, unknown> = {};
      let hasValue = false;
      headers.forEach((h, idx) => {
        const v = row.getCell(idx + 1).value as unknown;
        const out = v && typeof v === "object" && "text" in (v as any) ? (v as any).text : v;
        if (out !== "" && out != null) hasValue = true;
        obj[h] = out ?? "";
      });
      if (hasValue) rows.push(obj);
    }
    onParsed({ headers, rows, fileName: file.name });
  };

  const handlePaste = () => {
    const text = pasted.trim();
    if (!text) return;
    const sep = text.includes("\t") ? "\t" : text.includes(";") ? ";" : ",";
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return;
    const headers = lines[0].split(sep).map((h) => h.trim().replace(/^["']|["']$/g, ""));
    const rows: Record<string, unknown>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(sep).map((v) => v.trim().replace(/^["']|["']$/g, ""));
      const obj: Record<string, unknown> = {};
      headers.forEach((h, idx) => { obj[h] = vals[idx] ?? ""; });
      rows.push(obj);
    }
    onParsed({ headers, rows, fileName: "Geplakte data" });
  };

  return (
    <Tabs defaultValue="upload">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="upload" className="gap-1.5"><FileSpreadsheet className="w-3.5 h-3.5" /> Bestand uploaden</TabsTrigger>
        <TabsTrigger value="paste" className="gap-1.5"><ClipboardPaste className="w-3.5 h-3.5" /> Plakken</TabsTrigger>
      </TabsList>

      <TabsContent value="upload" className="mt-4">
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.txt,.xlsx,.xls"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className={cn(
            "w-full border-2 border-dashed rounded-xl p-10 text-center transition-all",
            "hover:border-primary hover:bg-primary/5",
            fileName ? "border-primary bg-primary/5" : "border-border"
          )}
        >
          {fileName ? (
            <div className="flex items-center justify-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-primary" />
              <span className="text-sm font-medium">{fileName}</span>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="w-10 h-10 mx-auto text-muted-foreground" />
              <p className="text-sm font-medium">Sleep een bestand hierheen of klik</p>
              <p className="text-xs text-muted-foreground">Ondersteunt CSV, Excel (.xlsx, .xls), TXT</p>
            </div>
          )}
        </button>
      </TabsContent>

      <TabsContent value="paste" className="mt-4 space-y-3">
        <Textarea
          placeholder={"Plak hier een tabel uit Excel, Google Sheets of Numbers.\nEerste rij = kolomnamen."}
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
          rows={10}
          className="font-mono text-xs"
        />
        <Button onClick={handlePaste} disabled={!pasted.trim()} className="w-full">
          Geplakte data verwerken
        </Button>
      </TabsContent>
    </Tabs>
  );
}