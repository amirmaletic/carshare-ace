import { Link, useLocation } from "react-router-dom";
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
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Car, label: "Voertuigen", path: "/voertuigen" },
  { icon: Users, label: "Chauffeurs", path: "/chauffeurs" },
  { icon: Route, label: "Ritten", path: "/ritten" },
  { icon: RotateCcw, label: "Terugmelden", path: "/terugmelden" },
  { icon: FileText, label: "Contracten", path: "/contracten" },
  { icon: UserPlus, label: "Klanten", path: "/klanten" },
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
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <span className="text-primary-foreground font-bold text-lg leading-none">F</span>
        </div>
        {!isCollapsed && (
          <span className="font-semibold text-base text-foreground tracking-tight">
            FleeFlo
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
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
              <item.icon className={cn("w-[18px] h-[18px] flex-shrink-0", isActive && "text-primary")} />
              {!isCollapsed && <span>{item.label}</span>}
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
