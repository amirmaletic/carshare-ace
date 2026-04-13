import { ArrowRight, Car, BarChart3, FileText, Shield, Users, Zap, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import productDashboard from "@/assets/product-dashboard.png";
import productVoertuigen from "@/assets/product-voertuigen.png";
import productContracten from "@/assets/product-contracten.png";

const features = [
  {
    icon: Car,
    title: "Voertuigbeheer",
    description:
      "Houd je volledige wagenpark overzichtelijk bij met actuele statussen, locaties, APK-verloopdatums en directe beschikbaarheidsinformatie, zodat je altijd weet welk voertuig waar staat en wanneer het ingezet kan worden.",
  },
  {
    icon: FileText,
    title: "Contracten & Lease",
    description:
      "Maak professionele huur- en leasecontracten aan met automatische verloopdata, borgbeheer en maandprijzen, inclusief digitale ondertekening waardoor je binnen twee minuten een compleet contract klaarzet.",
  },
  {
    icon: BarChart3,
    title: "Rapportages & Inzicht",
    description:
      "Krijg realtime dashboards met gedetailleerde overzichten van je omzet, bezettingsgraad, openstaande facturen en totale kostenstructuur, zodat je datagedreven beslissingen kunt nemen voor je verhuurbedrijf.",
  },
  {
    icon: Users,
    title: "Klant- & Chauffeursbeheer",
    description:
      "Beheer alle klantgegevens, rijbewijsinformatie en chauffeursbeschikbaarheid op één centrale plek en koppel chauffeurs direct aan geplande ritten en voertuigen binnen je organisatie.",
  },
  {
    icon: Shield,
    title: "Schadebeheer",
    description:
      "Registreer schades visueel met een interactieve voertuigschets, volg de voortgang van herstellingen en beheer de verzekeringsafhandeling, zodat je altijd grip hebt op de staat van elk voertuig in je vloot.",
  },
  {
    icon: Zap,
    title: "AI-assistent",
    description:
      "Ontvang slimme aanbevelingen voor voertuigkoppeling, automatische kostenberekening en geavanceerde optimalisatie van je wagenpark, aangedreven door kunstmatige intelligentie die meeleert met je bedrijfsprocessen.",
  },
];

const stats = [
  { value: "50+", label: "Voertuigen beheren" },
  { value: "< 2 min", label: "Contract aanmaken" },
  { value: "100%", label: "Digitale overdracht" },
  { value: "24/7", label: "Klantportaal toegang" },
];

export default function MarketingHome() {
  return (
    <div>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "FleeFlo",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            description:
              "Professioneel wagenparkbeheer voor verhuurbedrijven. Beheer voertuigen, contracten, chauffeurs en klanten vanuit één platform.",
            offers: {
              "@type": "AggregateOffer",
              lowPrice: "49",
              highPrice: "199",
              priceCurrency: "EUR",
              offerCount: "3",
            },
          }),
        }}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-28 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              1 maand gratis uitproberen, geen creditcard nodig
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight leading-tight">
              Professioneel wagenparkbeheer{" "}
              <span className="text-primary">voor verhuurbedrijven</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Van contracten en schadebeheer tot ritplanning en facturatie — FleeFlo biedt je alles
              wat je nodig hebt om je wagenpark slim te beheren en je verhuurbedrijf professioneel
              te laten groeien, allemaal vanuit één centraal platform.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="gap-2 text-base" asChild>
                <Link to="/prijzen">
                  Bekijk prijzen
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-base" asChild>
                <Link to="/auth?mode=signup">Gratis starten</Link>
              </Button>
            </div>
          </div>

          {/* Hero Screenshot */}
          <div className="max-w-5xl mx-auto">
            <img
              src={productDashboard}
              alt="FleeFlo dashboard met overzicht van voertuigen, contracten en openstaande taken voor wagenparkbeheer"
              className="w-full rounded-xl shadow-2xl shadow-primary/10"
              loading="eager"
              width={1400}
              height={900}
            />
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-border bg-muted/30 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat) => (
            <div key={stat.label}>
              <div className="text-3xl font-extrabold text-foreground">{stat.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" id="features">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Alles voor professioneel wagenparkbeheer
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Met FleeFlo beheer je al je voertuigen, contracten, chauffeurs en klanten op één
              centrale plek, speciaal ontworpen voor verhuurbedrijven die efficiënt en overzichtelijk
              willen werken.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="p-6 rounded-2xl border border-border bg-background hover:shadow-lg transition-shadow"
              >
                <div className="p-3 rounded-xl bg-primary/10 w-fit mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Screenshot: Voertuigen */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/20">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Compleet overzicht van je hele vloot
            </h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Als verhuurbedrijf wil je direct zien welke voertuigen beschikbaar zijn en waar ze zich
              bevinden. Met FleeFlo filter je op categorie, brandstoftype of beschikbaarheid en bekijk
              je elk voertuig in detail, inclusief kilometerstand, APK-status en volledige
              verhuurgeschiedenis. Importeer nieuwe voertuigen eenvoudig via RDW-kenteken.
            </p>
            <ul className="space-y-3">
              {["RDW-kenteken automatisch opzoeken", "Filteren op categorie en beschikbaarheid", "Dagprijzen en statusbeheer per voertuig", "Tijdlijn- en locatieweergave van je wagenpark"].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-foreground">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <img
              src={productVoertuigen}
              alt="Voertuigenbeheer scherm met filters, categorieën en voertuigkaarten in het FleeFlo wagenparkbeheer platform"
              className="w-full rounded-xl shadow-xl"
              loading="lazy"
              width={1400}
              height={900}
            />
          </div>
        </div>
      </section>

      {/* Screenshot: Contracten */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <img
              src={productContracten}
              alt="Contractenbeheer met overzicht van actieve lease- en verhuurcontracten in FleeFlo"
              className="w-full rounded-xl shadow-xl"
              loading="lazy"
              width={1400}
              height={900}
            />
          </div>
          <div className="order-1 lg:order-2">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Contracten en facturatie altijd op orde
            </h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Beheer al je lease-, verhuur- en fietsleasecontracten vanuit één overzicht. Volg
              maandelijkse omzet, verloopdata en openstaande facturen in realtime. Genereer
              professionele PDF-contracten met digitale handtekening, zodat je klanten snel en
              papierloos kunnen tekenen — ideaal voor moderne verhuurbedrijven die tijd willen besparen.
            </p>
            <ul className="space-y-3">
              {["Lease, verhuur en fietslease contracten", "Digitale ondertekening door klanten", "Professionele PDF-export van facturen", "Automatische herinneringen bij verloopdatum"].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-foreground">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Klaar om je wagenpark professioneel te beheren?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Start vandaag nog met een gratis proefperiode van 30 dagen en ontdek hoe FleeFlo
            je verhuurbedrijf helpt om efficiënter te werken. Geen creditcard nodig, en je krijgt
            direct volledige toegang tot alle functies van het platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="gap-2 text-base" asChild>
              <Link to="/auth?mode=signup">
                Gratis starten
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-base" asChild>
              <Link to="/prijzen">Bekijk alle plannen</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
