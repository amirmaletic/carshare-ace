import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Car, CalendarIcon, Check, ArrowRight, LogIn } from "lucide-react";
import { differenceInDays, format, isAfter, isBefore, parseISO, addDays, nextSaturday } from "date-fns";
import { nl } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function PubliekBoeken() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [startDate, setStartDate] = useState<Date | undefined>();
  const [eindDate, setEindDate] = useState<Date | undefined>();
  const [selectedVoertuig, setSelectedVoertuig] = useState<string | null>(null);

  const startDatum = startDate ? format(startDate, "yyyy-MM-dd") : "";
  const eindDatum = eindDate ? format(eindDate, "yyyy-MM-dd") : "";
  const dagen = startDate && eindDate ? Math.max(differenceInDays(eindDate, startDate), 1) : 0;

  const presets = [
    { label: "Vandaag", days: 1 },
    { label: "Weekend", weekend: true },
    { label: "3 dagen", days: 3 },
    { label: "Een week", days: 7 },
  ];

  const applyPreset = (p: { days?: number; weekend?: boolean }) => {
    const today = new Date();
    if (p.weekend) {
      const sat = nextSaturday(today);
      setStartDate(sat);
      setEindDate(addDays(sat, 2));
    } else if (p.days) {
      setStartDate(today);
      setEindDate(addDays(today, p.days));
    }
  };

  const { data: voertuigen = [], isLoading } = useQuery({
    queryKey: ["publiek-voertuigen", startDatum, eindDatum],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("voertuigen")
        .select("id, kenteken, merk, model, bouwjaar, brandstof, categorie, dagprijs, kleur")
        .eq("status", "beschikbaar")
        .order("merk");

      if (error) throw error;

      if (!startDatum || !eindDatum) return data ?? [];

      const { data: reserveringen } = await supabase
        .from("reserveringen")
        .select("voertuig_id, start_datum, eind_datum")
        .in("status", ["aangevraagd", "bevestigd", "actief"]);

      const bezet = new Set(
        (reserveringen ?? [])
          .filter((r) => {
            const rStart = parseISO(r.start_datum);
            const rEnd = parseISO(r.eind_datum);
            const sStart = parseISO(startDatum);
            const sEnd = parseISO(eindDatum);
            return !(isAfter(sStart, rEnd) || isBefore(sEnd, rStart));
          })
          .map((r) => r.voertuig_id)
      );

      return (data ?? []).filter((v) => !bezet.has(v.id));
    },
  });

  const selectedVehicle = voertuigen.find((v) => v.id === selectedVoertuig);

  const handleBoeken = () => {
    // Store selection in sessionStorage, then redirect to login/portal
    if (selectedVoertuig && startDatum && eindDatum) {
      sessionStorage.setItem(
        "pendingReservering",
        JSON.stringify({ voertuig_id: selectedVoertuig, start_datum: startDatum, eind_datum: eindDatum })
      );
    }

    if (user) {
      navigate("/portaal/reserveren?confirm=1");
    } else {
      navigate("/klant-login?redirect=/portaal/reserveren&confirm=1");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Car className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">De Waal Autoverhuur</span>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <Button variant="outline" size="sm" onClick={() => navigate("/portaal")} className="gap-1.5">
                Mijn portaal
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => navigate("/klant-login")} className="gap-1.5">
                <LogIn className="w-3.5 h-3.5" />
                Inloggen
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Huur een auto</h1>
          <p className="text-muted-foreground text-lg">Kies je periode en vind direct een beschikbaar voertuig</p>
        </div>

        {/* Date selection */}
        <Card className="max-w-xl mx-auto">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Wanneer wil je huren?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              {presets.map((p) => (
                <Button
                  key={p.label}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset(p)}
                  className="text-xs"
                >
                  {p.label}
                </Button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ophaaldatum</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "d MMMM yyyy", { locale: nl }) : <span>Kies datum</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(d) => {
                        setStartDate(d);
                        if (d && eindDate && eindDate < d) setEindDate(undefined);
                      }}
                      disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                      locale={nl}
                      weekStartsOn={1}
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Retourdatum</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !eindDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {eindDate ? format(eindDate, "d MMMM yyyy", { locale: nl }) : <span>Kies datum</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={eindDate}
                      onSelect={setEindDate}
                      disabled={(d) => d < (startDate ?? new Date(new Date().setHours(0, 0, 0, 0)))}
                      initialFocus
                      locale={nl}
                      weekStartsOn={1}
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            {dagen > 0 && (
              <p className="text-sm text-muted-foreground mt-3">
                {dagen} dag{dagen !== 1 ? "en" : ""} geselecteerd
              </p>
            )}
          </CardContent>
        </Card>

        {/* Vehicle grid */}
        {startDatum && eindDatum && (
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Beschikbare voertuigen ({voertuigen.length})
            </h2>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : voertuigen.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <Car className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground">Geen voertuigen beschikbaar voor deze periode</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {voertuigen.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVoertuig(v.id)}
                    className={`text-left bg-card rounded-xl border-2 p-5 transition-all ${
                      selectedVoertuig === v.id
                        ? "border-primary ring-2 ring-primary/20 shadow-md"
                        : "border-border hover:border-primary/40 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-foreground text-lg">{v.merk} {v.model}</p>
                        <p className="text-sm text-muted-foreground">{v.bouwjaar} · {v.brandstof}</p>
                      </div>
                      {selectedVoertuig === v.id && (
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded-full">
                        {v.categorie}
                      </span>
                      <div className="text-right">
                        <p className="text-xl font-bold text-primary">€{v.dagprijs}</p>
                        <p className="text-xs text-muted-foreground">per dag</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sticky booking bar */}
        {selectedVehicle && dagen > 0 && (
          <div className="sticky bottom-4 z-20">
            <Card className="bg-card border-primary/30 shadow-lg">
              <CardContent className="pt-5 pb-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-foreground">
                      {selectedVehicle.merk} {selectedVehicle.model}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {dagen} dag{dagen !== 1 ? "en" : ""} × €{selectedVehicle.dagprijs}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <p className="text-2xl font-bold text-primary">
                      €{(selectedVehicle.dagprijs * dagen).toLocaleString("nl-NL", { minimumFractionDigits: 2 })}
                    </p>
                    <Button onClick={handleBoeken} className="gap-2 flex-1 sm:flex-none">
                      {user ? "Reserveer nu" : "Inloggen & Reserveren"}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
