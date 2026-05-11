import Seo from "@/components/Seo";
import { MigratieSection, CtaSection } from "@/components/marketing/sections";
import IntegrationsSection from "@/components/marketing/IntegrationsSection";
import DevicesSection from "@/components/marketing/DevicesSection";

export default function MigratieIntegraties() {
  return (
    <div>
      <Seo
        title="Migratie en integraties | FleeFlo overstap en koppelingen"
        description="Wij zetten je voertuigen, klanten en contracten kosteloos over naar FleeFlo. Inclusief koppelingen met Moneybird, Mollie, Stripe en gebruik op tablet en mobiel."
        path="/migratie-integraties"
      />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 text-center">
        <h1 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight">Migratie en integraties</h1>
        <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
          Wij regelen de overstap en koppelen FleeFlo aan je bestaande tools.
        </p>
      </div>
      <MigratieSection />
      <IntegrationsSection />
      <DevicesSection />
      <CtaSection />
    </div>
  );
}