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
      "FleeFlo is een compleet wagenparkbeheersysteem voor verhuur en leasebedrijven in Nederland. Of je nu auto's, bestelbussen, campers, fietsen of elektrische voertuigen verhuurt, FleeFlo biedt alle tools die je nodig hebt: van RDW kenteken lookup en digitale contracten tot Gantt planning, facturatie, schade inspectie en een AI vloot copilot.",
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
    question: "Werkt FleeFlo met de RDW kenteken database?",
    answer:
      "Ja, voertuigen voeg je toe door simpelweg het kenteken in te voeren. FleeFlo haalt automatisch merk, model, bouwjaar, brandstof, kleur, APK datum en fiscale waarde op via de RDW koppeling. Dit scheelt veel typewerk en voorkomt fouten bij invoer.",
  },
  {
    question: "Wat doet de AI Vloot Copilot precies?",
    answer:
      "De AI Vloot Copilot is een chat assistent met live toegang tot je voertuigen, planning, klanten en contracten. Je kunt in natuurlijke taal vragen welk voertuig vrij is, klantaanvragen automatisch laten koppelen aan beschikbare auto's en zelfs direct Stripe betaallinks laten genereren. Alles binnen de strikte data scheiding van jouw organisatie.",
  },
  {
    question: "Hoe werkt het klantportaal?",
    answer:
      "Het klantportaal geeft je klanten 24/7 toegang tot een eigen omgeving. Daar kunnen zij reserveringen inzien, facturen downloaden, hun profiel beheren en nieuwe boekingen plaatsen. Inloggen kan via e mail of Google. Dit bespaart jou tijd op klantvragen en biedt een professionele selfservice ervaring.",
  },
  {
    question: "Kan ik publiek laten boeken via mijn eigen website?",
    answer:
      "Ja, FleeFlo heeft een publieke boekingspagina die je kunt koppelen onder je eigen domein. Bezoekers selecteren een voertuig en periode, vullen hun gegevens in en de aanvraag komt direct in jouw FleeFlo binnen, klaar om te bevestigen of om er automatisch een betaallink van te maken.",
  },
  {
    question: "Kan ik digitale contracten laten ondertekenen?",
    answer:
      "Absoluut. Met de 4 staps wizard maak je in minder dan twee minuten een professioneel huur of leasecontract aan. Klanten ontvangen het contract digitaal en kunnen het direct ondertekenen, zonder papierwerk. Het ondertekende document wordt automatisch opgeslagen bij het contract en het voertuig.",
  },
  {
    question: "Hoe werkt het schadebeheer in FleeFlo?",
    answer:
      "FleeFlo biedt een interactieve SVG voertuigschets waarop je schades visueel registreert. Per schademelding leg je verplicht de ernst, grootte en foto's vast. Bij geen schade bevestig je dat expliciet via een checkbox. Schade koppelt automatisch aan het juiste voertuig en contract en je volgt de voortgang van herstellingen en verzekeringsafhandeling.",
  },
  {
    question: "Kan ik ook ritten en transport plannen?",
    answer:
      "Ja, FleeFlo heeft een aparte module voor ritregistratie en transport. Je plant ritten met chauffeurs en oplegger capaciteit (1 tot 20 slots), en kosten worden automatisch berekend op basis van afstand via de Google Routes API. Ideaal voor verhuurbedrijven die voertuigen tussen locaties of klanten verplaatsen.",
  },
  {
    question: "Krijg ik meldingen wanneer APK of verzekeringen verlopen?",
    answer:
      "Ja, FleeFlo stuurt automatische herinneringen wanneer APK, verzekering, onderhoudsbeurten of zelfs rijbewijzen van chauffeurs bijna verlopen. Zo voorkom je dat voertuigen onverwacht niet inzetbaar zijn en blijf je voldoen aan wettelijke eisen.",
  },
  {
    question: "Verstuurt FleeFlo e mails vanuit mijn eigen domein?",
    answer:
      "Ja, transactionele e mails zoals bevestigingen, uitnodigingen en herinneringen worden verstuurd vanuit notify.jouwdomein.nl met professionele templates die in jouw huisstijl staan. Dit verhoogt je merkwaarde en de afleverbaarheid van mails.",
  },
  {
    question: "Is mijn data veilig bij FleeFlo?",
    answer:
      "Veiligheid staat bij FleeFlo voorop. Data is versleuteld, gehost in de EU en strikt gescheiden per organisatie via Row Level Security. Wachtwoorden worden gecontroleerd tegen de Have I Been Pwned database, toegang is rolgebaseerd en elke wijziging wordt gelogd in een audit trail. FleeFlo werkt GDPR proof.",
  },
];

export default function FaqSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8" id="faq">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqItems.map((f) => ({
              "@type": "Question",
              name: f.question,
              acceptedAnswer: { "@type": "Answer", text: f.answer },
            })),
          }),
        }}
      />
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
