import Seo from "@/components/Seo";
import { CheckCircle2, Loader2, Sparkles, Lightbulb } from "lucide-react";
import { CtaSection } from "@/components/marketing/sections";

type Status = "done" | "now" | "next" | "later";

const statusConfig: Record<Status, { label: string; icon: typeof CheckCircle2; klass: string }> = {
  done: { label: "Live", icon: CheckCircle2, klass: "border-primary/30 bg-primary/5 text-primary" },
  now: { label: "Nu in ontwikkeling", icon: Loader2, klass: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  next: { label: "Volgende kwartaal", icon: Sparkles, klass: "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-400" },
  later: { label: "Op de planning", icon: Lightbulb, klass: "border-border bg-muted/40 text-muted-foreground" },
};

const items: { kwartaal: string; status: Status; titel: string; beschrijving: string }[] = [
  { kwartaal: "Q1 2026", status: "done", titel: "AI Vloot Copilot", beschrijving: "Chat assistent met live tool calling op voertuigen, planning en klanten. Genereert direct Stripe betaallinks bij een match." },
  { kwartaal: "Q1 2026", status: "done", titel: "Visuele schade inspectie", beschrijving: "SVG voertuigschets met verplichte ernst, grootte en foto. Inclusief expliciete bevestiging zonder schade." },
  { kwartaal: "Q1 2026", status: "done", titel: "Modus wagenparkbeheer", beschrijving: "Schakel per organisatie tussen autoverhuur en eigen wagenpark. Sidebar en instellingen passen automatisch aan." },
  { kwartaal: "Q2 2026", status: "done", titel: "Dashboarding met 6 tabs", beschrijving: "Operationeel, financieel, vlootprestatie, klant, rapportages en kosten en TCO in één overzicht met CSV export." },
  { kwartaal: "Q2 2026", status: "done", titel: "Migratie wizard", beschrijving: "Stapsgewijze import vanuit Excel, Wincar en CarRental Manager met automatische veld mapping en RDW aanvulling." },
  { kwartaal: "Q2 2026", status: "now", titel: "Mobiele overdracht app", beschrijving: "Native gevoel op telefoon en tablet voor pick up en return, inclusief offline foto upload en signatuur." },
  { kwartaal: "Q2 2026", status: "now", titel: "Boekhouding koppeling Moneybird en e Boekhouden", beschrijving: "Push facturen automatisch naar je boekhoudsysteem met btw codes, grootboekrekeningen en relaties." },
  { kwartaal: "Q3 2026", status: "next", titel: "Telematica integratie", beschrijving: "Live kilometerstand en locatie via OBD dongles en fabrieks API van Volkswagen, BMW en Tesla." },
  { kwartaal: "Q3 2026", status: "next", titel: "Dynamische prijzen", beschrijving: "Automatisch je tarieven aanpassen op basis van bezetting, seizoen en lokale concurrentie." },
  { kwartaal: "Q3 2026", status: "next", titel: "Klant identificatie via iDIN en NFC rijbewijs", beschrijving: "Snelle KYC bij online boeking met iDIN en NFC scan van het rijbewijs voor balieverhuur." },
  { kwartaal: "Q4 2026", status: "later", titel: "Whatsapp business kanaal", beschrijving: "Bevestigingen, overdrachten en herinneringen via Whatsapp, met tweerichtings antwoorden naar de planning." },
  { kwartaal: "Q4 2026", status: "later", titel: "Marketplace voor verhuurders", beschrijving: "Optionele etalage waar klanten direct beschikbare voertuigen van aangesloten verhuurders kunnen boeken." },
  { kwartaal: "Q4 2026", status: "later", titel: "Multi taal voor klantportaal", beschrijving: "Engels, Duits en Frans voor publieke boekingspagina, klantportaal en transactionele e mails." },
];

export default function Roadmap() {
  const groepen = Array.from(new Set(items.map((i) => i.kwartaal)));
  return (
    <div>
      <Seo
        title="Roadmap | FleeFlo wagenparkbeheer en autoverhuur software"
        description="De FleeFlo roadmap: wat live is, wat nu in ontwikkeling is en wat we komende kwartalen bouwen. Inclusief AI copilot, telematica, boekhouding en mobiele overdracht."
        path="/roadmap"
      />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 text-center">
        <h1 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight">Roadmap</h1>
        <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
          Transparant overzicht van wat live is, waar we nu aan bouwen en wat eraan komt.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs">
          {(Object.keys(statusConfig) as Status[]).map((s) => {
            const c = statusConfig[s];
            const Icon = c.icon;
            return (
              <span key={s} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${c.klass}`}>
                <Icon className="w-3.5 h-3.5" />
                {c.label}
              </span>
            );
          })}
        </div>
      </div>

      <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-12">
          {groepen.map((q) => (
            <div key={q}>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-5">{q}</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {items.filter((i) => i.kwartaal === q).map((i) => {
                  const c = statusConfig[i.status];
                  const Icon = c.icon;
                  return (
                    <article key={i.titel} className="p-5 rounded-2xl border border-border bg-background">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${c.klass}`}>
                          <Icon className={`w-3 h-3 ${i.status === "now" ? "animate-spin" : ""}`} />
                          {c.label}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-foreground mb-1.5">{i.titel}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{i.beschrijving}</p>
                    </article>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="p-6 sm:p-8 rounded-2xl border-2 border-primary/20 bg-primary/5 text-center">
            <h3 className="text-xl font-bold text-foreground mb-2">Mis je iets op de roadmap?</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-xl mx-auto">
              We bouwen FleeFlo samen met onze klanten. Stuur je suggestie en we nemen het mee in de planning.
            </p>
            <a
              href="mailto:info@fleeflo.nl?subject=Roadmap%20suggestie%20FleeFlo"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Stuur je suggestie
            </a>
          </div>
        </div>
      </section>

      <CtaSection />
    </div>
  );
}