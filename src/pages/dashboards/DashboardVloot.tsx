import { useMemo, useState } from "react";
import { Car, Gauge, ShieldAlert, Wrench } from "lucide-react";
import { format, isWithinInterval, parseISO, max as dmax, min as dmin, differenceInDays } from "date-fns";
import { useDashboardData } from "@/hooks/useDashboardData";
import { PeriodFilter, buildPeriod, downloadCsv, type PresetKey } from "@/components/dashboards/PeriodFilter";
import { KpiTile } from "@/components/dashboards/KpiTile";
import { ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

const CAT_COLORS = ["hsl(var(--primary))", "hsl(217 91% 75%)", "hsl(142 76% 45%)", "hsl(38 92% 50%)", "hsl(280 70% 60%)", "hsl(0 84% 60%)"];

export default function DashboardVloot() {
  const { data, isLoading } = useDashboardData();
  const [preset, setPreset] = useState<PresetKey>("jaar");
  const [customStart, setCustomStart] = useState<Date | undefined>();
  const [customEnd, setCustomEnd] = useState<Date | undefined>();
  const period = useMemo(() => buildPeriod(preset, customStart, customEnd), [preset, customStart, customEnd]);

  const stats = useMemo(() => {
    if (!data) return null;
    const inPeriod = (d?: string | null) => d ? isWithinInterval(parseISO(d), { start: period.start, end: period.end }) : false;

    const totaal = data.voertuigen.length;
    const dagenInPeriode = Math.max(1, differenceInDays(period.end, period.start) + 1);

    // Bezetting per voertuig: aantal dagen met actief contract overlappend met periode
    const perVoertuig = data.voertuigen.map((v) => {
      const contracts = data.contracts.filter((c) => c.voertuig_id === v.id);
      const huurDagen = contracts.reduce((tot, c) => {
        try {
          const cs = parseISO(c.start_datum);
          const ce = parseISO(c.eind_datum);
          const o = dmax([cs, period.start]);
          const e = dmin([ce, period.end]);
          if (e < o) return tot;
          return tot + Math.max(0, differenceInDays(e, o) + 1);
        } catch { return tot; }
      }, 0);
      const schadeAantal = data.schades.filter((s) => s.voertuig_id === v.id && inPeriod(s.datum)).length;
      const onderhoudKosten = data.services.filter((s) => s.voertuig_id === v.id && inPeriod(s.datum)).reduce((s, r) => s + Number(r.kosten ?? 0), 0);
      const bezetPct = Math.min(100, Math.round((huurDagen / dagenInPeriode) * 100));
      return { id: v.id, label: `${v.kenteken} | ${v.merk} ${v.model}`, kenteken: v.kenteken, merk: v.merk, model: v.model, status: v.status, categorie: v.categorie, huurDagen, bezetPct, schadeAantal, onderhoudKosten, kilometerstand: v.kilometerstand };
    });

    const gemBezetting = perVoertuig.length === 0 ? 0 : Math.round(perVoertuig.reduce((s, v) => s + v.bezetPct, 0) / perVoertuig.length);
    const totaalSchades = perVoertuig.reduce((s, v) => s + v.schadeAantal, 0);
    const totaalOnderhoud = perVoertuig.reduce((s, v) => s + v.onderhoudKosten, 0);

    const top = [...perVoertuig].sort((a, b) => b.bezetPct - a.bezetPct).slice(0, 8);
    const flop = [...perVoertuig].sort((a, b) => a.bezetPct - b.bezetPct).slice(0, 8);

    // Categorie verdeling
    const catMap = new Map<string, number>();
    data.voertuigen.forEach((v) => catMap.set(v.categorie ?? "overig", (catMap.get(v.categorie ?? "overig") ?? 0) + 1));
    const categorieData = [...catMap.entries()].map(([name, value]) => ({ name, value }));

    // Status verdeling
    const statusMap = new Map<string, number>();
    data.voertuigen.forEach((v) => statusMap.set(v.status, (statusMap.get(v.status) ?? 0) + 1));
    const statusData = [...statusMap.entries()].map(([name, value]) => ({ name, value }));

    return { totaal, gemBezetting, totaalSchades, totaalOnderhoud, top, flop, categorieData, statusData, perVoertuig };
  }, [data, period]);

  const handleExport = () => {
    if (!stats) return;
    const rows: (string | number)[][] = [["Kenteken", "Merk", "Model", "Status", "Categorie", "Bezetting %", "Huurdagen", "Schades", "Onderhoud €", "KM-stand"]];
    stats.perVoertuig.forEach((v) => rows.push([v.kenteken, v.merk, v.model, v.status, v.categorie, v.bezetPct, v.huurDagen, v.schadeAantal, v.onderhoudKosten.toFixed(2), v.kilometerstand]));
    downloadCsv(`vloot_${format(period.start, "yyyyMMdd")}_${format(period.end, "yyyyMMdd")}.csv`, rows);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Vlootprestatie dashboard</h1>
          <p className="text-muted-foreground mt-1">Bezetting, top en flop, schades en onderhoud per voertuig</p>
        </div>
        <PeriodFilter preset={preset} setPreset={setPreset} customStart={customStart} customEnd={customEnd} setCustomStart={setCustomStart} setCustomEnd={setCustomEnd} onExport={handleExport} />
      </div>

      {isLoading || !stats ? (
        <div className="h-64 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiTile icon={Car} title="Vloot omvang" value={stats.totaal} subtitle="Totaal voertuigen" />
            <KpiTile icon={Gauge} title="Gem. bezetting" value={`${stats.gemBezetting}%`} subtitle="In periode" />
            <KpiTile icon={ShieldAlert} title="Schades in periode" value={stats.totaalSchades} subtitle="Alle voertuigen" />
            <KpiTile icon={Wrench} title="Onderhoudskosten" value={`€${stats.totaalOnderhoud.toLocaleString("nl-NL", { maximumFractionDigits: 0 })}`} subtitle="In periode" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="clean-card p-5">
              <h2 className="text-sm font-semibold mb-4">Top 8 best presterende voertuigen</h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats.top} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <YAxis type="category" dataKey="kenteken" tick={{ fontSize: 11 }} width={75} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={(v: number) => `${v}%`} />
                  <Bar dataKey="bezetPct" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="clean-card p-5">
              <h2 className="text-sm font-semibold mb-4">Flop 8 voertuigen (laagste bezetting)</h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats.flop} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <YAxis type="category" dataKey="kenteken" tick={{ fontSize: 11 }} width={75} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={(v: number) => `${v}%`} />
                  <Bar dataKey="bezetPct" fill="hsl(0 84% 60%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="clean-card p-5">
              <h2 className="text-sm font-semibold mb-4">Verdeling per categorie</h2>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={stats.categorieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {stats.categorieData.map((_, i) => (<Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="clean-card p-5">
              <h2 className="text-sm font-semibold mb-4">Verdeling per status</h2>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={stats.statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {stats.statusData.map((_, i) => (<Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
