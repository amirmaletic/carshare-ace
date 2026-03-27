import { useState, useEffect } from "react";
import { Settings, Shield, Bell, Building2, Save, LogOut, KeyRound, MapPin } from "lucide-react";
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
import { useIsMobile } from "@/hooks/use-mobile";
import AutorisatieTab from "@/components/settings/AutorisatieTab";
import LocatiesTab from "@/components/settings/LocatiesTab";

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
  bedrijfsnaam: "", kvkNummer: "", btwNummer: "", adres: "", postcode: "", plaats: "", telefoon: "", email: "",
};

const defaultNotificaties: NotificatieInstellingen = {
  apkHerinnering: true, apkDagenVooraf: "30", verzekeringHerinnering: true, onderhoudHerinnering: true,
  contractVerloop: true, contractDagenVooraf: "60", factuurHerinnering: true, kmOverschrijding: true,
};

const defaultAlgemeen: AlgemeneInstellingen = {
  standaardBtw: "21", valuta: "EUR", datumFormaat: "dd-mm-yyyy", kmRegistratieInterval: "maandelijks", standaardContractDuur: "12",
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

const tabs = [
  { value: "bedrijf", label: "Bedrijf", icon: Building2 },
  { value: "notificaties", label: "Meldingen", icon: Bell },
  { value: "locaties", label: "Locaties", icon: MapPin },
  { value: "autorisatie", label: "Autorisatie", icon: KeyRound },
  { value: "algemeen", label: "Algemeen", icon: Settings },
  { value: "account", label: "Account", icon: Shield },
];

export default function SettingsPage() {
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();

  const [activeTab, setActiveTab] = useState("bedrijf");
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
        <h1 className="text-2xl font-bold text-foreground">Instellingen</h1>
        <p className="text-muted-foreground mt-1">Beheer je account en applicatie-instellingen</p>
      </div>

      {isMobile ? (
        /* Mobile: dropdown selector + content */
        <div className="space-y-4">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tabs.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  <div className="flex items-center gap-2">
                    <t.icon className="w-4 h-4" />
                    {t.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div>{renderTabContent(activeTab)}</div>
        </div>
      ) : (
        /* Desktop: normal tabs */
        <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-3xl">
          <TabsList className="grid w-full grid-cols-6">
            {tabs.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="gap-1.5 text-xs sm:text-sm">
                <t.icon className="w-4 h-4 hidden sm:block" /> {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {tabs.map((t) => (
            <TabsContent key={t.value} value={t.value} className="space-y-4 mt-4">
              {renderTabContent(t.value)}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );

  function renderTabContent(tab: string) {
    switch (tab) {
      case "bedrijf":
        return (
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
        );

      case "notificaties":
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notificatie-instellingen</CardTitle>
              <CardDescription>Stel in welke automatische meldingen je wilt ontvangen.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {[
                { key: "apkHerinnering", label: "APK-herinnering", desc: "Ontvang een melding voordat de APK verloopt", select: { key: "apkDagenVooraf" as const, options: ["14", "30", "60"], suffix: "dagen" } },
                { key: "verzekeringHerinnering", label: "Verzekering-herinnering", desc: "Melding bij verlopen verzekering" },
                { key: "onderhoudHerinnering", label: "Onderhouds-herinnering", desc: "Melding bij gepland onderhoud" },
                { key: "contractVerloop", label: "Contract-verloop", desc: "Herinnering voordat een contract verloopt", select: { key: "contractDagenVooraf" as const, options: ["30", "60", "90"], suffix: "dagen" } },
                { key: "factuurHerinnering", label: "Factuur-herinnering", desc: "Melding bij openstaande facturen" },
                { key: "kmOverschrijding", label: "Kilometer-overschrijding", desc: "Waarschuwing wanneer km-limiet bijna bereikt is" },
              ].map((item, idx) => (
                <div key={item.key}>
                  {idx > 0 && <Separator className="mb-5" />}
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {item.select && (
                        <Select value={notificaties[item.select.key]} onValueChange={(v) => setNotificaties({ ...notificaties, [item.select!.key]: v })}>
                          <SelectTrigger className="w-20 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {item.select.options.map((o) => (
                              <SelectItem key={o} value={o}>{o} {item.select!.suffix}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <Switch
                        checked={notificaties[item.key as keyof NotificatieInstellingen] as boolean}
                        onCheckedChange={(v) => setNotificaties({ ...notificaties, [item.key]: v })}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex justify-end pt-2">
                <Button onClick={handleSaveNotificaties} className="gap-2">
                  <Save className="w-4 h-4" /> Opslaan
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case "locaties":
        return <LocatiesTab />;

      case "autorisatie":
        return <AutorisatieTab />;

      case "algemeen":
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Algemene instellingen</CardTitle>
              <CardDescription>Standaardwaarden en voorkeuren voor de applicatie.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { label: "Standaard BTW-tarief", value: algemeen.standaardBtw, key: "standaardBtw", options: [{ v: "0", l: "0%" }, { v: "9", l: "9%" }, { v: "21", l: "21%" }] },
                  { label: "Valuta", value: algemeen.valuta, key: "valuta", options: [{ v: "EUR", l: "Euro (€)" }, { v: "USD", l: "Dollar ($)" }, { v: "GBP", l: "Pond (£)" }] },
                  { label: "Datumformaat", value: algemeen.datumFormaat, key: "datumFormaat", options: [{ v: "dd-mm-yyyy", l: "DD-MM-YYYY" }, { v: "yyyy-mm-dd", l: "YYYY-MM-DD" }, { v: "mm-dd-yyyy", l: "MM-DD-YYYY" }] },
                  { label: "KM-registratie interval", value: algemeen.kmRegistratieInterval, key: "kmRegistratieInterval", options: [{ v: "wekelijks", l: "Wekelijks" }, { v: "maandelijks", l: "Maandelijks" }, { v: "per_kwartaal", l: "Per kwartaal" }] },
                  { label: "Standaard contractduur", value: algemeen.standaardContractDuur, key: "standaardContractDuur", options: [{ v: "6", l: "6 maanden" }, { v: "12", l: "12 maanden" }, { v: "24", l: "24 maanden" }, { v: "36", l: "36 maanden" }, { v: "48", l: "48 maanden" }] },
                ].map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label>{field.label}</Label>
                    <Select value={field.value} onValueChange={(v) => setAlgemeen({ ...algemeen, [field.key]: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {field.options.map((o) => (
                          <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={handleSaveAlgemeen} className="gap-2">
                  <Save className="w-4 h-4" /> Opslaan
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case "account":
        return (
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
              <Button variant="destructive" onClick={signOut} className="gap-2">
                <LogOut className="w-4 h-4" /> Uitloggen
              </Button>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  }
}
