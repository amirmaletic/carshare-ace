import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenantPortaal } from "@/hooks/useTenantPortaal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Car, Fuel, Calendar, Search, MapPin, ShieldCheck, Sparkles, Settings2, Gift, Send, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

export default function TenantAanbod() {
  const { tenant, slug } = useTenantPortaal();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [zoek, setZoek] = useState("");
  const [categorie, setCategorie] = useState<string>("alle");
  const [aanvraagType, setAanvraagType] = useState<null | {
    label: string;
    merk: string;
    model: string;
    categorie?: string;
    brandstof?: string;
    dagprijs?: number;
  }>(null);

  const { data: voertuigen = [], isLoading } = useQuery({
    queryKey: ["tenant-voertuigen", tenant?.id],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_publiek_aanbod", { _organisatie_id: tenant!.id });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (!tenant) return null;
  const base = slug ? `/t/${slug}` : "";

  const categorieen = useMemo(() => {
    const set = new Set<string>();
    voertuigen.forEach((v: any) => v.categorie && set.add(v.categorie));
    return ["alle", ...Array.from(set)];
  }, [voertuigen]);

  const gefilterd = useMemo(() => {
    const q = zoek.trim().toLowerCase();
    return (voertuigen as any[]).filter((v) => {
      const matchQ = !q || `${v.merk} ${v.model}`.toLowerCase().includes(q);
      const matchC = categorie === "alle" || v.categorie === categorie;
      return matchQ && matchC;
    });
  }, [voertuigen, zoek, categorie]);

  // Groepeer beschikbare voertuigen per type (merk + model). Per type tonen we
  // 1 representatieve kaart met laagste dagprijs en aantal beschikbaar.
  type TypeGroep = {
    key: string;
    merk: string;
    model: string;
    categorie?: string;
    brandstof?: string;
    image_url?: string;
    dagprijs: number;
    aantal: number;
    voorbeeld_id: string;
  };
  const typeGroepen: TypeGroep[] = useMemo(() => {
    const map = new Map<string, TypeGroep>();
    (gefilterd as any[]).forEach((v) => {
      const key = `${(v.merk || "").toLowerCase()}|${(v.model || "").toLowerCase()}`;
      const huidig = map.get(key);
      if (!huidig) {
        map.set(key, {
          key,
          merk: v.merk,
          model: v.model,
          categorie: v.categorie,
          brandstof: v.brandstof,
          image_url: v.image_url,
          dagprijs: Number(v.dagprijs) || 0,
          aantal: 1,
          voorbeeld_id: v.id,
        });
      } else {
        huidig.aantal += 1;
        if (Number(v.dagprijs) && Number(v.dagprijs) < huidig.dagprijs) huidig.dagprijs = Number(v.dagprijs);
        if (!huidig.image_url && v.image_url) huidig.image_url = v.image_url;
      }
    });
    return Array.from(map.values()).sort((a, b) => a.dagprijs - b.dagprijs);
  }, [gefilterd]);

  return (
    <div className="space-y-10">
      {/* HERO */}
      <section
        className="relative overflow-hidden rounded-2xl border border-border"
        style={{
          background:
            "linear-gradient(135deg, hsl(var(--primary) / 0.10), hsl(var(--primary) / 0.02) 60%, transparent)",
        }}
      >
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-30 blur-3xl"
             style={{ background: "hsl(var(--primary))" }} />
        <div className="relative p-8 md:p-12 max-w-3xl space-y-5">
          <Badge variant="secondary" className="gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Direct online reserveren
          </Badge>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground leading-tight">
            Welkom bij {tenant.portaal_naam || tenant.naam}
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl">
            {tenant.portaal_welkomtekst ||
              "Bekijk ons aanbod en boek snel en eenvoudig online een voertuig. Transparante prijzen, direct bevestigd."}
          </p>
          <div className="flex flex-wrap items-center gap-5 pt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-primary" /> Veilig betalen</span>
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-primary" /> Flexibele periodes</span>
            <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-primary" /> Lokale service</span>
          </div>
        </div>
      </section>

      {!user && (
        <section
          className="rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4"
        >
          <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm text-foreground">Spaar mee met onze voordelenkaart</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Gratis account, spaar punten bij elke verhuur en verzilver ze als korting. Reserveren kan ook gewoon zonder.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`${base}/inloggen?mode=signup`)}
          >
            Activeer kaart
          </Button>
        </section>
      )}

      {/* FILTERS */}
      <section className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Zoek op merk of model..."
            value={zoek}
            onChange={(e) => setZoek(e.target.value)}
            className="pl-9 h-11"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto -mx-1 px-1">
          {categorieen.map((c) => (
            <button
              key={c}
              onClick={() => setCategorie(c)}
              className={
                "px-3.5 py-2 rounded-full text-xs font-medium border whitespace-nowrap transition-colors " +
                (categorie === c
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:bg-accent")
              }
            >
              {c === "alle" ? "Alle voertuigen" : c}
            </button>
          ))}
        </div>
      </section>

      {/* AANBOD */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {gefilterd.length} {gefilterd.length === 1 ? "voertuig" : "voertuigen"} beschikbaar
          </h2>
        </div>

        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-72 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : typeGroepen.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <Car className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">
                {voertuigen.length === 0
                  ? "Op dit moment zijn er geen voertuigen beschikbaar."
                  : "Geen voertuigen gevonden voor deze filters."}
              </p>
              <Button
                variant="outline"
                onClick={() => setAanvraagType({ label: "Geen voorkeur", merk: "", model: "" })}
                className="gap-2"
              >
                <Send className="w-4 h-4" /> Doe een vrijblijvende aanvraag
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {typeGroepen.map((t) => (
              <Card
                key={t.key}
                className="group overflow-hidden rounded-2xl border-border hover:border-primary/40 hover:shadow-xl transition-all duration-300"
              >
                <div className="aspect-[16/10] bg-muted relative overflow-hidden">
                  {t.image_url ? (
                    <img
                      src={t.image_url}
                      alt={`${t.merk} ${t.model}`}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Car className="w-14 h-14 text-muted-foreground/40" />
                    </div>
                  )}
                  {t.categorie && (
                    <Badge className="absolute top-3 left-3 backdrop-blur bg-background/80 text-foreground border-0">
                      {t.categorie}
                    </Badge>
                  )}
                  <Badge className="absolute top-3 right-3 backdrop-blur bg-primary/90 text-primary-foreground border-0 gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {t.aantal} beschikbaar
                  </Badge>
                </div>
                <CardContent className="p-5 space-y-4">
                  <div>
                    <h3 className="font-semibold text-base text-foreground capitalize">
                      {t.merk?.toLowerCase()} {t.model?.toLowerCase()}
                    </h3>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1.5">
                      {t.brandstof && (
                        <span className="flex items-center gap-1 capitalize"><Fuel className="w-3.5 h-3.5" />{t.brandstof?.toLowerCase()}</span>
                      )}
                      <span className="flex items-center gap-1"><Settings2 className="w-3.5 h-3.5" />vanaf type</span>
                    </div>
                  </div>
                  <div className="flex items-end justify-between pt-3 border-t border-border">
                    <div>
                      <p className="text-[11px] text-muted-foreground leading-none">vanaf</p>
                      <p className="text-2xl font-bold text-foreground leading-none mt-1">
                        €{t.dagprijs.toFixed(0)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">per dag</p>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Button
                        size="sm"
                        className="gap-1.5"
                        onClick={() =>
                          setAanvraagType({
                            label: `${t.merk} ${t.model}`,
                            merk: t.merk,
                            model: t.model,
                            categorie: t.categorie,
                            brandstof: t.brandstof,
                            dagprijs: t.dagprijs,
                          })
                        }
                      >
                        <Send className="w-3.5 h-3.5" /> Aanvraag doen
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-7"
                        onClick={() => navigate(`${base}/reserveren?voertuig=${t.voorbeeld_id}`)}
                      >
                        Direct reserveren
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <AanvraagDialog
        open={!!aanvraagType}
        onOpenChange={(o) => !o && setAanvraagType(null)}
        organisatieId={tenant.id}
        type={aanvraagType}
      />
    </div>
  );
}

function AanvraagDialog({
  open,
  onOpenChange,
  organisatieId,
  type,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  organisatieId: string;
  type: { label: string; merk: string; model: string; categorie?: string; brandstof?: string; dagprijs?: number } | null;
}) {
  const [form, setForm] = useState({
    klant_naam: "",
    klant_email: "",
    klant_telefoon: "",
    start: "",
    eind: "",
    notitie: "",
  });
  const [verzonden, setVerzonden] = useState(false);
  const [bezig, setBezig] = useState(false);

  const reset = () => {
    setForm({ klant_naam: "", klant_email: "", klant_telefoon: "", start: "", eind: "", notitie: "" });
    setVerzonden(false);
    setBezig(false);
  };

  const indienen = async () => {
    if (!form.klant_naam.trim() || !form.klant_email.trim()) {
      toast({ title: "Vul je naam en e-mail in", variant: "destructive" });
      return;
    }
    setBezig(true);
    const { error } = await supabase.functions.invoke("submit-aanvraag", {
      body: {
        organisatie_id: organisatieId,
        klant_naam: form.klant_naam,
        klant_email: form.klant_email,
        klant_telefoon: form.klant_telefoon || null,
        gewenst_type: type?.merk ? `${type.merk} ${type.model}`.trim() : null,
        gewenste_categorie: type?.categorie || null,
        gewenste_brandstof: type?.brandstof || null,
        gewenste_periode_start: form.start || null,
        gewenste_periode_eind: form.eind || null,
        notitie: form.notitie || null,
      },
    });
    setBezig(false);
    if (error) {
      toast({ title: "Aanvraag mislukt", description: error.message, variant: "destructive" });
      return;
    }
    setVerzonden(true);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setTimeout(reset, 200);
      }}
    >
      <DialogContent className="sm:max-w-[480px]">
        {verzonden ? (
          <div className="text-center py-6 space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Aanvraag verzonden</h3>
            <p className="text-sm text-muted-foreground">
              We nemen zo snel mogelijk contact op met een bevestiging en de juiste auto voor je periode.
            </p>
            <Button onClick={() => onOpenChange(false)} className="mt-2">Sluiten</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Aanvraag voor {type?.label || "een voertuig"}</DialogTitle>
              <DialogDescription>
                Laat je gegevens en gewenste periode achter. Wij koppelen er een beschikbare auto aan en sturen je een bevestiging.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Naam *</Label>
                  <Input value={form.klant_naam} onChange={(e) => setForm({ ...form, klant_naam: e.target.value })} placeholder="Voor- en achternaam" />
                </div>
                <div className="space-y-1.5">
                  <Label>Telefoon</Label>
                  <Input value={form.klant_telefoon} onChange={(e) => setForm({ ...form, klant_telefoon: e.target.value })} placeholder="06 ..." />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>E-mail *</Label>
                <Input type="email" value={form.klant_email} onChange={(e) => setForm({ ...form, klant_email: e.target.value })} placeholder="naam@voorbeeld.nl" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Van</Label>
                  <Input type="date" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Tot</Label>
                  <Input type="date" value={form.eind} onChange={(e) => setForm({ ...form, eind: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Opmerkingen</Label>
                <Textarea rows={3} value={form.notitie} onChange={(e) => setForm({ ...form, notitie: e.target.value })} placeholder="Bijv. ophaallocatie, extra wensen" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuleren</Button>
              <Button onClick={indienen} disabled={bezig} className="gap-2">
                <Send className="w-4 h-4" /> {bezig ? "Verzenden..." : "Aanvraag versturen"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}