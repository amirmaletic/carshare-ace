import Seo from "@/components/Seo";
import {
  FeaturesSection,
  CopilotHighlightSection,
  DashboardingSection,
  CtaSection,
} from "@/components/marketing/sections";

export default function Functies() {
  return (
    <div>
      <Seo
        title="Functies | FleeFlo wagenparkbeheer en autoverhuur software"
        description="Alle functies van FleeFlo: RDW kenteken lookup, contracten, planning, overdracht, schade inspectie, facturatie, AI copilot en dashboarding voor verhuur en wagenpark."
        path="/functies"
      />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 text-center">
        <h1 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight">Alle functies van FleeFlo</h1>
        <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
          Eén platform voor RDW lookup, contracten, planning, overdracht, schade, facturatie, kosten en AI.
        </p>
      </div>
      <FeaturesSection />
      <CopilotHighlightSection />
      <DashboardingSection />
      <CtaSection />
    </div>
  );
}