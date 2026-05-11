import Seo from "@/components/Seo";
import {
  VoordelenSection,
  TestimonialsSection,
  CtaSection,
} from "@/components/marketing/sections";
import FaqSection from "@/components/marketing/FaqSection";
import BlogPreviewSection from "@/components/marketing/BlogPreviewSection";

export default function WaaromFleeflo() {
  return (
    <div>
      <Seo
        title="Waarom FleeFlo | Voordelen, ervaringen en veelgestelde vragen"
        description="Waarom verhuurbedrijven en wagenparken kiezen voor FleeFlo: tijdwinst, GDPR proof, multi locatie, automatische APK waarschuwingen, ervaringen en antwoorden op je vragen."
        path="/waarom-fleeflo"
      />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 text-center">
        <h1 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight">Waarom FleeFlo</h1>
        <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
          Voordelen, ervaringen van klanten en antwoorden op de meestgestelde vragen.
        </p>
      </div>
      <VoordelenSection />
      <TestimonialsSection />
      <BlogPreviewSection />
      <FaqSection />
      <CtaSection />
    </div>
  );
}