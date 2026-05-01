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
          <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
          <Route path="/voertuigen" element={<ProtectedRoute><AppLayout><Vehicles /></AppLayout></ProtectedRoute>} />
          <Route path="/terugmelden" element={<ProtectedRoute><AppLayout><Terugmelden /></AppLayout></ProtectedRoute>} />
          <Route path="/contracten" element={<ProtectedRoute><AppLayout><Contracts /></AppLayout></ProtectedRoute>} />
          <Route path="/reserveringen" element={<ProtectedRoute><AppLayout><Reservations /></AppLayout></ProtectedRoute>} />
          <Route path="/onderhoud" element={<ProtectedRoute><AppLayout><Maintenance /></AppLayout></ProtectedRoute>} />
          <Route path="/rapportages" element={<ProtectedRoute><AppLayout><Reports /></AppLayout></ProtectedRoute>} />
          <Route path="/kosten" element={<ProtectedRoute><AppLayout><Kosten /></AppLayout></ProtectedRoute>} />
          <Route path="/chauffeurs" element={<ProtectedRoute><AppLayout><Chauffeurs /></AppLayout></ProtectedRoute>} />
          <Route path="/ritten" element={<ProtectedRoute><AppLayout><Ritten /></AppLayout></ProtectedRoute>} />
          <Route path="/klanten" element={<ProtectedRoute><AppLayout><Klanten /></AppLayout></ProtectedRoute>} />
          <Route path="/rijbewijzen" element={<ProtectedRoute><AppLayout><Rijbewijzen /></AppLayout></ProtectedRoute>} />
          <Route path="/instellingen" element={<ProtectedRoute><AppLayout><SettingsPage /></AppLayout></ProtectedRoute>} />

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
