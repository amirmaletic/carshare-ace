import { Car, CalendarRange, Wrench, Euro, TrendingUp, AlertTriangle, Clock, FileText, Bike } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { vehicles, reservations, maintenanceRecords, contracts, getVehicleById, getStatusColor, getReservationStatusColor, getContractTypeIcon, getContractStatusColor } from "@/data/mockData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

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
  { name: 'Verhuurd', value: vehicles.filter(v => v.status === 'verhuurd').length, color: 'hsl(210, 92%, 45%)' },
  { name: 'Onderhoud', value: vehicles.filter(v => v.status === 'onderhoud').length, color: 'hsl(38, 92%, 50%)' },
  { name: 'Gereserveerd', value: vehicles.filter(v => v.status === 'gereserveerd').length, color: 'hsl(36, 95%, 50%)' },
];

const activeReservations = reservations.filter(r => r.status === 'actief' || r.status === 'bevestigd');
const totalRevenue = reservations.filter(r => r.status !== 'geannuleerd').reduce((sum, r) => sum + r.totaalPrijs, 0);
const upcomingMaintenance = maintenanceRecords.filter(m => m.status === 'gepland').length;
const activeContracts = contracts.filter(c => c.status === 'actief');
const monthlyLeaseRevenue = activeContracts.reduce((sum, c) => sum + c.maandprijs, 0);
const overdueInvoices = contracts.flatMap(c => c.facturen).filter(f => f.status === 'te_laat' || f.status === 'herinnering_verstuurd');

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overzicht van je wagenpark en verhuuractiviteiten</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={Car} title="Totaal voertuigen" value={vehicles.length} subtitle={`${vehicles.filter(v => v.status === 'beschikbaar').length} beschikbaar`} trend={{ value: 12, label: 'vs vorige maand' }} />
        <StatCard icon={FileText} title="Actieve contracten" value={activeContracts.length} subtitle={`€${monthlyLeaseRevenue.toLocaleString('nl-NL')}/mnd`} trend={{ value: 5, label: 'vs vorige maand' }} />
        <StatCard icon={CalendarRange} title="Actieve reserveringen" value={activeReservations.length} subtitle="Deze week" trend={{ value: 8, label: 'vs vorige week' }} />
        <StatCard icon={Euro} title="Omzet deze maand" value={`€${totalRevenue.toLocaleString('nl-NL')}`} subtitle="Verhuurinkomsten" trend={{ value: 15, label: 'vs vorige maand' }} />
        <StatCard icon={Wrench} title="Gepland onderhoud" value={upcomingMaintenance} subtitle="Komende 30 dagen" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="lg:col-span-2 glass-card rounded-xl p-6">
          <h3 className="font-display font-semibold text-foreground mb-4">Omzet overzicht</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
              <XAxis dataKey="maand" tick={{ fill: 'hsl(220, 10%, 46%)', fontSize: 12 }} />
              <YAxis tick={{ fill: 'hsl(220, 10%, 46%)', fontSize: 12 }} tickFormatter={v => `€${v}`} />
              <Tooltip formatter={(v: number) => [`€${v}`, 'Omzet']} contentStyle={{ borderRadius: '8px', border: '1px solid hsl(220, 13%, 91%)' }} />
              <Bar dataKey="omzet" fill="hsl(36, 95%, 50%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status pie */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="font-display font-semibold text-foreground mb-4">Vlootstatus</h3>
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

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent reservations */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-foreground">Recente reserveringen</h3>
            <CalendarRange className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {reservations.slice(0, 4).map(r => {
              const vehicle = getVehicleById(r.voertuigId);
              return (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
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

        {/* Alerts */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-foreground">Meldingen</h3>
            <AlertTriangle className="w-4 h-4 text-warning" />
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-warning/5 border border-warning/15">
              <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">APK verloopt binnenkort</p>
                <p className="text-xs text-muted-foreground">CD-234-EF (Ford Transit) — vervalt 01-05-2025</p>
              </div>
            </div>
            {overdueInvoices.length > 0 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/15">
                <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">{overdueInvoices.length} openstaande facturen</p>
                  <p className="text-xs text-muted-foreground">€{overdueInvoices.reduce((s, f) => s + f.bedrag, 0)} totaal — betalingsherinneringen verstuurd</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-info/5 border border-info/15">
              <Clock className="w-4 h-4 text-info mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Onderhoud vandaag</p>
                <p className="text-xs text-muted-foreground">IJ-789-KL (BMW X3) — grote beurt + remblokken</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-success/5 border border-success/15">
              <TrendingUp className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Omzet stijging</p>
                <p className="text-xs text-muted-foreground">+15% verhuuropbrengsten t.o.v. vorige maand</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
