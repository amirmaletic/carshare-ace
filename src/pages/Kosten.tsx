import { Euro, TrendingUp, Calculator, Car } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { useKostenBerekening } from "@/hooks/useKostenBerekening";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function Kosten() {
  const { data, isLoading } = useKostenBerekening();

  const [aanschafprijs, setAanschafprijs] = useState(30000);
  const [afschrijvingJaar, setAfschrijvingJaar] = useState(5);
  const [verwachtOnderhoud, setVerwachtOnderhoud] = useState(200);
  const [huidigeLease, setHuidigeLease] = useState(500);

  const koopPerMaand = aanschafprijs / (afschrijvingJaar * 12) + verwachtOnderhoud;
  const verschil = huidigeLease - koopPerMaand;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kostenberekening</h1>
          <p className="text-muted-foreground mt-1">Laden...</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  const samenvatting = data!;

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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Kostenberekening</h1>
        <p className="text-muted-foreground mt-1">TCO, kosten per km en prognoses voor je wagenpark</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Euro} title="Totale TCO" value={`€${Math.round(samenvatting.totaalTCO).toLocaleString("nl-NL")}`} subtitle={`${samenvatting.aantalVoertuigen} voertuigen`} />
        <StatCard icon={Calculator} title="Gem. kosten/km" value={samenvatting.gemiddeldeKostenPerKm ? `€${samenvatting.gemiddeldeKostenPerKm.toFixed(2)}` : "—"} subtitle="Over alle voertuigen" />
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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Lease vs. Koop vergelijking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="font-medium text-foreground">Koop parameters</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-muted-foreground">Aanschafprijs (€)</label>
                  <Input type="number" value={aanschafprijs} onChange={e => setAanschafprijs(Number(e.target.value))} />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Afschrijving (jaren)</label>
                  <Input type="number" value={afschrijvingJaar} onChange={e => setAfschrijvingJaar(Number(e.target.value))} />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Verwacht onderhoud/mnd (€)</label>
                  <Input type="number" value={verwachtOnderhoud} onChange={e => setVerwachtOnderhoud(Number(e.target.value))} />
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Huidige leaseprijs/mnd (€)</label>
                <Input type="number" value={huidigeLease} onChange={e => setHuidigeLease(Number(e.target.value))} />
              </div>
            </div>
            <div className="flex flex-col justify-center space-y-4">
              <div className="clean-card p-6 text-center">
                <p className="text-sm text-muted-foreground">Koop kosten per maand</p>
                <p className="text-3xl font-bold text-foreground mt-1">€{Math.round(koopPerMaand).toLocaleString("nl-NL")}</p>
              </div>
              <div className="clean-card p-6 text-center">
                <p className="text-sm text-muted-foreground">Lease kosten per maand</p>
                <p className="text-3xl font-bold text-foreground mt-1">€{Math.round(huidigeLease).toLocaleString("nl-NL")}</p>
              </div>
              <div className={`rounded-xl p-4 text-center ${verschil > 0 ? "bg-success/10 border border-success/15" : "bg-destructive/10 border border-destructive/15"}`}>
                <p className="text-sm text-muted-foreground">
                  {verschil > 0 ? "Koop is goedkoper" : "Lease is goedkoper"}
                </p>
                <p className={`text-xl font-bold mt-1 ${verschil > 0 ? "text-success" : "text-destructive"}`}>
                  €{Math.abs(Math.round(verschil)).toLocaleString("nl-NL")}/mnd verschil
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Kosten per voertuig</CardTitle>
        </CardHeader>
        <CardContent>
          {samenvatting.voertuigKosten.length === 0 ? (
            <p className="text-muted-foreground text-sm">Geen voertuigdata beschikbaar. Voeg contracten en servicehistorie toe om kosten te berekenen.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Voertuig ID</th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Klant</th>
                    <th className="text-right py-3 px-2 text-muted-foreground font-medium">Lease</th>
                    <th className="text-right py-3 px-2 text-muted-foreground font-medium">Service</th>
                    <th className="text-right py-3 px-2 text-muted-foreground font-medium">Schade</th>
                    <th className="text-right py-3 px-2 text-muted-foreground font-medium">Totaal</th>
                    <th className="text-right py-3 px-2 text-muted-foreground font-medium">€/km</th>
                  </tr>
                </thead>
                <tbody>
                  {samenvatting.voertuigKosten.map(v => (
                    <tr key={v.voertuigId} className="border-b border-border">
                      <td className="py-3 px-2 font-medium text-foreground">{v.voertuigId.slice(0, 8)}</td>
                      <td className="py-3 px-2 text-muted-foreground">{v.klantNaam ?? "—"}</td>
                      <td className="py-3 px-2 text-right text-foreground">€{Math.round(v.leaseKosten).toLocaleString("nl-NL")}</td>
                      <td className="py-3 px-2 text-right text-foreground">€{Math.round(v.serviceKosten).toLocaleString("nl-NL")}</td>
                      <td className="py-3 px-2 text-right text-foreground">€{Math.round(v.schadeKosten).toLocaleString("nl-NL")}</td>
                      <td className="py-3 px-2 text-right font-medium text-foreground">€{Math.round(v.totaalKosten).toLocaleString("nl-NL")}</td>
                      <td className="py-3 px-2 text-right text-muted-foreground">{v.kostenPerKm ? `€${v.kostenPerKm.toFixed(2)}` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
