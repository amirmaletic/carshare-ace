import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { blogPosts } from "@/components/marketing/BlogPreviewSection";

const blogContent: Record<string, string[]> = {
  "wagenparkbeheer-tips-verhuurbedrijven": [
    "Een goed georganiseerd wagenpark is de ruggengraat van elk verhuurbedrijf. Zonder overzicht verlies je tijd, geld en klanten. In dit artikel bespreken we zeven bewezen strategieën die je direct kunt toepassen om je wagenparkbeheer te optimaliseren.",
    "1. Centraliseer al je voertuigdata op één plek. Verspreid je informatie niet over losse spreadsheets, notitieblokken en e-mails. Gebruik een centraal systeem waarin je per voertuig de status, kilometerstand, APK datum en verhuurgeschiedenis bijhoudt. Zo heb je altijd realtime inzicht in je vloot.",
    "2. Automatiseer je herinneringen. Verlopende APK keuringen en verzekeringen zijn een risico als je ze handmatig bijhoudt. Met geautomatiseerde meldingen weet je altijd op tijd wanneer actie nodig is, waardoor je voorkomt dat voertuigen onverwacht stilstaan.",
    "3. Werk met duidelijke statussen per voertuig. Maak onderscheid tussen beschikbaar, verhuurd, in onderhoud en niet inzetbaar. Dit voorkomt dubbele boekingen en geeft je team in één oogopslag een compleet overzicht van de beschikbaarheid.",
    "4. Registreer schades direct en visueel. Gebruik een digitaal schadeformulier met foto's en een interactieve voertuigschets. Zo is altijd duidelijk welke schade wanneer is ontstaan en wie verantwoordelijk is.",
    "5. Houd je kostenstructuur bij per voertuig. Door brandstof, onderhoud, verzekering en afschrijving per voertuig te registreren, weet je precies welke auto's rendabel zijn en waar je kosten kunt besparen.",
    "6. Bied je klanten een selfservice portaal. Een klantportaal waar huurders hun reserveringen kunnen inzien, facturen downloaden en hun gegevens bijwerken, bespaart jouw team veel tijd op routinevragen.",
    "7. Analyseer je data regelmatig. Kijk maandelijks naar je bezettingsgraad, omzet per voertuig en openstaande facturen. Datagedreven beslissingen helpen je om je wagenpark winstgevender te maken.",
    "Door deze zeven stappen te volgen, transformeer je je wagenparkbeheer van reactief naar proactief. FleeFlo biedt al deze functionaliteiten in één platform, zodat je direct aan de slag kunt.",
  ],
  "digitale-contracten-voordelen": [
    "In de wereld van voertuigverhuur draait alles om snelheid en betrouwbaarheid. Klanten verwachten een soepel proces, van reservering tot ondertekening. Papieren contracten passen niet meer in dat plaatje. Hier lees je waarom digitale contracten de toekomst zijn.",
    "Snelheid is het eerste grote voordeel. Met een digitaal contractsysteem maak je binnen twee minuten een volledig huur of leasecontract aan. De klant ontvangt het document per e-mail, bekijkt het op het scherm en ondertekent met een paar klikken. Geen printer, geen scanner, geen postzegels.",
    "Daarnaast verminder je fouten. Bij handmatige invoer sluipen er gemakkelijk typefouten in namen, bedragen of datums. Een digitaal systeem haalt klantgegevens automatisch op en vult contractvelden vooraf in, waardoor de kans op fouten drastisch daalt.",
    "Digitale contracten zijn ook beter vindbaar. In plaats van door mappen te bladeren zoek je op klantnaam, kenteken of contractnummer en je vindt het gewenste document binnen seconden. Dat scheelt enorm veel tijd, zeker wanneer je tientallen of honderden contracten beheert.",
    "Bovendien kun je met digitale contracten automatische herinneringen instellen. Wanneer een contract bijna verloopt, ontvangen zowel jij als de klant een notificatie. Zo voorkom je onbedoelde verlengingen of gemiste opzegtermijnen.",
    "Tot slot draagt digitalisering bij aan een professionele uitstraling. Klanten ervaren een modern en gestroomlijnd proces, wat het vertrouwen in je bedrijf vergroot. Met FleeFlo genereer je professionele PDF contracten met je eigen bedrijfslogo en digitale handtekening.",
    "De overstap naar digitale contracten is eenvoudiger dan je denkt. Met de juiste software heb je binnen een dag je volledige contractadministratie gedigitaliseerd en profiteer je direct van de voordelen.",
  ],
  "schaderegistratie-best-practices": [
    "Schade aan voertuigen is onvermijdelijk in de verhuurbranch. Het verschil tussen een professioneel bedrijf en een amateuristisch bedrijf zit in hoe je met schade omgaat. Een goede schaderegistratie beschermt je financieel en voorkomt discussies met klanten.",
    "Begin altijd met een grondige inspectie bij uitgifte en inname. Loop samen met de klant rond het voertuig en noteer eventuele bestaande schades. Doe dit digitaal met foto's en een visuele schets, zodat er geen twijfel bestaat over de staat van het voertuig op het moment van overdracht.",
    "Gebruik een interactief schadeformulier. Met een digitale voertuigschets kun je per schade de exacte locatie aanwijzen en de ernst classificeren. Dit is vele malen nauwkeuriger dan een schriftelijke omschrijving en voorkomt misverstanden achteraf.",
    "Maak altijd foto's van meerdere hoeken. Een enkele foto is vaak niet voldoende om de omvang van een schade goed in te schatten. Leg de schade vast vanuit minimaal drie perspectieven: een overzichtsfoto, een detailfoto en een foto die de locatie op het voertuig toont.",
    "Koppel schades aan specifieke huurperiodes. Wanneer je weet welke klant het voertuig heeft gebruikt op het moment dat de schade is ontstaan, kun je de kosten eerlijk toewijzen. Dit is essentieel voor de verzekeringsafhandeling en voorkomt dat schades onopgemerkt blijven.",
    "Volg de voortgang van herstellingen. Registreer wanneer een schade is gemeld, wanneer het voertuig naar de garage gaat en wanneer het hersteld is opgeleverd. Zo houd je grip op de doorlooptijd en weet je altijd welke voertuigen volledig inzetbaar zijn.",
    "Met een professioneel schadebeheersysteem zoals FleeFlo combineer je al deze stappen in één workflow. Van registratie tot herstel en verzekeringsafhandeling: alles is inzichtelijk, traceerbaar en gekoppeld aan het juiste voertuig en de juiste klant.",
  ],
};

export default function BlogPost() {
  const { slug } = useParams();
  const post = blogPosts.find((p) => p.slug === slug);
  const content = slug ? blogContent[slug] : undefined;

  if (!post || !content) {
    return (
      <div className="py-20 px-4 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-4">Artikel niet gevonden</h1>
        <Button asChild>
          <Link to="/blog">Terug naar blog</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
      <article className="max-w-3xl mx-auto">
        <Button variant="ghost" size="sm" className="gap-2 mb-8" asChild>
          <Link to="/blog">
            <ArrowLeft className="w-4 h-4" />
            Terug naar blog
          </Link>
        </Button>

        <div className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 rounded-full px-2.5 py-1 w-fit mb-4">
          {post.category}
        </div>

        <h1 className="text-2xl sm:text-4xl font-bold text-foreground mb-4 leading-tight">
          {post.title}
        </h1>

        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-10">
          <span>{post.date}</span>
          <span>·</span>
          <span>{post.readTime}</span>
        </div>

        <div className="prose prose-lg max-w-none">
          {content.map((paragraph, i) => (
            <p key={i} className="text-foreground leading-relaxed mb-6">
              {paragraph}
            </p>
          ))}
        </div>
      </article>
    </div>
  );
}
