import { useState, useEffect } from "react";
import { Settings, Shield, Bell, Database, Building2, Save, LogOut } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface BedrijfsInstellingen {
  bedrijfsnaam: string;
  kvkNummer: string;
  btwNummer: string;
  adres: string;
  postcode: string;
  plaats: string;
  telefoon: string;
  email: string;
}

interface NotificatieInstellingen {
  apkHerinnering: boolean;
  apkDagenVooraf: string;
  verzekeringHerinnering: boolean;
  onderhoudHerinnering: boolean;
  contractVerloop: boolean;
  contractDagenVooraf: string;
  factuurHerinnering: boolean;
  kmOverschrijding: boolean;
}

interface AlgemeneInstellingen {
  standaardBtw: string;
  valuta: string;
  datumFormaat: string;
  kmRegistratieInterval: string;
  standaardContractDuur: string;
}

const defaultBedrijf: BedrijfsInstellingen = {
  bedrijfsnaam: "",
  kvkNummer: "",
  btwNummer: "",
  adres: "",
  postcode: "",
  plaats: "",
  telefoon: "",
  email: "",
};

const defaultNotificaties: NotificatieInstellingen = {
  apkHerinnering: true,
  apkDagenVooraf: "30",
  verzekeringHerinnering: true,
  onderhoudHerinnering: true,
  contractVerloop: true,
  contractDagenVooraf: "60",
  factuurHerinnering: true,
  kmOverschrijding: true,
};

const defaultAlgemeen: AlgemeneInstellingen = {
  standaardBtw: "21",
  valuta: "EUR",
  datumFormaat: "dd-mm-yyyy",
  kmRegistratieInterval: "maandelijks",
  standaardContractDuur: "12",
};

function loadSetting<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(`fleetflow_${key}`);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function saveSetting(key: string, value: unknown) {
  localStorage.setItem(`fleetflow_${key}`, JSON.stringify(value));
}

export default function SettingsPage() {
  const { toast } = useToast();
  const { user, signOut } = useAuth();

  const [bedrijf, setBedrijf] = useState<BedrijfsInstellingen>(() => loadSetting("bedrijf", defaultBedrijf));
  const [notificaties, setNotificaties] = useState<NotificatieInstellingen>(() => loadSetting("notificaties", defaultNotificaties));
  const [algemeen, setAlgemeen] = useState<AlgemeneInstellingen>(() => loadSetting("algemeen", defaultAlgemeen));

  const handleSaveBedrijf = () => {
    saveSetting("bedrijf", bedrijf);
    toast({ title: "Opgeslagen", description: "Bedrijfsgegevens zijn bijgewerkt." });
  };

  const handleSaveNotificaties = () => {
    saveSetting("notificaties", notificaties);
    toast({ title: "Opgeslagen", description: "Notificatie-instellingen zijn bijgewerkt." });
  };

  const handleSaveAlgemeen = () => {
    saveSetting("algemeen", algemeen);
    toast({ title: "Opgeslagen", description: "Algemene instellingen zijn bijgewerkt." });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Instellingen</h1>
        <p className="text-muted-foreground mt-1">Beheer je account en applicatie-instellingen</p>
      </div>

      <Tabs defaultValue="bedrijf" className="max-w-3xl">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="bedrijf" className="gap-1.5 text-xs sm:text-sm">
            <Building2 className="w-4 h-4 hidden sm:block" /> Bedrijf
          </TabsTrigger>
          <TabsTrigger value="notificaties" className="gap-1.5 text-xs sm:text-sm">
            <Bell className="w-4 h-4 hidden sm:block" /> Meldingen
          </TabsTrigger>
          <TabsTrigger value="algemeen" className="gap-1.5 text-xs sm:text-sm">
            <Settings className="w-4 h-4 hidden sm:block" /> Algemeen
          </TabsTrigger>
          <TabsTrigger value="account" className="gap-1.5 text-xs sm:text-sm">
            <Shield className="w-4 h-4 hidden sm:block" /> Account
          </TabsTrigger>
        </TabsList>

        {/* Bedrijfsgegevens */}
        <TabsContent value="bedrijf" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Bedrijfsgegevens</CardTitle>
              <CardDescription>Deze gegevens worden gebruikt op contracten en facturen.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="bedrijfsnaam">Bedrijfsnaam</Label>
                  <Input id="bedrijfsnaam" value={bedrijf.bedrijfsnaam} onChange={(e) => setBedrijf({ ...bedrijf, bedrijfsnaam: e.target.value })} placeholder="Mijn Bedrijf B.V." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kvk">KVK-nummer</Label>
                  <Input id="kvk" value={bedrijf.kvkNummer} onChange={(e) => setBedrijf({ ...bedrijf, kvkNummer: e.target.value })} placeholder="12345678" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="btw">BTW-nummer</Label>
                  <Input id="btw" value={bedrijf.btwNummer} onChange={(e) => setBedrijf({ ...bedrijf, btwNummer: e.target.value })} placeholder="NL123456789B01" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefoon">Telefoon</Label>
                  <Input id="telefoon" value={bedrijf.telefoon} onChange={(e) => setBedrijf({ ...bedrijf, telefoon: e.target.value })} placeholder="+31 6 12345678" />
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2 sm:col-span-3">
                  <Label htmlFor="adres">Adres</Label>
                  <Input id="adres" value={bedrijf.adres} onChange={(e) => setBedrijf({ ...bedrijf, adres: e.target.value })} placeholder="Straatnaam 123" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postcode">Postcode</Label>
                  <Input id="postcode" value={bedrijf.postcode} onChange={(e) => setBedrijf({ ...bedrijf, postcode: e.target.value })} placeholder="1234 AB" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plaats">Plaats</Label>
                  <Input id="plaats" value={bedrijf.plaats} onChange={(e) => setBedrijf({ ...bedrijf, plaats: e.target.value })} placeholder="Amsterdam" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bedrijf-email">E-mail</Label>
                  <Input id="bedrijf-email" type="email" value={bedrijf.email} onChange={(e) => setBedrijf({ ...bedrijf, email: e.target.value })} placeholder="info@bedrijf.nl" />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={handleSaveBedrijf} className="gap-2">
                  <Save className="w-4 h-4" /> Opslaan
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notificaties */}
        <TabsContent value="notificaties" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notificatie-instellingen</CardTitle>
              <CardDescription>Stel in welke automatische meldingen je wilt ontvangen.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">APK-herinnering</p>
                  <p className="text-xs text-muted-foreground">Ontvang een melding voordat de APK verloopt</p>
                </div>
                <div className="flex items-center gap-3">
                  <Select value={notificaties.apkDagenVooraf} onValueChange={(v) => setNotificaties({ ...notificaties, apkDagenVooraf: v })}>
                    <SelectTrigger className="w-24 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="14">14 dagen</SelectItem>
                      <SelectItem value="30">30 dagen</SelectItem>
                      <SelectItem value="60">60 dagen</SelectItem>
                    </SelectContent>
                  </Select>
                  <Switch checked={notificaties.apkHerinnering} onCheckedChange={(v) => setNotificaties({ ...notificaties, apkHerinnering: v })} />
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Verzekering-herinnering</p>
                  <p className="text-xs text-muted-foreground">Melding bij verlopen verzekering</p>
                </div>
                <Switch checked={notificaties.verzekeringHerinnering} onCheckedChange={(v) => setNotificaties({ ...notificaties, verzekeringHerinnering: v })} />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Onderhouds-herinnering</p>
                  <p className="text-xs text-muted-foreground">Melding bij gepland onderhoud</p>
                </div>
                <Switch checked={notificaties.onderhoudHerinnering} onCheckedChange={(v) => setNotificaties({ ...notificaties, onderhoudHerinnering: v })} />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Contract-verloop</p>
                  <p className="text-xs text-muted-foreground">Herinnering voordat een contract verloopt</p>
                </div>
                <div className="flex items-center gap-3">
                  <Select value={notificaties.contractDagenVooraf} onValueChange={(v) => setNotificaties({ ...notificaties, contractDagenVooraf: v })}>
                    <SelectTrigger className="w-24 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 dagen</SelectItem>
                      <SelectItem value="60">60 dagen</SelectItem>
                      <SelectItem value="90">90 dagen</SelectItem>
                    </SelectContent>
                  </Select>
                  <Switch checked={notificaties.contractVerloop} onCheckedChange={(v) => setNotificaties({ ...notificaties, contractVerloop: v })} />
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Factuur-herinnering</p>
                  <p className="text-xs text-muted-foreground">Melding bij openstaande facturen</p>
                </div>
                <Switch checked={notificaties.factuurHerinnering} onCheckedChange={(v) => setNotificaties({ ...notificaties, factuurHerinnering: v })} />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Kilometer-overschrijding</p>
                  <p className="text-xs text-muted-foreground">Waarschuwing wanneer km-limiet bijna bereikt is</p>
                </div>
                <Switch checked={notificaties.kmOverschrijding} onCheckedChange={(v) => setNotificaties({ ...notificaties, kmOverschrijding: v })} />
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={handleSaveNotificaties} className="gap-2">
                  <Save className="w-4 h-4" /> Opslaan
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Algemeen */}
        <TabsContent value="algemeen" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Algemene instellingen</CardTitle>
              <CardDescription>Standaardwaarden en voorkeuren voor de applicatie.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Standaard BTW-tarief</Label>
                  <Select value={algemeen.standaardBtw} onValueChange={(v) => setAlgemeen({ ...algemeen, standaardBtw: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0%</SelectItem>
                      <SelectItem value="9">9%</SelectItem>
                      <SelectItem value="21">21%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Valuta</Label>
                  <Select value={algemeen.valuta} onValueChange={(v) => setAlgemeen({ ...algemeen, valuta: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                      <SelectItem value="USD">Dollar ($)</SelectItem>
                      <SelectItem value="GBP">Pond (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Datumformaat</Label>
                  <Select value={algemeen.datumFormaat} onValueChange={(v) => setAlgemeen({ ...algemeen, datumFormaat: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dd-mm-yyyy">DD-MM-YYYY</SelectItem>
                      <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                      <SelectItem value="mm-dd-yyyy">MM-DD-YYYY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>KM-registratie interval</Label>
                  <Select value={algemeen.kmRegistratieInterval} onValueChange={(v) => setAlgemeen({ ...algemeen, kmRegistratieInterval: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wekelijks">Wekelijks</SelectItem>
                      <SelectItem value="maandelijks">Maandelijks</SelectItem>
                      <SelectItem value="per_kwartaal">Per kwartaal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Standaard contractduur</Label>
                  <Select value={algemeen.standaardContractDuur} onValueChange={(v) => setAlgemeen({ ...algemeen, standaardContractDuur: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6">6 maanden</SelectItem>
                      <SelectItem value="12">12 maanden</SelectItem>
                      <SelectItem value="24">24 maanden</SelectItem>
                      <SelectItem value="36">36 maanden</SelectItem>
                      <SelectItem value="48">48 maanden</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={handleSaveAlgemeen} className="gap-2">
                  <Save className="w-4 h-4" /> Opslaan
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account */}
        <TabsContent value="account" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account</CardTitle>
              <CardDescription>Je accountgegevens en beveiligingsopties.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>E-mailadres</Label>
                <Input value={user?.email ?? ""} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">Je inlog-emailadres kan niet worden gewijzigd.</p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Account-ID</Label>
                <Input value={user?.id ?? ""} disabled className="bg-muted font-mono text-xs" />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Uitloggen</p>
                  <p className="text-xs text-muted-foreground">Log uit van je FleetFlow account</p>
                </div>
                <Button variant="destructive" size="sm" onClick={signOut} className="gap-2">
                  <LogOut className="w-4 h-4" /> Uitloggen
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
