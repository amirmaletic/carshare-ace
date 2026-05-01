import { useMemo, useState } from "react";
import { Wrench, Plus, AlertTriangle, Calendar as CalendarIcon, Euro, Search, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useVoertuigen } from "@/hooks/useVoertuigen";
import { differenceInDays, format, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { nl } from "date-fns/locale";
import { cn } from "@/lib/utils";

function apkSeverity(days: number) {
  if (days < 0) return { label: "Verlopen", color: "text-destructive bg-destructive/10 border-destructive/30" };
  if (days <= 30) return { label: `${days}d`, color: "text-destructive bg-destructive/10 border-destructive/30" };
  if (days <= 60) return { label: `${days}d`, color: "text-warning bg-warning/10 border-warning/30" };
  return { label: `${days}d`, color: "text-muted-foreground bg-muted border-border" };
}

export default function Maintenance() {
  const { user } = useAuth();
  const { voertuigen } = useVoertuigen();
  const [zoek, setZoek] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("alle");

  const { data: serviceRecords = [], isLoading } = useQuery({
    queryKey: ["all-service-historie"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_historie")
        .select("*")
        .order("datum", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const getVehicle = (id: string) => voertuigen.find(v => v.id === id);

  // APK-radar: voertuigen op vervaldatum
  const apkRadar = useMemo(() => {
    const now = new Date();
    return voertuigen
      .filter(v => v.apk_vervaldatum)
      .map(v => ({ vehicle: v, days: differenceInDays(parseISO(v.apk_vervaldatum as string), now) }))
      .filter(x => x.days <= 90)
      .sort((a, b) => a.days - b.days);
  }, [voertuigen]);

  // Kosten deze maand + jaar
  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now).getTime();
    const monthEnd = endOfMonth(now).getTime();
    const yearStart = new Date(now.getFullYear(), 0, 1).getTime();
    let kostenMaand = 0, kostenJaar = 0, geplandCount = 0;
    for (const r of serviceRecords as any[]) {
      const t = new Date(r.datum).getTime();
      const k = Number(r.kosten ?? 0);
      if (t >= monthStart && t <= monthEnd) kostenMaand += k;
      if (t >= yearStart) kostenJaar += k;
      if (t > now.getTime()) geplandCount += 1;
    }
    return { kostenMaand, kostenJaar, geplandCount, totaal: serviceRecords.length };
  }, [serviceRecords]);

  const types = useMemo(() => {
    const set = new Set<string>();
    for (const r of serviceRecords as any[]) if (r.type) set.add(r.type);
    return Array.from(set);
  }, [serviceRecords]);

  const filtered = useMemo(() => {
    return (serviceRecords as any[]).filter(r => {
      if (typeFilter !== "alle" && r.type !== typeFilter) return false;
      if (!zoek) return true;
      const v = getVehicle(r.voertuig_id);
      const blob = `${v?.kenteken ?? ""} ${v?.merk ?? ""} ${v?.model ?? ""} ${r.omschrijving ?? ""} ${r.garage ?? ""}`.toLowerCase();
      return blob.includes(zoek.toLowerCase());
    });
  }, [serviceRecords, typeFilter, zoek, voertuigen]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Onderhoud</h1>
          <p className="text-muted-foreground mt-1">Plan en beheer onderhoud, APK en reparaties</p>
        </div>
        <Button className="gap-2"><Plus className="w-4 h-4" />Onderhoud inplannen</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="clean-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs"><Euro className="w-3.5 h-3.5" />Kosten deze maand</div>
          <div className="text-2xl font-semibold text-foreground mt-1">€{stats.kostenMaand.toLocaleString("nl-NL", { maximumFractionDigits: 0 })}</div>
        </div>
        <div className="clean-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs"><Euro className="w-3.5 h-3.5" />Kosten dit jaar</div>
          <div className="text-2xl font-semibold text-foreground mt-1">€{stats.kostenJaar.toLocaleString("nl-NL", { maximumFractionDigits: 0 })}</div>
        </div>
        <div className="clean-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs"><CalendarIcon className="w-3.5 h-3.5" />Gepland</div>
          <div className="text-2xl font-semibold text-foreground mt-1">{stats.geplandCount}</div>
        </div>
        <div className="clean-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs"><Wrench className="w-3.5 h-3.5" />Totaal records</div>
          <div className="text-2xl font-semibold text-foreground mt-1">{stats.totaal}</div>
        </div>
      </div>

      {/* APK Radar */}
      <div className="clean-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <ShieldAlert className="w-4 h-4 text-warning" />
          <h2 className="font-semibold text-foreground">APK-radar</h2>
          <span className="text-xs text-muted-foreground">(volgende 90 dagen)</span>
        </div>
        {apkRadar.length === 0 ? (
          <p className="text-sm text-muted-foreground">Geen APK's binnen 90 dagen.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {apkRadar.map(({ vehicle, days }) => {
              const sev = apkSeverity(days);
              return (
                <div key={vehicle.id} className={cn("flex items-center justify-between gap-3 px-3 py-2 rounded-lg border", sev.color)}>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{vehicle.merk} {vehicle.model}</p>
                    <p className="text-xs font-mono opacity-80">{vehicle.kenteken} · {format(parseISO(vehicle.apk_vervaldatum as string), "d MMM yyyy", { locale: nl })}</p>
                  </div>
                  <span className="text-xs font-semibold whitespace-nowrap flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />{sev.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={zoek} onChange={e => setZoek(e.target.value)} placeholder="Zoek op kenteken, merk, omschrijving..." className="pl-9" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="sm:w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle types</SelectItem>
            {types.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Wrench className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-1">Geen resultaten</h3>
          <p className="text-muted-foreground text-sm">Pas je filters aan of plan een nieuwe onderhoudsbeurt in.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((m: any, i: number) => {
            const vehicle = getVehicle(m.voertuig_id);
            return (
              <div key={m.id} className="clean-card p-5 flex flex-col sm:flex-row sm:items-center gap-4 animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="p-2.5 rounded-lg bg-warning/10 self-start"><Wrench className="w-5 h-5 text-warning" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-foreground">{m.type}</h3>
                    <span className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground font-mono">{vehicle?.kenteken ?? "-"}</span>
                    {m.garage && <span className="text-xs text-muted-foreground">@ {m.garage}</span>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{vehicle ? `${vehicle.merk} ${vehicle.model} · ` : ""}{m.omschrijving}</p>
                  <p className="text-xs text-muted-foreground mt-1">{format(parseISO(m.datum), "d MMMM yyyy", { locale: nl })}{m.kilometerstand ? ` · ${Number(m.kilometerstand).toLocaleString("nl-NL")} km` : ""}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-medium text-foreground">€{Number(m.kosten ?? 0).toLocaleString("nl-NL", { maximumFractionDigits: 0 })}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
