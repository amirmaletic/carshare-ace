import { useState, useEffect } from "react";
import { Car, CalendarRange, Wrench, Euro, FileText } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { ActionableTasks } from "@/components/dashboard/ActionableTasks";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { UpcomingAgenda } from "@/components/dashboard/UpcomingAgenda";
import { TodayPickups } from "@/components/dashboard/TodayPickups";
import { OverdrachtenOverzicht } from "@/components/dashboard/OverdrachtenOverzicht";
import { ActiviteitenLog } from "@/components/ActiviteitenLog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import OnboardingWizard from "@/components/OnboardingWizard";

export default function Dashboard() {
  const { user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  // Check if onboarding is needed
  const { data: needsOnboarding } = useQuery({
    queryKey: ["onboarding-check", user?.id],
    queryFn: async () => {
      // Already completed onboarding?
      if (localStorage.getItem("fleetflow_onboarding_done") === "true") return false;
      // Has any vehicles? If yes, skip onboarding
      const { count } = await supabase.from("voertuigen").select("id", { count: "exact", head: true });
      if (count && count > 0) {
        localStorage.setItem("fleetflow_onboarding_done", "true");
        return false;
      }
      // Has bedrijfsgegevens saved?
      const saved = localStorage.getItem("fleetflow_bedrijf");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.bedrijfsnaam) {
          localStorage.setItem("fleetflow_onboarding_done", "true");
          return false;
        }
      }
      return true;
    },
    enabled: !!user,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (needsOnboarding !== undefined) setShowOnboarding(needsOnboarding);
  }, [needsOnboarding]);

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [vehRes, conRes, invRes] = await Promise.all([
        supabase.from("voertuigen").select("id, status"),
        supabase.from("contracts").select("id, status, maandprijs").eq("status", "actief"),
        supabase.from("invoices").select("id, status").in("status", ["openstaand", "te_laat", "herinnering_verstuurd"]),
      ]);
      const vehicles = vehRes.data ?? [];
      const contracts = conRes.data ?? [];
      const invoices = invRes.data ?? [];
      return {
        totalVehicles: vehicles.length,
        available: vehicles.filter(v => v.status === "beschikbaar").length,
        activeContracts: contracts.length,
        monthlyRevenue: contracts.reduce((s, c) => s + c.maandprijs, 0),
        openInvoices: invoices.length,
      };
    },
    enabled: !!user && showOnboarding === false,
  });

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
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overzicht van je wagenpark en verhuuractiviteiten</p>
      </div>

      {/* Quick actions */}
      <QuickActions />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={Car} title="Voertuigen" value={stats?.totalVehicles ?? 0} subtitle={`${stats?.available ?? 0} beschikbaar`} />
        <StatCard icon={FileText} title="Actieve contracten" value={stats?.activeContracts ?? 0} subtitle={`€${(stats?.monthlyRevenue ?? 0).toLocaleString("nl-NL")}/mnd`} />
        <StatCard icon={Euro} title="Open facturen" value={stats?.openInvoices ?? 0} subtitle="Actie vereist" />
        <StatCard icon={Wrench} title="Bezettingsgraad" value={stats ? `${Math.round(((stats.totalVehicles - stats.available) / Math.max(stats.totalVehicles, 1)) * 100)}%` : "-"} subtitle="Van de vloot" />
      </div>

      {/* Today's pickups */}
      <TodayPickups />

      {/* Tasks + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActionableTasks />
        <RecentActivity />
      </div>

      {/* Overdrachten overzicht */}
      <OverdrachtenOverzicht />

      {/* Agenda + Activiteitenlog */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingAgenda />
        <ActiviteitenLog />
      </div>
    </div>
  );
}
