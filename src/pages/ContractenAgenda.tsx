import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar as CalendarIcon, ArrowRight, ArrowLeft, FileText, Archive, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useContracts, type ContractWithInvoices } from "@/hooks/useContracts";
import { cn } from "@/lib/utils";

type Mode = "alle" | "vandaag" | "komend" | "archief";

function daysBetween(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
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

interface DagItem {
  datum: string;
  starts: ContractWithInvoices[];
  eindes: ContractWithInvoices[];
}

export default function ContractenAgenda() {
  const { data: contracts = [], isLoading } = useContracts();
  const [mode, setMode] = useState<Mode>("alle");
  const [openDagen, setOpenDagen] = useState<Record<string, boolean>>({});

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const dagen: DagItem[] = useMemo(() => {
    const map = new Map<string, DagItem>();

    const inRange = (datum: string) => {
      if (!datum) return false;
      if (mode === "alle") return true;
      const d = new Date(datum);
      d.setHours(0, 0, 0, 0);
      const diff = daysBetween(isoDate(today), isoDate(d));
      if (mode === "vandaag") return diff === 0;
      if (mode === "komend") return diff >= 0;
      return diff < 0;
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

  const isOpen = (datum: string, isToday: boolean) =>
    openDagen[datum] ?? isToday;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contracten agenda</h1>
          <p className="text-sm text-muted-foreground">
            Overzicht per datum: contracten die starten en die terug verwacht worden.
          </p>
        </div>
        <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
          <TabsList>
            <TabsTrigger value="alle">Alle</TabsTrigger>
            <TabsTrigger value="vandaag">Vandaag</TabsTrigger>
            <TabsTrigger value="komend">Komend</TabsTrigger>
            <TabsTrigger value="archief">
              <Archive className="w-3.5 h-3.5 mr-1.5" />
              Archief
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-2 gap-4">
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
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
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
        <div className="space-y-2">
          {dagen.map((dag) => {
            const d = new Date(dag.datum);
            d.setHours(0, 0, 0, 0);
            const isToday = isoDate(d) === isoDate(today);
            const open = isOpen(dag.datum, isToday);
            return (
              <Collapsible
                key={dag.datum}
                open={open}
                onOpenChange={(v) => setOpenDagen((s) => ({ ...s, [dag.datum]: v }))}
              >
                <Card className={cn(isToday && "border-primary/50 bg-primary/5")}>
                  <CollapsibleTrigger asChild>
                    <button type="button" className="w-full text-left">
                      <CardHeader className="py-3 hover:bg-muted/40 transition-colors rounded-t-lg">
                        <CardTitle className="flex items-center justify-between gap-3 text-sm sm:text-base font-medium">
                          <span className="flex items-center gap-2 min-w-0">
                            <ChevronDown
                              className={cn(
                                "w-4 h-4 text-muted-foreground transition-transform shrink-0",
                                !open && "-rotate-90",
                              )}
                            />
                            <CalendarIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                            <span className="truncate">{formatDateNL(dag.datum)}</span>
                            {isToday && <Badge variant="default" className="ml-1 shrink-0">Vandaag</Badge>}
                          </span>
                          <span className="flex items-center gap-2 text-xs font-normal text-muted-foreground shrink-0">
                            {dag.starts.length > 0 && (
                              <Badge variant="outline" className="gap-1">
                                <ArrowRight className="w-3 h-3 text-blue-600" />
                                {dag.starts.length}
                              </Badge>
                            )}
                            {dag.eindes.length > 0 && (
                              <Badge variant="outline" className="gap-1">
                                <ArrowLeft className="w-3 h-3 text-amber-600" />
                                {dag.eindes.length}
                              </Badge>
                            )}
                          </span>
                        </CardTitle>
                      </CardHeader>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-0">
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
                                <Link to="/contracten" className="block">
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
                                </Link>
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
                            {dag.eindes.map((c) => (
                              <li key={`e-${c.id}`} className="rounded-lg border bg-card p-3 text-sm">
                                <Link to="/contracten" className="block">
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
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
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
