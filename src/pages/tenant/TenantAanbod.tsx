import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenantPortaal } from "@/hooks/useTenantPortaal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Car, Fuel, Calendar, Search, MapPin, ShieldCheck, Sparkles, Settings2 } from "lucide-react";

export default function TenantAanbod() {
  const { tenant, slug } = useTenantPortaal();
  const navigate = useNavigate();
  const [zoek, setZoek] = useState("");
  const [categorie, setCategorie] = useState<string>("alle");

  const { data: voertuigen = [], isLoading } = useQuery({
    queryKey: ["tenant-voertuigen", tenant?.id],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("voertuigen")
        .select("id, merk, model, bouwjaar, brandstof, categorie, kleur, dagprijs, image_url")
        .eq("organisatie_id", tenant!.id)
        .eq("status", "beschikbaar")
        .order("dagprijs", { ascending: true });
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
        ) : gefilterd.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <Car className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {voertuigen.length === 0
                  ? "Op dit moment zijn er geen voertuigen beschikbaar."
                  : "Geen voertuigen gevonden voor deze filters."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {gefilterd.map((v: any) => (
              <Card
                key={v.id}
                className="group overflow-hidden rounded-2xl border-border hover:border-primary/40 hover:shadow-xl transition-all duration-300 cursor-pointer"
                onClick={() => navigate(`${base}/reserveren?voertuig=${v.id}`)}
              >
                <div className="aspect-[16/10] bg-muted relative overflow-hidden">
                  {v.image_url ? (
                    <img
                      src={v.image_url}
                      alt={`${v.merk} ${v.model}`}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Car className="w-14 h-14 text-muted-foreground/40" />
                    </div>
                  )}
                  {v.categorie && (
                    <Badge className="absolute top-3 left-3 backdrop-blur bg-background/80 text-foreground border-0">
                      {v.categorie}
                    </Badge>
                  )}
                </div>
                <CardContent className="p-5 space-y-4">
                  <div>
                    <h3 className="font-semibold text-base text-foreground capitalize">
                      {v.merk?.toLowerCase()} {v.model?.toLowerCase()}
                    </h3>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1.5">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{v.bouwjaar}</span>
                      <span className="flex items-center gap-1 capitalize"><Fuel className="w-3.5 h-3.5" />{v.brandstof?.toLowerCase()}</span>
                      {v.kleur && <span className="flex items-center gap-1 capitalize"><Settings2 className="w-3.5 h-3.5" />{v.kleur?.toLowerCase()}</span>}
                    </div>
                  </div>
                  <div className="flex items-end justify-between pt-3 border-t border-border">
                    <div>
                      <p className="text-2xl font-bold text-foreground leading-none">
                        €{Number(v.dagprijs).toFixed(0)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">per dag</p>
                    </div>
                    <Button size="sm" className="gap-1.5">
                      Reserveer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}