import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { differenceInDays, format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useTenantPortaal } from "@/hooks/useTenantPortaal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar, Car, CheckCircle2, Gift, Sparkles, ArrowLeft, ShieldCheck } from "lucide-react";

export default function TenantReserveren() {
  const { tenant, slug } = useTenantPortaal();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const base = slug ? `/t/${slug}` : "";

  const [voertuigId, setVoertuigId] = useState<string | null>(params.get("voertuig"));
  const [startDatum, setStartDatum] = useState("");
  const [eindDatum, setEindDatum] = useState("");
  const [naam, setNaam] = useState("");
  const [email, setEmail] = useState("");
  const [telefoon, setTelefoon] = useState("");
  const [notitie, setNotitie] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const { data: voertuigen = [] } = useQuery({
    queryKey: ["tenant-aanbod-min", tenant?.id],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_publiek_aanbod", { _organisatie_id: tenant!.id });
      if (error) throw error;
      return data ?? [];
    },
  });

  const voertuig = useMemo(
    () => (voertuigen as any[]).find((v) => v.id === voertuigId) ?? null,
    [voertuigen, voertuigId],
  );

  const dagen =
    startDatum && eindDatum
      ? Math.max(differenceInDays(new Date(eindDatum), new Date(startDatum)), 1)
      : 0;
  const totaal = voertuig && dagen > 0 ? Number(voertuig.dagprijs) * dagen : 0;

  useEffect(() => {
    if (!voertuigId && voertuigen.length === 1) setVoertuigId((voertuigen[0] as any).id);
  }, [voertuigen, voertuigId]);

  if (!tenant) return null;

  const submit = async () => {
    if (!naam || !email) {
      toast.error("Vul je naam en e-mailadres in");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.rpc("create_gast_aanvraag", {
      _organisatie_id: tenant.id,
      _klant_naam: naam,
      _klant_email: email,
      _klant_telefoon: telefoon || null,
      _voertuig_id: voertuigId,
      _start_datum: startDatum || null,
      _eind_datum: eindDatum || null,
      _notitie: notitie || null,
      _gewenste_categorie: voertuig?.categorie ?? null,
      _gewenste_brandstof: voertuig?.brandstof ?? null,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Aanvraag mislukt: " + error.message);
      return;
    }
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-primary/15 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Aanvraag verzonden</h2>
            <p className="text-muted-foreground">
              Bedankt {naam.split(" ")[0]}! We hebben je aanvraag ontvangen en nemen zo snel mogelijk
              contact met je op via <span className="font-medium text-foreground">{email}</span>.
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <div
            className="p-6 md:p-8 space-y-4"
            style={{
              background:
                "linear-gradient(135deg, hsl(var(--primary) / 0.10), hsl(var(--primary) / 0.02))",
            }}
          >
            <Badge variant="secondary" className="gap-1.5">
              <Gift className="w-3.5 h-3.5" /> Voordelenkaart
            </Badge>
            <h3 className="text-xl font-bold text-foreground">
              Maak een gratis account aan en spaar voor korting
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                Spaar punten bij elke verhuur en verzilver ze als korting
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                Snellere boeking, je gegevens zijn al ingevuld
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                Overzicht van al je reserveringen en facturen
              </li>
            </ul>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button onClick={() => navigate(`${base}/inloggen?mode=signup&email=${encodeURIComponent(email)}`)}>
                Voordelenkaart activeren
              </Button>
              <Button variant="ghost" onClick={() => navigate(base)}>
                Terug naar aanbod
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        onClick={() => navigate(base)}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Terug naar aanbod
      </button>

      <header className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Reservering aanvragen</h1>
        <p className="text-muted-foreground">
          Vul je gegevens in. Je hoeft geen account aan te maken; we nemen direct contact met je op.
        </p>
      </header>

      {/* Voertuigkaart */}
      {voertuig && (
        <Card className="overflow-hidden">
          <div className="flex flex-col sm:flex-row">
            <div className="sm:w-48 aspect-video sm:aspect-auto bg-muted shrink-0">
              {voertuig.image_url ? (
                <img
                  src={voertuig.image_url}
                  alt={`${voertuig.merk} ${voertuig.model}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Car className="w-10 h-10 text-muted-foreground/40" />
                </div>
              )}
            </div>
            <CardContent className="p-5 flex-1 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">{voertuig.categorie}</p>
                <h3 className="font-semibold text-foreground capitalize">
                  {voertuig.merk?.toLowerCase()} {voertuig.model?.toLowerCase()}
                </h3>
                <p className="text-xs text-muted-foreground capitalize mt-1">
                  {voertuig.bouwjaar} · {voertuig.brandstof?.toLowerCase()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-foreground">€{Number(voertuig.dagprijs).toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">per dag</p>
              </div>
            </CardContent>
          </div>
        </Card>
      )}

      {/* Periode */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" /> Gewenste periode
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Ophaaldatum</Label>
            <Input
              type="date"
              value={startDatum}
              onChange={(e) => setStartDatum(e.target.value)}
              min={format(new Date(), "yyyy-MM-dd")}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Retourdatum</Label>
            <Input
              type="date"
              value={eindDatum}
              onChange={(e) => setEindDatum(e.target.value)}
              min={startDatum || format(new Date(), "yyyy-MM-dd")}
            />
          </div>
          {dagen > 0 && voertuig && (
            <div className="sm:col-span-2 flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm text-muted-foreground">
                {dagen} dag{dagen !== 1 ? "en" : ""} × €{voertuig.dagprijs}
              </p>
              <p className="text-lg font-bold text-foreground">
                Indicatie €{totaal.toLocaleString("nl-NL", { minimumFractionDigits: 2 })}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contactgegevens */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Jouw gegevens</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Volledige naam *</Label>
              <Input value={naam} onChange={(e) => setNaam(e.target.value)} placeholder="Voornaam Achternaam" />
            </div>
            <div className="space-y-1.5">
              <Label>E-mailadres *</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jij@voorbeeld.nl"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Telefoonnummer</Label>
            <Input value={telefoon} onChange={(e) => setTelefoon(e.target.value)} placeholder="06 12 34 56 78" />
          </div>
          <div className="space-y-1.5">
            <Label>Bericht (optioneel)</Label>
            <Textarea
              value={notitie}
              onChange={(e) => setNotitie(e.target.value)}
              placeholder="Bijzonderheden, vragen of voorkeuren..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          Je gegevens worden alleen gebruikt voor deze aanvraag.
        </p>
        <Button size="lg" onClick={submit} disabled={submitting}>
          {submitting ? "Versturen..." : "Aanvraag versturen"}
        </Button>
      </div>
    </div>
  );
}