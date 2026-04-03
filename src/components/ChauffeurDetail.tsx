import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { type Chauffeur } from "@/hooks/useChauffeurs";
import { useVoertuigen } from "@/hooks/useVoertuigen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  User, Mail, Phone, Car, CreditCard, MapPin, CalendarIcon,
  AlertTriangle, Truck, Clock, X, Plus, Trash2, CalendarDays
} from "lucide-react";
import { format, differenceInDays, parseISO, isWithinInterval, addDays, eachDayOfInterval } from "date-fns";
import { nl } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { toast } from "sonner";
import { RitForm } from "@/components/RitForm";

interface ChauffeurDetailProps {
  chauffeur: Chauffeur;
  onClose: () => void;
}

interface Beschikbaarheid {
  id: string;
  chauffeur_id: string;
  type: string;
  start_datum: string;
  eind_datum: string;
  notitie: string | null;
}

interface Rit {
  id: string;
  datum: string;
  van_locatie: string;
  naar_locatie: string;
  afstand_km: number | null;
  status: string;
  kosten: number | null;
}

const typeColors: Record<string, string> = {
  verlof: "bg-warning/10 text-warning",
  ziek: "bg-destructive/10 text-destructive",
  training: "bg-info/10 text-info",
  anders: "bg-muted text-muted-foreground",
};

const typeLabels: Record<string, string> = {
  verlof: "Verlof",
  ziek: "Ziek",
  training: "Training",
  anders: "Anders",
};

export function ChauffeurDetail({ chauffeur, onClose }: ChauffeurDetailProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { voertuigen } = useVoertuigen();
  const [addLeaveOpen, setAddLeaveOpen] = useState(false);
  const [addRitOpen, setAddRitOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    type: "verlof",
    start_datum: undefined as Date | undefined,
    eind_datum: undefined as Date | undefined,
    notitie: "",
  });

  const voertuig = voertuigen.find((v) => v.id === chauffeur.voertuig_id);
  const rijbewijsWarning = chauffeur.rijbewijs_verloopt
    ? differenceInDays(new Date(chauffeur.rijbewijs_verloopt), new Date()) <= 30
    : false;
  const rijbewijsVerlopen = chauffeur.rijbewijs_verloopt
    ? differenceInDays(new Date(chauffeur.rijbewijs_verloopt), new Date()) < 0
    : false;

  // Fetch ritten for this chauffeur
  const { data: ritten = [] } = useQuery({
    queryKey: ["chauffeur-ritten", chauffeur.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ritten")
        .select("id, datum, van_locatie, naar_locatie, afstand_km, status, kosten")
        .eq("chauffeur_id", chauffeur.id)
        .order("datum", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as Rit[];
    },
    enabled: !!user,
  });

  // Fetch beschikbaarheid
  const { data: beschikbaarheid = [] } = useQuery({
    queryKey: ["chauffeur-beschikbaarheid", chauffeur.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chauffeur_beschikbaarheid")
        .select("*")
        .eq("chauffeur_id", chauffeur.id)
        .order("start_datum", { ascending: false });
      if (error) throw error;
      return data as Beschikbaarheid[];
    },
    enabled: !!user,
  });

  const addLeaveMutation = useMutation({
    mutationFn: async () => {
      if (!leaveForm.start_datum || !leaveForm.eind_datum || !user) return;
      const { error } = await supabase.from("chauffeur_beschikbaarheid").insert({
        user_id: user.id,
        chauffeur_id: chauffeur.id,
        type: leaveForm.type,
        start_datum: format(leaveForm.start_datum, "yyyy-MM-dd"),
        eind_datum: format(leaveForm.eind_datum, "yyyy-MM-dd"),
        notitie: leaveForm.notitie || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Beschikbaarheid toegevoegd");
      queryClient.invalidateQueries({ queryKey: ["chauffeur-beschikbaarheid"] });
      setAddLeaveOpen(false);
      setLeaveForm({ type: "verlof", start_datum: undefined, eind_datum: undefined, notitie: "" });
    },
    onError: () => toast.error("Fout bij opslaan"),
  });

  const deleteLeaveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("chauffeur_beschikbaarheid").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Verwijderd");
      queryClient.invalidateQueries({ queryKey: ["chauffeur-beschikbaarheid"] });
    },
  });

  // Stats
  const totalRitten = ritten.length;
  const totalKm = ritten.reduce((s, r) => s + (r.afstand_km ?? 0), 0);
  const totalKosten = ritten.reduce((s, r) => s + (r.kosten ?? 0), 0);
  const afgerondeRitten = ritten.filter((r) => r.status === "afgerond").length;

  // Check if available today
  const today = new Date();
  const isUnavailableToday = beschikbaarheid.some((b) => {
    try {
      return isWithinInterval(today, { start: parseISO(b.start_datum), end: addDays(parseISO(b.eind_datum), 1) });
    } catch { return false; }
  });

  // Build calendar highlights for next 30 days
  const unavailableDays = beschikbaarheid.flatMap((b) => {
    try {
      return eachDayOfInterval({ start: parseISO(b.start_datum), end: parseISO(b.eind_datum) });
    } catch { return []; }
  });

  const statusColors: Record<string, "success" | "warning" | "muted" | "destructive"> = {
    actief: "success",
    inactief: "muted",
    verlof: "warning",
  };

  return (
    <div className="clean-card overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-border bg-muted/30">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {chauffeur.voornaam} {chauffeur.achternaam}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <StatusBadge status={chauffeur.status} variant={statusColors[chauffeur.status] || "muted"} />
                {isUnavailableToday && (
                  <Badge variant="outline" className="text-xs border-warning text-warning">Niet beschikbaar</Badge>
                )}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="p-5 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <p className="text-xl font-bold text-foreground">{totalRitten}</p>
            <p className="text-xs text-muted-foreground">Ritten</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <p className="text-xl font-bold text-foreground">{totalKm.toLocaleString("nl-NL")}</p>
            <p className="text-xs text-muted-foreground">Km gereden</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <p className="text-xl font-bold text-foreground">{afgerondeRitten}</p>
            <p className="text-xs text-muted-foreground">Afgerond</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <p className="text-xl font-bold text-foreground">€{totalKosten.toLocaleString("nl-NL")}</p>
            <p className="text-xs text-muted-foreground">Kosten</p>
          </div>
        </div>

        {/* Contact & info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">Contactgegevens</h4>
            {chauffeur.email && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{chauffeur.email}</span>
              </div>
            )}
            {chauffeur.telefoon && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-3.5 h-3.5 shrink-0" />
                <span>{chauffeur.telefoon}</span>
              </div>
            )}
            {(chauffeur.adres || chauffeur.plaats) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span>{[chauffeur.adres, chauffeur.postcode, chauffeur.plaats].filter(Boolean).join(", ")}</span>
              </div>
            )}
            {chauffeur.geboortedatum && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarIcon className="w-3.5 h-3.5 shrink-0" />
                <span>Geboren: {format(new Date(chauffeur.geboortedatum), "d MMM yyyy", { locale: nl })}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">Rijbewijs</h4>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={cn("gap-1", rijbewijsWarning && "border-warning text-warning")}>
                <CreditCard className="w-3 h-3" />
                Categorie {chauffeur.rijbewijs_categorie}
                {rijbewijsWarning && <AlertTriangle className="w-3 h-3" />}
              </Badge>
            </div>
            {chauffeur.rijbewijs_nummer && (
              <p className="text-sm text-muted-foreground">Nr: {chauffeur.rijbewijs_nummer}</p>
            )}
            {chauffeur.rijbewijs_verloopt && (
              <p className={cn("text-sm", rijbewijsVerlopen ? "text-destructive font-medium" : rijbewijsWarning ? "text-warning font-medium" : "text-muted-foreground")}>
                {rijbewijsVerlopen ? "Verlopen" : "Verloopt"}: {format(new Date(chauffeur.rijbewijs_verloopt), "d MMM yyyy", { locale: nl })}
              </p>
            )}
            {voertuig && (
              <div className="flex items-center gap-2 text-sm bg-muted/50 rounded-lg px-3 py-2 mt-2">
                <Car className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-foreground font-medium truncate">{voertuig.merk} {voertuig.model}</span>
                <span className="text-muted-foreground font-mono text-xs ml-auto">{voertuig.kenteken}</span>
              </div>
            )}
          </div>
        </div>

        {/* Beschikbaarheid / Planning */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4" /> Beschikbaarheid & Verlof
            </h4>
            <Button size="sm" variant="outline" onClick={() => setAddLeaveOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Toevoegen
            </Button>
          </div>

          {/* Mini calendar showing availability */}
          <div className="rounded-lg border border-border p-2 mb-3">
            <Calendar
              mode="multiple"
              selected={unavailableDays}
              className="p-0 pointer-events-none"
              locale={nl}
              modifiersStyles={{
                selected: { backgroundColor: "hsl(var(--destructive) / 0.15)", color: "hsl(var(--destructive))", fontWeight: 600 },
              }}
            />
            <p className="text-[11px] text-muted-foreground text-center mt-1">
              <span className="inline-block w-2 h-2 rounded-full bg-destructive/30 mr-1" />
              Rood = niet beschikbaar
            </p>
          </div>

          {beschikbaarheid.length === 0 ? (
            <p className="text-sm text-muted-foreground">Geen verlof of afwezigheid gepland</p>
          ) : (
            <div className="space-y-2">
              {beschikbaarheid.map((b) => (
                <div key={b.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border">
                  <Badge className={cn("text-xs", typeColors[b.type] || typeColors.anders)}>
                    {typeLabels[b.type] || b.type}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">
                      {format(parseISO(b.start_datum), "d MMM", { locale: nl })} — {format(parseISO(b.eind_datum), "d MMM yyyy", { locale: nl })}
                    </p>
                    {b.notitie && <p className="text-xs text-muted-foreground truncate">{b.notitie}</p>}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteLeaveMutation.mutate(b.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ritten */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Truck className="w-4 h-4" /> Recente ritten
            </h4>
            <Button size="sm" variant="outline" onClick={() => setAddRitOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Rit plannen
            </Button>
          </div>
          {ritten.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nog geen ritten geregistreerd</p>
          ) : (
            <div className="space-y-2">
              {ritten.slice(0, 10).map((r) => (
                <div key={r.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border">
                  <div className={cn("p-1.5 rounded-lg", r.status === "afgerond" ? "bg-success/10" : r.status === "onderweg" ? "bg-info/10" : "bg-muted")}>
                    <Truck className={cn("w-3.5 h-3.5", r.status === "afgerond" ? "text-success" : r.status === "onderweg" ? "text-info" : "text-muted-foreground")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {r.van_locatie} → {r.naar_locatie}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(r.datum), "d MMM yyyy", { locale: nl })}
                      {r.afstand_km ? ` • ${r.afstand_km} km` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-[10px]">{r.status}</Badge>
                    {r.kosten ? <p className="text-xs font-medium text-foreground mt-0.5">€{r.kosten}</p> : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notities */}
        {chauffeur.notities && (
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-2">Notities</h4>
            <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">{chauffeur.notities}</p>
          </div>
        )}
      </div>

      {/* Add leave dialog */}
      <Dialog open={addLeaveOpen} onOpenChange={setAddLeaveOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Afwezigheid toevoegen</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={leaveForm.type} onValueChange={(v) => setLeaveForm({ ...leaveForm, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="verlof">Verlof</SelectItem>
                  <SelectItem value="ziek">Ziek</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="anders">Anders</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Van</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("w-full justify-start text-left font-normal h-10", !leaveForm.start_datum && "text-muted-foreground")}>
                      <CalendarIcon className="w-3.5 h-3.5 mr-1" />
                      {leaveForm.start_datum ? format(leaveForm.start_datum, "d MMM", { locale: nl }) : "Start"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={leaveForm.start_datum} onSelect={(d) => setLeaveForm({ ...leaveForm, start_datum: d })} initialFocus className="p-3 pointer-events-auto" locale={nl} />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1.5">
                <Label>Tot</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("w-full justify-start text-left font-normal h-10", !leaveForm.eind_datum && "text-muted-foreground")}>
                      <CalendarIcon className="w-3.5 h-3.5 mr-1" />
                      {leaveForm.eind_datum ? format(leaveForm.eind_datum, "d MMM", { locale: nl }) : "Eind"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={leaveForm.eind_datum} onSelect={(d) => setLeaveForm({ ...leaveForm, eind_datum: d })} initialFocus className="p-3 pointer-events-auto" locale={nl} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notitie</Label>
              <Textarea
                value={leaveForm.notitie}
                onChange={(e) => setLeaveForm({ ...leaveForm, notitie: e.target.value })}
                placeholder="Reden of opmerking..."
                rows={2}
              />
            </div>
            <Button
              className="w-full"
              disabled={!leaveForm.start_datum || !leaveForm.eind_datum || addLeaveMutation.isPending}
              onClick={() => addLeaveMutation.mutate()}
            >
              {addLeaveMutation.isPending ? "Opslaan..." : "Opslaan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
