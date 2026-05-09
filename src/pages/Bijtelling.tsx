import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calculator, AlertTriangle, CheckCircle2, Car, Loader2, Download } from "lucide-react";

interface BijtellingRij {
  voertuig_id: string;
  kenteken: string;
  merk: string;
  model: string;
  cataloguswaarde: number;
  bijtelling_percentage: number;
  jaarlijkse_bijtelling: number;
  maandelijkse_bijtelling: number;
  prive_km: number;
  zakelijk_km: number;
  woon_werk_km: number;
  totaal_km: number;
  bijtelling_verplicht: boolean;
}

function formatEuro(n: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

export default function Bijtelling() {
  const huidigJaar = new Date().getFullYear();
  const [jaar, setJaar] = useState(huidigJaar);

  const { data, isLoading } = useQuery({
    queryKey: ["bijtelling-overzicht", jaar],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("bijtelling_overzicht", { _jaar: jaar });
      if (error) throw error;
      return (data ?? []) as BijtellingRij[];
    },
  });

  const totalen = useMemo(() => {
    const rows = data ?? [];
    return {
      voertuigen: rows.length,
      bijtellingsplichtig: rows.filter((r) => r.bijtelling_verplicht).length,
      jaarlijksTotaal: rows.filter((r) => r.bijtelling_verplicht).reduce((s, r) => s + Number(r.jaarlijkse_bijtelling), 0),
      priveKmTotaal: rows.reduce((s, r) => s + Number(r.prive_km || 0), 0),
      zakelijkKmTotaal: rows.reduce((s, r) => s + Number(r.zakelijk_km || 0), 0),
    };
  }, [data]);

  function exporteerCsv() {
    const rows = data ?? [];
    const header = [
      "Kenteken", "Merk", "Model", "Cataloguswaarde", "Bijtelling %",
      "Jaarlijkse bijtelling", "Maandelijkse bijtelling",
      "Privé km", "Zakelijk km", "Woon-werk km", "Totaal km", "Bijtelling verplicht",
    ];
    const lines = [header.join(";")];
    for (const r of rows) {
      lines.push([
        r.kenteken, r.merk, r.model,
        r.cataloguswaarde, r.bijtelling_percentage,
        r.jaarlijkse_bijtelling, r.maandelijkse_bijtelling,
        r.prive_km, r.zakelijk_km, r.woon_werk_km, r.totaal_km,
        r.bijtelling_verplicht ? "Ja" : "Nee",
      ].join(";"));
    }
    const blob = new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bijtelling-${jaar}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Calculator className="w-6 h-6 text-primary" /> Bijtelling overzicht
          </h1>
          <p className="text-sm text-muted-foreground">
            Fiscale kilometeradministratie per voertuig | grens 500 km privé per kalenderjaar
          </p>
        </div>
        <div className="flex items-end gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Jaar</Label>
            <Input
              type="number"
              value={jaar}
              onChange={(e) => setJaar(Number(e.target.value))}
              className="w-28"
              min={2000}
              max={2100}
            />
          </div>
          <Button variant="outline" onClick={exporteerCsv} className="gap-2">
            <Download className="w-4 h-4" /> CSV
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Voertuigen</p>
            <p className="text-2xl font-bold text-foreground">{totalen.voertuigen}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Bijtellingsplichtig</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{totalen.bijtellingsplichtig}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Jaarlijkse bijtelling</p>
            <p className="text-2xl font-bold text-primary">{formatEuro(totalen.jaarlijksTotaal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Privé km totaal</p>
            <p className="text-2xl font-bold text-foreground">{totalen.priveKmTotaal.toLocaleString("nl-NL")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Per voertuig | {jaar}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (data ?? []).length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              <Car className="w-8 h-8 mx-auto mb-2 opacity-40" />
              Geen voertuigen gevonden voor dit jaar.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kenteken</TableHead>
                    <TableHead>Voertuig</TableHead>
                    <TableHead className="text-right">Cataloguswaarde</TableHead>
                    <TableHead className="text-right">%</TableHead>
                    <TableHead className="text-right">Privé km</TableHead>
                    <TableHead className="text-right">Zakelijk km</TableHead>
                    <TableHead className="text-right">Woon-werk km</TableHead>
                    <TableHead className="text-right">Bijtelling/jaar</TableHead>
                    <TableHead className="text-right">Bijtelling/mnd</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data ?? []).map((r) => (
                    <TableRow key={r.voertuig_id}>
                      <TableCell className="font-mono text-xs">{r.kenteken}</TableCell>
                      <TableCell>{r.merk} {r.model}</TableCell>
                      <TableCell className="text-right">{formatEuro(Number(r.cataloguswaarde))}</TableCell>
                      <TableCell className="text-right">{Number(r.bijtelling_percentage)}%</TableCell>
                      <TableCell className="text-right">{Number(r.prive_km).toLocaleString("nl-NL")}</TableCell>
                      <TableCell className="text-right">{Number(r.zakelijk_km).toLocaleString("nl-NL")}</TableCell>
                      <TableCell className="text-right">{Number(r.woon_werk_km).toLocaleString("nl-NL")}</TableCell>
                      <TableCell className="text-right font-medium">
                        {r.bijtelling_verplicht ? formatEuro(Number(r.jaarlijkse_bijtelling)) : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {r.bijtelling_verplicht ? formatEuro(Number(r.maandelijkse_bijtelling)) : "-"}
                      </TableCell>
                      <TableCell>
                        {r.bijtelling_verplicht ? (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="w-3 h-3" /> Bijtelling
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Vrij ({Number(r.prive_km)} km)
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="rounded-lg border bg-muted/30 p-4 text-xs text-muted-foreground space-y-1">
        <p><strong>Hoe werkt het?</strong> Per voertuig worden alle ritten in het gekozen jaar opgeteld op fiscale categorie. Boven 500 privé km per kalenderjaar is bijtelling verplicht (Belastingdienst).</p>
        <p>Bijtelling = cataloguswaarde × bijtellingspercentage. Het percentage stel je per voertuig in (standaard 22%, EV's vaak 16%).</p>
      </div>
    </div>
  );
}