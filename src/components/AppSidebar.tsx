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
  Building2,
  Briefcase,
  BarChartBig,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useGoedkeuringen } from "@/hooks/useGoedkeuringen";
import { useModuleModus, WAGENPARK_HIDDEN_PATHS } from "@/hooks/useModuleModus";
import { usePermissions } from "@/hooks/usePermissions";
import { PATH_TO_MODULE } from "@/hooks/useRouteAccess";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: BarChartBig, label: "Dashboarding", path: "/dashboarding/operationeel" },
  { icon: Car, label: "Voertuigen", path: "/voertuigen" },
  { icon: Users, label: "Chauffeurs", path: "/chauffeurs" },
  { icon: Route, label: "Ritten", path: "/ritten" },
  { icon: RotateCcw, label: "Terugmelden", path: "/terugmelden" },
  { icon: FileText, label: "Contracten", path: "/contracten" },
  { icon: UserPlus, label: "Klanten", path: "/klanten" },
  { icon: IdCard, label: "Rijbewijzen", path: "/rijbewijzen" },
  { icon: CalendarRange, label: "Reserveringen", path: "/reserveringen" },
  { icon: Wrench, label: "Onderhoud", path: "/onderhoud" },
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
  const { hasAccess, isLoading: permsLoading } = usePermissions();

  const visibleNavItems = navItems.filter((item) => {
    // Modus filter
    if (modus === "wagenpark" && WAGENPARK_HIDDEN_PATHS.has(item.path)) return false;
    // Permissies filter (toon tijdens loading om flicker te voorkomen)
    if (permsLoading) return true;
    const moduleKey = PATH_TO_MODULE[item.path];
    if (!moduleKey) return true;
    return hasAccess(moduleKey);
  });

  const isWagenpark = modus === "wagenpark";
  const ModusIcon = isWagenpark ? Briefcase : Building2;
  const modusLabel = isWagenpark ? "Wagenparkbeheer" : "Autoverhuur";
  const modusKort = isWagenpark ? "WPB" : "AV";

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

      {/* Module-modus badge */}
      {modus && (
        <div className={cn("px-3 pt-3", isCollapsed && "px-2")}>
          <div
            title={`Modus: ${modusLabel}`}
            className={cn(
              "flex items-center gap-2 rounded-lg border text-xs font-medium",
              isWagenpark
                ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                : "border-primary/30 bg-primary/10 text-primary",
              isCollapsed ? "justify-center p-2" : "px-2.5 py-1.5"
            )}
          >
            <ModusIcon className="w-3.5 h-3.5 flex-shrink-0" />
            {!isCollapsed && (
              <span className="truncate">{modusLabel}</span>
            )}
            {isCollapsed && <span className="sr-only">{modusLabel}</span>}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
        {visibleNavItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path.startsWith("/dashboarding") &&
              (location.pathname.startsWith("/dashboarding") ||
                location.pathname.startsWith("/dashboards")));
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
