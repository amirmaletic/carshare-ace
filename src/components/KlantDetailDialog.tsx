import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useKlantReserveringen, useKlantFacturen, type KlantAccount } from "@/hooks/useKlanten";
import { useVoertuigen } from "@/hooks/useVoertuigen";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { User, Mail, Phone, MapPin, IdCard, Building2, FileText, CalendarRange, Euro, Car } from "lucide-react";

interface Props {
  klant: KlantAccount | null;
  onClose: () => void;
}

const reserveringStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  aangevraagd: { label: "Aangevraagd", variant: "outline" },
  bevestigd: { label: "Bevestigd", variant: "default" },
  actief: { label: "Actief", variant: "default" },
  voltooid: { label: "Voltooid", variant: "secondary" },
  geannuleerd: { label: "Geannuleerd", variant: "destructive" },
};

const factuurStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  betaald: { label: "Betaald", variant: "secondary" },
  openstaand: { label: "Openstaand", variant: "outline" },
  te_laat: { label: "Te laat", variant: "destructive" },
  herinnering_verstuurd: { label: "Herinnering verstuurd", variant: "outline" },
};

export function KlantDetailDialog({ klant, onClose }: Props) {
  const { data: reserveringen = [] } = useKlantReserveringen(klant?.id ?? null);
  const { data: facturenData } = useKlantFacturen(klant?.email ?? null);
  const { voertuigen } = useVoertuigen();

  if (!klant) return null;

  const facturen = facturenData?.facturen ?? [];
  const contracten = facturenData?.contracten ?? [];
  const totaalOpenstaand = facturen
    .filter((f) => f.status === "openstaand" || f.status === "te_laat")
    .reduce((sum, f) => sum + Number(f.bedrag), 0);
  const totaalBetaald = facturen
    .filter((f) => f.status === "betaald")
    .reduce((sum, f) => sum + Number(f.bedrag), 0);

  const getVoertuig = (id: string) => voertuigen.find((v) => v.id === id);

  return (
    <Dialog open={!!klant} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            {klant.voornaam} {klant.achternaam}
            {klant.auth_user_id ? (
              <Badge variant="default" className="ml-2">Portaal-account</Badge>
            ) : (
              <Badge variant="outline" className="ml-2">Geen account</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profiel" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profiel">Profiel</TabsTrigger>
            <TabsTrigger value="reserveringen">
              Reserveringen {reserveringen.length > 0 && `(${reserveringen.length})`}
            </TabsTrigger>
            <TabsTrigger value="facturen">
              Facturen {facturen.length > 0 && `(${facturen.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profiel" className="space-y-3 mt-4">
            <Card>
              <CardContent className="p-4 space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <InfoRow icon={Mail} label="E-mail" value={klant.email} />
                  <InfoRow icon={Phone} label="Telefoon" value={klant.telefoon} />
                  <InfoRow icon={MapPin} label="Adres" value={[klant.adres, klant.postcode, klant.plaats].filter(Boolean).join(", ") || null} />
                  <InfoRow icon={User} label="Type" value={klant.type === "zakelijk" ? "Zakelijk" : "Particulier"} />
                  {klant.type === "zakelijk" && (
                    <>
                      <InfoRow icon={Building2} label="Bedrijfsnaam" value={klant.bedrijfsnaam} />
                      <InfoRow icon={Building2} label="KvK-nummer" value={klant.kvk_nummer} />
                    </>
                  )}
                  <InfoRow icon={IdCard} label="Rijbewijsnummer" value={klant.rijbewijs_nummer} />
                  <InfoRow
                    icon={CalendarRange}
                    label="Rijbewijs verloopt"
                    value={klant.rijbewijs_verloopt ? format(new Date(klant.rijbewijs_verloopt), "d MMM yyyy", { locale: nl }) : null}
                    warning={klant.rijbewijs_verloopt && new Date(klant.rijbewijs_verloopt) < new Date()}
                  />
                </div>
                {klant.notities && (
                  <div className="pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-1">Notities</p>
                    <p className="text-sm">{klant.notities}</p>
                  </div>
                )}
                <div className="pt-3 border-t border-border text-xs text-muted-foreground">
                  Aangemaakt op {format(new Date(klant.created_at), "d MMMM yyyy", { locale: nl })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reserveringen" className="space-y-2 mt-4">
            {reserveringen.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground text-sm">Geen reserveringen</CardContent></Card>
            ) : (
              reserveringen.map((r) => {
                const voertuig = getVoertuig(r.voertuig_id);
                const cfg = reserveringStatusConfig[r.status] || { label: r.status, variant: "outline" as const };
                return (
                  <Card key={r.id}>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Car className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium text-sm">
                            {voertuig ? `${voertuig.merk} ${voertuig.model}` : "Voertuig onbekend"}
                          </span>
                          {voertuig && <span className="text-xs text-muted-foreground">({voertuig.kenteken})</span>}
                        </div>
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarRange className="w-3 h-3" />
                          {format(new Date(r.start_datum), "d MMM yyyy", { locale: nl })} t/m{" "}
                          {format(new Date(r.eind_datum), "d MMM yyyy", { locale: nl })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Euro className="w-3 h-3" />
                          €{Number(r.totaalprijs).toFixed(2)} (€{Number(r.dagprijs).toFixed(2)}/dag)
                        </span>
                      </div>
                      {r.notities && <p className="text-xs text-muted-foreground italic">{r.notities}</p>}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="facturen" className="space-y-3 mt-4">
            {facturen.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                <Card><CardContent className="p-3 text-center">
                  <p className="text-lg font-bold text-foreground">€{totaalBetaald.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Totaal betaald</p>
                </CardContent></Card>
                <Card><CardContent className="p-3 text-center">
                  <p className={`text-lg font-bold ${totaalOpenstaand > 0 ? "text-destructive" : "text-foreground"}`}>
                    €{totaalOpenstaand.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">Openstaand</p>
                </CardContent></Card>
              </div>
            )}

            {contracten.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase">Contracten</p>
                {contracten.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{c.contract_nummer}</span>
                      <Badge variant="outline" className="text-[10px]">{c.type}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      €{Number(c.maandprijs).toFixed(2)}/mnd
                    </span>
                  </div>
                ))}
              </div>
            )}

            {facturen.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground text-sm">Geen facturen</CardContent></Card>
            ) : (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase">Facturen</p>
                {facturen.map((f) => {
                  const cfg = factuurStatusConfig[f.status] || { label: f.status, variant: "outline" as const };
                  return (
                    <div key={f.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span>{format(new Date(f.datum), "d MMM yyyy", { locale: nl })}</span>
                        <span className="font-medium">€{Number(f.bedrag).toFixed(2)}</span>
                      </div>
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({ icon: Icon, label, value, warning }: { icon: any; label: string; value: string | null; warning?: boolean | null }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-sm truncate ${warning ? "text-destructive font-medium" : "text-foreground"}`}>
          {value || <span className="text-muted-foreground italic">Niet opgegeven</span>}
        </p>
      </div>
    </div>
  );
}