import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type AppRole = "beheerder" | "medewerker" | "chauffeur" | "klant";

export interface ModuleFunction {
  key: string;
  label: string;
}

export interface AppModule {
  key: string;
  label: string;
  icon: string;
  functions: ModuleFunction[];
}

export const APP_MODULES: AppModule[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: "LayoutDashboard",
    functions: [
      { key: "dashboard.bekijken", label: "Dashboard bekijken" },
    ],
  },
  {
    key: "voertuigen",
    label: "Voertuigen",
    icon: "Car",
    functions: [
      { key: "voertuigen.bekijken", label: "Voertuigen bekijken" },
      { key: "voertuigen.toevoegen", label: "Voertuig toevoegen" },
      { key: "voertuigen.bewerken", label: "Voertuig bewerken" },
      { key: "voertuigen.verwijderen", label: "Voertuig verwijderen" },
      { key: "voertuigen.locatie_wijzigen", label: "Locatie wijzigen" },
    ],
  },
  {
    key: "terugmelden",
    label: "Terugmelden",
    icon: "RotateCcw",
    functions: [
      { key: "terugmelden.bekijken", label: "Terugmeldingen bekijken" },
      { key: "terugmelden.aanmaken", label: "Terugmelding aanmaken" },
      { key: "terugmelden.fotos_uploaden", label: "Schadefoto's uploaden" },
    ],
  },
  {
    key: "contracten",
    label: "Contracten",
    icon: "FileText",
    functions: [
      { key: "contracten.bekijken", label: "Contracten bekijken" },
      { key: "contracten.aanmaken", label: "Contract aanmaken" },
      { key: "contracten.bewerken", label: "Contract bewerken" },
      { key: "contracten.verwijderen", label: "Contract verwijderen" },
      { key: "contracten.facturen", label: "Facturen beheren" },
    ],
  },
  {
    key: "reserveringen",
    label: "Reserveringen",
    icon: "CalendarRange",
    functions: [
      { key: "reserveringen.bekijken", label: "Reserveringen bekijken" },
      { key: "reserveringen.aanmaken", label: "Reservering aanmaken" },
      { key: "reserveringen.annuleren", label: "Reservering annuleren" },
    ],
  },
  {
    key: "onderhoud",
    label: "Onderhoud",
    icon: "Wrench",
    functions: [
      { key: "onderhoud.bekijken", label: "Onderhoud bekijken" },
      { key: "onderhoud.inplannen", label: "Onderhoud inplannen" },
      { key: "onderhoud.afronden", label: "Onderhoud afronden" },
    ],
  },
  {
    key: "rapportages",
    label: "Rapportages",
    icon: "BarChart3",
    functions: [
      { key: "rapportages.bekijken", label: "Rapportages bekijken" },
      { key: "rapportages.exporteren", label: "Rapportages exporteren" },
    ],
  },
  {
    key: "kosten",
    label: "Kosten",
    icon: "Euro",
    functions: [
      { key: "kosten.bekijken", label: "Kosten bekijken" },
      { key: "kosten.registreren", label: "Kosten registreren" },
    ],
  },
  {
    key: "instellingen",
    label: "Instellingen",
    icon: "Settings",
    functions: [
      { key: "instellingen.bekijken", label: "Instellingen bekijken" },
      { key: "instellingen.bewerken", label: "Instellingen bewerken" },
      { key: "instellingen.autorisatie", label: "Autorisatie beheren" },
      { key: "instellingen.locaties", label: "Locaties beheren" },
    ],
  },
];

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

  const effectiveRoles: AppRole[] = userRoles.length > 0
    ? userRoles.map(r => r.role)
    : ["beheerder"];

  const isAdmin = effectiveRoles.includes("beheerder");

  const hasAccess = (module: string): boolean => {
    if (effectiveRoles.includes("beheerder")) return true;
    return effectiveRoles.some(role => {
      const perm = permissions.find(p => p.role === role && p.module === module);
      return perm ? perm.allowed : false;
    });
  };

  // Check a specific function permission (e.g. "voertuigen.toevoegen")
  const hasFunctionAccess = (funcKey: string): boolean => {
    if (effectiveRoles.includes("beheerder")) return true;
    // First check module-level access
    const moduleKey = funcKey.split(".")[0];
    if (!hasAccess(moduleKey)) return false;
    // Then check function-level (if no specific entry, default to module-level access)
    return effectiveRoles.some(role => {
      const perm = permissions.find(p => p.role === role && p.module === funcKey);
      return perm ? perm.allowed : true; // default allowed if module is allowed
    });
  };

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
    isAdmin,
    permissions,
    hasAccess,
    hasFunctionAccess,
    updatePermission,
    isLoading,
  };
}
