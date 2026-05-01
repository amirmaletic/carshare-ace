import { useState } from "react";
import fleefloLogo from "@/assets/fleeflo-logo-blue.png";
import { Menu, Building2, Briefcase } from "lucide-react";
import { AppSidebar } from "./AppSidebar";
import { AiAssistant } from "./AiAssistant";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useTrialStatus } from "@/hooks/useTrialStatus";
import TrialExpiredScreen from "./TrialExpiredScreen";
import { Badge } from "@/components/ui/badge";
import { useModuleModus } from "@/hooks/useModuleModus";
import { cn } from "@/lib/utils";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: trialStatus, isLoading: trialLoading } = useTrialStatus();
  const { data: modus } = useModuleModus();
  const isWagenpark = modus === "wagenpark";
  const ModusIcon = isWagenpark ? Briefcase : Building2;
  const modusLabel = isWagenpark ? "Wagenparkbeheer" : "Autoverhuur";

  if (trialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (trialStatus?.isExpired) {
    return <TrialExpiredScreen />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      {!isMobile && <AppSidebar />}

      {/* Mobile header + sheet */}
      {isMobile && (
        <>
          <div className="fixed top-0 left-0 right-0 z-40 h-14 bg-background border-b border-border flex items-center px-4 gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 -ml-2 rounded-lg hover:bg-accent transition-colors"
            >
              <Menu className="w-5 h-5 text-foreground" />
            </button>
            <img src={fleefloLogo} alt="FleeFlo" className="w-8 h-8 object-contain flex-shrink-0" />
            <span className="font-semibold text-base text-foreground tracking-tight">FleeFlo</span>
            {modus && (
              <span
                title={`Modus: ${modusLabel}`}
                className={cn(
                  "ml-auto flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                  isWagenpark
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                    : "border-primary/30 bg-primary/10 text-primary"
                )}
              >
                <ModusIcon className="w-3 h-3" />
                {modusLabel}
              </span>
            )}
          </div>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetContent side="left" className="p-0 w-[260px]">
              <VisuallyHidden>
                <SheetTitle>Navigatie</SheetTitle>
              </VisuallyHidden>
              <AppSidebar onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
        </>
      )}

      <main className="flex-1 overflow-auto">
        <div className={isMobile ? "p-4 pt-18" : "p-6 lg:p-8 max-w-[1400px] mx-auto"}>
          {children}
        </div>
      </main>
      <AiAssistant />
    </div>
  );
}
