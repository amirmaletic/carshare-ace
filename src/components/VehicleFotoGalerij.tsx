import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { ImageIcon, Loader2, Camera, RotateCcw, FileSignature } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  voertuigId: string;
  kenteken: string;
}

interface FotoItem {
  url: string;
  bron: "schade" | "terugmelding" | "overdracht";
  datum: string;
  context: string;
}

export function VehicleFotoGalerij({ voertuigId, kenteken }: Props) {
  const [filter, setFilter] = useState<"alle" | "schade" | "terugmelding" | "overdracht">("alle");
  const [lightbox, setLightbox] = useState<FotoItem | null>(null);

  const { data: fotos = [], isLoading } = useQuery({
    queryKey: ["voertuig-fotos", voertuigId, kenteken],
    queryFn: async (): Promise<FotoItem[]> => {
      const items: FotoItem[] = [];

      // Schade-rapporten (incl. losse foto's én foto's per schade_punt)
      const { data: schades } = await supabase
        .from("schade_rapporten")
        .select("id, datum, omschrijving, fotos, schade_punten")
        .eq("voertuig_id", voertuigId);
      for (const s of schades ?? []) {
        for (const url of (s.fotos ?? []) as string[]) {
          items.push({ url, bron: "schade", datum: s.datum, context: s.omschrijving });
        }
        for (const p of ((s.schade_punten ?? []) as any[])) {
          for (const url of (p.fotos ?? []) as string[]) {
            items.push({ url, bron: "schade", datum: s.datum, context: `Schade: ${p.label || "Onbekend"}` });
          }
        }
      }

      // Terugmeldingen
      const { data: terugs } = await supabase
        .from("terugmeldingen")
        .select("id, datum, voertuig_naam, fotos, schade_punten")
        .or(`voertuig_id.eq.${voertuigId},voertuig_kenteken.eq.${kenteken}`);
      for (const t of terugs ?? []) {
        for (const url of (t.fotos ?? []) as string[]) {
          items.push({ url, bron: "terugmelding", datum: t.datum, context: `Terugmelding ${t.voertuig_naam}` });
        }
        for (const p of ((t.schade_punten ?? []) as any[])) {
          for (const url of (p.fotos ?? []) as string[]) {
            items.push({ url, bron: "terugmelding", datum: t.datum, context: `Inlever-schade: ${p.label || "Onbekend"}` });
          }
        }
      }

      // Overdrachten
      const { data: overs } = await supabase
        .from("overdrachten")
        .select("id, datum, type, voertuig_naam, schade_punten")
        .or(`voertuig_id.eq.${voertuigId},voertuig_kenteken.eq.${kenteken}`);
      for (const o of overs ?? []) {
        for (const p of ((o.schade_punten ?? []) as any[])) {
          for (const url of (p.fotos ?? []) as string[]) {
            items.push({ url, bron: "overdracht", datum: o.datum, context: `${o.type === "ophalen" ? "Ophalen" : "Inleveren"}: ${p.label || "Onbekend"}` });
          }
        }
      }

      return items.sort((a, b) => b.datum.localeCompare(a.datum));
    },
  });

  const filtered = fotos.filter(f => filter === "alle" || f.bron === filter);

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  if (fotos.length === 0) {
    return (
      <div className="text-center py-10">
        <ImageIcon className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Nog geen foto's voor dit voertuig</p>
      </div>
    );
  }

  const filters: Array<{ key: typeof filter; label: string; icon: any }> = [
    { key: "alle", label: `Alle (${fotos.length})`, icon: ImageIcon },
    { key: "schade", label: `Schade (${fotos.filter(f => f.bron === "schade").length})`, icon: Camera },
    { key: "terugmelding", label: `Inlever (${fotos.filter(f => f.bron === "terugmelding").length})`, icon: RotateCcw },
    { key: "overdracht", label: `Overdracht (${fotos.filter(f => f.bron === "overdracht").length})`, icon: FileSignature },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors",
              filter === f.key
                ? "bg-primary text-primary-foreground border-transparent"
                : "bg-background text-muted-foreground border-border hover:border-primary/40"
            )}
          >
            <f.icon className="w-3 h-3" />
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {filtered.map((f, i) => (
          <button
            key={`${f.url}-${i}`}
            onClick={() => setLightbox(f)}
            className="group relative aspect-square rounded-lg overflow-hidden border border-border hover:border-primary/40 transition-all"
          >
            <img src={f.url} alt={f.context} className="w-full h-full object-cover" loading="lazy" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-[10px] text-white font-medium truncate">{f.context}</p>
            </div>
          </button>
        ))}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div className="max-w-3xl max-h-[90vh] flex flex-col gap-2" onClick={e => e.stopPropagation()}>
            <img src={lightbox.url} alt={lightbox.context} className="max-h-[80vh] rounded-lg object-contain" />
            <div className="bg-background/95 rounded-lg p-3 text-sm">
              <p className="font-medium text-foreground">{lightbox.context}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {format(new Date(lightbox.datum), "d MMMM yyyy", { locale: nl })} · {lightbox.bron}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
