import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { type Vehicle } from "@/data/mockData";
import { useVoertuigen } from "@/hooks/useVoertuigen";
import { useLocaties } from "@/hooks/useLocaties";
import { StatusBadge } from "@/components/StatusBadge";
import { getStatusColor } from "@/data/mockData";
import { ChevronLeft, ChevronRight, Eye, FileText, RotateCcw, Plus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format, addDays, startOfWeek, differenceInDays, isWithinInterval, addWeeks } from "date-fns";
import { nl } from "date-fns/locale";
import {
  ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface GanttBlock {
  id: string;
  vehicleId: string;
  start: Date;
  end: Date;
  label: string;
  type: "contract" | "reservation" | "onderhoud";
}

const CELL_WIDTH = 36;
const ROW_HEIGHT = 44;
const DAYS_VISIBLE = 28;

function getBlockColor(type: GanttBlock["type"], status?: string) {
  switch (type) {
    case "contract":
      return status === "concept"
        ? "bg-warning/70 border-warning text-warning-foreground"
        : "bg-primary/70 border-primary text-primary-foreground";
    case "reservation":
      return "bg-info/70 border-info text-info-foreground";
    case "onderhoud":
      return "bg-destructive/70 border-destructive text-destructive-foreground";
  }
}

function getEffectiveStatus(vehicle: Vehicle, blocks: GanttBlock[]): Vehicle["status"] {
  const today = new Date();
  const hasActiveBlock = blocks.some(
    (b) => b.vehicleId === vehicle.id && b.type === "contract" && isWithinInterval(today, { start: b.start, end: b.end })
  );
  if (hasActiveBlock) return "verhuurd";
  if (vehicle.status === "onderhoud") return "onderhoud";
  return vehicle.status;
}

interface VehicleGanttProps {
  onSelectVehicle?: (vehicle: Vehicle) => void;
  onReturnVehicle?: (vehicle: Vehicle) => void;
  onCreateContract?: (vehicle: Vehicle) => void;
}

export function VehicleGantt({ onSelectVehicle, onReturnVehicle, onCreateContract }: VehicleGanttProps) {
  const { user } = useAuth();
  const { voertuigen: dbVoertuigen } = useVoertuigen();
  const { locaties } = useLocaties();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [locationFilter, setLocationFilter] = useState<string>("alle");

  const startDate = useMemo(
    () => startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 }),
    [weekOffset]
  );
  const days = useMemo(
    () => Array.from({ length: DAYS_VISIBLE }, (_, i) => addDays(startDate, i)),
    [startDate]
  );

  const { data: dbContracts = [] } = useQuery({
    queryKey: ["gantt-contracts"],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("contracts")
        .select("id, voertuig_id, klant_naam, start_datum, eind_datum, status, contract_nummer")
        .in("status", ["actief", "concept"]);
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
    if (locationFilter === "alle") return allVehicles;
    if (locationFilter === "geen") return allVehicles.filter(v => !v._locatie);
    return allVehicles.filter(v => v._locatie === locationFilter);
  }, [allVehicles, locationFilter]);

  const blocks: GanttBlock[] = useMemo(() => {
    const result: GanttBlock[] = [];
    dbContracts.forEach((c: any) => {
      if (!c.voertuig_id) return;
      result.push({
        id: `con-${c.id}`,
        vehicleId: c.voertuig_id,
        start: new Date(c.start_datum),
        end: new Date(c.eind_datum),
        label: `${c.contract_nummer} · ${c.klant_naam}`,
        type: "contract",
      });
    });
    return result;
  }, [dbContracts]);

  const endDate = days[days.length - 1];

  if (allVehicles.length === 0) {
    return (
      <div className="clean-card text-center py-16">
        <p className="text-muted-foreground">Voeg voertuigen toe om de tijdlijn te gebruiken.</p>
      </div>
    );
  }

  return (
    <div className="clean-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekOffset((o) => o - 1)}><ChevronLeft className="w-4 h-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)}>Vandaag</Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekOffset((o) => o + 1)}><ChevronRight className="w-4 h-4" /></Button>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="h-8 w-[160px] text-xs"><SelectValue placeholder="Alle locaties" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="alle">Alle locaties</SelectItem>
              <SelectItem value="geen">Geen locatie</SelectItem>
              {locaties.map((l) => (<SelectItem key={l.id} value={l.naam}>{l.naam}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground">
          {format(startDate, "d MMM", { locale: nl })} tot {format(endDate, "d MMM yyyy", { locale: nl })}
        </p>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-primary/70" /> Contract</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-warning/70" /> Concept</span>
        </div>
      </div>

      <div className="overflow-x-auto" ref={scrollRef}>
        <div className="flex min-w-fit">
          <div className="sticky left-0 z-10 bg-background border-r border-border shrink-0" style={{ width: 220 }}>
            <div className="h-10 border-b border-border" />
            {filteredVehicles.map((v) => {
              const effectiveStatus = getEffectiveStatus(v, blocks);
              return (
                <ContextMenu key={v.id}>
                  <ContextMenuTrigger asChild>
                    <div
                      className="flex items-center gap-2 px-3 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors"
                      style={{ height: ROW_HEIGHT }}
                      onClick={() => onSelectVehicle?.(v)}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-foreground truncate">{v.merk} {v.model}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{v.kenteken}</p>
                      </div>
                      <StatusBadge status={effectiveStatus} variant={getStatusColor(effectiveStatus)} />
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onClick={() => onSelectVehicle?.(v)} className="gap-2"><Eye className="w-3.5 h-3.5" />Voertuig openen</ContextMenuItem>
                    <ContextMenuItem onClick={() => onCreateContract?.(v)} className="gap-2"><FileText className="w-3.5 h-3.5" />Contract aanmaken</ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem onClick={() => onReturnVehicle?.(v)} className="gap-2"><RotateCcw className="w-3.5 h-3.5" />Terugmelden</ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              );
            })}
          </div>

          <div className="relative flex-1">
            <div className="flex border-b border-border h-10">
              {days.map((d, i) => {
                const isToday = format(d, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                return (
                  <div key={i} className={cn("shrink-0 flex flex-col items-center justify-center border-r border-border text-[10px]", isToday && "bg-primary/10 font-bold text-primary", isWeekend && !isToday && "bg-muted/50 text-muted-foreground")} style={{ width: CELL_WIDTH }}>
                    <span>{format(d, "EEE", { locale: nl })}</span>
                    <span>{format(d, "d")}</span>
                  </div>
                );
              })}
            </div>

            {filteredVehicles.map((v) => {
              const vehicleBlocks = blocks.filter((b) => b.vehicleId === v.id);
              return (
                <ContextMenu key={v.id}>
                  <ContextMenuTrigger asChild>
                    <div className="relative border-b border-border cursor-context-menu" style={{ height: ROW_HEIGHT }}>
                      <div className="absolute inset-0 flex">
                    {days.map((d, i) => {
                      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                      const isToday = format(d, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
                      return (<div key={i} className={cn("shrink-0 border-r border-border", isWeekend && "bg-muted/30", isToday && "bg-primary/5")} style={{ width: CELL_WIDTH }} />);
                    })}
                      </div>
                  {vehicleBlocks.map((block) => {
                    const blockStart = differenceInDays(block.start, startDate);
                    const blockEnd = differenceInDays(block.end, startDate);
                    const clampedStart = Math.max(0, blockStart);
                    const clampedEnd = Math.min(DAYS_VISIBLE - 1, blockEnd);
                    if (clampedStart > DAYS_VISIBLE - 1 || clampedEnd < 0) return null;
                    const left = clampedStart * CELL_WIDTH;
                    const width = (clampedEnd - clampedStart + 1) * CELL_WIDTH - 4;
                    const contractStatus = block.id.startsWith("con-") ? dbContracts.find((c: any) => `con-${c.id}` === block.id)?.status : undefined;
                    return (
                      <div key={block.id} className={cn("absolute top-1.5 rounded-md border text-[10px] font-medium px-1.5 flex items-center truncate z-[1] shadow-sm", getBlockColor(block.type, contractStatus))} style={{ left: left + 2, width: Math.max(width, 18), height: ROW_HEIGHT - 12 }} title={`${block.label}\n${format(block.start, "d MMM yyyy", { locale: nl })} tot ${format(block.end, "d MMM yyyy", { locale: nl })}`}>
                        <span className="truncate">{block.label}</span>
                      </div>
                    );
                  })}
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onClick={() => onSelectVehicle?.(v)} className="gap-2"><Eye className="w-3.5 h-3.5" />Voertuig openen</ContextMenuItem>
                    <ContextMenuItem onClick={() => onCreateContract?.(v)} className="gap-2"><FileText className="w-3.5 h-3.5" />Contract aanmaken</ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem onClick={() => onReturnVehicle?.(v)} className="gap-2"><RotateCcw className="w-3.5 h-3.5" />Terugmelden</ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              );
            })}

            {(() => {
              const todayOffset = differenceInDays(new Date(), startDate);
              if (todayOffset < 0 || todayOffset >= DAYS_VISIBLE) return null;
              return (<div className="absolute top-0 bottom-0 w-0.5 bg-primary z-[2]" style={{ left: todayOffset * CELL_WIDTH + CELL_WIDTH / 2 }} />);
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
