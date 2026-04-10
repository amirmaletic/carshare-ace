import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Car, CalendarRange, FileText, User, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/portaal", icon: CalendarRange, label: "Mijn reserveringen", end: true },
  { to: "/portaal/reserveren", icon: Car, label: "Voertuig reserveren" },
  { to: "/portaal/facturen", icon: FileText, label: "Mijn facturen" },
  { to: "/portaal/profiel", icon: User, label: "Mijn profiel" },
];

function NavItems({ onClick }: { onClick?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onClick}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )
          }
        >
          <item.icon className="w-4 h-4" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

export function KlantLayout({ children }: { children: React.ReactNode }) {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/klant-login");
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Car className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">De Waal Autoverhuur</p>
            <p className="text-xs text-muted-foreground">Klantportaal</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-3">
        <NavItems onClick={isMobile ? () => setMobileOpen(false) : undefined} />
      </div>

      <div className="p-3 border-t border-border">
        <p className="text-xs text-muted-foreground px-3 mb-2 truncate">{user?.email}</p>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          Uitloggen
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      {!isMobile && (
        <aside className="w-[240px] border-r border-border flex-shrink-0">
          {sidebarContent}
        </aside>
      )}

      {/* Mobile header */}
      {isMobile && (
        <>
          <div className="fixed top-0 left-0 right-0 z-40 h-14 bg-background border-b border-border flex items-center px-4 gap-3">
            <button onClick={() => setMobileOpen(true)} className="p-2 -ml-2 rounded-lg hover:bg-accent transition-colors">
              <Menu className="w-5 h-5 text-foreground" />
            </button>
            <Car className="w-5 h-5 text-primary" />
            <span className="font-semibold text-sm text-foreground">De Waal Autoverhuur</span>
          </div>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetContent side="left" className="p-0 w-[260px]">
              <VisuallyHidden><SheetTitle>Navigatie</SheetTitle></VisuallyHidden>
              {sidebarContent}
            </SheetContent>
          </Sheet>
        </>
      )}

      <main className="flex-1 overflow-auto">
        <div className={isMobile ? "p-4 pt-18" : "p-6 lg:p-8 max-w-[1000px] mx-auto"}>
          {children}
        </div>
      </main>
    </div>
  );
}
