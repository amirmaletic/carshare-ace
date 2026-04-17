import { useState } from "react";
import { CheckCircle2, XCircle, Clock, ShieldCheck, Lock, Euro, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePermissions } from "@/hooks/usePermissions";
import { useGoedkeuringRegels, useGoedkeuringen, ACTIE_TYPES, type Goedkeuring } from "@/hooks/useGoedkeuringen";
import { toast } from "sonner";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

export default function GoedkeuringenTab() {
  const { userRoles } = usePermissions();
  const isApprover = userRoles.includes("beheerder") || userRoles.includes("leidinggevende");
  const isAdmin = userRoles.includes("beheerder");

  const { regels, getRegel, upsert } = useGoedkeuringRegels();
  const { inBehandeling, goedkeuringen, beslissen } = useGoedkeuringen();

  const [drempelInputs, setDrempelInputs] = useState<Record<string, string>>({});
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; id?: string }>({ open: false });
  const [rejectReason, setRejectReason] = useState("");

  if (!isApprover) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Lock className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm">
            Alleen beheerders en leidinggevenden hebben toegang tot dit onderdeel.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleToggle = (actie_type: string, actief: boolean) => {
    const existing = getRegel(actie_type);
    upsert.mutate(
      { actie_type, actief, drempel_bedrag: existing?.drempel_bedrag ?? null },
      {
        onSuccess: () => toast.success("Regel bijgewerkt"),
        onError: () => toast.error("Fout bij opslaan"),
      }
    );
  };

  const handleDrempelSave = (actie_type: string) => {
    const existing = getRegel(actie_type);
    const value = drempelInputs[actie_type] ?? String(existing?.drempel_bedrag ?? "");
    const num = value ? Number(value) : null;
    upsert.mutate(
      { actie_type, actief: existing?.actief ?? true, drempel_bedrag: num },
      {
        onSuccess: () => toast.success("Drempel opgeslagen"),
        onError: () => toast.error("Fout bij opslaan"),
      }
    );
  };

  const handleApprove = (id: string) => {
    beslissen.mutate(
      { id, status: "goedgekeurd" },
      {
        onSuccess: () => toast.success("Verzoek goedgekeurd"),
        onError: () => toast.error("Fout bij goedkeuren"),
      }
    );
  };

  const handleReject = () => {
    if (!rejectDialog.id) return;
    beslissen.mutate(
      { id: rejectDialog.id, status: "afgewezen", reden: rejectReason || undefined },
      {
        onSuccess: () => {
          toast.success("Verzoek afgewezen");
          setRejectDialog({ open: false });
          setRejectReason("");
        },
        onError: () => toast.error("Fout bij afwijzen"),
      }
    );
  };

  const renderVerzoek = (g: Goedkeuring) => {
    const actie = ACTIE_TYPES.find(a => a.key === g.actie_type);
    return (
      <div key={g.id} className="rounded-lg border border-border p-3 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs">{actie?.label ?? g.actie_type}</Badge>
              {g.bedrag != null && (
                <span className="text-xs font-medium text-foreground">€ {g.bedrag.toLocaleString("nl-NL")}</span>
              )}
              {g.status === "goedgekeurd" && <Badge className="bg-success/15 text-success border-success/30 text-xs">Goedgekeurd</Badge>}
              {g.status === "afgewezen" && <Badge variant="destructive" className="text-xs">Afgewezen</Badge>}
              {g.status === "in_behandeling" && <Badge variant="secondary" className="text-xs">In behandeling</Badge>}
            </div>
            <p className="text-sm text-foreground mt-1.5">{g.beschrijving}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Aangevraagd op {format(new Date(g.created_at), "d MMM yyyy HH:mm", { locale: nl })}
            </p>
            {g.reden_afwijzing && (
              <p className="text-xs text-destructive mt-1">Reden: {g.reden_afwijzing}</p>
            )}
          </div>
          {g.status === "in_behandeling" && (
            <div className="flex gap-1.5 shrink-0">
              <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => handleApprove(g.id)}>
                <CheckCircle2 className="w-3.5 h-3.5" /> Goedkeuren
              </Button>
              <Button size="sm" variant="outline" className="h-8 gap-1 text-destructive hover:text-destructive" onClick={() => setRejectDialog({ open: true, id: g.id })}>
                <XCircle className="w-3.5 h-3.5" /> Afwijzen
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Goedkeuringen
            {inBehandeling.length > 0 && (
              <Badge variant="default" className="ml-1">{inBehandeling.length}</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Beheer aangevraagde acties die goedkeuring vereisen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="open">
            <TabsList>
              <TabsTrigger value="open">Open ({inBehandeling.length})</TabsTrigger>
              <TabsTrigger value="historie">Historie</TabsTrigger>
            </TabsList>
            <TabsContent value="open" className="space-y-2 mt-4">
              {inBehandeling.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Geen openstaande verzoeken.</p>
              ) : (
                inBehandeling.map(renderVerzoek)
              )}
            </TabsContent>
            <TabsContent value="historie" className="space-y-2 mt-4">
              {goedkeuringen.filter(g => g.status !== "in_behandeling").length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Nog geen historie.</p>
              ) : (
                goedkeuringen.filter(g => g.status !== "in_behandeling").map(renderVerzoek)
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Goedkeuringsregels
            </CardTitle>
            <CardDescription>
              Stel in welke acties een goedkeuring vereisen van een leidinggevende of beheerder.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5" /> Verwijderacties
              </p>
              <div className="space-y-1">
                {ACTIE_TYPES.filter(a => a.category === "verwijderen").map((actie) => {
                  const regel = getRegel(actie.key);
                  const actief = regel?.actief ?? false;
                  return (
                    <div key={actie.key} className="flex items-center justify-between py-2.5 px-3 rounded-lg border border-border">
                      <span className="text-sm font-medium text-foreground">{actie.label}</span>
                      <Switch checked={actief} onCheckedChange={(v) => handleToggle(actie.key, v)} />
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Euro className="w-3.5 h-3.5" /> Financiële drempels
              </p>
              <div className="space-y-1">
                {ACTIE_TYPES.filter(a => a.category === "financieel").map((actie) => {
                  const regel = getRegel(actie.key);
                  const actief = regel?.actief ?? false;
                  const drempel = drempelInputs[actie.key] ?? (regel?.drempel_bedrag?.toString() ?? "");
                  return (
                    <div key={actie.key} className="py-2.5 px-3 rounded-lg border border-border space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">{actie.label}</span>
                        <Switch checked={actief} onCheckedChange={(v) => handleToggle(actie.key, v)} />
                      </div>
                      {actief && (
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-xs text-muted-foreground shrink-0">Drempel €</span>
                          <Input
                            type="number"
                            value={drempel}
                            placeholder="bv. 500"
                            onChange={(e) => setDrempelInputs({ ...drempelInputs, [actie.key]: e.target.value })}
                            className="h-8 text-sm"
                          />
                          <Button size="sm" variant="outline" className="h-8" onClick={() => handleDrempelSave(actie.key)}>
                            Opslaan
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={rejectDialog.open} onOpenChange={(open) => !open && setRejectDialog({ open: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verzoek afwijzen</DialogTitle>
            <DialogDescription>Geef optioneel een reden mee voor de aanvrager.</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reden van afwijzing (optioneel)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog({ open: false })}>Annuleren</Button>
            <Button variant="destructive" onClick={handleReject}>Afwijzen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
