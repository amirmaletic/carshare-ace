import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Plus, CalendarRange, Sparkles, Inbox, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { getReservationStatusColor } from "@/data/mockData";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ReservationForm } from "@/components/ReservationForm";
import { useAanvragen } from "@/hooks/useAanvragen";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { toast } from "sonner";

const statusFilters = ['Alle', 'aangevraagd', 'bevestigd', 'actief', 'voltooid', 'geannuleerd'] as const;

export default function Reservations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("Alle");
  const [formOpen, setFormOpen] = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [prefill, setPrefill] = useState<{
    voertuig?: string;
    klant?: string;
    start?: string;
    eind?: string;
  }>({});

  // Diepe link vanuit Copilot: /reserveringen?nieuw=1&voertuig=...&klant=...&start=...&eind=...
  useEffect(() => {
    if (searchParams.get("nieuw") !== "1") return;
    setPrefill({
      voertuig: searchParams.get("voertuig") ?? undefined,
      klant: searchParams.get("klant") ?? undefined,
      start: searchParams.get("start") ?? undefined,
      eind: searchParams.get("eind") ?? undefined,
    });
    setFormOpen(true);
    const next = new URLSearchParams(searchParams);
    ["nieuw", "voertuig", "klant", "start", "eind"].forEach((k) => next.delete(k));
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const { data: reserveringen = [], isLoading } = useQuery({
    queryKey: ["reserveringen-page"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reserveringen")
        .select("*, klanten(voornaam, achternaam, email), voertuigen(merk, model, kenteken)")
        .order("start_datum", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { aanvragen, isLoading: aanvragenLoading, deleteAanvraag } = useAanvragen();
  const openAanvragen = aanvragen.filter((a) => a.status !== "omgezet" && a.status !== "geannuleerd");

  const { data: voertuigenLookup = [] } = useQuery({
    queryKey: ["voertuigen-lookup"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("voertuigen").select("id, merk, model, kenteken");
      if (error) throw error;
      return data ?? [];
    },
  });

  const handleConvertNaarKlant = async (aanvraagId: string) => {
    setConvertingId(aanvraagId);
    try {
      const { error } = await supabase.rpc("convert_aanvraag_naar_klant", { _aanvraag_id: aanvraagId });
      if (error) throw error;
      toast.success("Aanvraag omgezet naar klant");
      queryClient.invalidateQueries({ queryKey: ["aanvragen"] });
      queryClient.invalidateQueries({ queryKey: ["klanten"] });
    } catch (e: any) {
      toast.error("Fout bij omzetten: " + e.message);
    } finally {
      setConvertingId(null);
    }
  };

  const handleAanvraagNaarReservering = (aanvraag: any) => {
    setPrefill({
      voertuig: aanvraag.gekoppeld_voertuig_id ?? undefined,
      start: aanvraag.gewenste_periode_start ?? undefined,
      eind: aanvraag.gewenste_periode_eind ?? undefined,
    });
    setFormOpen(true);
  };

  const filtered = reserveringen.filter((r: any) => {
    const klantNaam = `${r.klanten?.voornaam ?? ""} ${r.klanten?.achternaam ?? ""}`.trim();
    const kenteken = r.voertuigen?.kenteken ?? "";
    const matchesSearch =
      klantNaam.toLowerCase().includes(search.toLowerCase()) ||
      kenteken.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "Alle" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reserveringen</h1>
          <p className="text-muted-foreground mt-1">
            {reserveringen.length} reserveringen · {openAanvragen.length} open aanvragen
          </p>
        </div>
        <Button className="gap-2" onClick={() => setFormOpen(true)}>
          <Plus className="w-4 h-4" />Nieuwe reservering
        </Button>
      </div>

      <Tabs defaultValue={openAanvragen.length > 0 ? "aanvragen" : "reserveringen"} className="space-y-4">
        <TabsList>
          <TabsTrigger value="reserveringen" className="gap-2">
            <CalendarRange className="w-4 h-4" />
            Reserveringen ({reserveringen.length})
          </TabsTrigger>
          <TabsTrigger value="aanvragen" className="gap-2">
            <Sparkles className="w-4 h-4" />
            Aanvragen {openAanvragen.length > 0 && `(${openAanvragen.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reserveringen" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Zoek op klant of kenteken..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {statusFilters.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${statusFilter === s ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"}`}>{s}</button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : (
        <div className="clean-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Klant</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Voertuig</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Periode</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Totaal</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((r: any, i: number) => (
                  <tr key={r.id} className="hover:bg-muted/50 transition-colors animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                    <td className="px-5 py-4">
                      <p className="font-medium text-sm text-foreground">{r.klanten?.voornaam} {r.klanten?.achternaam}</p>
                      <p className="text-xs text-muted-foreground">{r.klanten?.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-foreground">{r.voertuigen?.merk} {r.voertuigen?.model}</p>
                      <p className="text-xs text-muted-foreground font-mono">{r.voertuigen?.kenteken}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-foreground">{r.start_datum}</p>
                      <p className="text-xs text-muted-foreground">t/m {r.eind_datum}</p>
                    </td>
                    <td className="px-5 py-4 text-right"><span className="font-medium text-foreground">€{r.totaalprijs}</span></td>
                    <td className="px-5 py-4 text-right"><StatusBadge status={r.status} variant={getReservationStatusColor(r.status)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <CalendarRange className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground">Geen reserveringen gevonden</p>
            </div>
          )}
        </div>
      )}
        </TabsContent>

        <TabsContent value="aanvragen" className="space-y-3">
          {aanvragenLoading ? (
            <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : openAanvragen.length === 0 ? (
            <div className="clean-card text-center py-12">
              <Inbox className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground">Geen open aanvragen</p>
              <p className="text-xs text-muted-foreground mt-1">Aanvragen vanuit het klantportaal verschijnen hier automatisch.</p>
            </div>
          ) : (
            openAanvragen.map((a) => {
              const v = voertuigenLookup.find((x: any) => x.id === a.gekoppeld_voertuig_id);
              return (
                <div key={a.id} className="clean-card p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{a.klant_naam}</span>
                        <Badge variant={a.status === "gekoppeld" ? "default" : "secondary"}>{a.status}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                        {a.klant_email && <span>{a.klant_email}</span>}
                        {a.klant_telefoon && <span>{a.klant_telefoon}</span>}
                        <span>{format(new Date(a.created_at), "d MMM yyyy HH:mm", { locale: nl })}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleConvertNaarKlant(a.id)} disabled={convertingId === a.id}>
                        {convertingId === a.id ? "Bezig..." : "Maak klant"}
                      </Button>
                      <Button size="sm" className="gap-1" onClick={() => handleAanvraagNaarReservering(a)}>
                        Reservering <ArrowRight className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {a.gewenst_type && <Badge variant="outline">{a.gewenst_type}</Badge>}
                    {a.gewenste_categorie && <Badge variant="outline">{a.gewenste_categorie}</Badge>}
                    {a.gewenste_brandstof && <Badge variant="outline">{a.gewenste_brandstof}</Badge>}
                    {a.budget_max && <Badge variant="outline">Max €{a.budget_max}/dag</Badge>}
                    {a.gewenste_periode_start && (
                      <Badge variant="outline">
                        {a.gewenste_periode_start} t/m {a.gewenste_periode_eind ?? "?"}
                      </Badge>
                    )}
                  </div>
                  {v && (
                    <div className="text-sm bg-muted/50 rounded-lg p-3">
                      <span className="text-muted-foreground">Voorgesteld voertuig: </span>
                      <span className="font-medium text-foreground">{v.merk} {v.model}</span>
                      <span className="font-mono text-xs text-muted-foreground ml-2">{v.kenteken}</span>
                    </div>
                  )}
                  {a.notitie && <p className="text-sm text-muted-foreground italic">"{a.notitie}"</p>}
                </div>
              );
            })
          )}
        </TabsContent>
      </Tabs>

      <ReservationForm
        open={formOpen}
        onOpenChange={setFormOpen}
        prefilledVehicleId={prefill.voertuig}
        prefilledKlantId={prefill.klant}
        prefilledStartDatum={prefill.start}
        prefilledEindDatum={prefill.eind}
      />
    </div>
  );
}
