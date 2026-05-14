import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar as CalendarIcon, ArrowRight, ArrowLeft, TrendingUp, FileText, Archive, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useContracts, type ContractWithInvoices } from "@/hooks/useContracts";
import { cn } from "@/lib/utils";

type Mode = "komend" | "vandaag" | "archief" | "alle";

function daysBetween(a: string, b: string) {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function formatDateNL(d: string) {
  return new Date(d).toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

/**
 * Heuristische verlengingskans per contract.
 * Combineert: verlengbaar-vlag, contracttype, looptijd, klanthistorie en betaalgedrag.
 */
function berekenVerlengingskans(
  contract: ContractWithInvoices,
  alleContracten: ContractWithInvoices[],
) {
  let kans = 30;
  const redenen: string[] = [];

  if (contract.verlengbaar) {
    kans += 25;
    redenen.push("Verlengbaar contract");
  }

  const looptijdDagen = daysBetween(contract.start_datum, contract.eind_datum);
  if (looptijdDagen >= 365) {
    kans += 10;
    redenen.push("Looptijd ≥ 1 jaar");
  } else if (looptijdDagen <= 14) {
    kans -= 15;
    redenen.push("Korte huurperiode");
  }

  if (["lease", "fietslease", "ev-lease"].includes(contract.type)) {
    kans += 15;
    redenen.push("Lease product");
  }
  if (contract.type === "verhuur") {
    kans -= 10;
    redenen.push("Losse verhuur");
  }

  const klantContracten = alleContracten.filter(
    (c) => c.klant_email && c.klant_email.toLowerCase() === contract.klant_email.toLowerCase(),
  );
  if (klantContracten.length >= 3) {
    kans += 20;
    redenen.push(`${klantContracten.length} eerdere contracten`);
  } else if (klantContracten.length === 2) {
    kans += 10;
    redenen.push("Terugkerende klant");
  }

  const teLaat = contract.invoices.filter(
    (i) => i.status === "te_laat" || i.status === "herinnering_verstuurd",
  ).length;
  if (teLaat >= 2) {
    kans -= 20;
    redenen.push("Betalingsachterstand");
  } else if (teLaat === 0 && contract.invoices.length >= 3) {
    kans += 10;
    redenen.push("Stipt betaalgedrag");
  }

  if (contract.status === "verlopen") {
    kans = Math.min(kans, 10);
    redenen.push("Reeds verlopen");
  }

  kans = Math.max(5, Math.min(95, kans));
  return { kans, redenen };
}

function kansLabel(kans: number) {
  if (kans >= 70) return { label: "Hoog", color: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" };
  if (kans >= 45) return { label: "Gemiddeld", color: "bg-amber-500/15 text-amber-700 border-amber-500/30" };
  return { label: "Laag", color: "bg-rose-500/15 text-rose-700 border-rose-500/30" };
}

interface DagItem {
  datum: string;
  starts: ContractWithInvoices[];
  eindes: ContractWithInvoices[];
}

export default function ContractenAgenda() {
  const { data: contracts = [], isLoading } = useContracts();
  const [mode, setMode] = useState<Mode>("komend");

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const dagen: DagItem[] = useMemo(() => {
    const map = new Map<string, DagItem>();

    const inRange = (datum: string) => {
      if (mode === "alle") return true;
      const d = new Date(datum);
      d.setHours(0, 0, 0, 0);
      const diff = daysBetween(isoDate(today), isoDate(d));
      if (mode === "vandaag") return diff === 0;
      if (mode === "komend") return diff >= 0;
      return diff < 0; // archief: alles in het verleden
    };

    for (const c of contracts) {
      if (inRange(c.start_datum)) {
        const key = c.start_datum;
        if (!map.has(key)) map.set(key, { datum: key, starts: [], eindes: [] });
        map.get(key)!.starts.push(c);
      }
      if (inRange(c.eind_datum)) {
        const key = c.eind_datum;
        if (!map.has(key)) map.set(key, { datum: key, starts: [], eindes: [] });
        map.get(key)!.eindes.push(c);
      }
    }

    const arr = Array.from(map.values());
    arr.sort((a, b) =>
      mode === "archief"
        ? b.datum.localeCompare(a.datum)
        : a.datum.localeCompare(b.datum),
    );
    return arr;
  }, [contracts, mode, today]);

  const totalStarts = dagen.reduce((s, d) => s + d.starts.length, 0);
  const totalEindes = dagen.reduce((s, d) => s + d.eindes.length, 0);
  const verlengbareEindes = dagen
    .flatMap((d) => d.eindes)
    .map((c) => berekenVerlengingskans(c, contracts).kans)
    .filter((k) => k >= 45).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contracten agenda</h1>
          <p className="text-sm text-muted-foreground">
            Overzicht per datum: welke contracten beginnen en welke worden terug verwacht, inclusief verlengingskans.
          </p>
        </div>
        <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
          <TabsList>
            <TabsTrigger value="vandaag">Vandaag</TabsTrigger>
            <TabsTrigger value="komend">Komend</TabsTrigger>
            <TabsTrigger value="archief">
              <Archive className="w-3.5 h-3.5 mr-1.5" />
              Archief
            </TabsTrigger>
            <TabsTrigger value="alle">Alle</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
              <ArrowRight className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Starten</p>
              <p className="text-xl font-semibold">{totalStarts}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Terug verwacht</p>
              <p className="text-xl font-semibold">{totalEindes}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Verlengingskansen ≥ gemiddeld</p>
              <p className="text-xl font-semibold">{verlengbareEindes}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : dagen.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <CalendarIcon className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>Geen contractbewegingen in deze periode.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {dagen.map((dag) => {
            const d = new Date(dag.datum);
            d.setHours(0, 0, 0, 0);
            const isToday = isoDate(d) === isoDate(today);
            return (
              <Card key={dag.datum} className={cn(isToday && "border-primary/50 bg-primary/5")}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between gap-3 text-base">
                    <span className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                      {formatDateNL(dag.datum)}
                      {isToday && <Badge variant="default" className="ml-1">Vandaag</Badge>}
                    </span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {dag.starts.length} start · {dag.eindes.length} terug
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
                      <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                      Beginnen ({dag.starts.length})
                    </h3>
                    {dag.starts.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">Geen</p>
                    ) : (
                      <ul className="space-y-2">
                        {dag.starts.map((c) => (
                          <li key={`s-${c.id}`} className="rounded-lg border bg-card p-3 text-sm">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-medium truncate">{c.klant_naam}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {c.contract_nummer} · {c.type}
                                </p>
                              </div>
                              <Badge variant="outline" className="text-xs whitespace-nowrap">
                                €{Number(c.maandprijs).toFixed(0)}/mnd
                              </Badge>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
                      <ArrowLeft className="w-3.5 h-3.5 text-amber-600" />
                      Terug verwacht ({dag.eindes.length})
                    </h3>
                    {dag.eindes.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">Geen</p>
                    ) : (
                      <ul className="space-y-2">
                        {dag.eindes.map((c) => {
                          const { kans, redenen } = berekenVerlengingskans(c, contracts);
                          const k = kansLabel(kans);
                          return (
                            <li key={`e-${c.id}`} className="rounded-lg border bg-card p-3 text-sm">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="min-w-0">
                                  <p className="font-medium truncate">{c.klant_naam}</p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {c.contract_nummer} · {c.type}
                                  </p>
                                </div>
                                <Badge variant="outline" className={cn("text-xs whitespace-nowrap", k.color)}>
                                  {kans}% · {k.label}
                                </Badge>
                              </div>
                              <div className="space-y-1.5">
                                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                  <div
                                    className={cn(
                                      "h-full rounded-full transition-all",
                                      kans >= 70 ? "bg-emerald-500" : kans >= 45 ? "bg-amber-500" : "bg-rose-500",
                                    )}
                                    style={{ width: `${kans}%` }}
                                  />
                                </div>
                                {redenen.length > 0 && (
                                  <p className="text-[11px] text-muted-foreground line-clamp-2">
                                    {redenen.join(" · ")}
                                  </p>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="flex justify-end">
        <Button variant="outline" size="sm" asChild>
          <Link to="/contracten">
            <FileText className="w-3.5 h-3.5 mr-1.5" />
            Naar alle contracten
          </Link>
        </Button>
      </div>
    </div>
  );
}
