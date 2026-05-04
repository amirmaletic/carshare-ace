import { useMemo, useState } from "react";
import { Euro, FileWarning, Receipt, TrendingUp } from "lucide-react";
import { format, eachMonthOfInterval, isWithinInterval, parseISO, isSameMonth, differenceInMonths } from "date-fns";
import { nl } from "date-fns/locale";
import { useDashboardData } from "@/hooks/useDashboardData";
import { PeriodFilter, buildPeriod, downloadCsv, type PresetKey } from "@/components/dashboards/PeriodFilter";
import { KpiTile } from "@/components/dashboards/KpiTile";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

const STATUS_COLORS: Record<string, string> = {
  betaald: "hsl(142 76% 45%)",
  openstaand: "hsl(217 91% 60%)",
  herinnering_verstuurd: "hsl(38 92% 50%)",
  te_laat: "hsl(0 84% 60%)",
};

export default function DashboardFinancieel() {
  const { data, isLoading } = useDashboardData();
  const [preset, setPreset] = useState<PresetKey>("jaar");
  const [customStart, setCustomStart] = useState<Date | undefined>();
  const [customEnd, setCustomEnd] = useState<Date | undefined>();
  const period = useMemo(() => buildPeriod(preset, customStart, customEnd), [preset, customStart, customEnd]);

  const stats = useMemo(() => {
    if (!data) return null;
    const inPeriod = (d?: string | null) => d ? isWithinInterval(parseISO(d), { start: period.start, end: period.end }) : false;
    const inPrev = (d?: string | null) => d ? isWithinInterval(parseISO(d), { start: period.prevStart, end: period.prevEnd }) : false;

    const facturenPeriod = data.invoices.filter((i) => inPeriod(i.datum));
    const facturenPrev = data.invoices.filter((i) => inPrev(i.datum));
    const omzet = facturenPeriod.reduce((s, i) => s + Number(i.bedrag ?? 0), 0);
    const omzetPrev = facturenPrev.reduce((s, i) => s + Number(i.bedrag ?? 0), 0);
    const openstaand = data.invoices.filter((i) => i.status !== "betaald").reduce((s, i) => s + Number(i.bedrag ?? 0), 0);
    const openstaandAantal = data.invoices.filter((i) => i.status !== "betaald").length;

    const actieveContracten = data.contracts.filter((c) => c.status === "actief");
    const mrr = actieveContracten.reduce((s, c) => s + Number(c.maandprijs ?? 0), 0);

    // Maandlijnen
    const maanden = eachMonthOfInterval({ start: period.start, end: period.end });
    const maandData = maanden.map((m) => {
      const omzet = data.invoices
        .filter((i) => i.datum && isSameMonth(parseISO(i.datum), m))
        .reduce((s, i) => s + Number(i.bedrag ?? 0), 0);
      const kosten = [
        ...data.services.filter((s) => s.datum && isSameMonth(parseISO(s.datum), m)).map((s) => Number(s.kosten ?? 0)),
        ...data.schades.filter((s) => s.datum && isSameMonth(parseISO(s.datum), m)).map((s) => Number(s.kosten ?? 0)),
      ].reduce((s, v) => s + v, 0);
      return { maand: format(m, "MMM yy", { locale: nl }), omzet, kosten, marge: omzet - kosten };
    });

    // Verdeling factuurstatus
    const statusVerdeling = ["betaald", "openstaand", "herinnering_verstuurd", "te_laat"].map((st) => ({
      name: st.replace("_", " "),
      key: st,
      value: data.invoices.filter((i) => i.status === st).reduce((s, i) => s + Number(i.bedrag ?? 0), 0),
    })).filter((d) => d.value > 0);

    // Top contracten op omzet
    const perContract = new Map<string, { naam: string; nummer: string; bedrag: number }>();
    data.invoices.forEach((i) => {
      const c = data.contracts.find((co) => co.id === i.contract_id);
      if (!c) return;
      const cur = perContract.get(c.id) ?? { naam: c.klant_naam, nummer: c.contract_nummer, bedrag: 0 };
      cur.bedrag += Number(i.bedrag ?? 0);
      perContract.set(c.id, cur);
    });
    const topContracten = [...perContract.values()].sort((a, b) => b.bedrag - a.bedrag).slice(0, 8);

    return { omzet, omzetPrev, openstaand, openstaandAantal, mrr, actieveContracten: actieveContracten.length, maandData, statusVerdeling, topContracten };
  }, [data, period]);

  const handleExport = () => {
    if (!stats) return;
    const rows: (string | number)[][] = [["Maand", "Omzet", "Kosten", "Marge"]];
    stats.maandData.forEach((m) => rows.push([m.maand, m.omzet.toFixed(2), m.kosten.toFixed(2), m.marge.toFixed(2)]));
    rows.push([], ["Top contracten"], ["Contract", "Klant", "Omzet"]);
    stats.topContracten.forEach((c) => rows.push([c.nummer, c.naam, c.bedrag.toFixed(2)]));
    downloadCsv(`financieel_${format(period.start, "yyyyMMdd")}_${format(period.end, "yyyyMMdd")}.csv`, rows);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financieel dashboard</h1>
          <p className="text-muted-foreground mt-1">Omzet, openstaande facturen, kosten en marge</p>
        </div>
        <PeriodFilter preset={preset} setPreset={setPreset} customStart={customStart} customEnd={customEnd} setCustomStart={setCustomStart} setCustomEnd={setCustomEnd} onExport={handleExport} />
      </div>

      {isLoading || !stats ? (
        <div className="h-64 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiTile icon={Euro} title="Omzet in periode" value={`€${stats.omzet.toLocaleString("nl-NL", { maximumFractionDigits: 0 })}`} current={stats.omzet} previous={stats.omzetPrev} subtitle={`Vorige: €${stats.omzetPrev.toLocaleString("nl-NL", { maximumFractionDigits: 0 })}`} />
            <KpiTile icon={TrendingUp} title="MRR (maandelijks)" value={`€${stats.mrr.toLocaleString("nl-NL", { maximumFractionDigits: 0 })}`} subtitle={`${stats.actieveContracten} actieve contracten`} />
            <KpiTile icon={FileWarning} title="Openstaand" value={`€${stats.openstaand.toLocaleString("nl-NL", { maximumFractionDigits: 0 })}`} subtitle={`${stats.openstaandAantal} facturen`} />
            <KpiTile icon={Receipt} title="Gemiddelde factuur" value={`€${stats.omzet > 0 ? Math.round(stats.omzet / Math.max(1, data!.invoices.filter((i) => i.datum && isWithinInterval(parseISO(i.datum), { start: period.start, end: period.end })).length)).toLocaleString("nl-NL") : 0}`} subtitle="In periode" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="clean-card p-5">
              <h2 className="text-sm font-semibold mb-4">Omzet versus kosten per maand</h2>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={stats.maandData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="maand" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={(v: number) => `€${v.toLocaleString("nl-NL")}`} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="omzet" stroke="hsl(var(--primary))" strokeWidth={2} />
                  <Line type="monotone" dataKey="kosten" stroke="hsl(0 84% 60%)" strokeWidth={2} />
                  <Line type="monotone" dataKey="marge" stroke="hsl(142 76% 45%)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="clean-card p-5">
              <h2 className="text-sm font-semibold mb-4">Verdeling factuurstatus (alle tijd)</h2>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={stats.statusVerdeling} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e) => `€${Math.round(e.value).toLocaleString("nl-NL")}`}>
                    {stats.statusVerdeling.map((d) => (<Cell key={d.key} fill={STATUS_COLORS[d.key] ?? "hsl(var(--muted))"} />))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={(v: number) => `€${v.toLocaleString("nl-NL")}`} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="clean-card p-5">
            <h2 className="text-sm font-semibold mb-4">Top contracten op omzet</h2>
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground border-b border-border">
                <tr><th className="text-left py-2">Contract</th><th className="text-left">Klant</th><th className="text-right">Omzet</th></tr>
              </thead>
              <tbody>
                {stats.topContracten.map((c) => (
                  <tr key={c.nummer} className="border-b border-border/40">
                    <td className="py-2 font-mono text-xs">{c.nummer}</td>
                    <td>{c.naam}</td>
                    <td className="text-right font-medium">€{c.bedrag.toLocaleString("nl-NL", { maximumFractionDigits: 2 })}</td>
                  </tr>
                ))}
                {stats.topContracten.length === 0 && (<tr><td colSpan={3} className="py-6 text-center text-muted-foreground text-sm">Geen facturen gevonden</td></tr>)}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
