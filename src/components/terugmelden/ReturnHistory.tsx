import { useState } from "react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Car, ExternalLink, Loader2, RotateCcw, Search, Trash2, User, Fuel, Euro } from "lucide-react";
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
    <div className="clean-card overflow-hidden animate-fade-in">
      <div className="p-5 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="font-semibold text-foreground">Geschiedenis</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {filtered.length} van {terugmeldingen.length} registraties
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Zoek op naam, kenteken of medewerker..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
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
        <div className="divide-y divide-border">
          {filtered.map((t, i) => (
            <div
              key={t.id}
              className="p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors animate-fade-in"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <div className="p-2.5 rounded-lg bg-muted">
                <Car className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground truncate">{t.voertuig_naam}</p>
                <p className="text-xs text-muted-foreground font-mono">{t.voertuig_kenteken}</p>
                {t.medewerker_email && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <User className="w-3 h-3" />
                    {t.medewerker_email}
                  </p>
                )}
                {(t.bon_bedrag != null || t.bon_liters != null || t.bon_brandstof) && (
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                    {t.bon_liters != null && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted">
                        <Fuel className="w-3 h-3" /> {t.bon_liters}L {t.bon_brandstof || ""}
                      </span>
                    )}
                    {t.bon_bedrag != null && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted">
                        <Euro className="w-3 h-3" /> {t.bon_bedrag.toFixed(2)}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-medium text-foreground">
                  {(t.kilometerstand ?? 0).toLocaleString("nl-NL")} km
                </p>
                <p className="text-xs text-muted-foreground">
                  {!isNaN(new Date(t.created_at).getTime()) ? format(new Date(t.created_at), "d MMM yyyy · HH:mm", { locale: nl }) : "-"}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {t.bon_url && (
                  <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                    <a href={t.bon_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
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
