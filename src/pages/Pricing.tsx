import { useState } from "react";
import { Check, Zap, Shield, Crown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const plans = [
  {
    name: "Starter",
    description: "Perfect voor kleine verhuurbedrijven die net beginnen",
    monthlyPrice: 49,
    yearlyPrice: 470,
    icon: Zap,
    popular: false,
    features: [
      "Tot 10 voertuigen",
      "Contractbeheer",
      "Kilometerregistratie",
      "Terugmeldingen",
      "Basis rapportages",
      "E-mail support",
    ],
    notIncluded: [
      "Klantportaal",
      "AI-assistent",
      "Chauffeursbeheer",
      "API-toegang",
    ],
  },
  {
    name: "Professional",
    description: "De ideale keuze voor groeiende verhuurbedrijven",
    monthlyPrice: 99,
    yearlyPrice: 950,
    icon: Shield,
    popular: true,
    features: [
      "Tot 50 voertuigen",
      "Alles uit Starter",
      "Klantportaal",
      "AI-assistent",
      "Chauffeursbeheer",
      "Ritplanning",
      "Schadebeheer met visuele schets",
      "PDF-export facturen",
      "Prioriteit support",
    ],
    notIncluded: [
      "API-toegang",
    ],
  },
  {
    name: "Enterprise",
    description: "Voor grote vloten met geavanceerde behoeften",
    monthlyPrice: 199,
    yearlyPrice: 1910,
    icon: Crown,
    popular: false,
    features: [
      "Onbeperkt voertuigen",
      "Alles uit Professional",
      "API-toegang",
      "Aangepaste integraties",
      "Dedicated accountmanager",
      "SSO & multi-locatie",
      "Geavanceerde analytics",
      "SLA & uptime-garantie",
    ],
    notIncluded: [],
  },
];

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(false);
  const navigate = useNavigate();

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
            Beheer je wagenpark{" "}
            <span className="text-primary">moeiteloos</span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
            Van contracten tot schadebeheer, van ritplanning tot facturatie.
            Alles wat je nodig hebt om je verhuurbedrijf professioneel te runnen.
          </p>
        </div>
      </section>

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-4 mb-12">
        <span className={cn("text-sm font-medium transition-colors", !isYearly ? "text-foreground" : "text-muted-foreground")}>
          Maandelijks
        </span>
        <button
          onClick={() => setIsYearly(!isYearly)}
          className={cn(
            "relative w-14 h-7 rounded-full transition-colors",
            isYearly ? "bg-primary" : "bg-muted-foreground/30"
          )}
        >
          <div className={cn(
            "absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform",
            isYearly ? "translate-x-7" : "translate-x-0.5"
          )} />
        </button>
        <span className={cn("text-sm font-medium transition-colors", isYearly ? "text-foreground" : "text-muted-foreground")}>
          Jaarlijks
        </span>
        {isYearly && (
          <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full animate-fade-in">
            Bespaar tot 20%
          </span>
        )}
      </div>

      {/* Pricing cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
            const perMonth = isYearly ? Math.round(plan.yearlyPrice / 12) : plan.monthlyPrice;

            return (
              <div
                key={plan.name}
                className={cn(
                  "relative rounded-2xl border p-8 flex flex-col transition-shadow",
                  plan.popular
                    ? "border-primary shadow-xl shadow-primary/10 scale-[1.02]"
                    : "border-border hover:shadow-lg"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                    Meest gekozen
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className={cn(
                    "p-2.5 rounded-xl",
                    plan.popular ? "bg-primary/10" : "bg-muted"
                  )}>
                    <plan.icon className={cn("w-5 h-5", plan.popular ? "text-primary" : "text-muted-foreground")} />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-lg">{plan.name}</h3>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-foreground">€{perMonth}</span>
                    <span className="text-muted-foreground text-sm">/maand</span>
                  </div>
                  {isYearly && (
                    <p className="text-xs text-muted-foreground mt-1">
                      €{price} per jaar gefactureerd
                    </p>
                  )}
                </div>

                <Button
                  className={cn("w-full gap-2 mb-8", plan.popular ? "" : "variant-outline")}
                  variant={plan.popular ? "default" : "outline"}
                  size="lg"
                  onClick={() => navigate("/auth?mode=signup")}
                >
                  Start gratis proefperiode
                  <ArrowRight className="w-4 h-4" />
                </Button>

                <div className="space-y-3 flex-1">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <div className="mt-0.5 p-0.5 rounded-full bg-primary/10">
                        <Check className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <span className="text-sm text-foreground">{feature}</span>
                    </div>
                  ))}
                  {plan.notIncluded.map((feature) => (
                    <div key={feature} className="flex items-start gap-3 opacity-40">
                      <div className="mt-0.5 p-0.5 rounded-full bg-muted">
                        <Check className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <span className="text-sm text-muted-foreground">{feature}</span>
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
