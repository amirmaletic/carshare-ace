import Seo from "@/components/Seo";
import {
  ContractenSection,
  OverdrachtSection,
  CtaSection,
} from "@/components/marketing/sections";

export default function ContractenFacturatie() {
  return (
    <div>
      <Seo
        title="Contracten en facturatie | FleeFlo digitale ondertekening"
        description="Lease en verhuur contracten in een 4 staps wizard met digitale handtekening, PDF export, Stripe betaallinks, automatische herinneringen en visuele schade inspectie."
        path="/contracten-facturatie"
      />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 text-center">
        <h1 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight">Contracten, overdracht en facturatie</h1>
        <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
          Digitale ondertekening, schade inspectie en facturatie met Stripe betaallinks.
        </p>
      </div>
      <ContractenSection />
      <OverdrachtSection />
      <CtaSection />
    </div>
  );
}