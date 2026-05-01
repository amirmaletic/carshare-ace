import { ReactNode } from "react";
import { usePermissions } from "@/hooks/usePermissions";

interface CanProps {
  /** Module-level permissie, bijv. "voertuigen" */
  module?: string;
  /** Specifieke functie, bijv. "voertuigen.toevoegen" */
  fn?: string;
  /** Optioneel: tonen wanneer geen rechten (anders niets) */
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Toont children alleen wanneer de huidige gebruiker de gevraagde rechten heeft.
 * Beheerders zien altijd alles. Tijdens loading worden children optimistisch getoond.
 */
export function Can({ module, fn, fallback = null, children }: CanProps) {
  const { hasAccess, hasFunctionAccess, isLoading } = usePermissions();
  if (isLoading) return <>{children}</>;
  if (fn && !hasFunctionAccess(fn)) return <>{fallback}</>;
  if (module && !hasAccess(module)) return <>{fallback}</>;
  return <>{children}</>;
}

/** Hook variant voor disabled-states e.d. */
export function useCan(fnOrModule: string): boolean {
  const { hasAccess, hasFunctionAccess, isLoading } = usePermissions();
  if (isLoading) return true;
  if (fnOrModule.includes(".")) return hasFunctionAccess(fnOrModule);
  return hasAccess(fnOrModule);
}