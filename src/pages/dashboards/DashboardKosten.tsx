import { Euro, TrendingUp, Calculator, Car } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { useKostenBerekening } from "@/hooks/useKostenBerekening";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardKosten() {
  const { data, isLoading } = useKostenBerekening();

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const samenvatting = data;

  const prognoseData = [
    ...samenvatting.maandOverzicht,
    ...Array.from({ length: 6 }, (_, i) => ({
      maand: `+${i + 1}m`,
      lease: 0,
      service: 0,
      schade: 0,
      totaal: samenvatting.prognoseKomendeMaand,
    })),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Kosten en TCO</h2>
        <p className="text-sm text-muted-foreground mt-1">Total cost of ownership, kosten per maand en prognoses</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Euro} title="Totale TCO" value={`€${Math.round(samenvatting.totaalTCO).toLocaleString("nl-NL")}`} subtitle={`${samenvatting.aantalVoertuigen} voertuigen`} />
        <StatCard icon={Calculator} title="Gem. kosten/km" value={samenvatting.gemiddeldeKostenPerKm ? `€${samenvatting.gemiddeldeKostenPerKm.toFixed(2)}` : "-"} subtitle="Over alle voertuigen" />
        <StatCard icon={TrendingUp} title="Prognose komende maand" value={`€${Math.round(samenvatting.prognoseKomendeMaand).toLocaleString("nl-NL")}`} subtitle="Op basis van trend" />
        <StatCard icon={Car} title="Voertuigen met data" value={samenvatting.aantalVoertuigen} subtitle="Actieve contracten" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Kosten per maand</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={samenvatting.maandOverzicht}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="maand" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} tickFormatter={v => `€${v}`} />
                <Tooltip formatter={(v: number) => `€${v.toLocaleString("nl-NL")}`} contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))" }} />
                <Legend />
                <Bar dataKey="lease" name="Lease" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} stackId="a" />
                <Bar dataKey="service" name="Service" fill="hsl(var(--info))" radius={[0, 0, 0, 0]} stackId="a" />
                <Bar dataKey="schade" name="Schade" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Kostenprognose (6 maanden)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={prognoseData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="maand" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} tickFormatter={v => `€${v}`} />
                <Tooltip formatter={(v: number) => `€${v.toLocaleString("nl-NL")}`} contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))" }} />
                <Line type="monotone" dataKey="totaal" name="Totaal" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}