import { useState } from "react";
import { Check, Zap, ArrowRight, Sparkles, Building2, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Seo from "@/components/Seo";
import RoiCalculator from "@/components/marketing/RoiCalculator";

type Pakket = {
  naam: string;
  beschrijving: string;
  prijsPerVoertuig: number;
  range: string;
  min: number;
  max: number | null;
  icon: typeof Sparkles;
  popular?: boolean;
  features: string[];
};

const pakketten: Pakket[] = [
  {
    naam: "Starter",
    beschrijving: "Voor kleine verhuurders en wagenparken",
    prijsPerVoertuig: 4.5,
    range: "1 t/m 10 voertuigen",
    min: 1,
    max: 10,
    icon: Sparkles,
    features: [
      "Alle kernfuncties",
      "Contractbeheer met digitale ondertekening",
      "Klantportaal en publiek reserveren",
      "Visueel schadebeheer",
      "Onbeperkt gebruikers",
      "E mail support",
    ],
  },
  {
    naam: "Groei",
    beschrijving: "Voor groeiende vloten met meerdere vestigingen",
    prijsPerVoertuig: 3.75,
    range: "11 t/m 50 voertuigen",
    min: 11,
    max: 50,
    icon: Building2,
    popular: true,
    features: [
      "Alles uit Starter",
      "AI Vloot Copilot",
      "Ritregistratie en transport",
      "Boekhoudkoppelingen",
      "Onbeperkt locaties en vestigingen",
      "Prioriteit support",
    ],
  },
  {
    naam: "Pro",
    beschrijving: "Voor professionele vloten en lease maatschappijen",
    prijsPerVoertuig: 3.0,
    range: "51 t/m 150 voertuigen",
    min: 51,
    max: 150,
    icon: Crown,
    features: [
      "Alles uit Groei",
      "API toegang en webhooks",
      "Custom domeinen voor klantportaal",
      "Geavanceerde rapportages",
      "Dedicated onboarding",
    ],
  },
  {
    naam: "Enterprise",
    beschrijving: "Voor grote vloten met maatwerk wensen",
    prijsPerVoertuig: 2.25,
    range: "150+ voertuigen",
    min: 151,
    max: null,
    icon: Crown,
    features: [
      "Alles uit Pro",
      "Vlootabonnement op maat",
      "SLA en uptime garantie",
      "Dedicated accountmanager",
      "SSO en SAML",
    ],
  },
];

function pakketVoorAantal(n: number): Pakket {
  return pakketten.find((p) => n >= p.min && (p.max === null || n <= p.max)) ?? pakketten[0];
}

function fmtEuro(n: number): string {
  return n.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Pricing() {
  const [aantal, setAantal] = useState(10);
  const navigate = useNavigate();
  const huidig = pakketVoorAantal(aantal);
  const maandTotaal = aantal * huidig.prijsPerVoertuig;

  return (
    <div>
      <Seo
        title="Prijzen wagenparkbeheer | Vanaf €2,25 per voertuig | FleeFlo"
        description="Transparante prijzen voor wagenparkbeheer en autoverhuur software. Pakketten van Starter tot Enterprise, vanaf €2,25 per voertuig per maand. 30 dagen gratis proberen, geen creditcard."
        path="/prijzen"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: "FleeFlo wagenparkbeheer software",
          description:
            "Complete software voor autoverhuur en wagenparkbeheer met RDW koppeling, digitale contracten, planning, klantportaal en AI copilot.",
          brand: { "@type": "Brand", name: "FleeFlo" },
          offers: {
            "@type": "AggregateOffer",
            priceCurrency: "EUR",
            lowPrice: "2.25",
            highPrice: "4.50",
            offerCount: "4",
            url: "https://www.fleeflo.nl/prijzen",
          },
        }}
      />
      {/* Hero */}
      <section className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            1 maand gratis proberen, geen creditcard nodig
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight">
            Schaalbare prijzen,{" "}
            <span className="text-primary">vanaf €4,50 per voertuig</span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
            Hoe groter je vloot, hoe lager de prijs per voertuig. Kies het pakket
            dat past bij je huidige vloot en groei zonder rompslomp door naar het
            volgende.
          </p>
        </div>
      </section>

      {/* Calculator */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <div className="flex items-baseline justify-between mb-4">
            <label className="text-sm font-medium text-foreground">
              Hoeveel voertuigen heb je?
            </label>
            <span className="text-lg font-bold text-foreground tabular-nums">
              {aantal}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={10000}
            step={1}
            value={aantal}
            onChange={(e) => setAantal(Number(e.target.value))}
            className="w-full accent-primary"
            aria-label="Aantal voertuigen"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>1</span>
            <span>10.000</span>
          </div>

          <div className="mt-6 pt-6 border-t border-border grid sm:grid-cols-3 gap-4 items-end">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Pakket
              </p>
              <p className="text-lg font-bold text-foreground">{huidig.naam}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Per voertuig
              </p>
              <p className="text-lg font-bold text-foreground tabular-nums">
                €{fmtEuro(huidig.prijsPerVoertuig)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Totaal per maand
              </p>
              <p className="text-2xl font-extrabold text-primary tabular-nums">
                €{fmtEuro(maandTotaal)}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">Bedragen zijn excl. btw.</p>
        </div>
      </section>

      <RoiCalculator />

      {/* Pakketten */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
          {pakketten.map((p) => {
            const actief = huidig.naam === p.naam;
            return (
              <div
                key={p.naam}
                className={cn(
                  "relative rounded-2xl border p-6 flex flex-col transition-shadow",
                  p.popular
                    ? "border-primary shadow-xl shadow-primary/10"
                    : "border-border hover:shadow-lg",
                  actief && !p.popular && "ring-2 ring-primary/40"
                )}
              >
                {p.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                    Meest gekozen
                  </div>
                )}
                {actief && (
                  <div className="absolute top-4 right-4 px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-semibold rounded-full uppercase tracking-wide">
                    Jouw keuze
                  </div>
                )}

                <div className="flex items-center gap-3 mb-3">
                  <div className={cn("p-2.5 rounded-xl", p.popular ? "bg-primary/10" : "bg-muted")}>
                    <p.icon className={cn("w-5 h-5", p.popular ? "text-primary" : "text-muted-foreground")} />
                  </div>
                  <h3 className="font-bold text-foreground text-lg">{p.naam}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4 min-h-[40px]">
                  {p.beschrijving}
                </p>

                <div className="mb-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-foreground tabular-nums">
                      €{fmtEuro(p.prijsPerVoertuig)}
                    </span>
                    <span className="text-muted-foreground text-xs">/voertuig/mnd</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{p.range}</p>
                </div>

                <Button
                  className="w-full gap-2 my-5"
                  variant={p.popular ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    p.naam === "Enterprise"
                      ? (window.location.href = "mailto:hello@fleeflo.nl")
                      : navigate("/auth?mode=signup")
                  }
                >
                  {p.naam === "Enterprise" ? "Neem contact op" : "Start gratis"}
                  <ArrowRight className="w-4 h-4" />
                </Button>

                <div className="space-y-2 flex-1">
                  {p.features.map((f) => (
                    <div key={f} className="flex items-start gap-2">
                      <div className="mt-0.5 p-0.5 rounded-full bg-primary/10 shrink-0">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-xs text-foreground">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Trust section */}
      <section className="border-t border-border bg-muted/30 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Probeer 1 maand gratis, zonder verplichtingen
          </h2>
          <p className="text-muted-foreground mb-8">
            Geen creditcard nodig. Volledige toegang tot alle features van je gekozen plan.
            Na 30 dagen kies je of je doorgaat.
          </p>
          <div className="grid sm:grid-cols-3 gap-6 text-left">
            {[
              { title: "Geen creditcard", desc: "Start direct zonder betaalgegevens in te voeren" },
              { title: "Volledige toegang", desc: "Gebruik alle features van je plan tijdens de proefperiode" },
              { title: "Eenvoudig opzeggen", desc: "Niet tevreden? Gewoon stoppen, geen vragen" },
            ].map((item) => (
              <div key={item.title} className="p-5 rounded-xl bg-background border border-border">
                <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" id="faq">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Veelgestelde vragen over abonnementen
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Alles wat je wilt weten over onze plannen, betaling en wat FleeFlo voor jouw bedrijf kan betekenen.
            </p>
          </div>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="faq-0">
              <AccordionTrigger className="text-left text-base font-medium text-foreground">
                Kan ik tussentijds upgraden of downgraden?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                Ja, je kunt op elk moment overstappen naar een ander plan. Bij een upgrade krijg je direct toegang tot de extra functies en wordt het verschil pro rata verrekend. Bij een downgrade gaat de wijziging in aan het einde van je huidige facturatieperiode, zodat je nooit betaalt voor functies die je niet meer gebruikt.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="faq-1">
              <AccordionTrigger className="text-left text-base font-medium text-foreground">
                Hoe werkt de betaling na de gratis proefperiode?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                Na je gratis proefperiode van 30 dagen kies je een plan en voer je je betaalgegevens in. Je kunt kiezen voor maandelijkse of jaarlijkse facturatie. Bij jaarlijkse betaling bespaar je tot 20% ten opzichte van maandelijks. Je ontvangt elke periode automatisch een factuur per e-mail.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="faq-2">
              <AccordionTrigger className="text-left text-base font-medium text-foreground">
                Wat gebeurt er als mijn proefperiode afloopt?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                Je ontvangt ruim van tevoren een herinnering dat je proefperiode bijna eindigt. Na afloop wordt je account tijdelijk gepauzeerd totdat je een betaald plan activeert. Je gegevens blijven bewaard, zodat je precies verder kunt waar je gebleven was zodra je een abonnement afsluit.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="faq-3">
              <AccordionTrigger className="text-left text-base font-medium text-foreground">
                Hoeveel tijd bespaart FleeFlo mijn team dagelijks?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                Verhuurbedrijven die FleeFlo gebruiken besparen gemiddeld één tot twee uur per dag op administratieve taken. Denk aan het automatisch aanmaken van contracten, het digitaal laten ondertekenen door klanten, automatische APK en verzekeringsherinneringen en het in één klik genereren van facturen. Die uren kun je besteden aan het laten groeien van je bedrijf.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="faq-4">
              <AccordionTrigger className="text-left text-base font-medium text-foreground">
                Hoe helpt FleeFlo mij om meer omzet te genereren?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                FleeFlo geeft je realtime inzicht in de bezettingsgraad van je vloot, zodat je snel kunt zien welke voertuigen niet worden benut. Met het klantportaal kunnen klanten 24/7 zelf reserveren, waardoor je geen boekingen mist buiten kantoortijden. Daarnaast helpen de rapportages je om te zien welke voertuigen het meest rendabel zijn, zodat je slimmer kunt investeren in je wagenpark.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="faq-5">
              <AccordionTrigger className="text-left text-base font-medium text-foreground">
                Wat maakt FleeFlo beter dan een spreadsheet?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                Een spreadsheet biedt geen automatische meldingen, geen digitale contracten, geen klantportaal en geen visueel schadebeheer. FleeFlo combineert al deze functies in één overzichtelijk platform dat speciaal is gebouwd voor verhuurbedrijven. Bovendien werkt FleeFlo realtime samen met je team, waardoor iedereen altijd met dezelfde actuele gegevens werkt en fouten door verouderde bestanden tot het verleden behoren.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="faq-6">
              <AccordionTrigger className="text-left text-base font-medium text-foreground">
                Kan ik FleeFlo ook gebruiken voor fietsen of elektrische voertuigen?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                Absoluut. FleeFlo ondersteunt alle typen voertuigen, van personenauto's en busjes tot fietsen en elektrische voertuigen. Je kunt per voertuig de categorie instellen en aparte contracttypes aanmaken zoals fietslease of EV lease. Zo beheer je je gehele vloot vanuit één systeem, ongeacht het type voertuig.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="faq-7">
              <AccordionTrigger className="text-left text-base font-medium text-foreground">
                Is er een opzegtermijn aan het abonnement verbonden?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                Nee, bij maandelijkse betaling kun je op elk moment opzeggen. Je abonnement loopt dan af aan het einde van de lopende maand. Bij jaarlijkse betaling geldt het abonnement voor de volledige jaarperiode, maar ook dan wordt het niet automatisch verlengd tenzij je dat zelf instelt. We geloven dat de kwaliteit van ons product reden genoeg is om te blijven.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

    </div>
  );
}
