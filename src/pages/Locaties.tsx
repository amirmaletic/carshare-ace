import { Car, Fuel, Gauge, MapPin } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { getStatusColor, getVehicleImageUrl } from "@/data/mockData";
import { useLocaties } from "@/hooks/useLocaties";
import { useVoertuigen } from "@/hooks/useVoertuigen";
import { vehicles as mockVehicles, type Vehicle } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function Locaties() {
  const { locaties, isLoading: locLoading } = useLocaties();
  const { voertuigen: dbVoertuigen, isLoading: vLoading } = useVoertuigen();
  const queryClient = useQueryClient();

  const dbAsVehicles: (Vehicle & { locatie?: string | null })[] = dbVoertuigen.map((v: any) => ({
    id: v.id,
    kenteken: v.kenteken,
    merk: v.merk,
    model: v.model,
    bouwjaar: v.bouwjaar,
    brandstof: v.brandstof as Vehicle["brandstof"],
    kilometerstand: v.kilometerstand,
    status: v.status as Vehicle["status"],
    apkVervaldatum: v.apk_vervaldatum || "",
    verzekeringsVervaldatum: v.verzekering_vervaldatum || "",
    dagprijs: Number(v.dagprijs),
    categorie: v.categorie as Vehicle["categorie"],
    kleur: v.kleur,
    locatie: v.locatie,
  }));

  // Mock vehicles don't have locatie — treat as unassigned
  const mockAsVehicles: (Vehicle & { locatie?: string | null })[] = mockVehicles.map((v) => ({
    ...v,
    locatie: null,
  }));

  const allVehicles = [...dbAsVehicles, ...mockAsVehicles];

  const columns = [
    { id: "__unassigned__", naam: "Geen locatie" },
    ...locaties.map((l) => ({ id: l.id, naam: l.naam })),
  ];

  const vehiclesByColumn = columns.map((col) => ({
    ...col,
    vehicles: allVehicles.filter((v) =>
      col.id === "__unassigned__"
        ? !v.locatie || !locaties.some((l) => l.naam === v.locatie)
        : v.locatie === col.naam
    ),
  }));

  const handleDrop = async (vehicleId: string, locatieNaam: string | null) => {
    // Only DB vehicles can be moved
    const isDbVehicle = dbVoertuigen.some((v) => v.id === vehicleId);
    if (!isDbVehicle) {
      toast.error("Mock-voertuigen kunnen niet verplaatst worden");
      return;
    }
    const { error } = await supabase
      .from("voertuigen")
      .update({ locatie: locatieNaam })
      .eq("id", vehicleId);
    if (error) {
      toast.error("Fout bij verplaatsen: " + error.message);
    } else {
      queryClient.invalidateQueries({ queryKey: ["voertuigen"] });
      toast.success(`Voertuig verplaatst naar ${locatieNaam || "Geen locatie"}`);
    }
  };

  if (locLoading || vLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Locaties</h1>
        <p className="text-muted-foreground mt-1">
          Overzicht van voertuigen per locatie — sleep kaartjes om te verplaatsen
        </p>
      </div>

      {locaties.length === 0 ? (
        <div className="text-center py-16 clean-card">
          <MapPin className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">Geen locaties ingesteld</p>
          <p className="text-sm text-muted-foreground mt-1">
            Ga naar Instellingen → Locaties om locaties toe te voegen
          </p>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:-mx-0 sm:px-0">
          {vehiclesByColumn.map((col) => (
            <KanbanColumn
              key={col.id}
              id={col.id}
              naam={col.naam}
              vehicles={col.vehicles}
              onDrop={handleDrop}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface KanbanColumnProps {
  id: string;
  naam: string;
  vehicles: (Vehicle & { locatie?: string | null })[];
  onDrop: (vehicleId: string, locatieNaam: string | null) => void;
}

function KanbanColumn({ id, naam, vehicles, onDrop }: KanbanColumnProps) {
  const beschikbaar = vehicles.filter((v) => v.status === "beschikbaar").length;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const vehicleId = e.dataTransfer.getData("vehicleId");
    if (vehicleId) {
      onDrop(vehicleId, id === "__unassigned__" ? null : naam);
    }
  };

  return (
    <div
      className="flex-shrink-0 w-[280px] sm:w-[300px] bg-muted/50 rounded-xl border border-border"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Column header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm text-foreground">{naam}</h3>
          </div>
          <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-full border border-border">
            {vehicles.length} auto{vehicles.length !== 1 ? "'s" : ""}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {beschikbaar} beschikbaar
        </p>
      </div>

      {/* Cards */}
      <div className="p-2 space-y-2 max-h-[60vh] overflow-y-auto">
        {vehicles.length === 0 && (
          <div className="text-center py-8 text-xs text-muted-foreground">
            Geen voertuigen
          </div>
        )}
        {vehicles.map((v) => (
          <VehicleKanbanCard key={v.id} vehicle={v} />
        ))}
      </div>
    </div>
  );
}

function VehicleKanbanCard({ vehicle }: { vehicle: Vehicle }) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("vehicleId", vehicle.id);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={cn(
        "clean-card p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all",
        "animate-fade-in"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm text-foreground truncate">
            {vehicle.merk} {vehicle.model}
          </p>
          <p className="text-xs text-muted-foreground font-mono">{vehicle.kenteken}</p>
        </div>
        <StatusBadge status={vehicle.status} variant={getStatusColor(vehicle.status)} />
      </div>
      <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Fuel className="w-3 h-3" />
          {vehicle.brandstof}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Gauge className="w-3 h-3" />
          {(vehicle.kilometerstand / 1000).toFixed(0)}k
        </div>
        <span className="text-xs font-medium text-primary ml-auto">€{vehicle.dagprijs}/dag</span>
      </div>
    </div>
  );
}
