import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import {
  IdCard, FileSignature, AlertTriangle, ExternalLink, Plus, CheckCircle2, Clock, XCircle,
} from "lucide-react";
import {
  useRijbewijsStatus, useKlantOverdrachten, useKlantSchade, useKlantReserveringen,
} from "@/hooks/useKlantData";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PortaalPageHeader } from "@/components/portaal/PortaalPageHeader";
import { Badge } from "@/components/ui/badge";

export default function PortaalDocumenten() {
  const { slug } = useParams();
  const base = slug ? `/t/${slug}` : "";
  const { data: rijbewijs, isLoading: l1 } = useRijbewijsStatus();
  const { data: overdrachten = [], isLoading: l2 } = useKlantOverdrachten();
  const { data: schade = [], isLoading: l3 } = useKlantSchade();
  const { data: reserveringen = [] } = useKlantReserveringen();

  const heeftLopend = (reserveringen as any[]).some((r) =>
    ["actief", "lopend", "bevestigd"].includes(r.status) &&
    r.start_datum <= new Date().toISOString().slice(0, 10) &&
    r.eind_datum >= new Date().toISOString().slice(0, 10)
  );

  return (
    <div className="space-y-6">
      <PortaalPageHeader
        titel="Documenten"
        beschrijving="Rijbewijs, overdrachten en schaderapporten op één plek."
      />

      {/* Rijbewijs */}
      <Card className="p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <IdCard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Rijbewijs</h3>
              {l1 ? (
                <Skeleton className="h-4 w-40 mt-1" />
              ) : rijbewijs ? (
                <RijbewijsStatusLine status={rijbewijs.status} vervaldatum={rijbewijs.ai_vervaldatum} />
              ) : (
                <p className="text-sm text-muted-foreground mt-1">Nog geen rijbewijs ingediend</p>
              )}
            </div>
          </div>
          {rijbewijs?.upload_token && rijbewijs.status !== "goedgekeurd" && (
            <Button asChild variant="outline" size="sm">
              <Link to={`/rijbewijs/upload/${rijbewijs.upload_token}`} target="_blank">
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                Uploaden
              </Link>
            </Button>
          )}
        </div>
      </Card>

      {/* Overdrachten */}
      <Card>
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSignature className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Overdrachten</h3>
          </div>
          <span className="text-xs text-muted-foreground">{overdrachten.length} totaal</span>
        </div>
        <div className="divide-y divide-border">
          {l2 ? (
            <div className="p-5"><Skeleton className="h-12" /></div>
          ) : overdrachten.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Nog geen overdrachten</div>
          ) : (
            (overdrachten as any[]).map((o) => (
              <div key={o.id} className="p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground capitalize">
                    {o.type} · {o.voertuig_kenteken}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(o.datum), "d MMM yyyy", { locale: nl })}
                  </p>
                </div>
                <Badge variant={o.status === "ondertekend" ? "default" : "secondary"} className="capitalize">
                  {o.status?.replace(/_/g, " ")}
                </Badge>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Schade */}
      <Card>
        <div className="p-5 border-b border-border flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Schade meldingen</h3>
          </div>
          {heeftLopend && (
            <Button asChild size="sm">
              <Link to={`${base}/schade-melden`}>
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Schade melden
              </Link>
            </Button>
          )}
        </div>
        <div className="divide-y divide-border">
          {l3 ? (
            <div className="p-5"><Skeleton className="h-12" /></div>
          ) : schade.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Geen schade gemeld</div>
          ) : (
            (schade as any[]).map((s) => (
              <div key={s.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{s.omschrijving}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(s.datum), "d MMM yyyy", { locale: nl })}
                      {s.locatie_schade ? ` · ${s.locatie_schade}` : ""}
                    </p>
                  </div>
                  <Badge variant={s.hersteld ? "default" : "secondary"}>
                    {s.hersteld ? "Hersteld" : "Open"}
                  </Badge>
                </div>
                {s.fotos && s.fotos.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {s.fotos.slice(0, 4).map((f: string) => (
                      <img key={f} src={f} alt="schade" className="w-14 h-14 object-cover rounded-md border border-border" />
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

function RijbewijsStatusLine({ status, vervaldatum }: { status: string; vervaldatum?: string | null }) {
  const map: Record<string, { icon: any; tone: string; label: string }> = {
    goedgekeurd: { icon: CheckCircle2, tone: "text-emerald-600", label: "Goedgekeurd" },
    ingediend: { icon: Clock, tone: "text-blue-600", label: "In behandeling" },
    in_afwachting: { icon: Clock, tone: "text-amber-600", label: "Wachten op upload" },
    afgewezen: { icon: XCircle, tone: "text-red-600", label: "Afgewezen" },
  };
  const cfg = map[status] ?? { icon: Clock, tone: "text-muted-foreground", label: status };
  const Icon = cfg.icon;
  return (
    <div className={`flex items-center gap-1.5 text-sm mt-1 ${cfg.tone}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{cfg.label}</span>
      {vervaldatum && (
        <span className="text-muted-foreground">
          · geldig tot {format(parseISO(vervaldatum), "d MMM yyyy", { locale: nl })}
        </span>
      )}
    </div>
  );
}
