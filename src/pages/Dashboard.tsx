import { useState, useEffect } from "react";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { ActionableTasks } from "@/components/dashboard/ActionableTasks";
import { UpcomingAgenda } from "@/components/dashboard/UpcomingAgenda";
import { OverdrachtenCenter } from "@/components/dashboard/OverdrachtenCenter";
import { VervaldatumWaarschuwingen } from "@/components/dashboard/VervaldatumWaarschuwingen";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import OnboardingWizard from "@/components/OnboardingWizard";
import { useOrganisatie } from "@/hooks/useOrganisatie";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const { organisatieId, isLoading: organisatieLoading } = useOrganisatie();

  // Check if onboarding is needed — purely database-driven per organisation
  const { data: needsOnboarding } = useQuery({
    queryKey: ["onboarding-check", organisatieId],
    queryFn: async () => {
      const [{ count }, { count: contractCount }, { count: chauffeurCount }, { data: org }] = await Promise.all([
        supabase.from("voertuigen").select("id", { count: "exact", head: true }).eq("organisatie_id", organisatieId!),
        supabase.from("contracts").select("id", { count: "exact", head: true }).eq("organisatie_id", organisatieId!),
        supabase.from("chauffeurs").select("id", { count: "exact", head: true }).eq("organisatie_id", organisatieId!),
        supabase.from("organisaties").select("naam, kvk_nummer, btw_nummer, adres, postcode, plaats, telefoon, email").eq("id", organisatieId!).maybeSingle(),
      ]);
      if (count && count > 0) return false;
      if (contractCount && contractCount > 0) return false;
      if (chauffeurCount && chauffeurCount > 0) return false;
      return !org || ![org.naam, org.kvk_nummer, org.btw_nummer, org.adres, org.postcode, org.plaats, org.telefoon, org.email]
        .some((value) => typeof value === "string" && value.trim().length > 0 && value !== "Mijn Bedrijf");
    },
    enabled: !!user && !organisatieLoading && !!organisatieId,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (authLoading || organisatieLoading) return;
    // Geen organisatie gekoppeld → geen onboarding-check, gewoon overzicht tonen
    if (!organisatieId) {
      setShowOnboarding(false);
      return;
    }
    if (needsOnboarding !== undefined) setShowOnboarding(needsOnboarding);
  }, [authLoading, organisatieLoading, organisatieId, needsOnboarding]);

  if (showOnboarding === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (showOnboarding) {
    return <OnboardingWizard onComplete={() => setShowOnboarding(false)} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Overzicht</h1>
        <p className="text-muted-foreground mt-1">Jouw werk voor vandaag: overdrachten, taken en agenda</p>
      </div>

      {/* Quick actions */}
      <QuickActions />

      {/* Overdrachten (vandaag, morgen, recent) */}
      <OverdrachtenCenter />

      {/* Taken + Agenda */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActionableTasks />
        <UpcomingAgenda />
      </div>

      {/* Vervaldatum-waarschuwingen */}
      <VervaldatumWaarschuwingen />
    </div>
  );
}
