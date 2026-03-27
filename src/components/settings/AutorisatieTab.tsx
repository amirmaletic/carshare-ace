import { useState } from "react";
import { Shield, Lock, Unlock, Info, ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { usePermissions, APP_MODULES, ROLES, type AppRole } from "@/hooks/usePermissions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function AutorisatieTab() {
  const { isAdmin, permissions, updatePermission } = usePermissions();
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  const getPermission = (role: AppRole, module: string): boolean => {
    const perm = permissions.find(p => p.role === role && p.module === module);
    return perm ? perm.allowed : false;
  };

  const handleToggle = (role: AppRole, module: string, allowed: boolean) => {
    if (role === "beheerder" && (module === "instellingen" || module === "dashboard" || module.startsWith("instellingen.") || module.startsWith("dashboard."))) {
      toast.error("Beheerder moet altijd toegang hebben tot dit onderdeel");
      return;
    }
    updatePermission.mutate(
      { role, module, allowed },
      {
        onSuccess: () => toast.success("Rechten bijgewerkt"),
        onError: () => toast.error("Fout bij bijwerken rechten"),
      }
    );
  };

  const toggleExpand = (roleKey: string, moduleKey: string) => {
    const key = `${roleKey}:${moduleKey}`;
    setExpandedModules((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Lock className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm">
            Alleen beheerders kunnen autorisaties beheren.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Autorisatiebeheer
        </CardTitle>
        <CardDescription>
          Bepaal per rol welke modules en specifieke functies toegankelijk zijn.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border">
          <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            Klik op een module om de specifieke functies te zien en per functie rechten in te stellen. Beheerders hebben altijd volledige toegang.
          </p>
        </div>

        {ROLES.map((role, roleIdx) => (
          <div key={role.key}>
            {roleIdx > 0 && <Separator className="mb-5" />}
            <div className="mb-3 flex items-center gap-2">
              <Badge
                variant={role.key === "beheerder" ? "default" : "secondary"}
                className="capitalize"
              >
                {role.label}
              </Badge>
              {role.key === "beheerder" && (
                <span className="text-xs text-muted-foreground">Volledige toegang</span>
              )}
            </div>

            <div className="space-y-1">
              {APP_MODULES.map((mod) => {
                const isLocked = role.key === "beheerder";
                const moduleAllowed = isLocked ? true : getPermission(role.key, mod.key);
                const expandKey = `${role.key}:${mod.key}`;
                const isExpanded = expandedModules[expandKey] ?? false;
                const hasFunctions = mod.functions.length > 0;

                return (
                  <div key={mod.key} className="rounded-lg border border-border overflow-hidden">
                    {/* Module row */}
                    <div
                      className={cn(
                        "flex items-center justify-between py-2.5 px-3 transition-colors",
                        hasFunctions && !isLocked && "cursor-pointer hover:bg-muted/30"
                      )}
                      onClick={() => hasFunctions && !isLocked && toggleExpand(role.key, mod.key)}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {hasFunctions && !isLocked ? (
                          isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          )
                        ) : (
                          <div className="w-3.5" />
                        )}
                        {moduleAllowed ? (
                          <Unlock className="w-3.5 h-3.5 text-success shrink-0" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        )}
                        <span className="text-sm font-medium text-foreground">{mod.label}</span>
                      </div>
                      <Switch
                        checked={moduleAllowed}
                        disabled={isLocked || updatePermission.isPending}
                        onCheckedChange={(v) => {
                          // Prevent click propagation
                          handleToggle(role.key, mod.key, v);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    {/* Expanded function rows */}
                    {isExpanded && !isLocked && (
                      <div className="border-t border-border bg-muted/20">
                        {mod.functions.map((fn) => {
                          const fnAllowed = getPermission(role.key, fn.key);
                          // If module is off, functions are implicitly off
                          const effectiveAllowed = moduleAllowed ? fnAllowed : false;

                          return (
                            <div
                              key={fn.key}
                              className="flex items-center justify-between py-2 px-3 pl-12"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                {effectiveAllowed ? (
                                  <Unlock className="w-3 h-3 text-success/70 shrink-0" />
                                ) : (
                                  <Lock className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                                )}
                                <span className="text-xs text-muted-foreground">{fn.label}</span>
                              </div>
                              <Switch
                                checked={effectiveAllowed}
                                disabled={!moduleAllowed || updatePermission.isPending}
                                onCheckedChange={(v) => handleToggle(role.key, fn.key, v)}
                                className="scale-90"
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
