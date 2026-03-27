import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
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
import Locaties from "./pages/Locaties";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
          <Route path="/voertuigen" element={<ProtectedRoute><AppLayout><Vehicles /></AppLayout></ProtectedRoute>} />
          <Route path="/terugmelden" element={<ProtectedRoute><AppLayout><Terugmelden /></AppLayout></ProtectedRoute>} />
          <Route path="/contracten" element={<ProtectedRoute><AppLayout><Contracts /></AppLayout></ProtectedRoute>} />
          <Route path="/reserveringen" element={<ProtectedRoute><AppLayout><Reservations /></AppLayout></ProtectedRoute>} />
          <Route path="/onderhoud" element={<ProtectedRoute><AppLayout><Maintenance /></AppLayout></ProtectedRoute>} />
          <Route path="/rapportages" element={<ProtectedRoute><AppLayout><Reports /></AppLayout></ProtectedRoute>} />
          <Route path="/kosten" element={<ProtectedRoute><AppLayout><Kosten /></AppLayout></ProtectedRoute>} />
          <Route path="/locaties" element={<ProtectedRoute><AppLayout><Locaties /></AppLayout></ProtectedRoute>} />
          <Route path="/instellingen" element={<ProtectedRoute><AppLayout><SettingsPage /></AppLayout></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
