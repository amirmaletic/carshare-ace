import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type AppRole = "beheerder" | "medewerker" | "chauffeur" | "klant";

export const APP_MODULES = [
  { key: "dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { key: "voertuigen", label: "Voertuigen", icon: "Car" },
  { key: "terugmelden", label: "Terugmelden", icon: "RotateCcw" },
  { key: "contracten", label: "Contracten", icon: "FileText" },
  { key: "reserveringen", label: "Reserveringen", icon: "CalendarRange" },
  { key: "onderhoud", label: "Onderhoud", icon: "Wrench" },
  { key: "rapportages", label: "Rapportages", icon: "BarChart3" },
  { key: "kosten", label: "Kosten", icon: "Euro" },
  { key: "instellingen", label: "Instellingen", icon: "Settings" },
] as const;

export const ROLES: { key: AppRole; label: string }[] = [
  { key: "beheerder", label: "Beheerder" },
  { key: "medewerker", label: "Medewerker" },
  { key: "chauffeur", label: "Chauffeur" },
  { key: "klant", label: "Klant" },
];

interface RolePermission {
  id: string;
  role: AppRole;
  module: string;
  allowed: boolean;
}

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

export function usePermissions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch current user's roles
  const { data: userRoles = [] } = useQuery({
    queryKey: ["user_roles", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data as UserRole[];
    },
    enabled: !!user,
  });

  // Fetch all role permissions
  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ["role_permissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("role_permissions")
        .select("*")
        .order("role")
        .order("module");
      if (error) throw error;
      return data as RolePermission[];
    },
    enabled: !!user,
  });

  const isAdmin = userRoles.some(r => r.role === "beheerder");

  // If user has no roles yet, treat as beheerder (first user / owner)
  const effectiveRoles: AppRole[] = userRoles.length > 0
    ? userRoles.map(r => r.role)
    : ["beheerder"];

  const hasAccess = (module: string): boolean => {
    // Beheerders always have full access
    if (effectiveRoles.includes("beheerder")) return true;

    // Check if any of the user's roles grants access
    return effectiveRoles.some(role => {
      const perm = permissions.find(p => p.role === role && p.module === module);
      return perm ? perm.allowed : false;
    });
  };

  // Update a permission (admin only)
  const updatePermission = useMutation({
    mutationFn: async ({ role, module, allowed }: { role: AppRole; module: string; allowed: boolean }) => {
      const existing = permissions.find(p => p.role === role && p.module === module);
      if (existing) {
        const { error } = await supabase
          .from("role_permissions")
          .update({ allowed, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("role_permissions")
          .insert({ role: role as any, module, allowed });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role_permissions"] });
    },
  });

  return {
    userRoles: effectiveRoles,
    isAdmin: effectiveRoles.includes("beheerder"),
    permissions,
    hasAccess,
    updatePermission,
    isLoading,
  };
}
