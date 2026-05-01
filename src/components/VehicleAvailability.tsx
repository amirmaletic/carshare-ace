import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, startOfWeek, differenceInDays, addWeeks, isWithinInterval, isAfter } from "date-fns";
import { nl } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CheckCircle2, Clock, Plus, CalendarRange, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ReservationForm } from "@/components/ReservationForm";
import { ContractForm } from "@/components/ContractForm";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

const ROW_HEIGHT = 36;
const DAYS_VISIBLE = 28;

interface Block {
  id: string;
  start: Date;
  end: Date;
  label: string;
  type: "contract" | "reservation";
  status?: string;
}

interface VehicleAvailabilityProps {
  voertuigId: string;
}

export function VehicleAvailability({ voertuigId }: VehicleAvailabilityProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [contractOpen, setContractOpen] = useState(false);
  const [prefillStart, setPrefillStart] = useState<string | undefined>(undefined);
  const [prefillEnd, setPrefillEnd] = useState<string | undefined>(undefined);

  // Drag selectie
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const rowRef = useRef<HTMLDivElement | null>(null);

  const startDate = useMemo(
    () => startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 }),
    [weekOffset]
  );
  const days = useMemo(
    () => Array.from({ length: DAYS_VISIBLE }, (_, i) => addDays(startDate, i)),
    [startDate]
  );

  const { data: contracts = [] } = useQuery({
    queryKey: ["vehicle-availability", "contracts", voertuigId],
    queryFn: async () => {
      const { data } = await supabase
        .from("contracts")
        .select("id, klant_naam, start_datum, eind_datum, status, contract_nummer")
        .eq("voertuig_id", voertuigId)
        .in("status", ["actief", "concept"])
        .order("start_datum", { ascending: true });
      return data || [];
    },
  });

  const { data: reserveringen = [] } = useQuery({
    queryKey: ["vehicle-availability", "reserveringen", voertuigId],
    queryFn: async () => {
      const { data } = await supabase
        .from("reserveringen")
        .select("id, start_datum, eind_datum, status, klanten(voornaam, achternaam)")
        .eq("voertuig_id", voertuigId)
        .in("status", ["aangevraagd", "bevestigd", "actief"])
        .order("start_datum", { ascending: true });
      return data || [];
    },
  });

  const blocks: Block[] = useMemo(() => {
    const result: Block[] = [];
    contracts.forEach((c: any) => {
      result.push({
        id: `con-${c.id}`,
        start: new Date(c.start_datum),
        end: new Date(c.eind_datum),
        label: `${c.contract_nummer} · ${c.klant_naam}`,
        type: "contract",
        status: c.status,
      });
    });
    reserveringen.forEach((r: any) => {
      result.push({
        id: `res-${r.id}`,
        start: new Date(r.start_datum),
        end: new Date(r.eind_datum),
        label: `${r.klanten?.voornaam ?? ""} ${r.klanten?.achternaam ?? ""}`.trim() || "Reservering",
        type: "reservation",
        status: r.status,
      });
    });
    return result.sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [contracts, reserveringen]);

  // Status-tekst bepalen
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const activeBlock = blocks.find((b) => isWithinInterval(today, { start: b.start, end: b.end }));
  const nextBlock = blocks.find((b) => isAfter(b.start, today));

  let statusBanner: { tone: "available" | "rented" | "soon"; title: string; sub?: string };
  if (activeBlock) {
    statusBanner = {
      tone: "rented",
      title: "Verhuurd",
      sub: `Beschikbaar vanaf ${format(addDays(activeBlock.end, 1), "EEEE d MMMM yyyy", { locale: nl })}`,
    };
  } else if (nextBlock) {
    statusBanner = {
      tone: "soon",
      title: "Nu beschikbaar",
      sub: `Volgende verhuur: ${format(nextBlock.start, "d MMM", { locale: nl })} tot ${format(nextBlock.end, "d MMM yyyy", { locale: nl })}`,
    };
  } else {
    statusBanner = { tone: "available", title: "Nu beschikbaar", sub: "Geen geplande verhuur" };
  }

  const endDate = days[days.length - 1];

  const selStart = dragStart !== null && dragEnd !== null ? Math.min(dragStart, dragEnd) : null;
  const selEnd = dragStart !== null && dragEnd !== null ? Math.max(dragStart, dragEnd) : null;
  const hasSelection = selStart !== null && selEnd !== null;

  const selectionStartDate = hasSelection ? days[selStart!] : null;
  const selectionEndDate = hasSelection ? days[selEnd!] : null;
  const selectionDays = hasSelection ? selEnd! - selStart! + 1 : 0;

  const formatIso = (d: Date) => format(d, "yyyy-MM-dd");

  const openReservation = () => {
    if (!selectionStartDate || !selectionEndDate) return;
    setPrefillStart(formatIso(selectionStartDate));
    setPrefillEnd(formatIso(selectionEndDate));
    setFormOpen(true);
  };

  const openContract = () => {
    if (!selectionStartDate || !selectionEndDate) return;
    setPrefillStart(formatIso(selectionStartDate));
    setPrefillEnd(formatIso(selectionEndDate));
    setContractOpen(true);
  };

  const clearSelection = () => {
    setDragStart(null);
    setDragEnd(null);
  };

  const dayIndexFromEvent = (e: React.MouseEvent | React.PointerEvent) => {
    const el = rowRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const idx = Math.floor(x / CELL_WIDTH);
    return Math.max(0, Math.min(DAYS_VISIBLE - 1, idx));
  };

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "rounded-lg p-4 flex items-center gap-3 border",
          statusBanner.tone === "rented" && "bg-warning/10 border-warning/30",
          statusBanner.tone === "soon" && "bg-info/10 border-info/30",
          statusBanner.tone === "available" && "bg-success/10 border-success/30"
        )}
      >
        {statusBanner.tone === "rented" ? (
          <Clock className="w-5 h-5 text-warning shrink-0" />
        ) : (
          <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground">{statusBanner.title}</p>
          {statusBanner.sub && <p className="text-xs text-muted-foreground mt-0.5">{statusBanner.sub}</p>}
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setFormOpen(true)}>
          <Plus className="w-3.5 h-3.5" /> Reserveren
        </Button>
      </div>

      {hasSelection && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 flex items-center gap-2 flex-wrap">
          <CalendarRange className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium text-foreground">
            {format(selectionStartDate!, "d MMM", { locale: nl })} tot {format(selectionEndDate!, "d MMM yyyy", { locale: nl })}
            <span className="text-muted-foreground ml-1">({selectionDays} dagen)</span>
          </span>
          <div className="ml-auto flex gap-1.5">
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={openReservation}>
              <CalendarRange className="w-3 h-3" /> Reservering
            </Button>
            <Button size="sm" className="h-7 text-xs gap-1" onClick={openContract}>
              <FileText className="w-3 h-3" /> Contract
            </Button>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={clearSelection}>
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}

      <div className="border border-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setWeekOffset((o) => o - 1)}>
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>
          <p className="text-xs font-medium text-foreground">
            {format(startDate, "d MMM", { locale: nl })} tot {format(endDate, "d MMM yyyy", { locale: nl })}
          </p>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setWeekOffset(0)}>Vandaag</Button>
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setWeekOffset((o) => o + 1)}>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-fit">
            <div className="flex border-b border-border h-8">
              {days.map((d, i) => {
                const isToday = format(d, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                return (
                  <div
                    key={i}
                    className={cn(
                      "shrink-0 flex flex-col items-center justify-center border-r border-border text-[9px]",
                      isToday && "bg-primary/10 font-bold text-primary",
                      isWeekend && !isToday && "bg-muted/40 text-muted-foreground"
                    )}
                    style={{ width: CELL_WIDTH }}
                  >
                    <span>{format(d, "d")}</span>
                  </div>
                );
              })}
            </div>

            <ContextMenu>
              <ContextMenuTrigger asChild>
                <div
                  ref={rowRef}
                  className="relative select-none cursor-crosshair"
                  style={{ height: ROW_HEIGHT }}
                  onPointerDown={(e) => {
                    if (e.button !== 0) return;
                    const idx = dayIndexFromEvent(e);
                    if (idx === null) return;
                    setDragStart(idx);
                    setDragEnd(idx);
                    setIsDragging(true);
                    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
                  }}
                  onPointerMove={(e) => {
                    if (!isDragging) return;
                    const idx = dayIndexFromEvent(e);
                    if (idx === null) return;
                    setDragEnd(idx);
                  }}
                  onPointerUp={() => setIsDragging(false)}
                  onContextMenu={(e) => {
                    if (!hasSelection) {
                      const idx = dayIndexFromEvent(e);
                      if (idx !== null) {
                        setDragStart(idx);
                        setDragEnd(idx);
                      }
                    }
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
                        "shrink-0 border-r border-border",
                        isWeekend && "bg-muted/20",
                        isToday && "bg-primary/5"
                      )}
                      style={{ width: CELL_WIDTH }}
                    />
                  );
                })}
              </div>
              {hasSelection && (
                <div
                  className="absolute top-0 bottom-0 bg-primary/15 border-x-2 border-primary pointer-events-none z-[1]"
                  style={{
                    left: selStart! * CELL_WIDTH,
                    width: (selEnd! - selStart! + 1) * CELL_WIDTH,
                  }}
                />
              )}
              {blocks.map((block) => {
                const blockStart = differenceInDays(block.start, startDate);
                const blockEnd = differenceInDays(block.end, startDate);
                const clampedStart = Math.max(0, blockStart);
                const clampedEnd = Math.min(DAYS_VISIBLE - 1, blockEnd);
                if (clampedStart > DAYS_VISIBLE - 1 || clampedEnd < 0) return null;
                const left = clampedStart * CELL_WIDTH;
                const width = (clampedEnd - clampedStart + 1) * CELL_WIDTH - 4;
                const color =
                  block.type === "reservation"
                    ? "bg-info/70 border-info text-info-foreground"
                    : block.status === "concept"
                    ? "bg-warning/70 border-warning text-warning-foreground"
                    : "bg-primary/70 border-primary text-primary-foreground";
                return (
                  <div
                    key={block.id}
                    className={cn(
                      "absolute top-1.5 rounded-md border text-[10px] font-medium px-1.5 flex items-center truncate shadow-sm",
                      color
                    )}
                    style={{ left: left + 2, width: Math.max(width, 18), height: ROW_HEIGHT - 12 }}
                    title={`${block.label}\n${format(block.start, "d MMM yyyy", { locale: nl })} tot ${format(block.end, "d MMM yyyy", { locale: nl })}`}
                  >
                    <span className="truncate">{block.label}</span>
                  </div>
                );
              })}
              {(() => {
                const todayOffset = differenceInDays(today, startDate);
                if (todayOffset < 0 || todayOffset >= DAYS_VISIBLE) return null;
                return (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-primary z-[2]"
                    style={{ left: todayOffset * CELL_WIDTH + CELL_WIDTH / 2 }}
                  />
                );
              })()}
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent className="w-56">
                {hasSelection ? (
                  <>
                    <div className="px-2 py-1.5 text-[11px] text-muted-foreground">
                      {format(selectionStartDate!, "d MMM", { locale: nl })} tot {format(selectionEndDate!, "d MMM", { locale: nl })}
                      <span className="ml-1">({selectionDays}d)</span>
                    </div>
                    <ContextMenuSeparator />
                    <ContextMenuItem onSelect={openReservation} className="gap-2">
                      <CalendarRange className="w-4 h-4" /> Reservering aanmaken
                    </ContextMenuItem>
                    <ContextMenuItem onSelect={openContract} className="gap-2">
                      <FileText className="w-4 h-4" /> Contract aanmaken
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem onSelect={clearSelection} className="gap-2 text-muted-foreground">
                      <X className="w-4 h-4" /> Selectie wissen
                    </ContextMenuItem>
                  </>
                ) : (
                  <ContextMenuItem disabled>Sleep eerst over een periode</ContextMenuItem>
                )}
              </ContextMenuContent>
            </ContextMenu>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[10px] text-muted-foreground px-3 py-2 border-t border-border bg-muted/20">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-primary/70" />Contract</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-warning/70" />Concept</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-info/70" />Reservering</span>
          <span className="ml-auto text-muted-foreground/80 italic">Sleep om periode te kiezen · rechtsklik voor opties</span>
        </div>
      </div>

      <ReservationForm
        open={formOpen}
        onOpenChange={setFormOpen}
        prefilledVehicleId={voertuigId}
        prefilledStartDatum={prefillStart}
        prefilledEindDatum={prefillEnd}
      />
      <ContractForm
        open={contractOpen}
        onOpenChange={setContractOpen}
        prefilledVehicleId={voertuigId}
        prefilledStartDatum={prefillStart}
        prefilledEindDatum={prefillEnd}
      />
    </div>
  );
}