import { useState } from "react";
import { Users, Mail, Trash2, Clock, CheckCircle2, XCircle, UserPlus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useOrganisatie } from "@/hooks/useOrganisatie";
import { usePermissions, ROLES, type AppRole } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

export default function TeamTab() {
  const { user } = useAuth();
  const { organisatieId } = useOrganisatie();
  const { isAdmin } = usePermissions();
  const queryClient = useQueryClient();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AppRole>("medewerker");

  // Fetch team members (users with roles in this org)
  const { data: teamMembers = [] } = useQuery({
    queryKey: ["team_members", organisatieId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("id, user_id, role, created_at")
        .eq("organisatie_id", organisatieId!);
      if (error) throw error;
      return data;
    },
    enabled: !!organisatieId,
  });

  // Fetch pending invitations
  const { data: invitations = [] } = useQuery({
    queryKey: ["uitnodigingen", organisatieId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("uitnodigingen")
        .select("*")
        .eq("organisatie_id", organisatieId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!organisatieId,
  });

  const sendInvite = useMutation({
    mutationFn: async () => {
      if (!user || !organisatieId) throw new Error("Niet ingelogd");
      if (!email.trim()) throw new Error("Vul een e-mailadres in");

      // Check if already invited
      const existing = invitations.find(
        (i) => i.email === email.trim() && i.status === "pending"
      );
      if (existing) throw new Error("Dit e-mailadres is al uitgenodigd");

      const { error } = await supabase.from("uitnodigingen").insert({
        email: email.trim().toLowerCase(),
        role: role as any,
        organisatie_id: organisatieId,
        uitgenodigd_door: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Uitnodiging verstuurd", {
        description: `${email} is uitgenodigd als ${ROLES.find(r => r.key === role)?.label}.`,
      });
      setEmail("");
      queryClient.invalidateQueries({ queryKey: ["uitnodigingen"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const deleteInvite = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("uitnodigingen")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Uitnodiging verwijderd");
      queryClient.invalidateQueries({ queryKey: ["uitnodigingen"] });
    },
  });

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm">
            Alleen beheerders kunnen teamleden beheren.
          </p>
        </CardContent>
      </Card>
    );
  }

  const invitableRoles = ROLES.filter((r) => r.key !== "klant");

  const statusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="w-3.5 h-3.5 text-warning" />;
      case "accepted": return <CheckCircle2 className="w-3.5 h-3.5 text-success" />;
      case "expired": return <XCircle className="w-3.5 h-3.5 text-muted-foreground" />;
      default: return null;
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "pending": return "Wachtend";
      case "accepted": return "Geaccepteerd";
      case "expired": return "Verlopen";
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Invite form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Medewerker uitnodigen
          </CardTitle>
          <CardDescription>
            Nodig een nieuwe medewerker uit via e-mail. Ze ontvangen een link om een account aan te maken.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="invite-email">E-mailadres</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="collega@bedrijf.nl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendInvite.mutate()}
              />
            </div>
            <div className="w-full sm:w-44 space-y-1.5">
              <Label>Rol</Label>
              <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {invitableRoles.map((r) => (
                    <SelectItem key={r.key} value={r.key}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => sendInvite.mutate()}
                disabled={sendInvite.isPending || !email.trim()}
                className="gap-2 w-full sm:w-auto"
              >
                <Mail className="w-4 h-4" />
                Uitnodigen
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team members */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Teamleden ({teamMembers.length})
          </CardTitle>
          <CardDescription>
            Huidige leden van je organisatie.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nog geen teamleden gevonden.
            </p>
          ) : (
            <div className="space-y-2">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg border border-border"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
                      {member.user_id === user?.id ? "Jij" : "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {member.user_id === user?.id ? user.email : member.user_id.slice(0, 8) + "..."}
                      </p>
                    </div>
                  </div>
                  <Badge variant={member.role === "beheerder" ? "default" : "secondary"} className="capitalize">
                    {ROLES.find(r => r.key === member.role)?.label ?? member.role}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Uitnodigingen ({invitations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg border border-border"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {statusIcon(inv.status)}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{inv.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(inv.created_at), "d MMM yyyy", { locale: nl })} · {statusLabel(inv.status)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="capitalize">
                      {ROLES.find(r => r.key === inv.role)?.label ?? inv.role}
                    </Badge>
                    {inv.status === "pending" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteInvite.mutate(inv.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
