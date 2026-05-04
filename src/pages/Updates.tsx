import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Camera,
  FileSpreadsheet,
  Sparkles,
  ShieldCheck,
  Gauge,
  Users,
  PiggyBank,
  Activity,
  RotateCcw,
  Upload,
  ArrowRight,
} from "lucide-react";

type UpdateType = "Nieuw" | "Verbetering" | "Fix";

interface Update {
  datum: string;
  type: UpdateType;
  titel: string;
  beschrijving: string;
  icon: React.ElementType;
  highlights?: string[];
}

const updates: Update[] = [
  {
    datum: "4 mei 2026",
    type: "Nieuw",
    titel: "Uitgebreide dashboarding",
    beschrijving:
      "Vier nieuwe dashboards: operationeel, financieel, vlootprestatie en klant & verhuur. Met KPI tegels, trendvergelijking, heatmaps, ranglijsten en grafieken.",
    icon: BarChart3,
    highlights: [
      "Periode filter (maand, kwartaal, jaar, custom)",
      "Export naar CSV",
      "Top en flop ranglijsten per voertuig",
      "Bezettingsgraad realtime berekend",
    ],
  },
  {
    datum: "3 mei 2026",
    type: "Verbetering",
    titel: "Schade direct zichtbaar bij terugmelden",
    beschrijving:
      "Bij het terugmelden van een voertuig zie je nu meteen welke schade het voertuig al heeft, zodat je nieuwe schade sneller kunt herkennen.",
    icon: Camera,
  },
  {
    datum: "2 mei 2026",
    type: "Verbetering",
    titel: "Verhuurprijs in CSV import",
    beschrijving:
      "Bij het importeren van voertuigen kun je nu ook direct de dag- en weekprijs meegeven. Geen handmatige nawerk meer.",
    icon: FileSpreadsheet,
  },
  {
    datum: "28 april 2026",
    type: "Nieuw",
    titel: "AI Vloot Copilot",
    beschrijving:
      "Stel vragen over je vloot in gewone taal. De copilot kijkt mee in live data en helpt met planning, beschikbaarheid en cijfers.",
    icon: Sparkles,
  },
  {
    datum: "20 april 2026",
    type: "Nieuw",
    titel: "Visuele schade inspectie",
    beschrijving:
      "Klik schade direct op een SVG schets van het voertuig. Verplichte ernst en omvang, plus expliciete 'geen schade' bevestiging.",
    icon: ShieldCheck,
  },
  {
    datum: "12 april 2026",
    type: "Nieuw",
    titel: "Vlootplanning Gantt",
    beschrijving:
      "28 daagse Gantt weergave van je hele vloot. Status 'verhuurd' wordt automatisch afgeleid uit actieve contracten.",
    icon: Gauge,
  },
  {
    datum: "5 april 2026",
    type: "Nieuw",
    titel: "Chauffeursbeheer",
    beschrijving:
      "Beheer chauffeurs, trailercapaciteit en rijbewijsverloop. Inclusief beschikbaarheid en automatische waarschuwingen.",
    icon: Users,
  },
  {
    datum: "28 maart 2026",
    type: "Nieuw",
    titel: "Klantportaal en aanvragen",
    beschrijving:
      "Klanten reserveren via je eigen white label portaal. AI matcht aanvragen automatisch met beschikbare voertuigen.",
    icon: PiggyBank,
  },
  {
    datum: "20 maart 2026",
    type: "Verbetering",
    titel: "Activiteitenlog",
    beschrijving:
      "Centraal audit log van alle wijzigingen in voertuigen, contracten, ritten en schades.",
    icon: Activity,
  },
  {
    datum: "10 maart 2026",
    type: "Nieuw",
    titel: "Terugmeldsysteem",
    beschrijving:
      "Snelle voertuig terugmelding via kentekenzoek, met validatie op kilometerstand en foto uploads.",
    icon: RotateCcw,
  },
  {
    datum: "1 maart 2026",
    type: "Nieuw",
    titel: "Migratiehulp en CSV import",
    beschrijving:
      "Wij helpen je gratis bij de overstap. Importeer je hele vloot in één keer via CSV met automatische RDW verrijking.",
    icon: Upload,
  },
];

const typeStyles: Record<UpdateType, string> = {
  Nieuw: "bg-primary/10 text-primary border-primary/20",
  Verbetering: "bg-success/10 text-success border-success/20",
  Fix: "bg-warning/10 text-warning border-warning/20",
};

export default function Updates() {
  useEffect(() => {
    document.title = "Updates en changelog | FleeFlo";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute(
      "content",
      "Alle nieuwe functies, verbeteringen en updates van het FleeFlo wagenparkbeheer platform."
    );
  }, []);
  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="border-b border-border bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <Badge variant="outline" className="mb-4">
            Changelog
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight mb-4">
            Wat is er nieuw bij FleeFlo
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            We verbeteren FleeFlo continu. Hieronder vind je een overzicht van de
            laatste functies, verbeteringen en fixes.
          </p>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 sm:left-6 top-2 bottom-2 w-px bg-border" aria-hidden />

            <div className="space-y-10">
              {updates.map((u, idx) => {
                const Icon = u.icon;
                return (
                  <article key={idx} className="relative pl-14 sm:pl-20">
                    <div className="absolute left-0 top-0 w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-background border-2 border-primary/30 flex items-center justify-center">
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    </div>

                    <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-sm">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${typeStyles[u.type]}`}>
                          {u.type}
                        </span>
                        <span className="text-xs text-muted-foreground">{u.datum}</span>
                      </div>
                      <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
                        {u.titel}
                      </h2>
                      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                        {u.beschrijving}
                      </p>
                      {u.highlights && (
                        <ul className="mt-3 space-y-1">
                          {u.highlights.map((h, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                              <span>{h}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-16 rounded-2xl border border-border bg-muted/30 p-8 sm:p-10 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Wensen of feedback?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              We bouwen FleeFlo samen met onze gebruikers. Laat weten wat je mist en we
              kijken of we het kunnen toevoegen.
            </p>
            <Button asChild size="lg">
              <Link to="/auth">
                Aan de slag <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}