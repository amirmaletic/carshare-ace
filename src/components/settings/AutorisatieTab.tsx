import { Shield, Lock, Unlock, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { usePermissions, APP_MODULES, ROLES, type AppRole } from "@/hooks/usePermissions";
import { toast } from "sonner";

export default function AutorisatieTab() {
  const { isAdmin, permissions, updatePermission } = usePermissions();

  const getPermission = (role: AppRole, module: string): boolean => {
    const perm = permissions.find(p => p.role === role && p.module === module);
    return perm ? perm.allowed : false;
  };

  const handleToggle = (role: AppRole, module: string, allowed: boolean) => {
    // Beheerder always keeps access to instellingen and dashboard
    if (role === "beheerder" && (module === "instellingen" || module === "dashboard")) {
      toast.error("Beheerder moet altijd toegang hebben tot dit onderdeel");
      return;
    }

    updatePermission.mutate(
      { role, module, allowed },
      {
        onSuccess: () => toast.success(`Rechten bijgewerkt`),
        onError: () => toast.error("Fout bij bijwerken rechten"),
      }
    );
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
          Bepaal per rol welke onderdelen van Waggie toegankelijk zijn.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border">
          <Info className="w-4 h-4 text-info mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            Beheerders hebben altijd volledige toegang. Wijzigingen worden direct toegepast voor alle gebruikers met de betreffende rol.
          </p>
        </div>

        {/* Permission grid per role */}
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

            <div className="grid gap-2">
              {APP_MODULES.map(mod => {
                const allowed = role.key === "beheerder" ? true : getPermission(role.key, mod.key);
                const isLocked = role.key === "beheerder";

                return (
                  <div
                    key={mod.key}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {allowed ? (
                        <Unlock className="w-3.5 h-3.5 text-success" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                      <span className="text-sm text-foreground">{mod.label}</span>
                    </div>
                    <Switch
                      checked={allowed}
                      disabled={isLocked || updatePermission.isPending}
                      onCheckedChange={(v) => handleToggle(role.key, mod.key, v)}
                    />
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
