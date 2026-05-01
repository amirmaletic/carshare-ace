import { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTenantPortaal } from "@/hooks/useTenantPortaal";
import { Car, CalendarRange, FileText, User, LogOut, Menu, LogIn } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function TenantPortaalLayout({ children }: { children: React.ReactNode }) {
  const { tenant, isLoading, slug } = useTenantPortaal();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-2xl font-semibold text-foreground">Portaal niet gevonden</h1>
          <p className="text-muted-foreground">
            Dit klantportaal bestaat niet of is nog niet geactiveerd door de eigenaar.
          </p>
          <Button onClick={() => navigate("/")} variant="outline">Naar fleeflo.nl</Button>
        </div>
      </div>
    );
  }

  const base = slug ? `/t/${slug}` : "";
  const navItems = [
    { to: `${base}`, icon: Car, label: "Aanbod", end: true },
    { to: `${base}/reserveringen`, icon: CalendarRange, label: "Mijn reserveringen" },
    { to: `${base}/facturen`, icon: FileText, label: "Mijn facturen" },
    { to: `${base}/profiel`, icon: User, label: "Mijn profiel" },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate(`${base}`);
  };

  const Brand = () => (
    <div className="flex items-center gap-3">
      {tenant.portaal_logo_url ? (
        <img src={tenant.portaal_logo_url} alt={tenant.portaal_naam || tenant.naam} className="w-9 h-9 rounded-lg object-cover" />
      ) : (
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
          <Car className="w-5 h-5 text-primary-foreground" />
        </div>
      )}
      <div className="leading-tight">
        <p className="font-semibold text-sm text-foreground">{tenant.portaal_naam || tenant.naam}</p>
        <p className="text-xs text-muted-foreground">Online reserveren</p>
      </div>
    </div>
  );

  const NavList = ({ onClick }: { onClick?: () => void }) => (
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

  return (
    <div className="flex min-h-screen bg-background">
      {!isMobile && (
        <aside className="w-[260px] border-r border-border flex-shrink-0 flex flex-col">
          <div className="p-4 border-b border-border"><Brand /></div>
          <div className="flex-1 p-3"><NavList /></div>
          <div className="p-3 border-t border-border">
            {user ? (
              <>
                <p className="text-xs text-muted-foreground px-3 mb-2 truncate">{user.email}</p>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors w-full"
                >
                  <LogOut className="w-4 h-4" />
                  Uitloggen
                </button>
              </>
            ) : (
              <Button
                onClick={() => navigate(`${base}/inloggen?redirect=${encodeURIComponent(location.pathname)}`)}
                className="w-full gap-2"
              >
                <LogIn className="w-4 h-4" /> Inloggen
              </Button>
            )}
          </div>
        </aside>
      )}

      {isMobile && (
        <>
          <div className="fixed top-0 left-0 right-0 z-40 h-14 bg-background border-b border-border flex items-center px-4 gap-3">
            <button onClick={() => setMobileOpen(true)} className="p-2 -ml-2 rounded-lg hover:bg-accent transition-colors">
              <Menu className="w-5 h-5 text-foreground" />
            </button>
            <Brand />
          </div>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetContent side="left" className="p-0 w-[280px]">
              <VisuallyHidden><SheetTitle>Navigatie</SheetTitle></VisuallyHidden>
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-border"><Brand /></div>
                <div className="flex-1 p-3"><NavList onClick={() => setMobileOpen(false)} /></div>
              </div>
            </SheetContent>
          </Sheet>
        </>
      )}

      <main className="flex-1 overflow-auto">
        <div className={isMobile ? "p-4 pt-18" : "p-6 lg:p-8 max-w-[1100px] mx-auto"}>
          {children}
        </div>
      </main>
    </div>
  );
}