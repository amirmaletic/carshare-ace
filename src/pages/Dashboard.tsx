import { Car, CalendarRange, Wrench, Euro, TrendingUp, AlertTriangle, Clock, FileText, Bike, RotateCcw, User } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { vehicles, reservations, maintenanceRecords, contracts, getVehicleById, getStatusColor, getReservationStatusColor, getContractTypeIcon, getContractStatusColor } from "@/data/mockData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const revenueData = [
  { maand: 'Okt', omzet: 4200 },
  { maand: 'Nov', omzet: 5100 },
  { maand: 'Dec', omzet: 3800 },
  { maand: 'Jan', omzet: 4600 },
  { maand: 'Feb', omzet: 5400 },
  { maand: 'Mrt', omzet: 6100 },
];

const statusCounts = [
  { name: 'Beschikbaar', value: vehicles.filter(v => v.status === 'beschikbaar').length, color: 'hsl(142, 71%, 45%)' },
  { name: 'Verhuurd', value: vehicles.filter(v => v.status === 'verhuurd').length, color: 'hsl(221, 83%, 53%)' },
  { name: 'Onderhoud', value: vehicles.filter(v => v.status === 'onderhoud').length, color: 'hsl(38, 92%, 50%)' },
  { name: 'Gereserveerd', value: vehicles.filter(v => v.status === 'gereserveerd').length, color: 'hsl(221, 83%, 70%)' },
];

const activeReservations = reservations.filter(r => r.status === 'actief' || r.status === 'bevestigd');
const totalRevenue = reservations.filter(r => r.status !== 'geannuleerd').reduce((sum, r) => sum + r.totaalPrijs, 0);
const upcomingMaintenance = maintenanceRecords.filter(m => m.status === 'gepland').length;
const activeContracts = contracts.filter(c => c.status === 'actief');
const monthlyLeaseRevenue = activeContracts.reduce((sum, c) => sum + c.maandprijs, 0);
const overdueInvoices = contracts.flatMap(c => c.facturen).filter(f => f.status === 'te_laat' || f.status === 'herinnering_verstuurd');

export default function Dashboard() {
  const { user } = useAuth();

  const { data: terugmeldingen = [] } = useQuery({
    queryKey: ["terugmeldingen"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("terugmeldingen")
        .select("medewerker_email, id")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as { medewerker_email: string | null; id: string }[];
    },
    enabled: !!user,
  });

  // Group by medewerker
  const terugmeldingenPerMedewerker = terugmeldingen.reduce<Record<string, number>>((acc, t) => {
    const key = t.medewerker_email || "Onbekend";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const medewerkerStats = Object.entries(terugmeldingenPerMedewerker)
    .map(([email, count]) => ({ email, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overzicht van je wagenpark en verhuuractiviteiten</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatCard icon={Car} title="Totaal voertuigen" value={vehicles.length} subtitle={`${vehicles.filter(v => v.status === 'beschikbaar').length} beschikbaar`} trend={{ value: 12, label: 'vs vorige maand' }} />
        <StatCard icon={FileText} title="Actieve contracten" value={activeContracts.length} subtitle={`€${monthlyLeaseRevenue.toLocaleString('nl-NL')}/mnd`} trend={{ value: 5, label: 'vs vorige maand' }} />
        <StatCard icon={CalendarRange} title="Actieve reserveringen" value={activeReservations.length} subtitle="Deze week" trend={{ value: 8, label: 'vs vorige week' }} />
        <StatCard icon={Euro} title="Omzet deze maand" value={`€${totalRevenue.toLocaleString('nl-NL')}`} subtitle="Verhuurinkomsten" trend={{ value: 15, label: 'vs vorige maand' }} />
        <StatCard icon={Wrench} title="Gepland onderhoud" value={upcomingMaintenance} subtitle="Komende 30 dagen" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 clean-card p-6">
          <h3 className="font-semibold text-foreground mb-4">Omzet overzicht</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 92%)" />
              <XAxis dataKey="maand" tick={{ fill: 'hsl(215, 14%, 46%)', fontSize: 12 }} />
              <YAxis tick={{ fill: 'hsl(215, 14%, 46%)', fontSize: 12 }} tickFormatter={v => `€${v}`} />
              <Tooltip formatter={(v: number) => [`€${v}`, 'Omzet']} contentStyle={{ borderRadius: '8px', border: '1px solid hsl(214, 20%, 92%)' }} />
              <Bar dataKey="omzet" fill="hsl(221, 83%, 53%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="clean-card p-6">
          <h3 className="font-semibold text-foreground mb-4">Vlootstatus</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={statusCounts} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                {statusCounts.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {statusCounts.map(s => (
              <div key={s.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-muted-foreground">{s.name}</span>
                </div>
                <span className="font-medium text-foreground">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="clean-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Recente reserveringen</h3>
            <CalendarRange className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {reservations.slice(0, 4).map(r => {
              const vehicle = getVehicleById(r.voertuigId);
              return (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">{r.klantNaam}</p>
                    <p className="text-xs text-muted-foreground">{vehicle?.merk} {vehicle?.model} • {r.startDatum}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground">€{r.totaalPrijs}</span>
                    <StatusBadge status={r.status} variant={getReservationStatusColor(r.status)} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="clean-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Meldingen</h3>
            <AlertTriangle className="w-4 h-4 text-warning" />
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-warning/5 border border-warning/10">
              <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">APK verloopt binnenkort</p>
                <p className="text-xs text-muted-foreground">CD-234-EF (Ford Transit) — vervalt 01-05-2025</p>
              </div>
            </div>
            {overdueInvoices.length > 0 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">{overdueInvoices.length} openstaande facturen</p>
                  <p className="text-xs text-muted-foreground">€{overdueInvoices.reduce((s, f) => s + f.bedrag, 0)} totaal — betalingsherinneringen verstuurd</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-info/5 border border-info/10">
              <Clock className="w-4 h-4 text-info mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Onderhoud vandaag</p>
                <p className="text-xs text-muted-foreground">IJ-789-KL (BMW X3) — grote beurt + remblokken</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-success/5 border border-success/10">
              <TrendingUp className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Omzet stijging</p>
                <p className="text-xs text-muted-foreground">+15% verhuuropbrengsten t.o.v. vorige maand</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Terugmeldingen per medewerker */}
      <div className="clean-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Terugmeldingen per medewerker</h3>
          <RotateCcw className="w-4 h-4 text-muted-foreground" />
        </div>
        {medewerkerStats.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nog geen terugmeldingen geregistreerd</p>
        ) : (
          <div className="space-y-3">
            {medewerkerStats.map((m, i) => (
              <div key={m.email} className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="p-2 rounded-lg bg-muted">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{m.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 rounded-full bg-primary/20 w-24">
                    <div
                      className="h-2 rounded-full bg-primary transition-all"
                      style={{ width: `${Math.min((m.count / Math.max(...medewerkerStats.map(s => s.count))) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-foreground w-8 text-right">{m.count}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
