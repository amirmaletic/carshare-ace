import { useState, useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { MarketingLayout } from "@/components/MarketingLayout";
import { TenantPortaalLayout } from "@/components/TenantPortaalLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useModuleModus, isPathToegestaan } from "@/hooks/useModuleModus";
import { useRouteAccess } from "@/hooks/useRouteAccess";

// Marketing/auth: eager (kleine bundles, eerste paint)
import MarketingHome from "./pages/MarketingHome";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// App-routes: lazy-loaded per route voor kleinere initial bundle
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Vehicles = lazy(() => import("./pages/Vehicles"));
const Terugmelden = lazy(() => import("./pages/Terugmelden"));
const Contracts = lazy(() => import("./pages/Contracts"));
const Reservations = lazy(() => import("./pages/Reservations"));
const Maintenance = lazy(() => import("./pages/Maintenance"));
const Reports = lazy(() => import("./pages/Reports"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const Kosten = lazy(() => import("./pages/Kosten"));
const Chauffeurs = lazy(() => import("./pages/Chauffeurs"));
const Ritten = lazy(() => import("./pages/Ritten"));
const Klanten = lazy(() => import("./pages/Klanten"));
const DashboardOperationeel = lazy(() => import("./pages/dashboards/DashboardOperationeel"));
const DashboardFinancieel = lazy(() => import("./pages/dashboards/DashboardFinancieel"));
const DashboardVloot = lazy(() => import("./pages/dashboards/DashboardVloot"));
const DashboardKlanten = lazy(() => import("./pages/dashboards/DashboardKlanten"));
const MijnReserveringen = lazy(() => import("./pages/portaal/MijnReserveringen"));
const ReserveerVoertuig = lazy(() => import("./pages/portaal/ReserveerVoertuig"));
const MijnFacturen = lazy(() => import("./pages/portaal/MijnFacturen"));
const MijnProfiel = lazy(() => import("./pages/portaal/MijnProfiel"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const AdminPlatform = lazy(() => import("./pages/AdminPlatform"));
const TenantAanbod = lazy(() => import("./pages/tenant/TenantAanbod"));
const TenantInloggen = lazy(() => import("./pages/tenant/TenantInloggen"));
const TenantReserveren = lazy(() => import("./pages/tenant/TenantReserveren"));
const Rijbewijzen = lazy(() => import("./pages/Rijbewijzen"));
const RijbewijsUpload = lazy(() => import("./pages/RijbewijsUpload"));
const BetaalVerificatie = lazy(() => import("./pages/BetaalVerificatie"));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [isStaff, setIsStaff] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .then(({ data }) => {
        const roles = data?.map((r) => r.role) || [];
        setIsStaff(roles.some((r) => r === "beheerder" || r === "medewerker"));
      });
  }, [user]);

  if (loading || (user && isStaff === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!isStaff) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function KlantProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [role, setRole] = useState<"staff" | "klant" | null>(null);
  const location = useLocation();

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .then(({ data }) => {
        const roles = data?.map((r) => r.role) || [];
        setRole(
          roles.some((r) => r === "beheerder" || r === "medewerker")
            ? "staff"
            : "klant"
        );
      });
  }, [user]);

  if (loading || (user && role === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    // Detect tenant slug from current path /t/<slug>/...
    const m = location.pathname.match(/^\/t\/([^/]+)/);
    const target = m ? `/t/${m[1]}/inloggen?redirect=${encodeURIComponent(location.pathname)}` : "/";
    return <Navigate to={target} replace />;
  }
  if (role === "staff") return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

/**
 * Blokkeert routes die in 'wagenpark'-modus niet beschikbaar zijn.
 * Stuurt de gebruiker terug naar /dashboard.
 */
function ModuleGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { data: modus, isLoading } = useModuleModus();
  if (isLoading) return <PageLoader />;
  if (!isPathToegestaan(location.pathname, modus)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

/**
 * Blokkeert routes waarvoor de gebruiker geen rechten heeft volgens
 * role_permissions (autorisatiebeheer). Stuurt terug naar /dashboard.
 */
function PermissionGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { allowed, isLoading } = useRouteAccess(location.pathname);
  if (isLoading) return <PageLoader />;
  if (!allowed) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

// Homepage is now always the public marketing/booking page
// Staff access their dashboard via /dashboard directly

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public / marketing routes */}
          <Route path="/" element={<MarketingLayout><MarketingHome /></MarketingLayout>} />
          <Route path="/prijzen" element={<MarketingLayout><Pricing /></MarketingLayout>} />
          <Route path="/blog" element={<MarketingLayout><Blog /></MarketingLayout>} />
          <Route path="/blog/:slug" element={<MarketingLayout><BlogPost /></MarketingLayout>} />
          <Route path="/boeken" element={<Navigate to="/" replace />} />

          {/* Auth routes */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/unsubscribe" element={<Unsubscribe />} />
          {/* Admin/staff routes */}
          <Route path="/dashboard" element={<ProtectedRoute><PermissionGuard><AppLayout><Dashboard /></AppLayout></PermissionGuard></ProtectedRoute>} />
          <Route path="/voertuigen" element={<ProtectedRoute><PermissionGuard><AppLayout><Vehicles /></AppLayout></PermissionGuard></ProtectedRoute>} />
          <Route path="/terugmelden" element={<ProtectedRoute><ModuleGuard><PermissionGuard><AppLayout><Terugmelden /></AppLayout></PermissionGuard></ModuleGuard></ProtectedRoute>} />
          <Route path="/contracten" element={<ProtectedRoute><ModuleGuard><PermissionGuard><AppLayout><Contracts /></AppLayout></PermissionGuard></ModuleGuard></ProtectedRoute>} />
          <Route path="/reserveringen" element={<ProtectedRoute><ModuleGuard><PermissionGuard><AppLayout><Reservations /></AppLayout></PermissionGuard></ModuleGuard></ProtectedRoute>} />
          <Route path="/onderhoud" element={<ProtectedRoute><PermissionGuard><AppLayout><Maintenance /></AppLayout></PermissionGuard></ProtectedRoute>} />
          <Route path="/rapportages" element={<ProtectedRoute><PermissionGuard><AppLayout><Reports /></AppLayout></PermissionGuard></ProtectedRoute>} />
          <Route path="/dashboards/operationeel" element={<ProtectedRoute><PermissionGuard><AppLayout><DashboardOperationeel /></AppLayout></PermissionGuard></ProtectedRoute>} />
          <Route path="/dashboards/financieel" element={<ProtectedRoute><PermissionGuard><AppLayout><DashboardFinancieel /></AppLayout></PermissionGuard></ProtectedRoute>} />
          <Route path="/dashboards/vloot" element={<ProtectedRoute><PermissionGuard><AppLayout><DashboardVloot /></AppLayout></PermissionGuard></ProtectedRoute>} />
          <Route path="/dashboards/klanten" element={<ProtectedRoute><PermissionGuard><AppLayout><DashboardKlanten /></AppLayout></PermissionGuard></ProtectedRoute>} />
          <Route path="/kosten" element={<ProtectedRoute><PermissionGuard><AppLayout><Kosten /></AppLayout></PermissionGuard></ProtectedRoute>} />
          <Route path="/chauffeurs" element={<ProtectedRoute><PermissionGuard><AppLayout><Chauffeurs /></AppLayout></PermissionGuard></ProtectedRoute>} />
          <Route path="/ritten" element={<ProtectedRoute><PermissionGuard><AppLayout><Ritten /></AppLayout></PermissionGuard></ProtectedRoute>} />
          <Route path="/klanten" element={<ProtectedRoute><ModuleGuard><PermissionGuard><AppLayout><Klanten /></AppLayout></PermissionGuard></ModuleGuard></ProtectedRoute>} />
          <Route path="/rijbewijzen" element={<ProtectedRoute><ModuleGuard><PermissionGuard><AppLayout><Rijbewijzen /></AppLayout></PermissionGuard></ModuleGuard></ProtectedRoute>} />
          <Route path="/instellingen" element={<ProtectedRoute><PermissionGuard><AppLayout><SettingsPage /></AppLayout></PermissionGuard></ProtectedRoute>} />

          {/* Publieke rijbewijs-upload via token */}
          <Route path="/rijbewijs/:token" element={<RijbewijsUpload />} />
          <Route path="/betaal-verificatie/:token" element={<BetaalVerificatie />} />

          {/* White-label tenant portal (per organisatie) */}
          <Route path="/t/:slug" element={<TenantPortaalLayout><TenantAanbod /></TenantPortaalLayout>} />
          <Route path="/t/:slug/inloggen" element={<TenantInloggen />} />
          <Route path="/t/:slug/reserveringen" element={<KlantProtectedRoute><TenantPortaalLayout><MijnReserveringen /></TenantPortaalLayout></KlantProtectedRoute>} />
          <Route path="/t/:slug/reserveren" element={<TenantPortaalLayout><TenantReserveren /></TenantPortaalLayout>} />
          <Route path="/t/:slug/facturen" element={<KlantProtectedRoute><TenantPortaalLayout><MijnFacturen /></TenantPortaalLayout></KlantProtectedRoute>} />
          <Route path="/t/:slug/profiel" element={<KlantProtectedRoute><TenantPortaalLayout><MijnProfiel /></TenantPortaalLayout></KlantProtectedRoute>} />

          {/* FleeFlo super-admin */}
          <Route path="/admin" element={<AdminPlatform />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
