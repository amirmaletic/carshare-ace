import { Link, useLocation } from "react-router-dom";
import fleefloLogo from "@/assets/fleeflo-logo-blue.png";
import {
  LayoutDashboard,
  Car,
  CalendarRange,
  FileText,
  Wrench,
  BarChart3,
  Euro,
  Settings,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Users,
  Route,
  UserPlus,
  IdCard,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useGoedkeuringen } from "@/hooks/useGoedkeuringen";
import { useModuleModus, WAGENPARK_HIDDEN_PATHS } from "@/hooks/useModuleModus";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Car, label: "Voertuigen", path: "/voertuigen" },
  { icon: Users, label: "Chauffeurs", path: "/chauffeurs" },
  { icon: Route, label: "Ritten", path: "/ritten" },
  { icon: RotateCcw, label: "Terugmelden", path: "/terugmelden" },
  { icon: FileText, label: "Contracten", path: "/contracten" },
  { icon: UserPlus, label: "Klanten", path: "/klanten" },
  { icon: IdCard, label: "Rijbewijzen", path: "/rijbewijzen" },
  { icon: CalendarRange, label: "Reserveringen", path: "/reserveringen" },
  { icon: Wrench, label: "Onderhoud", path: "/onderhoud" },
  { icon: BarChart3, label: "Rapportages", path: "/rapportages" },
  { icon: Euro, label: "Kosten", path: "/kosten" },
  { icon: Settings, label: "Instellingen", path: "/instellingen" },
];

interface AppSidebarProps {
  onNavigate?: () => void;
}

export function AppSidebar({ onNavigate }: AppSidebarProps) {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
  const { inBehandeling } = useGoedkeuringen();
  const openCount = inBehandeling.length;
  const { data: modus } = useModuleModus();

  const visibleNavItems = navItems.filter((item) =>
    modus === "wagenpark" ? !WAGENPARK_HIDDEN_PATHS.has(item.path) : true
  );

  // On mobile inside Sheet, always show expanded
  const isCollapsed = isMobile ? false : collapsed;

  return (
    <aside
      className={cn(
        "h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 z-50",
        isMobile ? "w-full sticky top-0" : "sticky top-0",
        !isMobile && (isCollapsed ? "w-[72px]" : "w-[240px]")
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-14 border-b border-sidebar-border">
        <img src={fleefloLogo} alt="FleeFlo" className="w-8 h-8 object-contain flex-shrink-0" />
        {!isCollapsed && (
          <span className="font-semibold text-base text-foreground tracking-tight">
            FleeFlo
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
        {visibleNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          const showBadge = item.path === "/instellingen" && openCount > 0;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <div className="relative flex-shrink-0">
                <item.icon className={cn("w-[18px] h-[18px]", isActive && "text-primary")} />
                {showBadge && isCollapsed && (
                  <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-1 rounded-full bg-primary text-[9px] font-semibold text-primary-foreground flex items-center justify-center">
                    {openCount > 9 ? "9+" : openCount}
                  </span>
                )}
              </div>
              {!isCollapsed && (
                <span className="flex-1 flex items-center justify-between">
                  {item.label}
                  {showBadge && (
                    <span className="ml-2 min-w-[18px] h-[18px] px-1.5 rounded-full bg-primary text-[10px] font-semibold text-primary-foreground flex items-center justify-center">
                      {openCount > 9 ? "9+" : openCount}
                    </span>
                  )}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle - desktop only */}
      {!isMobile && (
        <div className="p-3 border-t border-sidebar-border">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sidebar-foreground hover:bg-accent transition-colors text-sm"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {!isCollapsed && <span>Inklappen</span>}
          </button>
        </div>
      )}
    </aside>
  );
}
