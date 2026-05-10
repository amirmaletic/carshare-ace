import { useState } from "react";
import { Check, Zap, ArrowRight, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const PRIJS_PER_VOERTUIG = 4;

const features = [
  "Onbeperkt gebruikers",
  "Contractbeheer met digitale ondertekening",
  "Klantportaal en publiek reserveren",
  "Visueel schadebeheer",
  "AI Vloot Copilot",
  "Ritregistratie en transport",
  "Facturatie met Stripe en Mollie",
  "Boekhoudkoppelingen (Moneybird, Exact, Yuki)",
  "E mail vanuit eigen domein",
  "API toegang en webhooks",
  "Onbeperkt locaties en vestigingen",
  "Prioriteit support",
];

export default function Pricing() {
  const [aantal, setAantal] = useState(10);
  const navigate = useNavigate();
  const maandTotaal = aantal * PRIJS_PER_VOERTUIG;

  return (
    <div>
      {/* Hero */}
      <section className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            1 maand gratis proberen, geen creditcard nodig
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight">
            Eén eerlijk tarief,{" "}
            <span className="text-primary">€4 per voertuig per maand</span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
            Geen pakketten, geen verrassingen. Je betaalt alleen voor de voertuigen
            die je actief beheert. Alle functies zijn inbegrepen, ongeacht de grootte
            van je vloot.
          </p>
        </div>
      </section>

      {/* Pricing card met calculator */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="relative rounded-2xl border border-primary p-8 sm:p-10 shadow-xl shadow-primary/10 bg-card">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full">
            Alles inbegrepen
          </div>

          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Car className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-bold text-foreground text-xl">FleeFlo Compleet</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-8">
            Pay as you grow. Voeg voertuigen toe of verwijder ze, je rekening past
            zich automatisch aan.
          </p>

          <div className="rounded-xl bg-muted/40 border border-border p-6 mb-8">
            <div className="flex items-baseline justify-between mb-4">
              <label className="text-sm font-medium text-foreground">
                Aantal voertuigen
              </label>
              <span className="text-lg font-bold text-foreground tabular-nums">
                {aantal}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={250}
              value={aantal}
              onChange={(e) => setAantal(Number(e.target.value))}
              className="w-full accent-primary"
              aria-label="Aantal voertuigen"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>1</span>
              <span>250+</span>
            </div>

            <div className="mt-6 pt-6 border-t border-border flex items-baseline gap-2">
              <span className="text-5xl font-extrabold text-foreground tabular-nums">
                €{maandTotaal}
              </span>
              <span className="text-muted-foreground">/maand</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {aantal} × €{PRIJS_PER_VOERTUIG} per voertuig per maand · excl. btw
            </p>
          </div>

          <Button
            className="w-full gap-2 mb-8"
            size="lg"
            onClick={() => navigate("/auth?mode=signup")}
          >
            Start gratis proefperiode
            <ArrowRight className="w-4 h-4" />
          </Button>

          <div className="grid sm:grid-cols-2 gap-3">
            {features.map((feature) => (
              <div key={feature} className="flex items-start gap-3">
                <div className="mt-0.5 p-0.5 rounded-full bg-primary/10 shrink-0">
                  <Check className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-sm text-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Meer dan 250 voertuigen?{" "}
          <a href="mailto:hello@fleeflo.nl" className="text-primary font-medium hover:underline">
            Neem contact op voor een vlootabonnement
          </a>
        </p>
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
