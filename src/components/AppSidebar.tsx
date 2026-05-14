import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Car,
  CalendarRange,
  FileText,
  Wrench,
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
  Upload,
  Download,
  Calculator,
  ChevronDown,
  Send,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useGoedkeuringen } from "@/hooks/useGoedkeuringen";
import { useModuleModus, WAGENPARK_HIDDEN_PATHS, AUTOVERHUUR_HIDDEN_PATHS } from "@/hooks/useModuleModus";
import { usePermissions } from "@/hooks/usePermissions";
import { PATH_TO_MODULE } from "@/hooks/useRouteAccess";

type NavItem = { icon: any; label: string; path: string };
type NavSection =
  | { type: "item"; item: NavItem }
  | { type: "group"; key: string; label: string; icon: any; items: NavItem[] };

const navSections: NavSection[] = [
  { type: "item", item: { icon: LayoutDashboard, label: "Overzicht", path: "/dashboard" } },
  { type: "item", item: { icon: BarChartBig, label: "Dashboarding", path: "/dashboarding/operationeel" } },
  {
    type: "group",
    key: "vloot",
    label: "Vloot",
    icon: Car,
    items: [
      { icon: Car, label: "Voertuigen", path: "/voertuigen" },
      { icon: Wrench, label: "Onderhoud", path: "/onderhoud" },
      { icon: CalendarRange, label: "Reserveringen", path: "/reserveringen" },
      { icon: Sparkles, label: "Aanvragen", path: "/aanvragen-planning" },
    ],
  },
  {
    type: "group",
    key: "operatie",
    label: "Operatie",
    icon: Route,
    items: [
      { icon: Route, label: "Ritten", path: "/ritten" },
      { icon: Users, label: "Chauffeurs", path: "/chauffeurs" },
      { icon: RotateCcw, label: "Terugmelden", path: "/terugmelden" },
    ],
  },
  {
    type: "group",
    key: "verhuur",
    label: "Verhuur",
    icon: FileText,
    items: [
      { icon: FileText, label: "Contracten", path: "/contracten" },
      { icon: CalendarIcon, label: "Contracten agenda", path: "/contracten/agenda" },
      { icon: UserPlus, label: "Klanten", path: "/klanten" },
      { icon: IdCard, label: "Rijbewijzen", path: "/rijbewijzen" },
    ],
  },
  {
    type: "group",
    key: "financieel",
    label: "Financieel",
    icon: Euro,
    items: [
      { icon: Euro, label: "Kosten", path: "/kosten" },
      { icon: Send, label: "Auto facturatie", path: "/auto-facturatie" },
      { icon: Download, label: "Boekhouding", path: "/boekhouding-export" },
      { icon: Calculator, label: "Bijtelling", path: "/bijtelling" },
    ],
  },
  {
    type: "group",
    key: "systeem",
    label: "Systeem",
    icon: Settings,
    items: [
      { icon: Upload, label: "Migratie", path: "/migratie" },
      { icon: Settings, label: "Instellingen", path: "/instellingen" },
    ],
  },
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

  const isItemVisible = (item: NavItem) => {
    if (modus === "wagenpark" && WAGENPARK_HIDDEN_PATHS.has(item.path)) return false;
    if (modus === "autoverhuur" && AUTOVERHUUR_HIDDEN_PATHS.has(item.path)) return false;
    if (permsLoading) return true;
    const moduleKey = PATH_TO_MODULE[item.path];
    if (!moduleKey) return true;
    return hasAccess(moduleKey);
  };

  const visibleSections = navSections
    .map((s) => {
      if (s.type === "item") return isItemVisible(s.item) ? s : null;
      const items = s.items.filter(isItemVisible);
      return items.length ? { ...s, items } : null;
    })
    .filter(Boolean) as NavSection[];

  const isItemActive = (path: string) =>
    location.pathname === path ||
    (path.startsWith("/dashboarding") &&
      (location.pathname.startsWith("/dashboarding") ||
        location.pathname.startsWith("/dashboards")));

  // Open groups state, persisted + auto-open active
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem("sidebar-open-groups");
      if (raw) return JSON.parse(raw);
    } catch {}
    return {};
  });

  useEffect(() => {
    // Auto-open group containing active route
    const next: Record<string, boolean> = { ...openGroups };
    let changed = false;
    for (const s of navSections) {
      if (s.type === "group" && s.items.some((i) => isItemActive(i.path)) && !next[s.key]) {
        next[s.key] = true;
        changed = true;
      }
    }
    if (changed) setOpenGroups(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem("sidebar-open-groups", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

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
      <div className={cn(
        "flex items-center h-16 border-b border-sidebar-border",
        isCollapsed ? "justify-center px-2" : "px-5"
      )}>
        {isCollapsed ? (
          <span className="font-display text-2xl font-medium text-primary tracking-tight">F</span>
        ) : (
          <span className="font-display text-2xl font-medium text-primary tracking-tight">
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
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {visibleSections.map((section) => {
          if (section.type === "item") {
            return (
              <NavLinkItem
                key={section.item.path}
                item={section.item}
                isActive={isItemActive(section.item.path)}
                isCollapsed={isCollapsed}
                openCount={openCount}
                onNavigate={onNavigate}
              />
            );
          }
          const groupActive = section.items.some((i) => isItemActive(i.path));
          const groupOpen = isCollapsed ? false : (openGroups[section.key] ?? groupActive);
          const GroupIcon = section.icon;
          if (isCollapsed) {
            // In collapsed mode: render items flat with icons only
            return (
              <div key={section.key} className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLinkItem
                    key={item.path}
                    item={item}
                    isActive={isItemActive(item.path)}
                    isCollapsed
                    openCount={openCount}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            );
          }
          return (
            <div key={section.key}>
              <button
                type="button"
                onClick={() => toggleGroup(section.key)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  groupActive
                    ? "text-foreground"
                    : "text-sidebar-foreground hover:text-foreground hover:bg-accent/60"
                )}
              >
                <GroupIcon className={cn("w-[18px] h-[18px]", groupActive && "text-primary")} />
                <span className="flex-1 text-left">{section.label}</span>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 transition-transform",
                    groupOpen ? "rotate-0" : "-rotate-90"
                  )}
                />
              </button>
              {groupOpen && (
                <div className="ml-3 mt-0.5 pl-3 border-l border-sidebar-border space-y-0.5">
                  {section.items.map((item) => (
                    <NavLinkItem
                      key={item.path}
                      item={item}
                      isActive={isItemActive(item.path)}
                      isCollapsed={false}
                      openCount={openCount}
                      onNavigate={onNavigate}
                    />
                  ))}
                </div>
              )}
            </div>
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

function NavLinkItem({
  item,
  isActive,
  isCollapsed,
  openCount,
  onNavigate,
}: {
  item: { icon: any; label: string; path: string };
  isActive: boolean;
  isCollapsed: boolean;
  openCount: number;
  onNavigate?: () => void;
}) {
  const showBadge = item.path === "/instellingen" && openCount > 0;
  const Icon = item.icon;
  return (
    <Link
      to={item.path}
      onClick={onNavigate}
      title={isCollapsed ? item.label : undefined}
      className={cn(
        "relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent"
      )}
    >
      <div className="relative flex-shrink-0">
        <Icon className={cn("w-[18px] h-[18px]", isActive ? "text-primary-foreground" : "")} />
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
}
