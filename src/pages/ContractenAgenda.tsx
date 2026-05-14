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
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type Mode = "alle" | "vandaag" | "komend" | "archief";

interface AgendaItem {
  id: string;
  bron: "contract" | "reservering";
  titel: string;
  subtitel: string;
  prijsLabel?: string;
  link: string;
}

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
  starts: AgendaItem[];
  eindes: AgendaItem[];
}

function AgendaRow({ item }: { item: AgendaItem }) {
  return (
    <li className="rounded-lg border bg-card p-3 text-sm">
      <Link to={item.link} className="block">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium truncate flex items-center gap-1.5">
              {item.titel}
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
                {item.bron === "contract" ? "Contract" : "Reservering"}
              </Badge>
            </p>
            <p className="text-xs text-muted-foreground truncate">{item.subtitel}</p>
          </div>
          {item.prijsLabel && (
            <Badge variant="outline" className="text-xs whitespace-nowrap">
              {item.prijsLabel}
            </Badge>
          )}
        </div>
      </Link>
    </li>
  );
}

export default function ContractenAgenda() {
  const { data: contracts = [], isLoading } = useContracts();
  const { data: reserveringen = [], isLoading: resLoading } = useQuery({
    queryKey: ["reserveringen-agenda"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reserveringen")
        .select("id, start_datum, eind_datum, status, totaalprijs, dagprijs, klanten(voornaam, achternaam), voertuigen(merk, model, kenteken)")
        .order("start_datum", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
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

    const addStart = (key: string, item: AgendaItem) => {
      if (!map.has(key)) map.set(key, { datum: key, starts: [], eindes: [] });
      map.get(key)!.starts.push(item);
    };
    const addEinde = (key: string, item: AgendaItem) => {
      if (!map.has(key)) map.set(key, { datum: key, starts: [], eindes: [] });
      map.get(key)!.eindes.push(item);
    };

    for (const c of contracts) {
      const item: AgendaItem = {
        id: `c-${c.id}`,
        bron: "contract",
        titel: c.klant_naam,
        subtitel: `${c.contract_nummer} · ${c.type}`,
        prijsLabel: `€${Number(c.maandprijs).toFixed(0)}/mnd`,
        link: "/contracten",
      };
      if (inRange(c.start_datum)) {
        addStart(c.start_datum, item);
      }
      if (inRange(c.eind_datum)) {
        addEinde(c.eind_datum, item);
      }
    }

    for (const r of reserveringen as any[]) {
      const klantNaam = r.klanten
        ? `${r.klanten.voornaam ?? ""} ${r.klanten.achternaam ?? ""}`.trim() || "Onbekende klant"
        : "Onbekende klant";
      const voertuig = r.voertuigen
        ? `${r.voertuigen.merk ?? ""} ${r.voertuigen.model ?? ""} · ${r.voertuigen.kenteken ?? ""}`.trim()
        : "Voertuig";
      const item: AgendaItem = {
        id: `r-${r.id}`,
        bron: "reservering",
        titel: klantNaam,
        subtitel: `Reservering · ${voertuig} · ${r.status}`,
        prijsLabel: r.totaalprijs ? `€${Number(r.totaalprijs).toFixed(0)}` : undefined,
        link: "/reserveringen",
      };
      if (inRange(r.start_datum)) addStart(r.start_datum, item);
      if (inRange(r.eind_datum)) addEinde(r.eind_datum, item);
    }

    const arr = Array.from(map.values());
    arr.sort((a, b) =>
      mode === "archief"
        ? b.datum.localeCompare(a.datum)
        : a.datum.localeCompare(b.datum),
    );
    return arr;
  }, [contracts, reserveringen, mode, today]);

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
                            {dag.starts.map((it) => (
                              <AgendaRow key={`s-${it.id}`} item={it} />
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
                            {dag.eindes.map((it) => (
                              <AgendaRow key={`e-${it.id}`} item={it} />
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
