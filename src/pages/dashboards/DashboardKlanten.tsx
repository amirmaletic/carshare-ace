import { useMemo, useState } from "react";
import { Users, Repeat, ClipboardList, Clock } from "lucide-react";
import { format, isWithinInterval, parseISO, differenceInDays } from "date-fns";
import { useDashboardData } from "@/hooks/useDashboardData";
import { PeriodFilter, buildPeriod, downloadCsv, type PresetKey } from "@/components/dashboards/PeriodFilter";
import { KpiTile } from "@/components/dashboards/KpiTile";
import { ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(142 76% 45%)", "hsl(38 92% 50%)", "hsl(0 84% 60%)", "hsl(280 70% 60%)"];

export default function DashboardKlanten() {
  const { data, isLoading } = useDashboardData();
  const [preset, setPreset] = useState<PresetKey>("jaar");
  const [customStart, setCustomStart] = useState<Date | undefined>();
  const [customEnd, setCustomEnd] = useState<Date | undefined>();
  const period = useMemo(() => buildPeriod(preset, customStart, customEnd), [preset, customStart, customEnd]);

  const stats = useMemo(() => {
    if (!data) return null;
    const inPeriod = (d?: string | null) => d ? isWithinInterval(parseISO(d), { start: period.start, end: period.end }) : false;
    const inPrev = (d?: string | null) => d ? isWithinInterval(parseISO(d), { start: period.prevStart, end: period.prevEnd }) : false;

    const nieuweKlanten = data.klanten.filter((k) => inPeriod(k.created_at)).length;
    const nieuweKlantenPrev = data.klanten.filter((k) => inPrev(k.created_at)).length;

    const aanvragen = data.aanvragen.filter((a) => inPeriod(a.created_at));
    const aanvragenGekoppeld = aanvragen.filter((a) => a.gekoppeld_voertuig_id || a.status === "gekoppeld" || a.status === "geboekt").length;
    const conversie = aanvragen.length === 0 ? 0 : Math.round((aanvragenGekoppeld / aanvragen.length) * 100);

    // Per klant aggregatie via contracten in periode
    const perKlant = new Map<string, { naam: string; email: string; aantalContracten: number; totaalDagen: number; omzet: number }>();
    data.contracts.forEach((c) => {
      if (!inPeriod(c.start_datum) && !inPeriod(c.eind_datum)) return;
      const key = c.klant_email || c.klant_naam;
      const cur = perKlant.get(key) ?? { naam: c.klant_naam, email: c.klant_email, aantalContracten: 0, totaalDagen: 0, omzet: 0 };
      cur.aantalContracten += 1;
      try {
        const dagen = Math.max(1, differenceInDays(parseISO(c.eind_datum), parseISO(c.start_datum)) + 1);
        cur.totaalDagen += dagen;
      } catch {}
      cur.omzet += data.invoices.filter((i) => i.contract_id === c.id).reduce((s, i) => s + Number(i.bedrag ?? 0), 0);
      perKlant.set(key, cur);
    });
    const topKlanten = [...perKlant.values()].sort((a, b) => b.omzet - a.omzet).slice(0, 10);
    const herhalingsKlanten = [...perKlant.values()].filter((k) => k.aantalContracten >= 2).length;

    // Gemiddelde huurduur in periode
    const contractsInPeriod = data.contracts.filter((c) => inPeriod(c.start_datum));
    const gemDuur = contractsInPeriod.length === 0 ? 0 : Math.round(contractsInPeriod.reduce((s, c) => {
      try { return s + differenceInDays(parseISO(c.eind_datum), parseISO(c.start_datum)) + 1; } catch { return s; }
    }, 0) / contractsInPeriod.length);

    // Aanvragen per status
    const statusMap = new Map<string, number>();
    data.aanvragen.forEach((a) => statusMap.set(a.status, (statusMap.get(a.status) ?? 0) + 1));
    const aanvraagStatus = [...statusMap.entries()].map(([name, value]) => ({ name, value }));

    // Klant type
    const typeMap = new Map<string, number>();
    data.klanten.forEach((k) => typeMap.set(k.type ?? "particulier", (typeMap.get(k.type ?? "particulier") ?? 0) + 1));
    const klantType = [...typeMap.entries()].map(([name, value]) => ({ name, value }));

    return { nieuweKlanten, nieuweKlantenPrev, aanvragenAantal: aanvragen.length, conversie, herhalingsKlanten, gemDuur, topKlanten, aanvraagStatus, klantType };
  }, [data, period]);

  const handleExport = () => {
    if (!stats) return;
    const rows: (string | number)[][] = [["Klant", "Email", "Contracten", "Huurdagen", "Omzet"]];
    stats.topKlanten.forEach((k) => rows.push([k.naam, k.email, k.aantalContracten, k.totaalDagen, k.omzet.toFixed(2)]));
    downloadCsv(`klanten_${format(period.start, "yyyyMMdd")}_${format(period.end, "yyyyMMdd")}.csv`, rows);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Klant en verhuur dashboard</h1>
          <p className="text-muted-foreground mt-1">Top klanten, herhalingsverhuur, conversie en gemiddelde huurduur</p>
        </div>
        <PeriodFilter preset={preset} setPreset={setPreset} customStart={customStart} customEnd={customEnd} setCustomStart={setCustomStart} setCustomEnd={setCustomEnd} onExport={handleExport} />
      </div>

      {isLoading || !stats ? (
        <div className="h-64 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiTile icon={Users} title="Nieuwe klanten" value={stats.nieuweKlanten} current={stats.nieuweKlanten} previous={stats.nieuweKlantenPrev} subtitle={`Vorige: ${stats.nieuweKlantenPrev}`} />
            <KpiTile icon={Repeat} title="Herhalingsklanten" value={stats.herhalingsKlanten} subtitle="Min. 2 contracten" />
            <KpiTile icon={ClipboardList} title="Conversie aanvragen" value={`${stats.conversie}%`} subtitle={`${stats.aanvragenAantal} aanvragen`} />
            <KpiTile icon={Clock} title="Gem. huurduur" value={`${stats.gemDuur}d`} subtitle="Per contract" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="clean-card p-5">
              <h2 className="text-sm font-semibold mb-4">Top 10 klanten op omzet</h2>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={stats.topKlanten} layout="vertical" margin={{ left: 110 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="naam" tick={{ fontSize: 11 }} width={105} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={(v: number) => `€${v.toLocaleString("nl-NL")}`} />
                  <Bar dataKey="omzet" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="clean-card p-5">
              <h2 className="text-sm font-semibold mb-4">Aanvragen per status</h2>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie data={stats.aanvraagStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {stats.aanvraagStatus.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="clean-card p-5">
            <h2 className="text-sm font-semibold mb-4">Top klanten · detail</h2>
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground border-b border-border">
                <tr><th className="text-left py-2">Klant</th><th className="text-left">Email</th><th className="text-right">Contracten</th><th className="text-right">Huurdagen</th><th className="text-right">Omzet</th></tr>
              </thead>
              <tbody>
                {stats.topKlanten.map((k) => (
                  <tr key={k.email + k.naam} className="border-b border-border/40">
                    <td className="py-2 font-medium">{k.naam}</td>
                    <td className="text-muted-foreground text-xs">{k.email}</td>
                    <td className="text-right">{k.aantalContracten}</td>
                    <td className="text-right">{k.totaalDagen}</td>
                    <td className="text-right font-medium">€{k.omzet.toLocaleString("nl-NL", { maximumFractionDigits: 2 })}</td>
                  </tr>
                ))}
                {stats.topKlanten.length === 0 && (<tr><td colSpan={5} className="py-6 text-center text-muted-foreground text-sm">Geen klanten in deze periode</td></tr>)}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
