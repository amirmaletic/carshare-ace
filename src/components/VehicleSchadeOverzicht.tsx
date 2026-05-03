import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { VehicleDamageSketch, type DamagePoint } from "@/components/VehicleDamageSketch";
import { AlertTriangle, Loader2, RotateCcw, ClipboardCheck } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Props {
  voertuigId: string;
  kenteken: string;
}

interface SchadeBron {
  id: string;
  source: "terugmelding" | "overdracht" | "rapport";
  datum: string;
  punten: DamagePoint[];
  label: string;
}

export function VehicleSchadeOverzicht({ voertuigId, kenteken }: Props) {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["vehicle-schade-overzicht", voertuigId, kenteken],
    enabled: !!user,
    queryFn: async () => {
      const [tm, ov, sr] = await Promise.all([
        supabase
          .from("terugmeldingen")
          .select("id, datum, created_at, schade_punten, voertuig_id, voertuig_kenteken")
          .or(`voertuig_id.eq.${voertuigId},voertuig_kenteken.eq.${kenteken}`)
          .order("created_at", { ascending: false }),
        supabase
          .from("overdrachten")
          .select("id, type, datum, created_at, schade_punten, voertuig_id, voertuig_kenteken")
          .or(`voertuig_id.eq.${voertuigId},voertuig_kenteken.eq.${kenteken}`)
          .order("created_at", { ascending: false }),
        supabase
          .from("schade_rapporten")
          .select("id, datum, schade_punten, voertuig_id, omschrijving")
          .eq("voertuig_id", voertuigId),
      ]);

      const bronnen: SchadeBron[] = [];

      (tm.data ?? []).forEach((t: any) => {
        const punten = Array.isArray(t.schade_punten) ? (t.schade_punten as DamagePoint[]) : [];
        if (punten.length > 0) {
          bronnen.push({
            id: t.id,
            source: "terugmelding",
            datum: t.datum || t.created_at,
            punten,
            label: "Terugmelding",
          });
        }
      });
      (ov.data ?? []).forEach((o: any) => {
        const punten = Array.isArray(o.schade_punten) ? (o.schade_punten as DamagePoint[]) : [];
        if (punten.length > 0) {
          bronnen.push({
            id: o.id,
            source: "overdracht",
            datum: o.datum || o.created_at,
            punten,
            label: o.type === "ophalen" ? "Overdracht (ophalen)" : "Overdracht (retour)",
          });
        }
      });
      (sr.data ?? []).forEach((s: any) => {
        const punten = Array.isArray(s.schade_punten) ? (s.schade_punten as DamagePoint[]) : [];
        if (punten.length > 0) {
          bronnen.push({
            id: s.id,
            source: "rapport",
            datum: s.datum,
            punten,
            label: s.omschrijving || "Schaderapport",
          });
        }
      });

      bronnen.sort((a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime());

      // Aggregeer alle punten met source-tagging voor de sketch
      const allePunten: DamagePoint[] = bronnen.flatMap((b) =>
        b.punten.map((p, i) => ({
          ...p,
          id: `${b.id}-${p.id || i}`,
          label: p.label || b.label,
        }))
      );

      return { bronnen, allePunten };
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const bronnen = data?.bronnen ?? [];
  const allePunten = data?.allePunten ?? [];

  if (allePunten.length === 0) {
    return (
      <div className="text-center py-10">
        <ClipboardCheck className="w-8 h-8 text-success/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Geen geregistreerde schade voor dit voertuig</p>
      </div>
    );
  }

  const ernstCount = {
    licht: allePunten.filter((p) => p.ernst === "licht").length,
    middel: allePunten.filter((p) => p.ernst === "middel").length,
    zwaar: allePunten.filter((p) => p.ernst === "zwaar").length,
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Licht" value={ernstCount.licht} color="bg-yellow-500" />
        <Stat label="Middel" value={ernstCount.middel} color="bg-orange-500" />
        <Stat label="Zwaar" value={ernstCount.zwaar} color="bg-red-500" />
      </div>

      <VehicleDamageSketch points={allePunten} onChange={() => {}} readOnly />

      <Separator />

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Bron ({bronnen.length})
        </p>
        {bronnen.map((b) => {
          const date = new Date(b.datum);
          const isValid = !isNaN(date.getTime());
          return (
            <div key={`${b.source}-${b.id}`} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="p-2 rounded-md bg-warning/10 mt-0.5 shrink-0">
                {b.source === "terugmelding" ? (
                  <RotateCcw className="w-4 h-4 text-warning" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-warning" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground truncate">{b.label}</p>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {b.punten.length} punt{b.punten.length === 1 ? "" : "en"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isValid ? format(date, "d MMM yyyy", { locale: nl }) : "Onbekend"}
                </p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {b.punten.slice(0, 4).map((p, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-1.5 py-0.5 rounded-full bg-background border border-border text-foreground"
                    >
                      {p.label || `Punt ${i + 1}`}
                    </span>
                  ))}
                  {b.punten.length > 4 && (
                    <span className="text-[10px] text-muted-foreground">+{b.punten.length - 4}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="p-2.5 rounded-lg bg-muted/50 text-center">
      <div className={`w-3 h-3 rounded-full ${color} mx-auto mb-1`} />
      <p className="text-sm font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}