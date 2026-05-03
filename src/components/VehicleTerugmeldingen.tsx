import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import {
  RotateCcw, Gauge, User, ExternalLink, FileText, TrendingUp, Loader2, Receipt, Fuel, Euro,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Terugmelding {
  id: string;
  voertuig_id: string;
  voertuig_kenteken: string;
  voertuig_naam: string;
  kilometerstand: number;
  datum: string;
  bon_url: string | null;
  notitie: string | null;
  created_at: string;
  medewerker_email: string | null;
  fotos: string[] | null;
  bon_bedrag?: number | null;
  bon_liters?: number | null;
  bon_brandstof?: string | null;
  bon_btw?: number | null;
}

interface VehicleTerugmeldingenProps {
  voertuigId: string;
  kenteken: string;
}

export function VehicleTerugmeldingen({ voertuigId, kenteken }: VehicleTerugmeldingenProps) {
  const { user } = useAuth();

  const { data: terugmeldingen = [], isLoading } = useQuery({
    queryKey: ["terugmeldingen-vehicle", voertuigId, kenteken],
    queryFn: async () => {
      // Match on voertuig_id or kenteken (to cover mock + db vehicles)
      const { data, error } = await supabase
        .from("terugmeldingen")
        .select("*")
        .or(`voertuig_id.eq.${voertuigId},voertuig_kenteken.eq.${kenteken}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Terugmelding[];
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (terugmeldingen.length === 0) {
    return (
      <div className="text-center py-10">
        <RotateCcw className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Geen terugmeldingen voor dit voertuig</p>
      </div>
    );
  }

  // Calculate stats
  const kmValues = terugmeldingen.map(t => t.kilometerstand).filter(k => k > 0);
  const hoogsteKm = kmValues.length > 0 ? Math.max(...kmValues) : 0;
  const laagsteKm = kmValues.length > 0 ? Math.min(...kmValues) : 0;
  const totaalRitten = terugmeldingen.length;

  // Unique medewerkers
  const medewerkers = [...new Set(terugmeldingen.map(t => t.medewerker_email).filter(Boolean))];

  // Brandstof/bon stats
  const bonnen = terugmeldingen.filter(t => t.bon_url || t.bon_bedrag != null);
  const totaalLiters = terugmeldingen.reduce((s, t) => s + (Number(t.bon_liters) || 0), 0);
  const totaalBedrag = terugmeldingen.reduce((s, t) => s + (Number(t.bon_bedrag) || 0), 0);

  // Km per melding trend
  const sorted = [...terugmeldingen].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const kmDiffs: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const diff = sorted[i].kilometerstand - sorted[i - 1].kilometerstand;
    if (diff > 0) kmDiffs.push(diff);
  }
  const gemiddeldKmPerRit = kmDiffs.length > 0
    ? Math.round(kmDiffs.reduce((s, d) => s + d, 0) / kmDiffs.length)
    : 0;

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatBlock icon={RotateCcw} label="Totaal meldingen" value={String(totaalRitten)} color="text-primary" />
        <StatBlock icon={Gauge} label="Hoogste km" value={`${hoogsteKm.toLocaleString("nl-NL")} km`} color="text-success" />
        <StatBlock icon={TrendingUp} label="Gem. km/rit" value={gemiddeldKmPerRit > 0 ? `${gemiddeldKmPerRit.toLocaleString("nl-NL")} km` : "-"} color="text-warning" />
        <StatBlock
          icon={Fuel}
          label={totaalLiters > 0 ? "Brandstof totaal" : "Medewerkers"}
          value={totaalLiters > 0 ? `${totaalLiters.toFixed(0)}L · €${totaalBedrag.toFixed(0)}` : String(medewerkers.length)}
          color="text-info"
        />
      </div>

      {/* Bonnetjes galerij */}
      {bonnen.length > 0 && (
        <div className="rounded-xl border border-border bg-muted/30 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-foreground">Bonnetjes ({bonnen.length})</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Totaal € {totaalBedrag.toFixed(2)}</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {bonnen.map((t) => (
              <a
                key={t.id}
                href={t.bon_url || undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block rounded-lg overflow-hidden border border-border bg-background hover:border-primary/40 transition-all"
                title={t.bon_url ? "Bon openen" : "Geen bestand"}
              >
                {t.bon_url && /\.(jpe?g|png|webp|gif)(\?|$)/i.test(t.bon_url) ? (
                  <img src={t.bon_url} alt="Bon" className="w-full h-20 object-cover" />
                ) : (
                  <div className="w-full h-20 flex items-center justify-center bg-muted/60">
                    <Receipt className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
                  <p className="text-[10px] font-mono text-white leading-none">
                    {t.bon_bedrag != null ? `€ ${Number(t.bon_bedrag).toFixed(2)}` : "—"}
                  </p>
                  {t.bon_liters != null && (
                    <p className="text-[9px] text-white/80 leading-none mt-0.5">{t.bon_liters}L</p>
                  )}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      <Separator />

      {/* Timeline */}
      <div className="space-y-1">
        {terugmeldingen.map((t, i) => {
          const date = new Date(t.created_at);
          const isValidDate = !isNaN(date.getTime());
          const prevKm = i < terugmeldingen.length - 1 ? terugmeldingen[i + 1].kilometerstand : null;
          const kmDiff = prevKm !== null ? t.kilometerstand - prevKm : null;

          return (
            <div
              key={t.id}
              className="relative flex gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors animate-fade-in"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              {/* Timeline line */}
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <RotateCcw className="w-3.5 h-3.5 text-primary" />
                </div>
                {i < terugmeldingen.length - 1 && (
                  <div className="w-0.5 flex-1 bg-border mt-1" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {(t.kilometerstand ?? 0).toLocaleString("nl-NL")} km
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isValidDate
                        ? format(date, "EEEE d MMMM yyyy 'om' HH:mm", { locale: nl })
                        : "Onbekende datum"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {kmDiff !== null && kmDiff > 0 && (
                      <Badge variant="outline" className="text-[10px] font-mono">
                        +{kmDiff.toLocaleString("nl-NL")} km
                      </Badge>
                    )}
                    {t.bon_url && (
                      <a
                        href={t.bon_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-md hover:bg-muted transition-colors"
                        title="Bon bekijken"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Medewerker */}
                {t.medewerker_email && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <User className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{t.medewerker_email}</span>
                  </div>
                )}

                {/* Bon details */}
                {(t.bon_bedrag != null || t.bon_liters != null || t.bon_brandstof) && (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {t.bon_liters != null && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 text-[10px] font-medium">
                        <Fuel className="w-3 h-3" /> {t.bon_liters}L {t.bon_brandstof || ""}
                      </span>
                    )}
                    {t.bon_bedrag != null && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-medium">
                        <Euro className="w-3 h-3" /> {Number(t.bon_bedrag).toFixed(2)}
                        {t.bon_btw != null && <span className="opacity-70">· btw € {Number(t.bon_btw).toFixed(2)}</span>}
                      </span>
                    )}
                  </div>
                )}

                {/* Schadefoto's */}
                {t.fotos && t.fotos.length > 0 && (
                  <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                    {t.fotos.map((url, fi) => (
                      <a key={fi} href={url} target="_blank" rel="noopener noreferrer" className="block rounded-md overflow-hidden border border-border hover:border-primary/30 transition-colors">
                        <img src={url} alt={`Schadefoto ${fi + 1}`} className="w-full h-16 object-cover" />
                      </a>
                    ))}
                  </div>
                )}

                {/* Notitie */}
                {t.notitie && (
                  <div className="mt-2 p-2.5 rounded-md bg-muted/70 border border-border">
                    <div className="flex items-center gap-1.5 mb-1">
                      <FileText className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Notitie</span>
                    </div>
                    <p className="text-xs text-foreground leading-relaxed">{t.notitie}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatBlock({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: string; color: string;
}) {
  return (
    <div className="p-2.5 rounded-lg bg-muted/50 text-center">
      <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />
      <p className="text-sm font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
