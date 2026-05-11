import Seo from "@/components/Seo";
import {
  VoertuigenSection,
  VlootgalerijSection,
  CtaSection,
} from "@/components/marketing/sections";

export default function Vlootbeheer() {
  return (
    <div>
      <Seo
        title="Voertuigbeheer | FleeFlo vloot en RDW kenteken lookup"
        description="Beheer je hele vloot in FleeFlo: RDW kenteken lookup, Gantt planning, voertuighistorie, schades, kilometers en automatische voertuigfoto's per merk en model."
        path="/vlootbeheer"
      />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 text-center">
        <h1 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight">Voertuig en vlootbeheer</h1>
        <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
          Van kentekeninvoer en RDW lookup tot Gantt planning en automatische voertuigfoto's.
        </p>
      </div>
      <VoertuigenSection />
      <VlootgalerijSection />
      <CtaSection />
    </div>
  );
}