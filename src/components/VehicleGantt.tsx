import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { type Vehicle } from "@/data/mockData";
import { useVoertuigen } from "@/hooks/useVoertuigen";
import { useLocaties } from "@/hooks/useLocaties";
import { StatusBadge } from "@/components/StatusBadge";
import { getStatusColor } from "@/data/mockData";
import {
  ChevronLeft, ChevronRight, Eye, FileText, RotateCcw, Filter, Search, ZoomIn, ZoomOut,
  Calendar as CalendarIcon, UserPlus, CalendarPlus, Wrench, ShieldAlert, Copy, Square, Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  format, addDays, startOfWeek, differenceInDays, isWithinInterval, addWeeks, parseISO, isValid,
} from "date-fns";
import { nl } from "date-fns/locale";
import {
  ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger,
  ContextMenuLabel, ContextMenuSub, ContextMenuSubTrigger, ContextMenuSubContent,
} from "@/components/ui/context-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import { usePlanningBlokken, type PlanningBlok } from "@/hooks/usePlanningBlokken";
import { PlanningBlokDialog } from "@/components/planning/PlanningBlokDialog";

type BlockType = "contract" | "reservation" | "onderhoud" | "blok";

interface GanttBlock {
  id: string;
  vehicleId: string;
  start: Date;
  end: Date;
  label: string;
  sub?: string;
  type: BlockType;
  status?: string;
  kleur?: string;
  meta?: Record<string, any>;
}

const ROW_HEIGHT_NORMAL = 44;
const ROW_HEIGHT_DENSE = 30;

const ZOOM_PRESETS: { id: "compact" | "normaal" | "ruim"; days: number; cellWidth: number; label: string }[] = [
  { id: "compact", days: 56, cellWidth: 22, label: "8 weken" },
  { id: "normaal", days: 28, cellWidth: 36, label: "4 weken" },
  { id: "ruim", days: 14, cellWidth: 64, label: "2 weken" },
];

function getBlockStyles(type: BlockType, status?: string) {
  if (type === "contract") {
    if (status === "concept") return "bg-warning/75 border-warning text-warning-foreground";
    if (status === "afgerond") return "bg-muted-foreground/40 border-muted-foreground/60 text-foreground";
    return "bg-primary/75 border-primary text-primary-foreground";
  }
  if (type === "reservation") {
    if (status === "aangevraagd") return "bg-info/40 border-info/70 text-info-foreground border-dashed";
    return "bg-info/75 border-info text-info-foreground";
  }
  return "bg-destructive/70 border-destructive text-destructive-foreground";
}

function getEffectiveStatus(vehicle: Vehicle, blocks: GanttBlock[]): Vehicle["status"] {
  const today = new Date();
  const hasActiveBlock = blocks.some(
    (b) => b.vehicleId === vehicle.id && b.type === "contract" && b.status === "actief" && isWithinInterval(today, { start: b.start, end: b.end })
  );
  if (hasActiveBlock) return "verhuurd";
  if (vehicle.status === "onderhoud") return "onderhoud";
  return vehicle.status;
}

interface VehicleGanttProps {
  onSelectVehicle?: (vehicle: Vehicle) => void;
  onReturnVehicle?: (vehicle: Vehicle) => void;
  onCreateContract?: (vehicle: Vehicle, opts?: { startDate?: Date; endDate?: Date }) => void;
  onCreateKlant?: (vehicle: Vehicle) => void;
}

export function VehicleGantt({ onSelectVehicle, onReturnVehicle, onCreateContract, onCreateKlant }: VehicleGanttProps) {
  const { user } = useAuth();
  const { voertuigen: dbVoertuigen } = useVoertuigen();
  const { locaties } = useLocaties();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [locationFilter, setLocationFilter] = useState<string>("alle");
  const [search, setSearch] = useState("");
  const [zoomId, setZoomId] = useState<"compact" | "normaal" | "ruim">("normaal");
  const [dense, setDense] = useState(false);
  const [showContracts, setShowContracts] = useState(true);
  const [showReserveringen, setShowReserveringen] = useState(true);
  const [showOnderhoud, setShowOnderhoud] = useState(true);
  const [showBlokken, setShowBlokken] = useState(true);
  const [blokDialogOpen, setBlokDialogOpen] = useState(false);
  const [editingBlok, setEditingBlok] = useState<PlanningBlok | null>(null);
  const [prefillBlok, setPrefillBlok] = useState<{ voertuigId?: string; start?: string; eind?: string }>({});
  const { blokken: planningBlokken } = usePlanningBlokken();

  const zoom = ZOOM_PRESETS.find((z) => z.id === zoomId)!;
  const DAYS_VISIBLE = zoom.days;
  const CELL_WIDTH = zoom.cellWidth;
  const ROW_HEIGHT = dense ? ROW_HEIGHT_DENSE : ROW_HEIGHT_NORMAL;

  const startDate = useMemo(
    () => startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 }),
    [weekOffset]
  );
  const days = useMemo(
    () => Array.from({ length: DAYS_VISIBLE }, (_, i) => addDays(startDate, i)),
    [startDate, DAYS_VISIBLE]
  );
  const endDate = days[days.length - 1];

  const { data: dbContracts = [] } = useQuery({
    queryKey: ["gantt-contracts", startDate.toISOString(), endDate?.toISOString()],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("contracts")
        .select("id, voertuig_id, klant_naam, bedrijf, start_datum, eind_datum, status, contract_nummer, maandprijs, type")
        .in("status", ["actief", "concept"])
        .lte("start_datum", format(endDate, "yyyy-MM-dd"))
        .gte("eind_datum", format(startDate, "yyyy-MM-dd"));
      return data || [];
    },
  });

  const { data: dbReserveringen = [] } = useQuery({
    queryKey: ["gantt-reserveringen", startDate.toISOString(), endDate?.toISOString()],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("reserveringen")
        .select("id, voertuig_id, start_datum, eind_datum, status, totaalprijs, klanten(voornaam,achternaam)")
        .in("status", ["aangevraagd", "bevestigd"])
        .lte("start_datum", format(endDate, "yyyy-MM-dd"))
        .gte("eind_datum", format(startDate, "yyyy-MM-dd"));
      return data || [];
    },
  });

  const { data: dbOnderhoud = [] } = useQuery({
    queryKey: ["gantt-onderhoud", startDate.toISOString(), endDate?.toISOString()],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("service_historie")
        .select("id, voertuig_id, datum, type, omschrijving, status, kosten")
        .gte("datum", format(addDays(startDate, -3), "yyyy-MM-dd"))
        .lte("datum", format(endDate, "yyyy-MM-dd"));
      return data || [];
    },
  });

  const allVehicles: (Vehicle & { _locatie?: string | null })[] = dbVoertuigen.map((v) => ({
    id: v.id,
    kenteken: v.kenteken,
    merk: v.merk,
    model: v.model,
    bouwjaar: v.bouwjaar,
    brandstof: v.brandstof as Vehicle["brandstof"],
    kilometerstand: v.kilometerstand,
    status: v.status as Vehicle["status"],
    apkVervaldatum: v.apk_vervaldatum || "",
    verzekeringsVervaldatum: v.verzekering_vervaldatum || "",
    dagprijs: Number(v.dagprijs),
    categorie: v.categorie as Vehicle["categorie"],
    kleur: v.kleur,
    _locatie: v.locatie,
  }));

  const filteredVehicles = useMemo(() => {
    let list = allVehicles;
    if (locationFilter === "geen") list = list.filter((v) => !v._locatie);
    else if (locationFilter !== "alle") list = list.filter((v) => v._locatie === locationFilter);
    const q = search.trim().toLowerCase();
    if (q) {
      const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
      const qn = norm(q);
      list = list.filter((v) =>
        norm(v.kenteken).includes(qn) ||
        v.merk.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allVehicles, locationFilter, search]);

  const blocks: GanttBlock[] = useMemo(() => {
    const result: GanttBlock[] = [];
    if (showContracts) {
      dbContracts.forEach((c: any) => {
        if (!c.voertuig_id) return;
        result.push({
          id: `con-${c.id}`,
          vehicleId: c.voertuig_id,
          start: parseISO(c.start_datum),
          end: parseISO(c.eind_datum),
          label: `${c.contract_nummer} · ${c.klant_naam || c.bedrijf || ""}`.trim(),
          sub: c.maandprijs ? `€ ${Number(c.maandprijs).toLocaleString("nl-NL")}/mnd · ${c.type}` : c.type,
          type: "contract",
          status: c.status,
          meta: c,
        });
      });
    }
    if (showReserveringen) {
      dbReserveringen.forEach((r: any) => {
        if (!r.voertuig_id) return;
        const naam = r.klanten ? `${r.klanten.voornaam ?? ""} ${r.klanten.achternaam ?? ""}`.trim() : "Reservering";
        result.push({
          id: `res-${r.id}`,
          vehicleId: r.voertuig_id,
          start: parseISO(r.start_datum),
          end: parseISO(r.eind_datum),
          label: naam,
          sub: r.totaalprijs ? `€ ${Number(r.totaalprijs).toLocaleString("nl-NL")} totaal` : undefined,
          type: "reservation",
          status: r.status,
          meta: r,
        });
      });
    }
    if (showOnderhoud) {
      dbOnderhoud.forEach((m: any) => {
        if (!m.voertuig_id || !m.datum) return;
        const d = parseISO(m.datum);
        if (!isValid(d)) return;
        result.push({
          id: `srv-${m.id}`,
          vehicleId: m.voertuig_id,
          start: d,
          end: d,
          label: m.omschrijving || m.type || "Onderhoud",
          sub: m.kosten ? `€ ${Number(m.kosten).toLocaleString("nl-NL")}` : undefined,
          type: "onderhoud",
          status: m.status,
          meta: m,
        });
      });
    }
    if (showBlokken) {
      planningBlokken.forEach((b) => {
        const s = parseISO(b.start_datum);
        const e = parseISO(b.eind_datum);
        if (!isValid(s) || !isValid(e)) return;
        if (e < startDate || s > endDate) return;
        result.push({
          id: `blk-${b.id}`,
          vehicleId: b.voertuig_id,
          start: s,
          end: e,
          label: b.titel,
          sub: b.notitie ?? undefined,
          type: "blok",
          kleur: b.kleur,
          meta: b,
        });
      });
    }
    return result;
  }, [dbContracts, dbReserveringen, dbOnderhoud, planningBlokken, showContracts, showReserveringen, showOnderhoud, showBlokken, startDate, endDate]);

  const openBlokDialog = (opts?: { blok?: PlanningBlok | null; voertuigId?: string; start?: string; eind?: string }) => {
    setEditingBlok(opts?.blok ?? null);
    setPrefillBlok({ voertuigId: opts?.voertuigId, start: opts?.start, eind: opts?.eind });
    setBlokDialogOpen(true);
  };

  const getDateForX = (x: number): Date => {
    const idx = Math.max(0, Math.min(DAYS_VISIBLE - 1, Math.floor(x / CELL_WIDTH)));
    return days[idx];
  };

  if (allVehicles.length === 0) {
    return (
      <div className="clean-card text-center py-16">
        <p className="text-muted-foreground">Voeg voertuigen toe om de tijdlijn te gebruiken.</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="clean-card overflow-hidden">
        {/* Toolbar */}
        <div className="px-4 py-3 border-b border-border space-y-2.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="icon" className="h-8 w-8" title="Vorige week" onClick={() => setWeekOffset((o) => o - 1)}><ChevronLeft className="w-4 h-4" /></Button>
              <Button variant="outline" size="sm" className="h-8" onClick={() => setWeekOffset(0)}>Vandaag</Button>
              <Button variant="outline" size="icon" className="h-8 w-8" title="Volgende week" onClick={() => setWeekOffset((o) => o + 1)}><ChevronRight className="w-4 h-4" /></Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8" title="Spring naar datum">
                    <CalendarIcon className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    onSelect={(d) => {
                      if (!d) return;
                      const diffWeeks = Math.round(differenceInDays(startOfWeek(d, { weekStartsOn: 1 }), startOfWeek(new Date(), { weekStartsOn: 1 })) / 7);
                      setWeekOffset(diffWeeks);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <span className="text-sm text-muted-foreground ml-2 hidden sm:inline">
                {format(startDate, "d MMM", { locale: nl })} · {format(endDate, "d MMM yyyy", { locale: nl })}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="flex items-center bg-muted rounded-md p-0.5">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                  const idx = ZOOM_PRESETS.findIndex(z => z.id === zoomId);
                  if (idx < ZOOM_PRESETS.length - 1) setZoomId(ZOOM_PRESETS[idx + 1].id);
                }} title="Inzoomen"><ZoomIn className="w-3.5 h-3.5" /></Button>
                <span className="text-[10px] font-medium px-1 text-muted-foreground w-14 text-center">{zoom.label}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                  const idx = ZOOM_PRESETS.findIndex(z => z.id === zoomId);
                  if (idx > 0) setZoomId(ZOOM_PRESETS[idx - 1].id);
                }} title="Uitzoomen"><ZoomOut className="w-3.5 h-3.5" /></Button>
              </div>
              <Button variant={dense ? "secondary" : "outline"} size="sm" className="h-8" onClick={() => setDense((d) => !d)}>
                {dense ? "Compact" : "Comfort"}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Zoek kenteken, merk of model" className="pl-8 h-8 text-xs" />
              </div>
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue placeholder="Locatie" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="alle">Alle locaties</SelectItem>
                  <SelectItem value="geen">Geen locatie</SelectItem>
                  {locaties.map((l) => (<SelectItem key={l.id} value={l.naam}>{l.naam}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] flex-wrap">
              <LegendToggle on={showContracts} setOn={setShowContracts} swatch="bg-primary/75" label="Contracten" />
              <LegendToggle on={showReserveringen} setOn={setShowReserveringen} swatch="bg-info/75" label="Reserveringen" />
              <LegendToggle on={showOnderhoud} setOn={setShowOnderhoud} swatch="bg-destructive/70" label="Onderhoud" />
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="overflow-x-auto" ref={scrollRef}>
          <div className="flex min-w-fit">
            {/* Sticky vehicle column */}
            <div className="sticky left-0 z-10 bg-background border-r border-border shrink-0" style={{ width: 220 }}>
              <div className="h-10 border-b border-border flex items-center px-3 text-[11px] font-semibold text-muted-foreground">
                {filteredVehicles.length} voertuigen
              </div>
              {filteredVehicles.map((v) => {
                const effectiveStatus = getEffectiveStatus(v, blocks);
                const apkSoon = v.apkVervaldatum && (() => {
                  const d = parseISO(v.apkVervaldatum);
                  if (!isValid(d)) return false;
                  const days = differenceInDays(d, new Date());
                  return days >= 0 && days <= 60;
                })();
                return (
                  <ContextMenu key={v.id}>
                    <ContextMenuTrigger asChild>
                      <div
                        className="flex items-center gap-2 px-3 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors"
                        style={{ height: ROW_HEIGHT }}
                        onClick={() => onSelectVehicle?.(v)}
                      >
                        <div className="min-w-0 flex-1">
                          <p className={cn("font-medium text-foreground truncate", dense ? "text-[11px]" : "text-xs")}>{v.merk} {v.model}</p>
                          {!dense && <p className="text-[10px] text-muted-foreground font-mono">{v.kenteken}</p>}
                        </div>
                        {apkSoon && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <ShieldAlert className="w-3.5 h-3.5 text-warning shrink-0" />
                            </TooltipTrigger>
                            <TooltipContent>APK vervalt {v.apkVervaldatum}</TooltipContent>
                          </Tooltip>
                        )}
                        <StatusBadge status={effectiveStatus} variant={getStatusColor(effectiveStatus)} />
                      </div>
                    </ContextMenuTrigger>
                    <VehicleContextMenu vehicle={v} onSelectVehicle={onSelectVehicle} onCreateContract={onCreateContract} onReturnVehicle={onReturnVehicle} onCreateKlant={onCreateKlant} />
                  </ContextMenu>
                );
              })}
            </div>

            {/* Day rail + rows */}
            <div className="relative flex-1">
              {/* Day header */}
              <div className="flex border-b border-border h-10">
                {days.map((d, i) => {
                  const isToday = format(d, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  const isMonthStart = d.getDate() === 1;
                  return (
                    <div key={i} className={cn(
                      "shrink-0 flex flex-col items-center justify-center border-r border-border text-[10px]",
                      isToday && "bg-primary/10 font-bold text-primary",
                      isWeekend && !isToday && "bg-muted/50 text-muted-foreground",
                      isMonthStart && "border-l-2 border-l-primary/40",
                    )} style={{ width: CELL_WIDTH }}>
                      <span>{format(d, CELL_WIDTH < 30 ? "EEEEE" : "EEE", { locale: nl })}</span>
                      <span>{format(d, "d")}</span>
                    </div>
                  );
                })}
              </div>

              {/* Vehicle rows */}
              {filteredVehicles.map((v) => {
                const vehicleBlocks = blocks.filter((b) => b.vehicleId === v.id);
                const apkD = v.apkVervaldatum ? parseISO(v.apkVervaldatum) : null;
                const apkInRange = apkD && isValid(apkD) && differenceInDays(apkD, startDate) >= 0 && differenceInDays(apkD, startDate) < DAYS_VISIBLE;
                return (
                  <ContextMenu key={v.id}>
                    <ContextMenuTrigger asChild>
                      <div
                        className="relative border-b border-border cursor-context-menu group"
                        style={{ height: ROW_HEIGHT }}
                        onDoubleClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const x = e.clientX - rect.left;
                          const date = getDateForX(x);
                          onCreateContract?.(v, { startDate: date, endDate: addDays(date, 1) });
                        }}
                      >
                        <div className="absolute inset-0 flex">
                          {days.map((d, i) => {
                            const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                            const isToday = format(d, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
                            return (
                              <div
                                key={i}
                                className={cn(
                                  "shrink-0 border-r border-border hover:bg-primary/5 transition-colors",
                                  isWeekend && "bg-muted/30",
                                  isToday && "bg-primary/5",
                                )}
                                style={{ width: CELL_WIDTH }}
                                title={format(d, "EEEE d MMM yyyy", { locale: nl })}
                              />
                            );
                          })}
                        </div>

                        {/* APK marker */}
                        {apkInRange && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className="absolute top-0 bottom-0 w-0.5 bg-warning z-[1] pointer-events-auto cursor-help"
                                style={{ left: differenceInDays(apkD!, startDate) * CELL_WIDTH + CELL_WIDTH / 2 }}
                              >
                                <ShieldAlert className="w-3 h-3 text-warning absolute -top-0.5 -translate-x-1/2 left-0 bg-background rounded" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>APK vervalt {v.apkVervaldatum}</TooltipContent>
                          </Tooltip>
                        )}

                        {/* Blocks */}
                        {vehicleBlocks.map((block) => {
                          const blockStart = differenceInDays(block.start, startDate);
                          const blockEnd = differenceInDays(block.end, startDate);
                          const clampedStart = Math.max(0, blockStart);
                          const clampedEnd = Math.min(DAYS_VISIBLE - 1, blockEnd);
                          if (clampedStart > DAYS_VISIBLE - 1 || clampedEnd < 0) return null;
                          const left = clampedStart * CELL_WIDTH;
                          const width = (clampedEnd - clampedStart + 1) * CELL_WIDTH - 4;
                          const isOnderhoud = block.type === "onderhoud";
                          const isBlok = block.type === "blok";
                          return (
                            <ContextMenu key={block.id}>
                              <ContextMenuTrigger asChild>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (block.type === "contract") onSelectVehicle?.(v);
                                        if (isBlok) openBlokDialog({ blok: block.meta as PlanningBlok });
                                      }}
                                      className={cn(
                                        "absolute rounded-md border text-[10px] font-medium px-1.5 flex items-center truncate z-[2] shadow-sm hover:shadow-md transition-all",
                                        !isBlok && getBlockStyles(block.type, block.status),
                                        isBlok && "text-white border-transparent",
                                        isOnderhoud && "rounded-full",
                                      )}
                                      style={{
                                        top: dense ? 4 : 6,
                                        left: left + 2,
                                        width: Math.max(width, isOnderhoud ? CELL_WIDTH - 6 : 18),
                                        height: ROW_HEIGHT - (dense ? 8 : 12),
                                        ...(isBlok && block.kleur ? { background: block.kleur, borderColor: block.kleur } : {}),
                                      }}
                                    >
                                      {isOnderhoud ? <Wrench className="w-3 h-3" /> : <span className="truncate">{block.label}</span>}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs">
                                    <div className="space-y-0.5">
                                      <p className="font-semibold">{block.label}</p>
                                      {block.sub && <p className="text-xs opacity-80">{block.sub}</p>}
                                      <p className="text-[11px] text-muted-foreground">
                                        {format(block.start, "d MMM", { locale: nl })}{" "}
                                        {block.start.getTime() !== block.end.getTime() && `tot ${format(block.end, "d MMM yyyy", { locale: nl })}`}
                                      </p>
                                      {block.status && <p className="text-[10px] uppercase tracking-wide">{block.status}</p>}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </ContextMenuTrigger>
                              <BlockContextMenu block={block} vehicle={v} onSelectVehicle={onSelectVehicle} onEditBlok={(b) => openBlokDialog({ blok: b })} />
                            </ContextMenu>
                          );
                        })}
                      </div>
                    </ContextMenuTrigger>
                    <RowContextMenu
                      vehicle={v}
                      getDate={getDateForX}
                      onSelectVehicle={onSelectVehicle}
                      onCreateContract={onCreateContract}
                      onCreateKlant={onCreateKlant}
                      onReturnVehicle={onReturnVehicle}
                      onCreateBlok={(d) => openBlokDialog({ voertuigId: v.id, start: format(d, "yyyy-MM-dd"), eind: format(d, "yyyy-MM-dd") })}
                    />
                  </ContextMenu>
                );
              })}

              {/* Today line */}
              {(() => {
                const todayOffset = differenceInDays(new Date(), startDate);
                if (todayOffset < 0 || todayOffset >= DAYS_VISIBLE) return null;
                return (<div className="absolute top-0 bottom-0 w-0.5 bg-primary z-[3] pointer-events-none" style={{ left: todayOffset * CELL_WIDTH + CELL_WIDTH / 2 }} />);
              })()}
            </div>
          </div>
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-border text-[11px] text-muted-foreground flex items-center gap-3 flex-wrap">
          <span>Tip: dubbelklik op een lege cel om een contract te starten op die datum.</span>
          <span className="opacity-60">·</span>
          <span>Rechtermuisknop voor meer acties.</span>
        </div>
      </div>
      <PlanningBlokDialog
        open={blokDialogOpen}
        onOpenChange={setBlokDialogOpen}
        blok={editingBlok}
        prefillVoertuigId={prefillBlok.voertuigId ?? null}
        prefillStart={prefillBlok.start ?? null}
        prefillEind={prefillBlok.eind ?? null}
      />
    </TooltipProvider>
  );
}

function LegendToggle({ on, setOn, swatch, label }: { on: boolean; setOn: (v: boolean) => void; swatch: string; label: string }) {
  return (
    <button
      onClick={() => setOn(!on)}
      className={cn(
        "flex items-center gap-1.5 px-2 py-1 rounded-md border transition-colors",
        on ? "bg-background border-border text-foreground" : "bg-muted/40 border-transparent text-muted-foreground line-through opacity-60"
      )}
    >
      <span className={cn("w-2.5 h-2.5 rounded", swatch)} />
      {label}
    </button>
  );
}

function VehicleContextMenu({
  vehicle, onSelectVehicle, onCreateContract, onReturnVehicle, onCreateKlant,
}: {
  vehicle: Vehicle;
  onSelectVehicle?: (v: Vehicle) => void;
  onCreateContract?: (v: Vehicle, opts?: { startDate?: Date; endDate?: Date }) => void;
  onReturnVehicle?: (v: Vehicle) => void;
  onCreateKlant?: (v: Vehicle) => void;
}) {
  return (
    <ContextMenuContent className="w-56">
      <ContextMenuLabel className="text-[11px] truncate">{vehicle.merk} {vehicle.model} · {vehicle.kenteken}</ContextMenuLabel>
      <ContextMenuSeparator />
      <ContextMenuItem onClick={() => onSelectVehicle?.(vehicle)} className="gap-2"><Eye className="w-3.5 h-3.5" />Voertuig openen</ContextMenuItem>
      <ContextMenuItem onClick={() => onCreateContract?.(vehicle)} className="gap-2"><FileText className="w-3.5 h-3.5" />Contract aanmaken</ContextMenuItem>
      <ContextMenuItem onClick={() => onCreateKlant?.(vehicle)} className="gap-2"><UserPlus className="w-3.5 h-3.5" />Nieuwe klant aanmaken</ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem onClick={() => onReturnVehicle?.(vehicle)} className="gap-2"><RotateCcw className="w-3.5 h-3.5" />Terugmelden</ContextMenuItem>
      <ContextMenuItem onClick={() => {
        navigator.clipboard.writeText(vehicle.kenteken);
        toast({ title: "Gekopieerd", description: `Kenteken ${vehicle.kenteken} gekopieerd` });
      }} className="gap-2"><Copy className="w-3.5 h-3.5" />Kopieer kenteken</ContextMenuItem>
    </ContextMenuContent>
  );
}

function RowContextMenu({
  vehicle, getDate, onSelectVehicle, onCreateContract, onCreateKlant, onReturnVehicle,
}: {
  vehicle: Vehicle;
  getDate: (x: number) => Date;
  onSelectVehicle?: (v: Vehicle) => void;
  onCreateContract?: (v: Vehicle, opts?: { startDate?: Date; endDate?: Date }) => void;
  onCreateKlant?: (v: Vehicle) => void;
  onReturnVehicle?: (v: Vehicle) => void;
}) {
  // Achterhaal de datum waarop is geklikt via een data-attribute zou ideaal zijn,
  // maar context menu's geven geen eventcoords. We bieden snelle datumkeuzes aan.
  const today = new Date();
  return (
    <ContextMenuContent className="w-56">
      <ContextMenuLabel className="text-[11px] truncate">{vehicle.merk} {vehicle.model} · {vehicle.kenteken}</ContextMenuLabel>
      <ContextMenuSeparator />
      <ContextMenuSub>
        <ContextMenuSubTrigger className="gap-2"><CalendarPlus className="w-3.5 h-3.5" />Plan contract...</ContextMenuSubTrigger>
        <ContextMenuSubContent>
          <ContextMenuItem onClick={() => onCreateContract?.(vehicle, { startDate: today, endDate: addDays(today, 1) })}>Vandaag (1 dag)</ContextMenuItem>
          <ContextMenuItem onClick={() => onCreateContract?.(vehicle, { startDate: today, endDate: addDays(today, 2) })}>Vandaag (weekend)</ContextMenuItem>
          <ContextMenuItem onClick={() => onCreateContract?.(vehicle, { startDate: today, endDate: addDays(today, 6) })}>Vandaag (1 week)</ContextMenuItem>
          <ContextMenuItem onClick={() => onCreateContract?.(vehicle, { startDate: addDays(today, 1), endDate: addDays(today, 1) })}>Morgen (1 dag)</ContextMenuItem>
          <ContextMenuItem onClick={() => onCreateContract?.(vehicle)}>Eigen periode kiezen</ContextMenuItem>
        </ContextMenuSubContent>
      </ContextMenuSub>
      <ContextMenuItem onClick={() => onCreateKlant?.(vehicle)} className="gap-2"><UserPlus className="w-3.5 h-3.5" />Nieuwe klant aanmaken</ContextMenuItem>
      <ContextMenuItem onClick={() => onSelectVehicle?.(vehicle)} className="gap-2"><Eye className="w-3.5 h-3.5" />Voertuig openen</ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem onClick={() => onReturnVehicle?.(vehicle)} className="gap-2"><RotateCcw className="w-3.5 h-3.5" />Terugmelden</ContextMenuItem>
    </ContextMenuContent>
  );
}

function BlockContextMenu({
  block, vehicle, onSelectVehicle,
}: { block: GanttBlock; vehicle: Vehicle; onSelectVehicle?: (v: Vehicle) => void }) {
  return (
    <ContextMenuContent className="w-56">
      <ContextMenuLabel className="text-[11px] truncate">{block.label}</ContextMenuLabel>
      <ContextMenuSeparator />
      <ContextMenuItem onClick={() => onSelectVehicle?.(vehicle)} className="gap-2"><Eye className="w-3.5 h-3.5" />Open voertuig</ContextMenuItem>
      {block.type === "contract" && (
        <ContextMenuItem onClick={() => window.location.href = `/contracts?id=${block.meta?.id}`} className="gap-2"><FileText className="w-3.5 h-3.5" />Open contract</ContextMenuItem>
      )}
      {block.type === "reservation" && (
        <ContextMenuItem onClick={() => window.location.href = "/reserveringen"} className="gap-2"><CalendarPlus className="w-3.5 h-3.5" />Open reserveringen</ContextMenuItem>
      )}
      {block.type === "onderhoud" && (
        <ContextMenuItem onClick={() => window.location.href = "/onderhoud"} className="gap-2"><Wrench className="w-3.5 h-3.5" />Open onderhoud</ContextMenuItem>
      )}
    </ContextMenuContent>
  );
}
