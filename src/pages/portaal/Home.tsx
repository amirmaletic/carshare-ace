import { Link, useParams } from "react-router-dom";
import { format, differenceInDays, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import {
  Car, CalendarRange, FileText, AlertTriangle, IdCard, ArrowRight, CheckCircle2, Clock, MapPin,
} from "lucide-react";
import {
  useKlantProfiel, useLopendeHuur, useKlantFacturen, useRijbewijsStatus,
} from "@/hooks/useKlantData";
import { usePortaalLocaties } from "@/hooks/usePortaalLocaties";
import { useTenantPortaal } from "@/hooks/useTenantPortaal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PortaalPageHeader } from "@/components/portaal/PortaalPageHeader";

export default function PortaalHome() {
  const { slug } = useParams();
  const base = slug ? `/t/${slug}` : "";
  const { data: profiel } = useKlantProfiel();
  const { lopend, komend, isLoading } = useLopendeHuur();
  const { data: facturen = [] } = useKlantFacturen();
  const { data: rijbewijs } = useRijbewijsStatus();
  const { tenant } = useTenantPortaal();
  const { data: locaties = [] } = usePortaalLocaties(tenant?.id);

  const openstaand = facturen
    .filter((f: any) => f.status === "openstaand" || f.status === "te_laat" || f.status === "herinnering_verstuurd")
    .reduce((sum: number, f: any) => sum + Number(f.bedrag || 0), 0);
  const aantalOpenstaand = facturen.filter((f: any) => f.status !== "betaald").length;

  const naam = profiel?.voornaam || "daar";

  return (
    <div className="space-y-6">
      <PortaalPageHeader
        titel={`Welkom terug, ${naam}`}
        beschrijving="Een overzicht van je huur, betalingen en documenten."
      />

      {/* Lopende huur hero */}
      {isLoading ? (
        <Skeleton className="h-44 rounded-xl" />
      ) : lopend ? (
        <LopendeHuurHero r={lopend} base={base} />
      ) : komend ? (
        <KomendeHuurHero r={komend} base={base} />
      ) : (
        <GeenHuurHero base={base} />
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={FileText}
          label="Openstaand"
          value={`€${openstaand.toLocaleString("nl-NL", { minimumFractionDigits: 2 })}`}
          sub={aantalOpenstaand > 0 ? `${aantalOpenstaand} factuur` : "Alles betaald"}
          tone={openstaand > 0 ? "warning" : "success"}
          to={`${base}/facturen`}
        />
        <StatCard
          icon={CalendarRange}
          label="Volgende reservering"
          value={komend ? format(parseISO(komend.start_datum), "d MMM", { locale: nl }) : "Geen"}
          sub={komend ? `${komend.voertuig?.merk ?? ""} ${komend.voertuig?.model ?? ""}` : "Boek een voertuig"}
          tone="info"
          to={`${base}/reserveringen`}
        />
        <StatCard
          icon={IdCard}
          label="Rijbewijs"
          value={rijbewijsLabel(rijbewijs?.status)}
          sub={rijbewijs?.ai_vervaldatum ? `Geldig tot ${format(parseISO(rijbewijs.ai_vervaldatum), "d MMM yyyy", { locale: nl })}` : "Nog niet ingediend"}
          tone={rijbewijsTone(rijbewijs?.status)}
          to={`${base}/documenten`}
        />
      </div>

      {/* Action cards */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Snel naar</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ActionCard to={base} icon={Car} titel="Boek een voertuig" beschrijving="Bekijk het beschikbare aanbod" />
          <ActionCard to={`${base}/documenten`} icon={IdCard} titel="Mijn documenten" beschrijving="Rijbewijs, overdrachten en schade" />
          <ActionCard to={`${base}/reserveringen`} icon={CalendarRange} titel="Mijn huur" beschrijving="Lopend, komend en historie" />
        </div>
      </div>

      {locaties.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Onze locaties</h2>
          <Card className="p-4 border-border">
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {locaties.map((l) => (
                <li
                  key={l.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-muted/40"
                >
                  <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-foreground truncate">{l.naam}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}

function LopendeHuurHero({ r, base }: { r: any; base: string }) {
  const start = parseISO(r.start_datum);
  const eind = parseISO(r.eind_datum);
  const totaalDagen = Math.max(differenceInDays(eind, start) + 1, 1);
  const resterend = Math.max(differenceInDays(eind, new Date()), 0);
  const verlopen = totaalDagen - resterend;
  const pct = Math.min(Math.max((verlopen / totaalDagen) * 100, 0), 100);

  return (
    <Card className="overflow-hidden border-border">
      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-0">
        <div className="bg-muted/40 p-4 flex items-center justify-center">
          {r.voertuig?.image_url ? (
            <img src={r.voertuig.image_url} alt={r.voertuig?.merk} className="max-h-32 object-contain" />
          ) : (
            <Car className="w-16 h-16 text-muted-foreground/40" />
          )}
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-medium mb-2">
                <CheckCircle2 className="w-3 h-3" /> Lopende huur
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                {r.voertuig?.merk} {r.voertuig?.model}
              </h3>
              <p className="text-sm text-muted-foreground">
                {r.voertuig?.kenteken} · {format(start, "d MMM", { locale: nl })} tot {format(eind, "d MMM yyyy", { locale: nl })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold text-foreground">{resterend}</p>
              <p className="text-xs text-muted-foreground">dagen resterend</p>
            </div>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link to={`${base}/reserveringen/${r.id}`}>Details</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to={`${base}/schade-melden?reservering=${r.id}`}>
                <AlertTriangle className="w-3.5 h-3.5 mr-1.5" /> Schade melden
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function KomendeHuurHero({ r, base }: { r: any; base: string }) {
  return (
    <Card className="p-5 border-border">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 text-xs font-medium mb-2">
            <Clock className="w-3 h-3" /> Komende huur
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            {r.voertuig?.merk} {r.voertuig?.model}
          </h3>
          <p className="text-sm text-muted-foreground">
            Start op {format(parseISO(r.start_datum), "EEEE d MMMM yyyy", { locale: nl })}
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link to={`${base}/reserveringen/${r.id}`}>Details <ArrowRight className="w-3.5 h-3.5 ml-1" /></Link>
        </Button>
      </div>
    </Card>
  );
}

function GeenHuurHero({ base }: { base: string }) {
  return (
    <Card className="p-6 border-border bg-gradient-to-br from-primary/5 to-transparent">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Nog geen huur lopend</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Bekijk het aanbod en boek direct een voertuig.
          </p>
        </div>
        <Button asChild>
          <Link to={base}>
            <Car className="w-4 h-4 mr-2" /> Bekijk aanbod
          </Link>
        </Button>
      </div>
    </Card>
  );
}

function StatCard({
  icon: Icon, label, value, sub, tone, to,
}: { icon: any; label: string; value: string; sub: string; tone: "info" | "warning" | "success"; to: string }) {
  const toneClasses =
    tone === "warning" ? "text-amber-600 bg-amber-500/10" :
    tone === "success" ? "text-emerald-600 bg-emerald-500/10" :
    "text-blue-600 bg-blue-500/10";
  return (
    <Link to={to} className="block">
      <Card className="p-4 hover:border-primary/40 transition-colors h-full">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${toneClasses}`}>
            <Icon className="w-4 h-4" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-semibold text-foreground mt-0.5">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{sub}</p>
      </Card>
    </Link>
  );
}

function ActionCard({ to, icon: Icon, titel, beschrijving }: any) {
  return (
    <Link to={to}>
      <Card className="p-4 hover:border-primary/40 hover:shadow-sm transition-all h-full">
        <Icon className="w-5 h-5 text-primary mb-2" />
        <p className="font-medium text-foreground text-sm">{titel}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{beschrijving}</p>
      </Card>
    </Link>
  );
}

function rijbewijsLabel(status?: string) {
  if (!status) return "Niet ingediend";
  if (status === "goedgekeurd") return "Goedgekeurd";
  if (status === "ingediend") return "In behandeling";
  if (status === "afgewezen") return "Afgewezen";
  return "In afwachting";
}
function rijbewijsTone(status?: string): "info" | "warning" | "success" {
  if (status === "goedgekeurd") return "success";
  if (status === "afgewezen") return "warning";
  return "info";
}
