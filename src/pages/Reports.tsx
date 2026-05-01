import { Download, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMemo } from "react";
import { format, subMonths, startOfMonth, endOfMonth, parseISO, differenceInDays, max as dMax, min as dMin } from "date-fns";
import { nl } from "date-fns/locale";

function buildLast6Months() {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(now, 5 - i);
    return { date: d, key: format(d, "yyyy-MM"), label: format(d, "LLL", { locale: nl }) };
  });
}

export default function Reports() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["reports-data", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const sixMonthsAgo = subMonths(new Date(), 6).toISOString().slice(0, 10);
      const [services, contracts, voertuigen, ritten] = await Promise.all([
        supabase.from("service_historie").select("datum, kosten, type").gte("datum", sixMonthsAgo),
        supabase.from("contracts").select("id, start_datum, eind_datum, maandprijs, status, voertuig_id"),
        supabase.from("voertuigen").select("id, dagprijs"),
        supabase.from("ritten").select("datum, kosten, afstand_km, status").gte("datum", sixMonthsAgo),
      ]);
      return {
        services: services.data ?? [],
        contracts: contracts.data ?? [],
        voertuigen: voertuigen.data ?? [],
        ritten: ritten.data ?? [],
      };
    },
  });

  const months = useMemo(() => buildLast6Months(), []);

  const costData = useMemo(() => {
    return months.map((m) => {
      const services = (data?.services ?? []).filter((s: any) => s.datum?.startsWith(m.key));
      const ritten = (data?.ritten ?? []).filter((r: any) => r.datum?.startsWith(m.key) && r.status === "afgerond");
      const onderhoud = services
        .filter((s: any) => s.type !== "verzekering" && s.type !== "brandstof")
        .reduce((sum: number, s: any) => sum + Number(s.kosten || 0), 0);
      const verzekering = services
        .filter((s: any) => s.type === "verzekering")
        .reduce((sum: number, s: any) => sum + Number(s.kosten || 0), 0);
      const brandstof =
        services.filter((s: any) => s.type === "brandstof").reduce((sum: number, s: any) => sum + Number(s.kosten || 0), 0) +
        ritten.reduce((sum: number, r: any) => sum + Number(r.kosten || 0), 0);
      return { maand: m.label, brandstof, onderhoud, verzekering };
    });
  }, [data, months]);

  const occupancyData = useMemo(() => {
    const totalVehicles = (data?.voertuigen ?? []).length || 1;
    return months.map((m) => {
      const monthStart = startOfMonth(m.date);
      const monthEnd = endOfMonth(m.date);
      const daysInMonth = differenceInDays(monthEnd, monthStart) + 1;
      let busyDays = 0;
      (data?.contracts ?? []).forEach((c: any) => {
        if (!["actief", "ondertekend"].includes(c.status)) return;
        const cStart = parseISO(c.start_datum);
        const cEnd = parseISO(c.eind_datum);
        const overlap = differenceInDays(dMin([cEnd, monthEnd]), dMax([cStart, monthStart])) + 1;
        if (overlap > 0) busyDays += overlap;
      });
      const possible = totalVehicles * daysInMonth;
      const bezetting = possible > 0 ? Math.round((busyDays / possible) * 100) : 0;
      return { maand: m.label, bezetting: Math.min(bezetting, 100) };
    });
  }, [data, months]);

  const kpis = useMemo(() => {
    const voertuigen = data?.voertuigen ?? [];
    const contracts = data?.contracts ?? [];
    const services = data?.services ?? [];
    const activeContracts = contracts.filter((c: any) => ["actief", "ondertekend"].includes(c.status));
    const avgDagprijs = voertuigen.length
      ? Math.round(voertuigen.reduce((s: number, v: any) => s + Number(v.dagprijs || 0), 0) / voertuigen.length)
      : 0;
    const lastMonthBezetting = occupancyData[occupancyData.length - 1]?.bezetting ?? 0;
    const avgPeriode = activeContracts.length
      ? (
          activeContracts.reduce((s: number, c: any) => {
            return s + Math.max(differenceInDays(parseISO(c.eind_datum), parseISO(c.start_datum)), 1);
          }, 0) / activeContracts.length
        ).toFixed(1)
      : "0";
    const onderhoudPerVoertuig = voertuigen.length
      ? Math.round(
          services.reduce((s: number, x: any) => s + Number(x.kosten || 0), 0) / voertuigen.length / 6
        )
      : 0;
    return [
      { label: "Gem. dagprijs", value: avgDagprijs ? `€${avgDagprijs}` : "Geen data" },
      { label: "Bezettingsgraad", value: `${lastMonthBezetting}%` },
      { label: "Gem. huurperiode", value: `${avgPeriode} dagen` },
      { label: "Onderhoudskosten/voertuig", value: onderhoudPerVoertuig ? `€${onderhoudPerVoertuig}/mnd` : "Geen data" },
    ];
  }, [data, occupancyData]);

  const heeftData =
    (data?.services?.length ?? 0) > 0 ||
    (data?.contracts?.length ?? 0) > 0 ||
    (data?.ritten?.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rapportages</h1>
          <p className="text-muted-foreground mt-1">Inzicht in kosten, opbrengsten en bezettingsgraad</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Exporteer rapport
        </Button>
      </div>

      {!isLoading && !heeftData && (
        <div className="clean-card p-12 text-center">
          <Inbox className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-foreground mb-1">Nog geen data om te tonen</h3>
          <p className="text-muted-foreground text-sm">
            Voeg voertuigen, contracten of ritten toe en je rapportages worden automatisch gevuld.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="clean-card p-6">
          <h3 className="font-semibold text-foreground mb-4">Kosten per categorie</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={costData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 92%)" />
              <XAxis dataKey="maand" tick={{ fill: 'hsl(215, 14%, 46%)', fontSize: 12 }} />
              <YAxis tick={{ fill: 'hsl(215, 14%, 46%)', fontSize: 12 }} tickFormatter={v => `€${v}`} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(214, 20%, 92%)' }} />
              <Bar dataKey="brandstof" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} name="Brandstof" />
              <Bar dataKey="onderhoud" fill="hsl(221, 83%, 70%)" radius={[4, 4, 0, 0]} name="Onderhoud" />
              <Bar dataKey="verzekering" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} name="Verzekering" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="clean-card p-6">
          <h3 className="font-semibold text-foreground mb-4">Bezettingsgraad (%)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={occupancyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 92%)" />
              <XAxis dataKey="maand" tick={{ fill: 'hsl(215, 14%, 46%)', fontSize: 12 }} />
              <YAxis tick={{ fill: 'hsl(215, 14%, 46%)', fontSize: 12 }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(214, 20%, 92%)' }} formatter={(v: number) => [`${v}%`, 'Bezetting']} />
              <Line type="monotone" dataKey="bezetting" stroke="hsl(221, 83%, 53%)" strokeWidth={2.5} dot={{ r: 4, fill: 'hsl(221, 83%, 53%)' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="clean-card p-6">
        <h3 className="font-semibold text-foreground mb-4">KPI Overzicht</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {kpis.map(kpi => (
            <div key={kpi.label} className="text-center">
              <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{kpi.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
