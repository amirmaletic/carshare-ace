import {
  ArrowRight,
  Car,
  BarChart3,
  FileText,
  Shield,
  Users,
  Sparkles,
  CheckCircle2,
  Clock,
  MapPin,
  Wrench,
  UserPlus,
  Upload,
  Rocket,
  CalendarRange,
  PenLine,
  Bot,
  Globe,
  Mail,
  Truck,
  CreditCard,
  ShieldCheck,
  Lock,
  Star,
  Receipt,
  ClipboardCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import productDashboard from "@/assets/product-dashboard.png";
import productVoertuigen from "@/assets/product-voertuigen.png";
import productContracten from "@/assets/product-contracten.png";
import productCopilot from "@/assets/screenshot-copilot.png";
import productTerugmelden from "@/assets/screenshot-terugmelden.png";
import FaqSection from "@/components/marketing/FaqSection";
import BlogPreviewSection from "@/components/marketing/BlogPreviewSection";

const features = [
  {
    icon: Car,
    title: "Voertuigbeheer met RDW",
    description:
      "Voeg voertuigen toe via kenteken en FleeFlo vult merk, model, bouwjaar, brandstof, APK en fiscale waarde automatisch in via de RDW koppeling. Inclusief actuele status, locatie en volledige verhuurhistorie per voertuig.",
  },
  {
    icon: FileText,
    title: "Contracten en lease wizard",
    description:
      "Maak verhuur, lease en fietslease contracten in een 4 staps wizard. Inclusief borgbeheer, automatische verloopdata, professionele PDF export en digitale handtekening direct vanuit het contract.",
  },
  {
    icon: CalendarRange,
    title: "Planning Gantt en reserveringen",
    description:
      "Realtime 28 daagse Gantt planning met automatische status verhuurd op basis van actieve contracten. Reserveringen sluiten conflicten met onderhoud, schade en bestaande boekingen automatisch uit.",
  },
  {
    icon: PenLine,
    title: "Digitale overdracht en terugmelding",
    description:
      "Pick up en return met digitale handtekening, kilometerstand validatie, fotobewijs en visuele schade inspectie op een SVG voertuigschets. Schade koppelt direct aan voertuig en contract.",
  },
  {
    icon: Globe,
    title: "Publiek boek en klantportaal",
    description:
      "Een publieke boekingspagina onder eigen domein en een klantportaal waar je klanten 24/7 hun reserveringen, facturen en profiel beheren via e mail of Google login.",
  },
  {
    icon: Bot,
    title: "AI Vloot Copilot",
    description:
      "Een chat copilot met live toegang tot je vlootdata. Beantwoordt vragen, koppelt klantaanvragen aan beschikbare voertuigen en genereert direct Stripe betaallinks voor snelle conversie.",
  },
  {
    icon: Truck,
    title: "Ritregistratie en transport",
    description:
      "Plan transportritten met chauffeurs en oplegger capaciteit. Automatische kostenberekening op basis van afstand via de Google Routes API en realtime registratie van geleverde voertuigen.",
  },
  {
    icon: Receipt,
    title: "Facturatie en kostenbeheer",
    description:
      "Genereer professionele facturen met PDF export, automatische herinneringen en gekoppelde betaallinks. Volg openstaande posten, marges en totale kosten per voertuig of klant.",
  },
  {
    icon: BarChart3,
    title: "Rapportages en inzicht",
    description:
      "Live dashboards met omzet, bezettingsgraad, openstaande facturen en voertuig rentabiliteit. Drill down per locatie, categorie of klant zodat je datagedreven kunt sturen.",
  },
];

const stats = [
  { value: "30 dagen", label: "Gratis proefperiode" },
  { value: "< 2 min", label: "Contract aanmaken" },
  { value: "100%", label: "Digitale overdracht" },
  { value: "24/7", label: "Klantportaal toegang" },
];

const useCases = [
  {
    icon: Clock,
    title: "Bespaar uren per week",
    description:
      "Automatiseer contractverlengingen, factuurherinneringen en statuswijzigingen. Wat eerst halve dagen administratie was, gebeurt nu op de achtergrond terwijl jij verhuurt.",
  },
  {
    icon: MapPin,
    title: "Multi locatie en multi tenant",
    description:
      "Beheer meerdere standplaatsen en filialen onder één account. Strikte data scheiding per organisatie zorgt dat elke vestiging alleen ziet wat relevant is.",
  },
  {
    icon: Wrench,
    title: "Geen verlopen APK meer",
    description:
      "Automatische waarschuwingen voor APK, verzekering, onderhoud en rijbewijzen van chauffeurs. Voertuigen blijven inzetbaar en risico op boetes verdwijnt.",
  },
  {
    icon: Mail,
    title: "E mail vanuit eigen domein",
    description:
      "Bevestigingen, uitnodigingen en herinneringen verstuur je vanuit notify.jouwdomein.nl met professionele templates die in jouw huisstijl zijn opgemaakt.",
  },
  {
    icon: ShieldCheck,
    title: "Veilig en GDPR proof",
    description:
      "Versleutelde opslag, rolgebaseerde autorisatie, gehashte wachtwoorden met HIBP check en audit log voor elke wijziging. Hosted in de EU.",
  },
  {
    icon: CreditCard,
    title: "Direct betalen via Stripe",
    description:
      "Genereer met één klik Stripe betaallinks bij offertes en facturen. Klanten betalen direct, jij krijgt minder openstaande posten.",
  },
];

const stappen = [
  {
    icon: UserPlus,
    title: "1. Maak je account",
    description:
      "Start in minder dan 60 seconden je gratis proefperiode van 30 dagen. Geen creditcard, geen verplichtingen, direct toegang tot alle functies.",
  },
  {
    icon: Upload,
    title: "2. Importeer je vloot",
    description:
      "Voeg voertuigen toe via RDW kenteken of upload een CSV bestand. Klanten, chauffeurs en contracten zijn binnen enkele minuten klaar voor gebruik.",
  },
  {
    icon: Rocket,
    title: "3. Werk professioneler",
    description:
      "Beheer reserveringen, contracten, overdrachten en facturen vanuit één plek. Bespaar elke week uren administratie en verhoog je bezettingsgraad.",
  },
];

const voorWie = [
  "Autoverhuurbedrijven en RAC verhuur",
  "Lease en private lease maatschappijen",
  "Bestelbus en transportverhuur",
  "Camper en caravanverhuur",
  "Fietslease en e bike verhuur",
  "Importeurs en occasionhandel met verhuurtak",
];

const testimonials = [
  {
    quote:
      "We hebben drie systemen vervangen door FleeFlo. De Gantt planning en automatische statusupdates besparen ons elke week uren.",
    author: "Verhuurbedrijf, 35 voertuigen",
  },
  {
    quote:
      "De AI copilot koppelt klantaanvragen direct aan beschikbare auto's met betaallink. Onze conversie ging significant omhoog.",
    author: "Lease specialist, regio Randstad",
  },
  {
    quote:
      "De digitale overdracht met handtekening en schade inspectie heeft ons veel discussie en kosten bespaard bij retour.",
    author: "Autoverhuur, Eindhoven",
  },
];

export default function MarketingHome() {
  return (
    <div>
      {/* JSON LD: SoftwareApplication */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "FleeFlo",
            applicationCategory: "BusinessApplication",
            applicationSubCategory: "FleetManagement",
            operatingSystem: "Web",
            url: "https://fleeflo.nl/",
            inLanguage: "nl-NL",
            description:
              "Compleet wagenparkbeheer voor autoverhuur en leasebedrijven met RDW koppeling, digitale contracten, klantportaal, schade inspectie en AI copilot.",
            featureList: [
              "RDW kenteken lookup",
              "Digitale lease en verhuur contracten",
              "Gantt planning en reserveringen",
              "Digitale overdracht met handtekening",
              "Visuele schade inspectie",
              "Klantportaal en publiek boeken",
              "AI Vloot Copilot",
              "Ritregistratie en transport",
              "Facturatie met Stripe betaallinks",
              "E mail vanuit eigen domein",
            ],
            offers: {
              "@type": "AggregateOffer",
              lowPrice: "49",
              highPrice: "199",
              priceCurrency: "EUR",
              offerCount: "3",
            },
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: "4.9",
              reviewCount: "27",
            },
          }),
        }}
      />
      {/* JSON LD: Organization */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "FleeFlo",
            url: "https://fleeflo.nl/",
            logo: "https://fleeflo.nl/favicon.png",
            sameAs: [],
            areaServed: "NL",
            contactPoint: {
              "@type": "ContactPoint",
              contactType: "customer support",
              availableLanguage: ["Dutch", "English"],
            },
          }),
        }}
      />
      {/* JSON LD: BreadcrumbList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://fleeflo.nl/" },
              { "@type": "ListItem", position: 2, name: "Functies", item: "https://fleeflo.nl/#functies" },
              { "@type": "ListItem", position: 3, name: "Prijzen", item: "https://fleeflo.nl/prijzen" },
            ],
          }),
        }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden pt-10 pb-12 sm:pt-20 sm:pb-24 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              30 dagen gratis · geen creditcard · in 60 seconden live
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight leading-[1.1]">
              Het complete platform voor{" "}
              <span className="text-primary">autoverhuur en lease</span>
            </h1>
            <p className="mt-4 sm:mt-6 text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Van RDW kenteken tot digitale handtekening, van klantportaal tot AI copilot.
              FleeFlo bundelt voertuigbeheer, contracten, planning, facturatie en schade inspectie in één Nederlands platform.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="gap-2 text-base" asChild>
                <Link to="/auth">
                  Start gratis proefperiode
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-base" asChild>
                <Link to="/prijzen">Bekijk prijzen</Link>
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs sm:text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                Geen installatie
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                Direct bruikbaar
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                Nederlandse support
              </span>
              <span className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-primary" />
                EU hosting · GDPR proof
              </span>
            </div>
          </div>

          <div className="max-w-5xl mx-auto">
            <img
              src={productDashboard}
              alt="FleeFlo dashboard met overzicht van voertuigen, actieve contracten, planning en openstaande taken voor wagenparkbeheer"
              className="w-full rounded-xl shadow-2xl shadow-primary/10"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              width={1400}
              height={900}
            />
          </div>
        </div>
      </section>

      {/* Voor wie */}
      <section className="border-y border-border bg-muted/20 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-5">
            Gebouwd voor verhuur en leasebedrijven
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-foreground/80">
            {voorWie.map((v) => (
              <span key={v} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" /> {v}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Hoe het werkt */}
      <section className="border-b border-border bg-background py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">In 3 stappen aan de slag</h2>
            <p className="mt-3 text-muted-foreground">Van inschrijving tot eerste contract in minder dan een uur.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
            {stappen.map((stap) => (
              <div key={stap.title} className="text-center sm:text-left">
                <div className="inline-flex p-3 rounded-xl bg-primary/10 mb-4">
                  <stap.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{stap.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{stap.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat) => (
            <div key={stat.label}>
              <div className="text-3xl font-extrabold text-foreground">{stat.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" id="functies">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Alles voor professioneel wagenparkbeheer
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Geen losse tools meer. FleeFlo combineert RDW lookup, contracten, planning, overdracht,
              schade, facturatie en AI in één Nederlands platform dat speciaal voor verhuur is gebouwd.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="p-6 rounded-2xl border border-border bg-background hover:shadow-lg hover:border-primary/30 transition-all"
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

      {/* AI Copilot highlight */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-5 gap-10 items-center">
          <div className="lg:col-span-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
              <Bot className="w-3.5 h-3.5" /> Nieuw · AI Vloot Copilot
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Een AI assistent die je hele vloot kent
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Vraag in natuurlijke taal welke auto vrij is volgende week, koppel binnenkomende
              klantaanvragen automatisch aan een passend voertuig, of laat de copilot direct een
              Stripe betaallink genereren. De copilot heeft live toegang tot voertuigen, planning,
              klanten en contracten en werkt veilig binnen jouw organisatie.
            </p>
            <ul className="space-y-3">
              {[
                "Live tool calling op voertuigen, planning en klanten",
                "Klantaanvragen koppelen aan beschikbare auto's",
                "Direct Stripe betaallink genereren bij een match",
                "Werkt onder strikte multi tenant data scheiding",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-foreground">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-2">
            <img
              src={productCopilot}
              alt="AI Vloot Copilot in FleeFlo met live data uit voertuigen, contracten en facturen"
              className="w-full rounded-2xl border border-primary/20 shadow-xl"
              loading="lazy"
              decoding="async"
              width={1536}
              height={864}
            />
          </div>
        </div>
      </section>

      {/* Voertuigen screenshot */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/20" id="voertuigen">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Compleet overzicht van je hele vloot
            </h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Voeg een voertuig toe via kenteken en FleeFlo haalt automatisch merk, model, bouwjaar,
              brandstof, kleur, APK datum en fiscale waarde op via de RDW. Filter op categorie,
              brandstof of beschikbaarheid, bekijk realtime planning op de Gantt, en zie per voertuig
              de complete verhuurhistorie inclusief schades en kilometers.
            </p>
            <ul className="space-y-3">
              {[
                "RDW kenteken automatisch opzoeken en invullen",
                "Filteren op categorie, brandstof en beschikbaarheid",
                "28 daagse Gantt planning met live status",
                "Tijdlijn, locatie en historie per voertuig",
                "CSV bulk import voor snelle migratie",
              ].map((item) => (
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
              decoding="async"
              width={1400}
              height={900}
            />
          </div>
        </div>
      </section>

      {/* Contracten */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" id="contracten">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <img
              src={productContracten}
              alt="Contractenbeheer met overzicht van actieve lease en verhuurcontracten en digitale handtekening in FleeFlo"
              className="w-full rounded-xl shadow-xl"
              loading="lazy"
              decoding="async"
              width={1400}
              height={900}
            />
          </div>
          <div className="order-1 lg:order-2">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Contracten en facturatie altijd op orde
            </h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Maak verhuur, lease of fietslease contracten via een 4 staps wizard, met automatische
              borg, looptijd en maandprijs. Klanten ondertekenen digitaal vanuit hun mailbox,
              facturen genereer je als professionele PDF en Stripe betaallinks zorgen dat geld
              sneller binnenkomt.
            </p>
            <ul className="space-y-3">
              {[
                "Lease, verhuur en fietslease contracten",
                "Digitale ondertekening door klanten",
                "Professionele PDF export van contracten en facturen",
                "Automatische herinneringen bij verloopdatum",
                "Stripe betaallinks bij offertes en facturen",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-foreground">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Overdracht en schade */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/20" id="overdracht">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Digitale overdracht zonder discussie achteraf
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Pick up en return met handtekening, kilometerstand validatie, fotobewijs en visuele
              schade inspectie. Alles automatisch gekoppeld aan voertuig en contract.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: PenLine,
                title: "Digitale handtekening",
                desc: "Klant tekent op tablet of telefoon. Het ondertekende overdrachtsformulier wordt direct opgeslagen bij het contract.",
              },
              {
                icon: ClipboardCheck,
                title: "Visuele schade inspectie",
                desc: "Klik schade aan op een SVG voertuigschets met verplichte ernst, grootte en foto. Inclusief expliciete geen schade bevestiging.",
              },
              {
                icon: Truck,
                title: "Terugmelding en transport",
                desc: "Snelle return via kentekenzoek, kilometer validatie en fotouploads. Transportritten worden automatisch berekend op afstand.",
              },
            ].map((b) => (
              <article key={b.title} className="p-6 rounded-2xl border border-border bg-background">
                <div className="p-3 rounded-xl bg-primary/10 w-fit mb-4">
                  <b.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{b.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{b.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Voordelen */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" id="voordelen">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Waarom verhuurbedrijven kiezen voor FleeFlo
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Of je nu vijf of vijftig voertuigen beheert, FleeFlo groeit mee met je bedrijf en
              vervangt losse tools, spreadsheets en papierwerk door één strak platform.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {useCases.map((uc) => (
              <article key={uc.title} className="p-6 rounded-2xl border border-border bg-background">
                <div className="p-3 rounded-xl bg-primary/10 w-fit mb-4">
                  <uc.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{uc.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{uc.description}</p>
              </article>
            ))}
          </div>
          <div className="text-center mt-10">
            <Button variant="outline" asChild>
              <Link to="/prijzen">Bekijk alle functies en prijzen</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Verhuurders die al overstapten
            </h2>
            <p className="mt-3 text-muted-foreground">Een greep uit de reacties van verhuurbedrijven die FleeFlo dagelijks gebruiken.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <figure key={t.author} className="p-6 rounded-2xl border border-border bg-background">
                <div className="flex gap-1 mb-3" aria-label="5 sterren">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <blockquote className="text-sm text-foreground leading-relaxed">
                  {t.quote}
                </blockquote>
                <figcaption className="mt-4 text-xs text-muted-foreground">{t.author}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Blog */}
      <BlogPreviewSection />

      {/* FAQ */}
      <FaqSection />

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Klaar om je wagenpark professioneel te beheren?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Start vandaag nog met een gratis proefperiode van 30 dagen en ontdek hoe FleeFlo je
            verhuurbedrijf helpt om efficiënter te werken. Geen creditcard, direct toegang tot
            alle functies, opzeggen wanneer je wilt.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="gap-2 text-base" asChild>
              <Link to="/auth">
                Gratis proefperiode starten
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