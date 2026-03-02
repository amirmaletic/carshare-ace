import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Car,
  CalendarRange,
  FileText,
  Wrench,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Car, label: "Voertuigen", path: "/voertuigen" },
  { icon: FileText, label: "Contracten", path: "/contracten" },
  { icon: CalendarRange, label: "Reserveringen", path: "/reserveringen" },
  { icon: Wrench, label: "Onderhoud", path: "/onderhoud" },
  { icon: BarChart3, label: "Rapportages", path: "/rapportages" },
  { icon: Settings, label: "Instellingen", path: "/instellingen" },
];

export function AppSidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "h-screen sticky top-0 sidebar-gradient border-r border-sidebar-border flex flex-col transition-all duration-300 z-50",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <Car className="w-4 h-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <span className="font-display font-bold text-lg text-sidebar-accent-foreground tracking-tight">
            FleetFlow
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-accent text-primary shadow-sm"
                  : "text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-primary")} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors text-sm"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!collapsed && <span>Inklappen</span>}
        </button>
      </div>
    </aside>
  );
}
