import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Car, Calendar, Check } from "lucide-react";
import { differenceInDays, format, isAfter, isBefore, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect } from "react";

export default function ReserveerVoertuig() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const [startDatum, setStartDatum] = useState("");
  const [eindDatum, setEindDatum] = useState("");
  const [selectedVoertuig, setSelectedVoertuig] = useState<string | null>(null);

  // Restore pending reservation from public booking page
  useEffect(() => {
    const pending = sessionStorage.getItem("pendingReservering");
    if (pending) {
      try {
        const data = JSON.parse(pending);
        if (data.start_datum) setStartDatum(data.start_datum);
        if (data.eind_datum) setEindDatum(data.eind_datum);
        if (data.voertuig_id) setSelectedVoertuig(data.voertuig_id);
        sessionStorage.removeItem("pendingReservering");
      } catch { /* ignore */ }
    }
  }, []);
  const [selectedVoertuig, setSelectedVoertuig] = useState<string | null>(null);

  const dagen = startDatum && eindDatum ? Math.max(differenceInDays(new Date(eindDatum), new Date(startDatum)), 1) : 0;

  // Fetch available vehicles
  const { data: voertuigen = [], isLoading } = useQuery({
    queryKey: ["beschikbare-voertuigen", startDatum, eindDatum],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("voertuigen")
        .select("id, kenteken, merk, model, bouwjaar, brandstof, categorie, dagprijs, kleur")
        .eq("status", "beschikbaar")
        .order("merk");

      if (error) throw error;

      if (!startDatum || !eindDatum) return data ?? [];

      // Filter out vehicles with overlapping reservations
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
    enabled: !!user,
  });

  // Get or create klant
  const reserveer = useMutation({
    mutationFn: async () => {
      if (!user || !selectedVoertuig) throw new Error("Selecteer een voertuig");

      // Get or create klant
      let { data: klant } = await supabase
        .from("klanten")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (!klant) {
        const { data: newKlant, error } = await supabase
          .from("klanten")
          .insert({
            auth_user_id: user.id,
            voornaam: user.email?.split("@")[0] ?? "Klant",
            achternaam: "",
            email: user.email ?? "",
          })
          .select("id")
          .single();
        if (error) throw error;
        klant = newKlant;
      }

      const voertuig = voertuigen.find((v) => v.id === selectedVoertuig);
      const prijs = (voertuig?.dagprijs ?? 0) * dagen;

      const { error } = await supabase.from("reserveringen").insert({
        klant_id: klant.id,
        voertuig_id: selectedVoertuig,
        start_datum: startDatum,
        eind_datum: eindDatum,
        dagprijs: voertuig?.dagprijs ?? 0,
        totaalprijs: prijs,
        status: "aangevraagd",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Reservering aangevraagd!");
      queryClient.invalidateQueries({ queryKey: ["klant-reserveringen"] });
      navigate("/portaal");
    },
    onError: (e) => {
      toast.error("Fout bij reserveren: " + e.message);
    },
  });

  const selectedVehicle = voertuigen.find((v) => v.id === selectedVoertuig);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Voertuig Reserveren</h1>
        <p className="text-muted-foreground mt-1">Kies een periode en voertuig</p>
      </div>

      {/* Date selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Verhuurperiode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ophaaldatum</Label>
              <Input type="date" value={startDatum} onChange={(e) => setStartDatum(e.target.value)} min={format(new Date(), "yyyy-MM-dd")} />
            </div>
            <div className="space-y-2">
              <Label>Retourdatum</Label>
              <Input type="date" value={eindDatum} onChange={(e) => setEindDatum(e.target.value)} min={startDatum || format(new Date(), "yyyy-MM-dd")} />
            </div>
          </div>
          {dagen > 0 && (
            <p className="text-sm text-muted-foreground mt-3">{dagen} dag{dagen !== 1 ? "en" : ""} geselecteerd</p>
          )}
        </CardContent>
      </Card>

      {/* Vehicle grid */}
      {startDatum && eindDatum && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Beschikbare voertuigen ({voertuigen.length})</h2>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : voertuigen.length === 0 ? (
            <div className="text-center py-8 bg-card rounded-xl border border-border">
              <Car className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground">Geen voertuigen beschikbaar voor deze periode</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {voertuigen.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVoertuig(v.id)}
                  className={`text-left bg-card rounded-xl border-2 p-4 transition-all ${
                    selectedVoertuig === v.id ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{v.merk} {v.model}</p>
                      <p className="text-sm text-muted-foreground font-mono">{v.kenteken}</p>
                      <p className="text-xs text-muted-foreground mt-1">{v.brandstof} · {v.categorie} · {v.bouwjaar}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">€{v.dagprijs}</p>
                      <p className="text-xs text-muted-foreground">per dag</p>
                      {selectedVoertuig === v.id && (
                        <div className="mt-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center ml-auto">
                          <Check className="w-3.5 h-3.5 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Summary + submit */}
      {selectedVehicle && dagen > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-semibold text-foreground">{selectedVehicle.merk} {selectedVehicle.model}</p>
                <p className="text-sm text-muted-foreground">{dagen} dag{dagen !== 1 ? "en" : ""} × €{selectedVehicle.dagprijs}</p>
              </div>
              <p className="text-2xl font-bold text-primary">
                €{(selectedVehicle.dagprijs * dagen).toLocaleString("nl-NL", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <Button
              className="w-full"
              onClick={() => reserveer.mutate()}
              disabled={reserveer.isPending}
            >
              {reserveer.isPending ? "Bezig..." : "Reservering aanvragen"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
