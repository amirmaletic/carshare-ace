import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Car, Fuel, Gauge, Calendar, Shield, Wrench, Euro, MapPin, CalendarRange, FileText, RotateCcw, Clock, CalendarCheck,
  Image as ImageIcon,
} from "lucide-react";
import {
  Vehicle, getStatusColor, getReservationStatusColor,
} from "@/data/mockData";
import { VehicleReportTabs } from "@/components/VehicleReportTabs";
import { VehicleTerugmeldingen } from "@/components/VehicleTerugmeldingen";
import { VehicleTimeline } from "@/components/VehicleTimeline";
import { VehicleImage } from "@/components/VehicleImage";
import { VehicleAvailability } from "@/components/VehicleAvailability";
import { VehicleFotoGalerij } from "@/components/VehicleFotoGalerij";
import { useServiceHistorie } from "@/hooks/useVehicleReports";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface VehicleDetailProps {
  vehicle: Vehicle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getMaintenanceStatusVariant(status: string) {
  switch (status) {
    case 'voltooid': return 'success' as const;
    case 'in_uitvoering': return 'warning' as const;
    case 'gepland': return 'info' as const;
    default: return 'muted' as const;
  }
}

const statusLabels: Record<string, string> = {
  voltooid: 'Voltooid',
  in_uitvoering: 'In uitvoering',
  gepland: 'Gepland',
};

export function VehicleDetail({ vehicle, open, onOpenChange }: VehicleDetailProps) {
  const { data: serviceRecords = [] } = useServiceHistorie(vehicle?.id ?? null);

  const { data: reserveringen = [] } = useQuery({
    queryKey: ["vehicle-reserveringen", vehicle?.id],
    enabled: !!vehicle,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reserveringen")
        .select("*, klanten(voornaam, achternaam)")
        .eq("voertuig_id", vehicle!.id)
        .order("start_datum", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (!vehicle) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl w-screen max-w-none h-[100dvh] sm:h-auto sm:w-full sm:max-w-2xl sm:max-h-[90vh] overflow-y-auto p-0 rounded-none sm:rounded-lg gap-0 border-0 sm:border top-0 left-0 translate-x-0 translate-y-0 sm:top-[50%] sm:left-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%]">
        {/* Hero image */}
        <div className="relative h-44 sm:h-48 bg-gradient-to-br from-sidebar to-sidebar-accent overflow-hidden">
          <VehicleImage
            merk={vehicle.merk}
            model={vehicle.model}
            src={vehicle.image}
            className="absolute inset-0 w-full h-full object-contain object-center p-4 drop-shadow-lg"
            containerClassName="absolute inset-0 bg-transparent"
            iconClassName="w-16 h-16"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-sidebar/95 via-sidebar/60 to-transparent p-4 sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <h2 className="font-bold text-lg sm:text-xl text-foreground truncate">
                  {vehicle.merk} {vehicle.model}
                </h2>
                <p className="font-mono text-sm text-sidebar-foreground">{vehicle.kenteken}</p>
              </div>
              <div className="shrink-0 self-start sm:self-end">
                <StatusBadge status={vehicle.status} variant={getStatusColor(vehicle.status)} />
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 space-y-4 sm:space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <QuickInfo icon={Calendar} label="Bouwjaar" value={String(vehicle.bouwjaar)} />
            <QuickInfo icon={Fuel} label="Brandstof" value={vehicle.brandstof} />
            <QuickInfo icon={Gauge} label="Kilometerstand" value={`${vehicle.kilometerstand.toLocaleString('nl-NL')} km`} />
            <QuickInfo icon={Euro} label="Dagprijs" value={`€${vehicle.dagprijs}`} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <QuickInfo icon={MapPin} label="Kleur" value={vehicle.kleur} />
            <QuickInfo icon={Shield} label="APK vervalt" value={vehicle.apkVervaldatum || "-"} />
            <QuickInfo icon={Shield} label="Verzekering vervalt" value={vehicle.verzekeringsVervaldatum || "-"} />
          </div>

          <Separator />

          <Tabs defaultValue="beschikbaarheid" className="w-full">
            <div className="-mx-4 sm:mx-0 px-4 sm:px-0 overflow-x-auto scrollbar-none">
              <TabsList className="inline-flex sm:grid sm:grid-cols-7 w-max sm:w-full h-auto p-1 bg-muted/60 rounded-full sm:rounded-xl gap-1">
                {[
                  { value: "beschikbaarheid", icon: CalendarCheck, label: "Beschikbaar" },
                  { value: "tijdlijn", icon: Clock, label: "Tijdlijn" },
                  { value: "onderhoud", icon: Wrench, label: "Onderhoud" },
                  { value: "terugmeldingen", icon: RotateCcw, label: "Retouren" },
                  { value: "reserveringen", icon: CalendarRange, label: "Reserveringen" },
                  { value: "rapporten", icon: FileText, label: "Rapporten" },
                  { value: "fotos", icon: ImageIcon, label: "Foto's" },
                ].map(({ value, icon: Icon, label }) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-2 sm:px-1 sm:py-2 sm:flex-col sm:gap-1 h-auto rounded-full sm:rounded-lg text-xs sm:text-[10px] font-medium text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-colors whitespace-nowrap"
                  >
                    <Icon className="w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0" />
                    <span className="leading-none">{label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value="beschikbaarheid" className="mt-4">
              <VehicleAvailability voertuigId={vehicle.id} />
            </TabsContent>

            <TabsContent value="tijdlijn" className="mt-4">
              <VehicleTimeline voertuigId={vehicle.id} />
            </TabsContent>

            <TabsContent value="onderhoud" className="mt-4 space-y-3">
              {serviceRecords.length === 0 ? (
                <EmptyState icon={Wrench} text="Geen onderhoudshistorie" />
              ) : (
                serviceRecords.map((m) => (
                  <div key={m.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 animate-fade-in">
                    <div className="p-2 rounded-md bg-warning/10 mt-0.5">
                      <Wrench className="w-4 h-4 text-warning" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground">{m.type}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{m.omschrijving}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span>{m.datum}</span>
                        <span className="font-medium text-foreground">€{m.kosten}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="terugmeldingen" className="mt-4">
              <VehicleTerugmeldingen voertuigId={vehicle.id} kenteken={vehicle.kenteken} />
            </TabsContent>

            <TabsContent value="reserveringen" className="mt-4 space-y-3">
              {reserveringen.length === 0 ? (
                <EmptyState icon={CalendarRange} text="Geen reserveringen" />
              ) : (
                reserveringen.map((r: any) => (
                  <div key={r.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 animate-fade-in">
                    <div className="p-2 rounded-md bg-info/10 mt-0.5">
                      <CalendarRange className="w-4 h-4 text-info" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-sm text-foreground">
                          {r.klanten?.voornaam} {r.klanten?.achternaam}
                        </p>
                        <StatusBadge status={r.status} variant={getReservationStatusColor(r.status)} />
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {r.start_datum} t/m {r.eind_datum}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">€{r.totaalprijs}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="rapporten" className="mt-4">
              <VehicleReportTabs voertuigId={vehicle.id} />
            </TabsContent>

            <TabsContent value="fotos" className="mt-4">
              <VehicleFotoGalerij voertuigId={vehicle.id} kenteken={vehicle.kenteken} />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function QuickInfo({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg bg-muted/50">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="text-center py-8">
      <Icon className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
