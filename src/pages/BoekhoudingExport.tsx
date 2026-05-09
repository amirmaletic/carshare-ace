import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileText, FileSpreadsheet, Calculator, Loader2 } from "lucide-react";
import { useBedrijfsgegevens } from "@/hooks/useBedrijfsgegevens";
import { useOrganisatieVoorkeuren } from "@/hooks/useOrganisatieVoorkeuren";
import { useToast } from "@/hooks/use-toast";
import {
  buildGeneriekeCsv,
  buildMoneybirdCsv,
  buildUblZip,
  downloadBlob,
  splitsBtw,
  type FactuurExport,
} from "@/lib/boekhouding-export";

function firstOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function BoekhoudingExport() {
  const { toast } = useToast();
  const { data: bedrijf } = useBedrijfsgegevens();
  const { data: voorkeuren } = useOrganisatieVoorkeuren();

  const [van, setVan] = useState(firstOfMonth());
  const [tot, setTot] = useState(today());
  const [statusFilter, setStatusFilter] = useState<string>("alle");
  const [btwTarief, setBtwTarief] = useState<number>(Number(voorkeuren?.standaard_btw ?? 21));
  const [busy, setBusy] = useState<string | null>(null);

  const { data: facturen, isLoading } = useQuery({
    queryKey: ["boekhouding-export", van, tot, statusFilter],
    queryFn: async (): Promise<FactuurExport[]> => {
      let q = supabase
        .from("invoices")
        .select(`
          id, datum, bedrag, status, omschrijving, type, contract_id,
          contracts:contract_id ( klant_naam, klant_email, klant_adres, voertuig_id, voertuigen:voertuig_id ( kenteken ) )
        `)
        .gte("datum", van)
        .lte("datum", tot)
        .order("datum", { ascending: true });
      if (statusFilter !== "alle") q = q.eq("status", statusFilter as "betaald" | "openstaand" | "te_laat" | "herinnering_verstuurd");
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map((row: any, idx) => {
        const c = row.contracts;
        const naam = c?.klant_naam || "Onbekend";
        const yr = row.datum?.slice(0, 4) ?? "";
        const seq = String(idx + 1).padStart(4, "0");
        return {
          id: row.id,
          factuurnummer: `${yr}-${seq}`,
          datum: row.datum,
          omschrijving: row.omschrijving || (row.type === "schade" ? "Schadekosten" : "Verhuurfactuur"),
          bedrag_incl: Number(row.bedrag) || 0,
          btw_tarief: btwTarief,
          status: row.status,
          type: row.type || "huur",
          klant_naam: naam,
          klant_email: c?.klant_email ?? "",
          klant_adres: c?.klant_adres ?? "",
          klant_postcode: "",
          klant_plaats: "",
          contract_id: row.contract_id,
          voertuig_kenteken: c?.voertuigen?.kenteken ?? "",
        } as FactuurExport;
      });
    },
  });

  const totals = useMemo(() => {
    const rows = facturen ?? [];
    let excl = 0, btw = 0, incl = 0;
    for (const r of rows) {
      const s = splitsBtw(r.bedrag_incl, r.btw_tarief);
      excl += s.excl; btw += s.btw; incl += s.incl;
    }
    return { excl, btw, incl, count: rows.length };
  }, [facturen]);

  const periodLabel = `${van}_${tot}`;

  async function exportCsv() {
    if (!facturen?.length) return;
    setBusy("csv");
    try {
      downloadBlob(buildGeneriekeCsv(facturen), `boekhouding_${periodLabel}.csv`, "text/csv;charset=utf-8");
      toast({ title: "CSV gedownload", description: `${facturen.length} facturen geëxporteerd` });
    } finally { setBusy(null); }
  }

  async function exportMoneybird() {
    if (!facturen?.length) return;
    setBusy("mb");
    try {
      downloadBlob(buildMoneybirdCsv(facturen), `moneybird_${periodLabel}.csv`, "text/csv;charset=utf-8");
      toast({ title: "Moneybird CSV gedownload" });
    } finally { setBusy(null); }
  }

  async function exportUbl() {
    if (!facturen?.length) return;
    setBusy("ubl");
    try {
      const zip = await buildUblZip(facturen, bedrijf);
      downloadBlob(zip, `ubl_facturen_${periodLabel}.zip`, "application/zip");
      toast({ title: "UBL ZIP gedownload", description: `${facturen.length} e-facturen` });
    } catch (e) {
      toast({ title: "Fout bij UBL export", description: (e as Error).message, variant: "destructive" });
    } finally { setBusy(null); }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Boekhoudingexport</h1>
        <p className="text-sm text-muted-foreground">
          Exporteer facturen naar CSV of UBL voor Exact, Moneybird, AFAS, Snelstart of elke andere boekhouding.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
          <CardDescription>Periode, status en BTW-tarief voor de export.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>Van</Label>
            <Input type="date" value={van} onChange={(e) => setVan(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Tot en met</Label>
            <Input type="date" value={tot} onChange={(e) => setTot(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="alle">Alle statussen</SelectItem>
                <SelectItem value="betaald">Betaald</SelectItem>
                <SelectItem value="openstaand">Openstaand</SelectItem>
                <SelectItem value="te_laat">Te laat</SelectItem>
                <SelectItem value="herinnering_verstuurd">Herinnering verstuurd</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>BTW-tarief</Label>
            <Select value={String(btwTarief)} onValueChange={(v) => setBtwTarief(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0%</SelectItem>
                <SelectItem value="9">9%</SelectItem>
                <SelectItem value="21">21%</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="pt-6">
          <div className="text-xs text-muted-foreground">Aantal facturen</div>
          <div className="text-2xl font-semibold">{totals.count}</div>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <div className="text-xs text-muted-foreground">Totaal excl. BTW</div>
          <div className="text-2xl font-semibold">€ {totals.excl.toFixed(2)}</div>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <div className="text-xs text-muted-foreground">Totaal BTW</div>
          <div className="text-2xl font-semibold">€ {totals.btw.toFixed(2)}</div>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <div className="text-xs text-muted-foreground">Totaal incl. BTW</div>
          <div className="text-2xl font-semibold">€ {totals.incl.toFixed(2)}</div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Exporteren</CardTitle>
          <CardDescription>Kies het formaat dat jouw boekhouder of pakket inleest.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <Button onClick={exportCsv} disabled={!totals.count || !!busy} className="gap-2 h-auto py-4 flex-col items-start">
            {busy === "csv" ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileSpreadsheet className="w-5 h-5" />}
            <div className="text-left">
              <div className="font-semibold">Generieke CSV</div>
              <div className="text-xs opacity-80">Exact, AFAS, Snelstart, Excel</div>
            </div>
          </Button>
          <Button onClick={exportMoneybird} disabled={!totals.count || !!busy} variant="secondary" className="gap-2 h-auto py-4 flex-col items-start">
            {busy === "mb" ? <Loader2 className="w-5 h-5 animate-spin" /> : <Calculator className="w-5 h-5" />}
            <div className="text-left">
              <div className="font-semibold">Moneybird CSV</div>
              <div className="text-xs opacity-80">Direct importformaat</div>
            </div>
          </Button>
          <Button onClick={exportUbl} disabled={!totals.count || !!busy} variant="secondary" className="gap-2 h-auto py-4 flex-col items-start">
            {busy === "ubl" ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
            <div className="text-left">
              <div className="font-semibold">UBL 2.0 (NLCIUS) ZIP</div>
              <div className="text-xs opacity-80">Peppol e-factuur per stuk</div>
            </div>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Voorbeeld</CardTitle>
          <CardDescription>Eerste 50 regels van de selectie.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Laden…</div>
          ) : !facturen?.length ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Geen facturen in deze periode.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Factuurnr</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead>Debiteur</TableHead>
                  <TableHead>Omschrijving</TableHead>
                  <TableHead className="text-right">Excl.</TableHead>
                  <TableHead className="text-right">BTW</TableHead>
                  <TableHead className="text-right">Incl.</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {facturen.slice(0, 50).map((r) => {
                  const s = splitsBtw(r.bedrag_incl, r.btw_tarief);
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.factuurnummer}</TableCell>
                      <TableCell>{r.datum}</TableCell>
                      <TableCell>{r.klant_naam}</TableCell>
                      <TableCell className="max-w-[280px] truncate">{r.omschrijving}</TableCell>
                      <TableCell className="text-right">€ {s.excl.toFixed(2)}</TableCell>
                      <TableCell className="text-right">€ {s.btw.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-medium">€ {s.incl.toFixed(2)}</TableCell>
                      <TableCell><Badge variant="outline">{r.status}</Badge></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}