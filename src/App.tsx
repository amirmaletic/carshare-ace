import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { KlantLayout } from "@/components/KlantLayout";
import { useAuth } from "@/hooks/useAuth";
import Dashboard from "./pages/Dashboard";
import Vehicles from "./pages/Vehicles";
import Terugmelden from "./pages/Terugmelden";
import Contracts from "./pages/Contracts";
import Reservations from "./pages/Reservations";
import Maintenance from "./pages/Maintenance";
import Reports from "./pages/Reports";
import SettingsPage from "./pages/SettingsPage";
import Kosten from "./pages/Kosten";
import Chauffeurs from "./pages/Chauffeurs";
import Ritten from "./pages/Ritten";
import Klanten from "./pages/Klanten";
import Auth from "./pages/Auth";
import KlantAuth from "./pages/KlantAuth";
import MijnReserveringen from "./pages/portaal/MijnReserveringen";
import ReserveerVoertuig from "./pages/portaal/ReserveerVoertuig";
import MijnFacturen from "./pages/portaal/MijnFacturen";
import MijnProfiel from "./pages/portaal/MijnProfiel";
import PubliekBoeken from "./pages/PubliekBoeken";
import NotFound from "./pages/NotFound";

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
  if (!isStaff) return <Navigate to="/portaal" replace />;
  return <>{children}</>;
}

function KlantProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [role, setRole] = useState<"staff" | "klant" | null>(null);

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

  if (!user) return <Navigate to="/klant-login" replace />;
  if (role === "staff") return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<PubliekBoeken />} />
          <Route path="/boeken" element={<Navigate to="/" replace />} />

          {/* Auth routes */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/klant-login" element={<KlantAuth />} />

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
          <Route path="/instellingen" element={<ProtectedRoute><AppLayout><SettingsPage /></AppLayout></ProtectedRoute>} />

          {/* Klantportaal routes */}
          <Route path="/portaal" element={<KlantProtectedRoute><KlantLayout><MijnReserveringen /></KlantLayout></KlantProtectedRoute>} />
          <Route path="/portaal/reserveren" element={<KlantProtectedRoute><KlantLayout><ReserveerVoertuig /></KlantLayout></KlantProtectedRoute>} />
          <Route path="/portaal/facturen" element={<KlantProtectedRoute><KlantLayout><MijnFacturen /></KlantLayout></KlantProtectedRoute>} />
          <Route path="/portaal/profiel" element={<KlantProtectedRoute><KlantLayout><MijnProfiel /></KlantLayout></KlantProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
