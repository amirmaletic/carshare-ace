import Seo from "@/components/Seo";
import {
  HeroSection,
  VoorWieSection,
  TweeModiSection,
  StappenSection,
  StatsSection,
  CtaSection,
} from "@/components/marketing/sections";

export default function MarketingHome() {
  return (
    <div>
      <Seo
        title="FleeFlo | Wagenparkbeheer software voor verhuur en lease"
        description="Compleet wagenparkbeheer voor autoverhuur en leasebedrijven. RDW kenteken lookup, digitale contracten, klantportaal, schade inspectie, AI copilot. 30 dagen gratis."
        path="/"
      />
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
              "Compleet platform voor autoverhuur én eigen wagenparkbeheer met RDW koppeling, digitale contracten, planning, onderhoud, kostenbeheer, klantportaal en AI copilot.",
            offers: {
              "@type": "AggregateOffer",
              lowPrice: "2.25",
              highPrice: "4.50",
              priceCurrency: "EUR",
              offerCount: "4",
            },
            aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", reviewCount: "27" },
          }),
        }}
      />
      <HeroSection />
      <VoorWieSection />
      <TweeModiSection />
      <StappenSection />
      <StatsSection />
      <CtaSection />
    </div>
  );
}