import { useEffect, useState } from "react";
import { Car, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getVehicleImageUrl } from "@/data/mockData";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface VehicleImageProps {
  merk: string;
  model: string;
  src?: string | null;
  alt?: string;
  className?: string;
  iconClassName?: string;
  containerClassName?: string;
  /** Wanneer voertuigId is meegegeven, kan automatisch een AI fallback gegenereerd worden */
  voertuigId?: string;
  /** Toon expliciete "Genereer met AI" knop als de afbeelding faalt */
  showAiButton?: boolean;
  /** Genereer automatisch een AI-afbeelding als Imagin faalt (default: true wanneer voertuigId aanwezig) */
  autoGenerate?: boolean;
}

/**
 * Voertuigafbeelding met nette fallback (Car icon) als de bron faalt
 * of de externe Imagin-API een placeholder/error retourneert.
 */
export function VehicleImage({
  merk,
  model,
  src,
  alt,
  className,
  iconClassName,
  containerClassName,
  voertuigId,
  showAiButton = true,
  autoGenerate,
}: VehicleImageProps) {
  const qc = useQueryClient();
  const [currentSrc, setCurrentSrc] = useState<string | null>(
    src || getVehicleImageUrl(merk, model),
  );
  const [failed, setFailed] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Reset wanneer src extern verandert
  useEffect(() => {
    setCurrentSrc(src || getVehicleImageUrl(merk, model));
    setFailed(false);
  }, [src, merk, model]);

  const isAiImage = !!currentSrc && currentSrc.includes("/voertuig-afbeeldingen/");
  const shouldAutoGenerate = autoGenerate ?? !!voertuigId;

  const generate = async () => {
    if (!voertuigId || generating) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "genereer-voertuig-afbeelding",
        { body: { voertuig_id: voertuigId, force: isAiImage } },
      );
      if (error) throw error;
      if (data?.image_url) {
        setCurrentSrc(data.image_url);
        setFailed(false);
        qc.invalidateQueries({ queryKey: ["voertuigen"] });
        qc.invalidateQueries({ queryKey: ["tenant-voertuigen"] });
      }
    } catch (e) {
      console.error("AI image gen failed", e);
    } finally {
      setGenerating(false);
    }
  };

  // Auto-trigger bij faal
  useEffect(() => {
    if (failed && shouldAutoGenerate && voertuigId && !isAiImage && !generating) {
      generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [failed]);

  if (generating) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center w-full h-full bg-muted gap-2",
          containerClassName,
        )}
      >
        <Loader2 className={cn("w-8 h-8 text-primary animate-spin", iconClassName)} />
        <p className="text-[11px] text-muted-foreground">AI genereert foto...</p>
      </div>
    );
  }

  if (failed || !currentSrc) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center w-full h-full bg-muted gap-2",
          containerClassName,
        )}
      >
        <Car className={cn("w-12 h-12 text-muted-foreground/40", iconClassName)} />
        {showAiButton && voertuigId && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              generate();
            }}
            className="text-[11px] inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            <Sparkles className="w-3 h-3" /> Genereer met AI
          </button>
        )}
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt ?? `${merk} ${model}`}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}