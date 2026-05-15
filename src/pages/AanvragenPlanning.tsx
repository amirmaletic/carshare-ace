import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Inbox, Sparkles, CheckCircle2, X, Calendar as CalendarIcon, User, Mail, Phone, Car, Search, Wand2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAanvragen, type DbAanvraag } from "@/hooks/useAanvragen";
import { useAanvraagMatching, type MatchVoertuig } from "@/hooks/useAanvraagMatching";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, differenceInCalendarDays, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  nieuw: "Nieuw",
  gekoppeld: "Gekoppeld",
  omgezet: "Omgezet",
  geannuleerd: "Geannuleerd",
};

function periodeLabel(a: DbAanvraag) {
  if (!a.gewenste_periode_start) return "Geen periode";
  const s = format(parseISO(a.gewenste_periode_start), "d MMM", { locale: nl });
  const e = a.gewenste_periode_eind
    ? format(parseISO(a.gewenste_periode_eind), "d MMM", { locale: nl })
    : "?";
  return `${s} t/m ${e}`;
}

export default function AanvragenPlanning() {
  const { aanvragen, isLoading, deleteAanvraag } = useAanvragen();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("open");
  const [search, setSearch] = useState("");
  const [chosenVoertuigId, setChosenVoertuigId] = useState<string | null>(null);
  const [bevestigen, setBevestigen] = useState(false);
  const [contractType, setContractType] = useState<"verhuur" | "lease">("verhuur");

  // Realtime: nieuwe aanvragen meteen tonen
  useEffect(() => {
    const channel = supabase
      .channel("aanvragen-planning")
      .on("postgres_changes", { event: "*", schema: "public", table: "aanvragen" }, () => {
        queryClient.invalidateQueries({ queryKey: ["aanvragen"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return aanvragen.filter((a) => {
      if (statusFilter === "open" && (a.status === "omgezet" || a.status === "geannuleerd")) return false;
      if (statusFilter !== "open" && statusFilter !== "alle" && a.status !== statusFilter) return false;
      if (q && !`${a.klant_naam} ${a.klant_email ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [aanvragen, statusFilter, search]);

  const selected = useMemo(
    () => filtered.find((a) => a.id === selectedId) ?? filtered[0] ?? null,
    [filtered, selectedId]
  );

  // Auto-select eerste
  useEffect(() => {
    if (!selectedId && filtered[0]) setSelectedId(filtered[0].id);
    if (selected) setChosenVoertuigId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  const { data: matches = [], isLoading: matchLoading } = useAanvraagMatching(selected);

  const topMatch = matches[0];
  const huidigeKeuze: MatchVoertuig | undefined =
    matches.find((m) => m.id === chosenVoertuigId) ?? topMatch;

  const dagen = selected?.gewenste_periode_start
    ? Math.max(
        differenceInCalendarDays(
          parseISO(selected.gewenste_periode_eind ?? selected.gewenste_periode_start),
          parseISO(selected.gewenste_periode_start)
        ),
        1
      )
    : 1;

  const handleBevestigen = async () => {
    if (!selected || !huidigeKeuze) return;
    setBevestigen(true);
    try {
      const { data, error } = await supabase.rpc("bevestig_aanvraag_naar_contract", {
        _aanvraag_id: selected.id,
        _voertuig_id: huidigeKeuze.id,
        _type: contractType,
        _prijs: huidigeKeuze.dagprijs,
      });
      if (error) throw error;
      const contractId = data as unknown as string;
      toast.success(`Concept-${contractType === "lease" ? "leasecontract" : "huurcontract"} aangemaakt`, {
        description: `${huidigeKeuze.merk} ${huidigeKeuze.model} (${huidigeKeuze.kenteken})`,
        action: {
          label: "Open contract",
          onClick: () => navigate(`/contracts?open=${contractId}`),
        },
      });
      queryClient.invalidateQueries({ queryKey: ["aanvragen"] });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["gantt-contracten"] });
      setSelectedId(null);
    } catch (e: any) {
      toast.error("Bevestigen mislukt: " + e.message);
    } finally {
      setBevestigen(false);
    }
  };

  const handleAfwijzen = async () => {
    if (!selected) return;
    if (!confirm("Aanvraag verwijderen?")) return;
    deleteAanvraag.mutate(selected.id);
    setSelectedId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Aanvragen planning</h1>
          <p className="text-muted-foreground mt-1">
            Slimme matching · {filtered.length} aanvragen in beeld
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Zoek op klant of email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open aanvragen</SelectItem>
            <SelectItem value="nieuw">Nieuw</SelectItem>
            <SelectItem value="gekoppeld">Gekoppeld</SelectItem>
            <SelectItem value="omgezet">Omgezet</SelectItem>
            <SelectItem value="alle">Alles</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4">
        {/* Lijst */}
        <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="clean-card text-center py-12">
              <Inbox className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground">Geen aanvragen</p>
            </div>
          ) : (
            filtered.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelectedId(a.id)}
                className={cn(
                  "w-full text-left clean-card p-3 transition-all hover:border-primary/40",
                  selected?.id === a.id && "ring-2 ring-primary border-primary"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{a.klant_naam}</p>
                    <p className="text-xs text-muted-foreground truncate">{a.klant_email}</p>
                  </div>
                  <Badge variant={a.status === "omgezet" ? "outline" : "default"} className="shrink-0">
                    {STATUS_LABELS[a.status] ?? a.status}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2 text-xs">
                  {a.gewenst_type && <Badge variant="outline" className="text-xs">{a.gewenst_type}</Badge>}
                  <Badge variant="outline" className="text-xs gap-1">
                    <CalendarIcon className="w-3 h-3" />{periodeLabel(a)}
                  </Badge>
                  {a.budget_max && <Badge variant="outline" className="text-xs">€{a.budget_max}/dag</Badge>}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Detail */}
        {selected ? (
          <div className="clean-card p-5 space-y-5">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-xl font-semibold text-foreground">{selected.klant_naam}</h2>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-1">
                  {selected.klant_email && (
                    <span className="inline-flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{selected.klant_email}</span>
                  )}
                  {selected.klant_telefoon && (
                    <span className="inline-flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{selected.klant_telefoon}</span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    {periodeLabel(selected)} · {dagen} dag{dagen > 1 ? "en" : ""}
                  </span>
                </div>
              </div>
              <Badge variant="outline">{STATUS_LABELS[selected.status] ?? selected.status}</Badge>
            </div>

            <div className="flex flex-wrap gap-2">
              {selected.gewenst_type && <Badge variant="outline">Type: {selected.gewenst_type}</Badge>}
              {selected.gewenste_categorie && <Badge variant="outline">{selected.gewenste_categorie}</Badge>}
              {selected.gewenste_brandstof && <Badge variant="outline">{selected.gewenste_brandstof}</Badge>}
              {selected.budget_max && <Badge variant="outline">Budget max €{selected.budget_max}/dag</Badge>}
            </div>

            {selected.notitie && (
              <div className="bg-muted/50 rounded-lg p-3 text-sm italic text-muted-foreground">
                &ldquo;{selected.notitie}&rdquo;
              </div>
            )}

            {/* Voorgesteld voertuig */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-primary" />
                <h3 className="font-medium text-foreground">Voorgesteld voertuig</h3>
              </div>

              {matchLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                </div>
              ) : !huidigeKeuze ? (
                <div className="text-center py-10 bg-muted/40 rounded-lg">
                  <Car className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-muted-foreground">Geen beschikbaar voertuig in deze periode</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pas de wensen of periode aan, of maak handmatig een reservering.
                  </p>
                </div>
              ) : (
                <div className="border-2 border-primary/30 bg-primary/5 rounded-xl p-4 flex gap-4 items-center">
                  {huidigeKeuze.image_url ? (
                    <img
                      src={huidigeKeuze.image_url}
                      alt={`${huidigeKeuze.merk} ${huidigeKeuze.model}`}
                      className="w-32 h-20 object-contain bg-white rounded-lg shrink-0"
                    />
                  ) : (
                    <div className="w-32 h-20 bg-muted rounded-lg flex items-center justify-center shrink-0">
                      <Car className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">
                      {huidigeKeuze.merk} {huidigeKeuze.model}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">{huidigeKeuze.kenteken}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {huidigeKeuze.redenen.slice(0, 3).map((r, i) => (
                        <Badge key={i} variant="secondary" className="text-xs gap-1">
                          <Sparkles className="w-3 h-3" />{r}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">Dagprijs</p>
                    <p className="text-lg font-bold text-foreground">€{huidigeKeuze.dagprijs}</p>
                    <p className="text-xs text-muted-foreground mt-1">Totaal: €{(huidigeKeuze.dagprijs * dagen).toFixed(2)}</p>
                  </div>
                </div>
              )}

              {matches.length > 1 && (
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">
                    Andere keuze ({matches.length - 1} alternatie{matches.length - 1 === 1 ? "f" : "ven"})
                  </label>
                  <Select
                    value={huidigeKeuze?.id ?? ""}
                    onValueChange={(v) => setChosenVoertuigId(v)}
                  >
                    <SelectTrigger><SelectValue placeholder="Kies voertuig" /></SelectTrigger>
                    <SelectContent>
                      {matches.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.merk} {m.model} · {m.kenteken} · €{m.dagprijs}/dag
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Acties */}
            <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
              <Select value={contractType} onValueChange={(v) => setContractType(v as "verhuur" | "lease")}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="verhuur">Huurcontract</SelectItem>
                  <SelectItem value="lease">Leasecontract</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="lg"
                className="gap-2 flex-1 sm:flex-none"
                disabled={!huidigeKeuze || bevestigen || selected.status === "omgezet"}
                onClick={handleBevestigen}
              >
                <CheckCircle2 className="w-4 h-4" />
                {bevestigen ? "Bezig..." : "Omzetten naar contract"}
              </Button>
              <Button variant="outline" onClick={handleAfwijzen} className="gap-2">
                <X className="w-4 h-4" />Afwijzen
              </Button>
            </div>
          </div>
        ) : (
          <div className="clean-card flex items-center justify-center py-20">
            <div className="text-center">
              <User className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground">Selecteer een aanvraag</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}