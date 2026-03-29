import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { vehicles as mockVehicles, reservations, type Vehicle } from "@/data/mockData";
import { useVoertuigen } from "@/hooks/useVoertuigen";
import { StatusBadge } from "@/components/StatusBadge";
import { getStatusColor, getVehicleImageUrl } from "@/data/mockData";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format, addDays, startOfWeek, differenceInDays, isWithinInterval, addWeeks, subWeeks } from "date-fns";
import { nl } from "date-fns/locale";

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
    (b) =>
      b.vehicleId === vehicle.id &&
      b.type === "contract" &&
      isWithinInterval(today, { start: b.start, end: b.end })
  );
  if (hasActiveBlock) return "verhuurd";
  if (vehicle.status === "onderhoud") return "onderhoud";
  return vehicle.status;
}

interface VehicleGanttProps {
  onSelectVehicle?: (vehicle: Vehicle) => void;
}

export function VehicleGantt({ onSelectVehicle }: VehicleGanttProps) {
  const { user } = useAuth();
  const { voertuigen: dbVoertuigen } = useVoertuigen();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [weekOffset, setWeekOffset] = useState(0);

  const startDate = useMemo(
    () => startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 }),
    [weekOffset]
  );

  const days = useMemo(
    () => Array.from({ length: DAYS_VISIBLE }, (_, i) => addDays(startDate, i)),
    [startDate]
  );

  // Fetch contracts from DB
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

  const dbAsVehicles: Vehicle[] = dbVoertuigen.map((v) => ({
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
  }));

  const allVehicles = [...mockVehicles, ...dbAsVehicles];

  // Build blocks
  const blocks: GanttBlock[] = useMemo(() => {
    const result: GanttBlock[] = [];

    // DB contracts
    dbContracts.forEach((c: any) => {
      if (!c.voertuig_id) return;
      result.push({
        id: `con-${c.id}`,
        vehicleId: c.voertuig_id,
        start: new Date(c.start_datum),
        end: new Date(c.eind_datum),
        label: `${c.contract_nummer} — ${c.klant_naam}`,
        type: "contract",
      });
    });

    // Mock reservations
    reservations.forEach((r) => {
      if (r.status === "geannuleerd" || r.status === "voltooid") return;
      result.push({
        id: `res-${r.id}`,
        vehicleId: r.voertuigId,
        start: new Date(r.startDatum),
        end: new Date(r.eindDatum),
        label: r.klantNaam,
        type: "reservation",
      });
    });

    return result;
  }, [dbContracts]);

  const endDate = days[days.length - 1];

  return (
    <div className="clean-card overflow-hidden">
      {/* Header nav */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekOffset((o) => o - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)}>
            Vandaag
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekOffset((o) => o + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          {format(startDate, "d MMM", { locale: nl })} — {format(endDate, "d MMM yyyy", { locale: nl })}
        </p>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-primary/70" /> Contract</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-warning/70" /> Concept</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-info/70" /> Reservering</span>
        </div>
      </div>

      <div className="overflow-x-auto" ref={scrollRef}>
        <div className="flex min-w-fit">
          {/* Vehicle column */}
          <div className="sticky left-0 z-10 bg-background border-r border-border shrink-0" style={{ width: 220 }}>
            {/* Date header spacer */}
            <div className="h-10 border-b border-border" />
            {allVehicles.map((v) => {
              const effectiveStatus = getEffectiveStatus(v, blocks);
              return (
                <div
                  key={v.id}
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
              );
            })}
          </div>

          {/* Gantt grid */}
          <div className="relative flex-1">
            {/* Day headers */}
            <div className="flex border-b border-border h-10">
              {days.map((d, i) => {
                const isToday = format(d, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                return (
                  <div
                    key={i}
                    className={cn(
                      "shrink-0 flex flex-col items-center justify-center border-r border-border text-[10px]",
                      isToday && "bg-primary/10 font-bold text-primary",
                      isWeekend && !isToday && "bg-muted/50 text-muted-foreground"
                    )}
                    style={{ width: CELL_WIDTH }}
                  >
                    <span>{format(d, "EEE", { locale: nl })}</span>
                    <span>{format(d, "d")}</span>
                  </div>
                );
              })}
            </div>

            {/* Rows */}
            {allVehicles.map((v) => {
              const vehicleBlocks = blocks.filter((b) => b.vehicleId === v.id);
              return (
                <div key={v.id} className="relative border-b border-border" style={{ height: ROW_HEIGHT }}>
                  {/* Day grid lines */}
                  <div className="absolute inset-0 flex">
                    {days.map((d, i) => {
                      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                      const isToday = format(d, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
                      return (
                        <div
                          key={i}
                          className={cn(
                            "shrink-0 border-r border-border",
                            isWeekend && "bg-muted/30",
                            isToday && "bg-primary/5"
                          )}
                          style={{ width: CELL_WIDTH }}
                        />
                      );
                    })}
                  </div>

                  {/* Blocks */}
                  {vehicleBlocks.map((block) => {
                    const blockStart = differenceInDays(block.start, startDate);
                    const blockEnd = differenceInDays(block.end, startDate);
                    const clampedStart = Math.max(0, blockStart);
                    const clampedEnd = Math.min(DAYS_VISIBLE - 1, blockEnd);
                    if (clampedStart > DAYS_VISIBLE - 1 || clampedEnd < 0) return null;

                    const left = clampedStart * CELL_WIDTH;
                    const width = (clampedEnd - clampedStart + 1) * CELL_WIDTH - 4;

                    const contractStatus = block.id.startsWith("con-")
                      ? dbContracts.find((c: any) => `con-${c.id}` === block.id)?.status
                      : undefined;

                    return (
                      <div
                        key={block.id}
                        className={cn(
                          "absolute top-1.5 rounded-md border text-[10px] font-medium px-1.5 flex items-center truncate z-[1] shadow-sm",
                          getBlockColor(block.type, contractStatus)
                        )}
                        style={{
                          left: left + 2,
                          width: Math.max(width, 18),
                          height: ROW_HEIGHT - 12,
                        }}
                        title={`${block.label}\n${format(block.start, "d MMM yyyy", { locale: nl })} — ${format(block.end, "d MMM yyyy", { locale: nl })}`}
                      >
                        <span className="truncate">{block.label}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Today line */}
            {(() => {
              const todayOffset = differenceInDays(new Date(), startDate);
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
    </div>
  );
}
