import { useState } from "react";
import { format, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subMonths, subYears, subQuarters, differenceInDays, addDays } from "date-fns";
import { nl } from "date-fns/locale";
import { Calendar as CalendarIcon, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { DashboardPeriod } from "@/hooks/useDashboardData";

export type PresetKey = "maand" | "vorigeMaand" | "kwartaal" | "jaar" | "ytd" | "custom";

export function buildPeriod(preset: PresetKey, customStart?: Date, customEnd?: Date): DashboardPeriod {
  const now = new Date();
  let start: Date, end: Date, label: string;
  switch (preset) {
    case "maand":
      start = startOfMonth(now); end = endOfMonth(now);
      label = `Deze maand · ${format(start, "MMMM yyyy", { locale: nl })}`;
      break;
    case "vorigeMaand": {
      const prev = subMonths(now, 1);
      start = startOfMonth(prev); end = endOfMonth(prev);
      label = `Vorige maand · ${format(start, "MMMM yyyy", { locale: nl })}`;
      break;
    }
    case "kwartaal":
      start = startOfQuarter(now); end = endOfQuarter(now);
      label = `Dit kwartaal · ${format(start, "Q yyyy")}`;
      break;
    case "jaar":
      start = startOfYear(now); end = endOfYear(now);
      label = `Dit jaar · ${format(start, "yyyy")}`;
      break;
    case "ytd":
      start = startOfYear(now); end = now;
      label = `Year to date · ${format(start, "yyyy")}`;
      break;
    case "custom":
      start = customStart ?? startOfMonth(now);
      end = customEnd ?? endOfMonth(now);
      label = `${format(start, "d MMM", { locale: nl })} | ${format(end, "d MMM yyyy", { locale: nl })}`;
      break;
  }
  const days = differenceInDays(end, start) + 1;
  const prevEnd = addDays(start, -1);
  const prevStart = addDays(prevEnd, -days + 1);
  return { start, end, prevStart, prevEnd, label };
}

interface PeriodFilterProps {
  preset: PresetKey;
  setPreset: (p: PresetKey) => void;
  customStart?: Date;
  customEnd?: Date;
  setCustomStart: (d?: Date) => void;
  setCustomEnd: (d?: Date) => void;
  onExport?: () => void;
}

export function PeriodFilter({ preset, setPreset, customStart, customEnd, setCustomStart, setCustomEnd, onExport }: PeriodFilterProps) {
  const period = buildPeriod(preset, customStart, customEnd);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={preset} onValueChange={(v) => setPreset(v as PresetKey)}>
        <SelectTrigger className="w-[180px] h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="maand">Deze maand</SelectItem>
          <SelectItem value="vorigeMaand">Vorige maand</SelectItem>
          <SelectItem value="kwartaal">Dit kwartaal</SelectItem>
          <SelectItem value="jaar">Dit jaar</SelectItem>
          <SelectItem value="ytd">Year to date</SelectItem>
          <SelectItem value="custom">Aangepast</SelectItem>
        </SelectContent>
      </Select>

      {preset === "custom" && (
        <>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("h-9 justify-start text-left font-normal", !customStart && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {customStart ? format(customStart, "d MMM yyyy", { locale: nl }) : "Startdatum"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={customStart} onSelect={setCustomStart} initialFocus className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("h-9 justify-start text-left font-normal", !customEnd && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {customEnd ? format(customEnd, "d MMM yyyy", { locale: nl }) : "Einddatum"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={customEnd} onSelect={setCustomEnd} initialFocus className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>
        </>
      )}

      <span className="hidden sm:inline text-xs text-muted-foreground px-2">{period.label}</span>

      {onExport && (
        <Button variant="outline" size="sm" onClick={onExport} className="ml-auto h-9">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      )}
    </div>
  );
}

/** Download a CSV string als bestand */
export function downloadCsv(filename: string, rows: (string | number | null | undefined)[][]) {
  const escape = (v: string | number | null | undefined) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return s.includes(",") || s.includes("\"") || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const csv = rows.map((r) => r.map(escape).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function TrendBadge({ current, previous, inverse = false }: { current: number; previous: number; inverse?: boolean }) {
  if (previous === 0 && current === 0) return <span className="text-xs text-muted-foreground">|</span>;
  const pct = previous === 0 ? 100 : Math.round(((current - previous) / Math.abs(previous)) * 100);
  const positief = inverse ? pct < 0 : pct > 0;
  const cls = pct === 0 ? "bg-muted text-muted-foreground" : positief ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive";
  return <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", cls)}>{pct > 0 ? "+" : ""}{pct}%</span>;
}
