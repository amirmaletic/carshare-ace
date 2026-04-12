import { useState } from "react";
import fleefloLogo from "@/assets/fleeflo-logo-blue.png";
import { Menu } from "lucide-react";
import { AppSidebar } from "./AppSidebar";
import { AiAssistant } from "./AiAssistant";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useTrialStatus } from "@/hooks/useTrialStatus";
import TrialExpiredScreen from "./TrialExpiredScreen";
import { Badge } from "@/components/ui/badge";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: trialStatus, isLoading: trialLoading } = useTrialStatus();

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
