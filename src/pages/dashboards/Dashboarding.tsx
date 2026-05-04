import { useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Activity, PiggyBank, Gauge, UsersRound, BarChart3, Calculator } from "lucide-react";
import DashboardOperationeel from "./DashboardOperationeel";
import DashboardFinancieel from "./DashboardFinancieel";
import DashboardVloot from "./DashboardVloot";
import DashboardKlanten from "./DashboardKlanten";
import DashboardRapportages from "./DashboardRapportages";
import DashboardKosten from "./DashboardKosten";

const TABS = [
  { value: "operationeel", label: "Operationeel", icon: Activity },
  { value: "financieel", label: "Financieel", icon: PiggyBank },
  { value: "vloot", label: "Vlootprestatie", icon: Gauge },
  { value: "klanten", label: "Klant en verhuur", icon: UsersRound },
  { value: "rapportages", label: "Rapportages", icon: BarChart3 },
  { value: "kosten", label: "Kosten en TCO", icon: Calculator },
] as const;

type TabValue = typeof TABS[number]["value"];

export default function Dashboarding() {
  const navigate = useNavigate();
  const location = useLocation();

  const current: TabValue = useMemo(() => {
    const seg = location.pathname.split("/")[2];
    const match = TABS.find((t) => t.value === seg);
    return (match?.value ?? "operationeel") as TabValue;
  }, [location.pathname]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboarding</h1>
        <p className="text-muted-foreground mt-1">Alle dashboards op één plek</p>
      </div>

      <Tabs
        value={current}
        onValueChange={(v) => navigate(`/dashboarding/${v}`)}
      >
        <TabsList className="h-auto flex-wrap justify-start gap-1 bg-muted/50 p-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <TabsTrigger key={t.value} value={t.value} className="gap-2">
                <Icon className="w-4 h-4" />
                {t.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="operationeel" className="mt-6">
          <DashboardOperationeel />
        </TabsContent>
        <TabsContent value="financieel" className="mt-6">
          <DashboardFinancieel />
        </TabsContent>
        <TabsContent value="vloot" className="mt-6">
          <DashboardVloot />
        </TabsContent>
        <TabsContent value="klanten" className="mt-6">
          <DashboardKlanten />
        </TabsContent>
        <TabsContent value="rapportages" className="mt-6">
          <DashboardRapportages />
        </TabsContent>
        <TabsContent value="kosten" className="mt-6">
          <DashboardKosten />
        </TabsContent>
      </Tabs>
    </div>
  );
}