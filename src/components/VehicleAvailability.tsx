import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, startOfWeek, differenceInDays, addWeeks, isWithinInterval, isAfter } from "date-fns";
import { nl } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CheckCircle2, Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ReservationForm } from "@/components/ReservationForm";

const CELL_WIDTH = 28;
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

            <div className="relative" style={{ height: ROW_HEIGHT }}>
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
          </div>
        </div>

        <div className="flex items-center gap-3 text-[10px] text-muted-foreground px-3 py-2 border-t border-border bg-muted/20">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-primary/70" />Contract</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-warning/70" />Concept</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-info/70" />Reservering</span>
        </div>
      </div>

      <ReservationForm open={formOpen} onOpenChange={setFormOpen} prefilledVehicleId={voertuigId} />
    </div>
  );
}