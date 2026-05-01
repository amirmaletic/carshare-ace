import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  useIsPlatformAdmin,
  useAdminOrganisaties,
  useAdminOrganisatieDetail,
  useUpdateOrganisatie,
  useGrantPlatformAdmin,
  useDeleteOrganisatie,
  type AdminOrgRow,
} from "@/hooks/usePlatformAdmin";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, formatDistanceToNow, addDays } from "date-fns";
import { nl } from "date-fns/locale";
import {
  Search, Building2, Users, Car, FileText, Activity, Calendar, Shield,
  AlertTriangle, CheckCircle2, XCircle, RefreshCw, Trash2,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminPlatform() {
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: roleLoading } = useIsPlatformAdmin();
  const { data: orgs = [], isLoading, refetch } = useAdminOrganisaties();
  const [search, setSearch] = useState("");
  const [selectedOrg, setSelectedOrg] = useState<AdminOrgRow | null>(null);
  const [grantOpen, setGrantOpen] = useState(false);
  const [grantEmail, setGrantEmail] = useState("");
  const grantMutation = useGrantPlatformAdmin();

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 space-y-4 text-center">
            <Shield className="w-12 h-12 text-muted-foreground mx-auto" />
            <h1 className="text-xl font-semibold text-foreground">Geen toegang</h1>
            <p className="text-sm text-muted-foreground">
              Deze pagina is alleen voor FleeFlo platform-beheerders.
            </p>
            <p className="text-xs text-muted-foreground">
              Eerste keer? Voeg jezelf toe als platform-admin via je e-mailadres.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  await grantMutation.mutateAsync(user.email!);
                  toast.success("Je bent nu platform-admin. Vernieuw de pagina.");
                  setTimeout(() => window.location.reload(), 800);
                } catch (e: any) {
                  toast.error(e.message || "Mislukt");
                }
              }}
            >
              Maak mij platform-admin (alleen mogelijk als nog geen admin bestaat)
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filtered = orgs.filter((o) => {
    const q = search.toLowerCase();
    return (
      o.naam.toLowerCase().includes(q) ||
      (o.eigenaar_email || "").toLowerCase().includes(q)
    );
  });

  const totaalActief = orgs.filter((o) => o.is_active).length;
  const totaalInTrial = orgs.filter((o) => o.trial_ends_at && new Date(o.trial_ends_at) > new Date()).length;
  const totaalVerlopen = orgs.filter((o) => o.trial_ends_at && new Date(o.trial_ends_at) <= new Date()).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b border-border bg-card">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">FleeFlo Platform Admin</h1>
              <p className="text-xs text-muted-foreground">Beheer alle klant-omgevingen</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Verversen
            </Button>
            <Button variant="outline" size="sm" onClick={() => setGrantOpen(true)}>
              <Users className="w-3.5 h-3.5 mr-1.5" /> Admin uitnodigen
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{orgs.length}</p>
            <p className="text-xs text-muted-foreground">Totaal omgevingen</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{totaalActief}</p>
            <p className="text-xs text-muted-foreground">Actief</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{totaalInTrial}</p>
            <p className="text-xs text-muted-foreground">In trial</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-destructive">{totaalVerlopen}</p>
            <p className="text-xs text-muted-foreground">Trial verlopen</p>
          </CardContent></Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Zoek op naam of e-mail van eigenaar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-10 text-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" /></div>
            ) : filtered.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">Geen omgevingen gevonden</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organisatie</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Trial einddatum</TableHead>
                    <TableHead className="text-right">Gebruikers</TableHead>
                    <TableHead className="text-right">Voertuigen</TableHead>
                    <TableHead className="text-right">Contracten</TableHead>
                    <TableHead className="text-right">Klanten</TableHead>
                    <TableHead>Laatste inlog</TableHead>
                    <TableHead>Laatste activiteit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((o) => {
                    const trialDate = o.trial_ends_at ? new Date(o.trial_ends_at) : null;
                    const trialExpired = trialDate ? trialDate <= new Date() : false;
                    return (
                      <TableRow
                        key={o.id}
                        className="cursor-pointer"
                        onClick={() => setSelectedOrg(o)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate">{o.naam}</p>
                              <p className="text-xs text-muted-foreground truncate">{o.eigenaar_email || "-"}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {o.is_active ? (
                            <Badge variant="default" className="gap-1"><CheckCircle2 className="w-3 h-3" /> Actief</Badge>
                          ) : (
                            <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" /> Gepauzeerd</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {trialDate ? (
                            <span className={`text-xs ${trialExpired ? "text-destructive font-medium" : "text-foreground"}`}>
                              {format(trialDate, "d MMM yyyy", { locale: nl })}
                              {trialExpired && <AlertTriangle className="w-3 h-3 inline ml-1" />}
                            </span>
                          ) : <span className="text-xs text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell className="text-right">{o.user_count}</TableCell>
                        <TableCell className="text-right">{o.voertuig_count}</TableCell>
                        <TableCell className="text-right">{o.contract_count}</TableCell>
                        <TableCell className="text-right">{o.klant_count}</TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">
                            {o.laatste_inlog_org
                              ? formatDistanceToNow(new Date(o.laatste_inlog_org), { addSuffix: true, locale: nl })
                              : "Nooit"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">
                            {o.laatste_activiteit
                              ? formatDistanceToNow(new Date(o.laatste_activiteit), { addSuffix: true, locale: nl })
                              : "Geen"}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <OrgDetailDialog org={selectedOrg} onClose={() => setSelectedOrg(null)} />

      <Dialog open={grantOpen} onOpenChange={setGrantOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Platform-admin uitnodigen</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label>E-mailadres van bestaande gebruiker</Label>
            <Input value={grantEmail} onChange={(e) => setGrantEmail(e.target.value)} placeholder="naam@fleeflo.nl" />
            <p className="text-xs text-muted-foreground">
              De gebruiker moet al een account hebben (bijv. via /auth) voordat je hem als platform-admin kunt aanwijzen.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGrantOpen(false)}>Annuleren</Button>
            <Button
              onClick={async () => {
                try {
                  await grantMutation.mutateAsync(grantEmail);
                  toast.success("Platform-admin rol toegekend");
                  setGrantOpen(false);
                  setGrantEmail("");
                } catch (e: any) {
                  toast.error(e.message || "Mislukt");
                }
              }}
              disabled={!grantEmail || grantMutation.isPending}
            >
              Toevoegen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OrgDetailDialog({ org, onClose }: { org: AdminOrgRow | null; onClose: () => void }) {
  const { data: detail, isLoading } = useAdminOrganisatieDetail(org?.id ?? null);
  const updateMutation = useUpdateOrganisatie();
  const deleteMutation = useDeleteOrganisatie();
  const [editNaam, setEditNaam] = useState("");
  const [editTrial, setEditTrial] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  if (!org) return null;

  const stats = detail?.stats ?? {};
  const gebruikers = detail?.gebruikers ?? [];
  const activiteit = detail?.recente_activiteit ?? [];

  const currentNaam = editNaam || org.naam;
  const currentTrial = editTrial || (org.trial_ends_at ? org.trial_ends_at.slice(0, 10) : "");

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        org_id: org.id,
        naam: currentNaam !== org.naam ? currentNaam : undefined,
        trial_ends_at: currentTrial ? new Date(currentTrial).toISOString() : undefined,
      });
      toast.success("Opgeslagen");
      setEditNaam("");
      setEditTrial("");
    } catch (e: any) {
      toast.error(e.message || "Mislukt");
    }
  };

  const handleToggleActive = async () => {
    try {
      await updateMutation.mutateAsync({ org_id: org.id, is_active: !org.is_active });
      toast.success(org.is_active ? "Omgeving gepauzeerd" : "Omgeving geactiveerd");
    } catch (e: any) {
      toast.error(e.message || "Mislukt");
    }
  };

  const extendTrial = async (days: number) => {
    const base = org.trial_ends_at && new Date(org.trial_ends_at) > new Date() ? new Date(org.trial_ends_at) : new Date();
    const newDate = addDays(base, days);
    try {
      await updateMutation.mutateAsync({ org_id: org.id, trial_ends_at: newDate.toISOString() });
      toast.success(`Trial verlengd met ${days} dagen`);
    } catch (e: any) {
      toast.error(e.message || "Mislukt");
    }
  };

  const handleDelete = async () => {
    if (!org) return;
    try {
      await deleteMutation.mutateAsync(org.id);
      toast.success("Omgeving verwijderd");
      setDeleteOpen(false);
      setDeleteConfirm("");
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Verwijderen mislukt");
    }
  };

  return (
    <Dialog open={!!org} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            {org.naam}
            {org.is_active ? (
              <Badge variant="default">Actief</Badge>
            ) : (
              <Badge variant="destructive">Gepauzeerd</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="beheer">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="beheer">Beheer</TabsTrigger>
            <TabsTrigger value="stats">Statistieken</TabsTrigger>
            <TabsTrigger value="gebruikers">Gebruikers ({gebruikers.length})</TabsTrigger>
            <TabsTrigger value="activiteit">Activiteit</TabsTrigger>
          </TabsList>

          <TabsContent value="beheer" className="space-y-4 mt-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-1.5">
                  <Label>Organisatienaam</Label>
                  <Input value={currentNaam} onChange={(e) => setEditNaam(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Trial einddatum</Label>
                  <Input type="date" value={currentTrial} onChange={(e) => setEditTrial(e.target.value)} />
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" variant="outline" onClick={() => extendTrial(7)}>+7 dagen</Button>
                    <Button size="sm" variant="outline" onClick={() => extendTrial(30)}>+30 dagen</Button>
                    <Button size="sm" variant="outline" onClick={() => extendTrial(90)}>+90 dagen</Button>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div>
                    <Label>Omgeving actief</Label>
                    <p className="text-xs text-muted-foreground">
                      {org.is_active ? "Gebruikers kunnen inloggen" : "Toegang gepauzeerd"}
                    </p>
                  </div>
                  <Switch checked={org.is_active} onCheckedChange={handleToggleActive} />
                </div>
                <Button className="w-full" onClick={handleSave} disabled={updateMutation.isPending}>
                  Wijzigingen opslaan
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-xs text-muted-foreground space-y-1">
                <p>Eigenaar: <span className="text-foreground">{detail?.eigenaar_email || org.eigenaar_email || "-"}</span></p>
                <p>Aangemaakt: <span className="text-foreground">{format(new Date(org.created_at), "d MMM yyyy HH:mm", { locale: nl })}</span></p>
                <p>Organisatie-ID: <code className="text-foreground">{org.id}</code></p>
              </CardContent>
            </Card>

            <Card className="border-destructive/40">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Gevarenzone</p>
                    <p className="text-xs text-muted-foreground">
                      Verwijder deze omgeving permanent, inclusief alle voertuigen, contracten, klanten en historie. Dit kan niet ongedaan worden gemaakt.
                    </p>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Omgeving verwijderen
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="mt-4">
            {isLoading ? (
              <div className="p-6 text-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" /></div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <StatCard icon={Car} label="Voertuigen" value={stats.voertuigen ?? 0} />
                <StatCard icon={FileText} label="Contracten" value={stats.contracten ?? 0} />
                <StatCard icon={Users} label="Klanten" value={stats.klanten ?? 0} />
                <StatCard icon={Calendar} label="Reserveringen" value={stats.reserveringen ?? 0} />
                <StatCard icon={Activity} label="Ritten" value={stats.ritten ?? 0} />
                <StatCard icon={Users} label="Chauffeurs" value={stats.chauffeurs ?? 0} />
              </div>
            )}
          </TabsContent>

          <TabsContent value="gebruikers" className="mt-4 space-y-2">
            {gebruikers.length === 0 ? (
              <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">Geen gebruikers</CardContent></Card>
            ) : (
              gebruikers.map((g: any, idx: number) => (
                <div key={`${g.user_id}-${g.role}-${idx}`} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{g.email || g.user_id}</p>
                    <p className="text-xs text-muted-foreground">
                      Toegevoegd {format(new Date(g.created_at), "d MMM yyyy", { locale: nl })}
                      {" · "}
                      Laatste inlog:{" "}
                      {g.last_sign_in_at
                        ? formatDistanceToNow(new Date(g.last_sign_in_at), { addSuffix: true, locale: nl })
                        : "nooit"}
                    </p>
                  </div>
                  <Badge variant="outline">{g.role}</Badge>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="activiteit" className="mt-4 space-y-1">
            {activiteit.length === 0 ? (
              <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">Geen activiteit gevonden</CardContent></Card>
            ) : (
              activiteit.map((a: any, idx: number) => (
                <div key={idx} className="flex items-start gap-3 text-sm border-b border-border py-2 last:border-0">
                  <Activity className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground">{a.beschrijving}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.actie} {a.entiteit_type && `· ${a.entiteit_type}`} ·{" "}
                      {formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: nl })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Omgeving definitief verwijderen
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-foreground">
              Je staat op het punt <strong>{org.naam}</strong> en alle bijbehorende data permanent te verwijderen.
            </p>
            <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-0.5">
              <li>{org.voertuig_count} voertuigen</li>
              <li>{org.contract_count} contracten</li>
              <li>{org.klant_count} klanten</li>
              <li>{org.user_count} gebruikersrollen</li>
              <li>Alle ritten, schade, onderhoud en historie</li>
            </ul>
            <div className="space-y-1.5 pt-2">
              <Label className="text-xs">
                Typ <code className="text-foreground">{org.naam}</code> om te bevestigen
              </Label>
              <Input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder={org.naam}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteOpen(false); setDeleteConfirm(""); }}>
              Annuleren
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteConfirm !== org.naam || deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Verwijderen..." : "Definitief verwijderen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <Icon className="w-4 h-4" />
          <span className="text-xs">{label}</span>
        </div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}