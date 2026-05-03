import { useState } from "react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Car, ExternalLink, Loader2, RotateCcw, Search, Trash2, User, Fuel, Euro, Receipt, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  medewerker_email?: string | null;
  bon_bedrag?: number | null;
  bon_liters?: number | null;
  bon_brandstof?: string | null;
  bon_btw?: number | null;
  fotos?: string[] | null;
}

interface ReturnHistoryProps {
  terugmeldingen: Terugmelding[];
  isLoading: boolean;
  onDelete: (id: string) => void;
}

export default function ReturnHistory({ terugmeldingen, isLoading, onDelete }: ReturnHistoryProps) {
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? terugmeldingen.filter(t =>
        t.voertuig_naam.toLowerCase().includes(search.toLowerCase()) ||
        t.voertuig_kenteken.toLowerCase().includes(search.toLowerCase()) ||
        (t.medewerker_email && t.medewerker_email.toLowerCase().includes(search.toLowerCase()))
      )
    : terugmeldingen;

  return (
    <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden animate-fade-in shadow-sm">
      <div className="p-5 border-b border-border bg-gradient-to-r from-muted/40 to-transparent">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <RotateCcw className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Geschiedenis</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {filtered.length} van {terugmeldingen.length} registraties
            </p>
            </div>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Zoek op naam, kenteken of medewerker..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm bg-background/70"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <RotateCcw className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            {search ? "Geen resultaten gevonden" : "Nog geen terugmeldingen"}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border/60">
          {filtered.map((t, i) => (
            <div
              key={t.id}
              className="p-4 flex items-start gap-3 sm:gap-4 hover:bg-muted/30 transition-colors animate-fade-in"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              {/* Bon thumbnail of icoon */}
              {t.bon_url && /\.(jpe?g|png|webp|gif)(\?|$)/i.test(t.bon_url) ? (
                <a
                  href={t.bon_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 w-14 h-14 rounded-lg overflow-hidden border border-border bg-muted hover:border-primary/40 transition-colors"
                >
                  <img src={t.bon_url} alt="Bon" className="w-full h-full object-cover" />
                </a>
              ) : (
                <div className="shrink-0 w-14 h-14 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                  {t.bon_url ? <Receipt className="w-5 h-5 text-primary" /> : <Car className="w-5 h-5 text-muted-foreground" />}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{t.voertuig_naam}</p>
                    <p className="text-xs text-muted-foreground font-mono">{t.voertuig_kenteken}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-foreground inline-flex items-center gap-1">
                      <Gauge className="w-3 h-3 text-muted-foreground" />
                      {(t.kilometerstand ?? 0).toLocaleString("nl-NL")}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {!isNaN(new Date(t.created_at).getTime()) ? format(new Date(t.created_at), "d MMM · HH:mm", { locale: nl }) : "-"}
                    </p>
                  </div>
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {t.bon_liters != null && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 text-[10px] font-medium">
                      <Fuel className="w-3 h-3" /> {t.bon_liters}L {t.bon_brandstof || ""}
                    </span>
                  )}
                  {t.bon_bedrag != null && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-medium">
                      <Euro className="w-3 h-3" /> {Number(t.bon_bedrag).toFixed(2)}
                      {t.bon_btw != null && <span className="opacity-60">· btw {Number(t.bon_btw).toFixed(2)}</span>}
                    </span>
                  )}
                  {t.medewerker_email && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px]">
                      <User className="w-3 h-3" /> {t.medewerker_email}
                    </span>
                  )}
                </div>

                {t.notitie && (
                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{t.notitie}</p>
                )}
              </div>

              <div className="flex flex-col items-center gap-1 shrink-0">
                {t.bon_url && (
                  <Button variant="ghost" size="icon" asChild className="h-7 w-7">
                    <a href={t.bon_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => onDelete(t.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
