import { useMemo, useState } from "react";
import { Activity, AlertTriangle, CalendarCheck, Car, ClipboardCheck, RotateCcw, Wrench } from "lucide-react";
import { format, eachDayOfInterval, isWithinInterval, parseISO, isSameDay } from "date-fns";
import { nl } from "date-fns/locale";
import { useDashboardData } from "@/hooks/useDashboardData";
import { PeriodFilter, buildPeriod, downloadCsv, type PresetKey } from "@/components/dashboards/PeriodFilter";
import { KpiTile } from "@/components/dashboards/KpiTile";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";

export default function DashboardOperationeel() {
  const { data, isLoading } = useDashboardData();
  const [preset, setPreset] = useState<PresetKey>("maand");
  const [customStart, setCustomStart] = useState<Date | undefined>();
  const [customEnd, setCustomEnd] = useState<Date | undefined>();
  const period = useMemo(() => buildPeriod(preset, customStart, customEnd), [preset, customStart, customEnd]);

  const stats = useMemo(() => {
    if (!data) return null;
    const inPeriod = (d?: string | null) => d ? isWithinInterval(parseISO(d), { start: period.start, end: period.end }) : false;
    const inPrev = (d?: string | null) => d ? isWithinInterval(parseISO(d), { start: period.prevStart, end: period.prevEnd }) : false;

    const overdrachtenPeriod = data.overdrachten.filter((o) => inPeriod(o.datum));
    const overdrachtenPrev = data.overdrachten.filter((o) => inPrev(o.datum));
    const ophalenWacht = data.overdrachten.filter((o) => o.type === "ophalen" && o.status === "wacht_op_handtekening");
    const schadesPeriod = data.schades.filter((s) => inPeriod(s.datum));
    const schadesPrev = data.schades.filter((s) => inPrev(s.datum));
    const openSchades = data.schades.filter((s) => !s.hersteld);

    // Bezetting nu
    const totaal = data.voertuigen.length;
    const verhuurd = data.voertuigen.filter((v) => v.status === "verhuurd").length;
    const bezetting = totaal === 0 ? 0 : Math.round((verhuurd / totaal) * 100);

    // Heatmap: overdrachten per dag binnen periode
    const dagen = eachDayOfInterval({ start: period.start, end: period.end });
    const heatmap = dagen.map((d) => {
      const aantalOphalen = data.overdrachten.filter((o) => o.type === "ophalen" && o.datum && isSameDay(parseISO(o.datum), d)).length;
      const aantalRetour = data.overdrachten.filter((o) => o.type === "terugbrengen" && o.datum && isSameDay(parseISO(o.datum), d)).length;
      return { datum: d, ophalen: aantalOphalen, retour: aantalRetour, totaal: aantalOphalen + aantalRetour };
    });
    const maxHeat = Math.max(1, ...heatmap.map((h) => h.totaal));

    // Bar: overdrachten per dag (laatste 14)
    const last14 = heatmap.slice(-14).map((h) => ({
      label: format(h.datum, "d/M"),
      ophalen: h.ophalen,
      retour: h.retour,
    }));

    return {
      overdrachtenAantal: overdrachtenPeriod.length,
      overdrachtenPrev: overdrachtenPrev.length,
      ophalenWacht: ophalenWacht.length,
      schadesAantal: schadesPeriod.length,
      schadesPrev: schadesPrev.length,
      openSchades: openSchades.length,
      totaal,
      verhuurd,
      bezetting,
      heatmap,
      maxHeat,
      last14,
    };
  }, [data, period]);

  const handleExport = () => {
    if (!stats || !data) return;
    const rows: (string | number)[][] = [["Datum", "Ophalen", "Retour", "Totaal"]];
    stats.heatmap.forEach((h) => rows.push([format(h.datum, "yyyy-MM-dd"), h.ophalen, h.retour, h.totaal]));
    downloadCsv(`operationeel_${format(period.start, "yyyyMMdd")}_${format(period.end, "yyyyMMdd")}.csv`, rows);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Operationeel dashboard</h1>
          <p className="text-muted-foreground mt-1">Live status van overdrachten, terugmeldingen en bezetting</p>
        </div>
        <PeriodFilter
          preset={preset} setPreset={setPreset}
          customStart={customStart} customEnd={customEnd}
          setCustomStart={setCustomStart} setCustomEnd={setCustomEnd}
          onExport={handleExport}
        />
      </div>

      {isLoading || !stats ? (
        <div className="h-64 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiTile icon={CalendarCheck} title="Overdrachten in periode" value={stats.overdrachtenAantal} current={stats.overdrachtenAantal} previous={stats.overdrachtenPrev} subtitle={`Vorige periode: ${stats.overdrachtenPrev}`} />
            <KpiTile icon={ClipboardCheck} title="Wacht op handtekening" value={stats.ophalenWacht} subtitle="Open ophaalmomenten" />
            <KpiTile icon={AlertTriangle} title="Open schades" value={stats.openSchades} subtitle={`${stats.schadesAantal} nieuw in periode`} />
            <KpiTile icon={Car} title="Bezetting nu" value={`${stats.bezetting}%`} subtitle={`${stats.verhuurd}/${stats.totaal} voertuigen`} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="clean-card p-5">
              <h2 className="text-sm font-semibold mb-4">Overdrachten laatste 14 dagen</h2>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={stats.last14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Bar dataKey="ophalen" stackId="a" fill="hsl(var(--primary))" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="retour" stackId="a" fill="hsl(var(--primary) / 0.4)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="clean-card p-5">
              <h2 className="text-sm font-semibold mb-4">Activiteit per dag (heatmap)</h2>
              <div className="grid grid-cols-7 gap-1.5">
                {stats.heatmap.map((h) => {
                  const intensity = h.totaal / stats.maxHeat;
                  return (
                    <div
                      key={h.datum.toISOString()}
                      title={`${format(h.datum, "EEEE d MMM", { locale: nl })}: ${h.totaal} overdrachten`}
                      className={cn(
                        "aspect-square rounded border flex items-center justify-center text-[10px] font-medium",
                        h.totaal === 0 ? "bg-muted/30 text-muted-foreground border-border/50" : "border-primary/30 text-primary-foreground"
                      )}
                      style={h.totaal > 0 ? { backgroundColor: `hsl(var(--primary) / ${0.25 + intensity * 0.75})` } : undefined}
                    >
                      {format(h.datum, "d")}
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                <span>Minder</span>
                {[0.2, 0.4, 0.6, 0.8, 1].map((o) => (
                  <div key={o} className="w-4 h-4 rounded border border-primary/30" style={{ backgroundColor: `hsl(var(--primary) / ${o})` }} />
                ))}
                <span>Meer</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
