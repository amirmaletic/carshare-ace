import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqItems = [
  {
    question: "Wat is FleeFlo en voor wie is het bedoeld?",
    answer:
      "FleeFlo is een compleet wagenparkbeheersysteem dat speciaal is ontworpen voor verhuurbedrijven in Nederland. Of je nu auto's, busjes, fietsen of elektrische voertuigen verhuurt, FleeFlo biedt alle tools die je nodig hebt om je vloot professioneel te beheren, van contractbeheer tot facturatie en schaderapportage.",
  },
  {
    question: "Kan ik FleeFlo gratis uitproberen?",
    answer:
      "Ja, je kunt FleeFlo 30 dagen volledig gratis uitproberen zonder creditcard. Tijdens de proefperiode heb je toegang tot alle functies van het platform, zodat je kunt ervaren hoe FleeFlo je dagelijkse werkzaamheden vereenvoudigt. Na de proefperiode kies je een plan dat past bij de omvang van je wagenpark.",
  },
  {
    question: "Hoeveel voertuigen kan ik beheren met FleeFlo?",
    answer:
      "Dat hangt af van het gekozen abonnement. Met het Starter plan beheer je tot 10 voertuigen, het Professional plan ondersteunt maximaal 50 voertuigen en met het Enterprise plan is er geen limiet. Elk plan groeit mee met je bedrijf, zodat je altijd de juiste capaciteit hebt.",
  },
  {
    question: "Hoe werkt het klantportaal?",
    answer:
      "Het klantportaal geeft je klanten 24/7 toegang tot hun eigen omgeving. Daar kunnen zij hun reserveringen inzien, facturen downloaden en hun profiel beheren. Dit bespaart jou tijd op klantvragen en biedt je klanten een professionele selfservice ervaring.",
  },
  {
    question: "Kan ik digitale contracten laten ondertekenen?",
    answer:
      "Absoluut. Met FleeFlo maak je in minder dan twee minuten een professioneel huur of leasecontract aan. Klanten ontvangen het contract digitaal en kunnen het direct ondertekenen, zonder papierwerk. Het ondertekende document wordt automatisch opgeslagen in het systeem.",
  },
  {
    question: "Hoe werkt het schadebeheer in FleeFlo?",
    answer:
      "FleeFlo biedt een interactieve voertuigschets waarop je schades visueel kunt registreren. Per schademelding leg je de ernst, locatie en foto's vast. Vervolgens volg je de voortgang van herstellingen en de verzekeringsafhandeling, zodat je altijd een compleet overzicht hebt van de staat van je vloot.",
  },
  {
    question: "Krijg ik meldingen wanneer APK of verzekeringen verlopen?",
    answer:
      "Ja, FleeFlo stuurt automatische herinneringen wanneer de APK keuring of de verzekering van een voertuig bijna verloopt. Zo voorkom je dat voertuigen onverwacht niet inzetbaar zijn en houd je je wagenpark altijd op orde.",
  },
  {
    question: "Is mijn data veilig bij FleeFlo?",
    answer:
      "Veiligheid staat bij FleeFlo voorop. Alle gegevens worden versleuteld opgeslagen en de toegang tot het systeem is beveiligd met moderne authenticatie. Daarnaast werkt FleeFlo met rolgebaseerde autorisatie, zodat medewerkers alleen toegang hebben tot de modules die bij hun functie passen.",
  },
];

export default function FaqSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8" id="faq">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Veelgestelde vragen
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Alles wat je wilt weten over wagenparkbeheer met FleeFlo.
          </p>
        </div>
        <Accordion type="single" collapsible className="w-full">
          {faqItems.map((item, index) => (
            <AccordionItem key={index} value={`faq-${index}`}>
              <AccordionTrigger className="text-left text-base font-medium text-foreground">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
