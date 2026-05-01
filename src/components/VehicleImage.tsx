import { useState } from "react";
import { Car } from "lucide-react";
import { cn } from "@/lib/utils";
import { getVehicleImageUrl } from "@/data/mockData";

interface VehicleImageProps {
  merk: string;
  model: string;
  src?: string | null;
  alt?: string;
  className?: string;
  iconClassName?: string;
  containerClassName?: string;
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
}: VehicleImageProps) {
  const initial = src || getVehicleImageUrl(merk, model);
  const [failed, setFailed] = useState(false);

  if (failed || !initial) {
    return (
      <div className={cn("flex items-center justify-center w-full h-full bg-muted", containerClassName)}>
        <Car className={cn("w-12 h-12 text-muted-foreground/40", iconClassName)} />
      </div>
    );
  }

  return (
    <img
      src={initial}
      alt={alt ?? `${merk} ${model}`}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}