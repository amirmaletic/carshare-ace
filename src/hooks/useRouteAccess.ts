import { usePermissions } from "./usePermissions";

/** Mapping van app-paden naar module-keys uit usePermissions/APP_MODULES. */
export const PATH_TO_MODULE: Record<string, string> = {
  "/dashboard": "dashboard",
  "/voertuigen": "voertuigen",
  "/terugmelden": "terugmelden",
  "/contracten": "contracten",
  "/reserveringen": "reserveringen",
  "/onderhoud": "onderhoud",
  "/rapportages": "rapportages",
  "/kosten": "kosten",
  "/klanten": "contracten",      // klanten valt onder contractenrechten
  "/rijbewijzen": "contracten",  // idem
  "/chauffeurs": "voertuigen",   // chauffeurs valt onder voertuigenrechten
  "/ritten": "voertuigen",
  "/instellingen": "instellingen",
};

export function useRouteAccess(path: string) {
  const { hasAccess, isLoading, userRoles } = usePermissions();
  const moduleKey = PATH_TO_MODULE[path];
  // Onbekend pad → standaard toegestaan (laat React Router 404 afhandelen)
  if (!moduleKey) return { allowed: true, isLoading, userRoles };
  return { allowed: hasAccess(moduleKey), isLoading, userRoles };
}