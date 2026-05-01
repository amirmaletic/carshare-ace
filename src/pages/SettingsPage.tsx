import { useEffect, useState } from "react";
import { Settings, Shield, Bell, Building2, Save, LogOut, KeyRound, MapPin, Users, ShieldCheck, Globe, ChevronRight, Plug, Webhook } from "lucide-react";
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
import { useBedrijfsgegevens, type Bedrijfsgegevens } from "@/hooks/useBedrijfsgegevens";
import { useOrganisatieVoorkeuren, type Voorkeuren } from "@/hooks/useOrganisatieVoorkeuren";
import { usePermissions } from "@/hooks/usePermissions";
import AutorisatieTab from "@/components/settings/AutorisatieTab";
import LocatiesTab from "@/components/settings/LocatiesTab";
import TeamTab from "@/components/settings/TeamTab";
import GoedkeuringenTab from "@/components/settings/GoedkeuringenTab";
import PortaalTab from "@/components/settings/PortaalTab";
import IntegratiesTab from "@/components/settings/IntegratiesTab";
import ApiWebhooksTab from "@/components/settings/ApiWebhooksTab";

type TabDef = { value: string; label: string; icon: any; description: string; group: string };
const tabs: TabDef[] = [
  { value: "bedrijf", label: "Bedrijf", icon: Building2, description: "Naam, adres en facturatiegegevens", group: "Organisatie" },
  { value: "portaal", label: "Klantportaal", icon: Globe, description: "White-label boekomgeving en domeinen", group: "Organisatie" },
  { value: "team", label: "Team", icon: Users, description: "Medewerkers en uitnodigingen", group: "Organisatie" },
  { value: "locaties", label: "Locaties", icon: MapPin, description: "Vestigingen en pickup-punten", group: "Organisatie" },
  { value: "autorisatie", label: "Autorisatie", icon: KeyRound, description: "Rollen en rechten per module", group: "Toegang" },
  { value: "goedkeuringen", label: "Goedkeuringen", icon: ShieldCheck, description: "Workflow voor acties met drempelwaarde", group: "Toegang" },
  { value: "integraties", label: "Integraties", icon: Plug, description: "Koppelingen met RDW, boekhouding en betalingen", group: "Voorkeuren" },
  { value: "api", label: "API & Webhooks", icon: Webhook, description: "Open API met API keys en realtime webhooks", group: "Voorkeuren" },
  { value: "notificaties", label: "Meldingen", icon: Bell, description: "Herinneringen voor APK, contracten en facturen", group: "Voorkeuren" },
  { value: "algemeen", label: "Algemeen", icon: Settings, description: "BTW, valuta, datumformaat", group: "Voorkeuren" },
  { value: "account", label: "Account", icon: Shield, description: "Wachtwoord, sessies en uitloggen", group: "Voorkeuren" },
];

export default function SettingsPage() {
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();
  const { userRoles } = usePermissions();
  const isBeheerder = userRoles.includes("beheerder");

  const [activeTab, setActiveTab] = useState("bedrijf");

  const { data: bedrijfsData, save: saveBedrijf } = useBedrijfsgegevens();
  const { data: voorkeurenData, save: saveVoorkeuren } = useOrganisatieVoorkeuren();

  const [bedrijf, setBedrijf] = useState<Bedrijfsgegevens>(bedrijfsData);
  const [voorkeuren, setVoorkeuren] = useState<Voorkeuren>(voorkeurenData);

  // Sync server data into local form state
  useEffect(() => { setBedrijf(bedrijfsData); }, [bedrijfsData]);
  useEffect(() => { setVoorkeuren(voorkeurenData); }, [voorkeurenData]);

  const handleSaveBedrijf = () => {
    if (!isBeheerder) {
      toast({ title: "Geen rechten", description: "Alleen beheerders kunnen bedrijfsgegevens wijzigen.", variant: "destructive" });
      return;
    }
    saveBedrijf.mutate(bedrijf, {
      onSuccess: () => toast({ title: "Opgeslagen", description: "Bedrijfsgegevens zijn bijgewerkt." }),
      onError: (e: Error) => toast({ title: "Fout bij opslaan", description: e.message, variant: "destructive" }),
    });
  };

  const handleSaveVoorkeuren = (label: string) => {
    if (!isBeheerder) {
      toast({ title: "Geen rechten", description: "Alleen beheerders kunnen voorkeuren wijzigen.", variant: "destructive" });
      return;
    }
    saveVoorkeuren.mutate(voorkeuren, {
      onSuccess: () => toast({ title: "Opgeslagen", description: `${label} zijn bijgewerkt.` }),
      onError: (e: Error) => toast({ title: "Fout bij opslaan", description: e.message, variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">Instellingen</h1>
        <p className="text-sm text-muted-foreground">Beheer je organisatie, team en voorkeuren.</p>
      </header>

      {isMobile ? (
        <div className="space-y-4">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-full h-11">
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
        <div className="grid grid-cols-[260px_1fr] gap-8 items-start">
          {/* Side navigation */}
          <aside className="sticky top-6 space-y-6">
            {Array.from(new Set(tabs.map((t) => t.group))).map((group) => (
              <div key={group} className="space-y-1">
                <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{group}</p>
                <nav className="space-y-0.5">
                  {tabs.filter((t) => t.group === group).map((t) => {
                    const isActive = activeTab === t.value;
                    return (
                      <button
                        key={t.value}
                        onClick={() => setActiveTab(t.value)}
                        className={`group w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                          isActive
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        }`}
                      >
                        <t.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-primary" : ""}`} />
                        <span className="flex-1 text-left">{t.label}</span>
                        <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isActive ? "translate-x-0 opacity-100" : "-translate-x-1 opacity-0 group-hover:opacity-50 group-hover:translate-x-0"}`} />
                      </button>
                    );
                  })}
                </nav>
              </div>
            ))}
          </aside>

          {/* Content panel */}
          <div className="min-w-0 space-y-5 max-w-3xl">
            {(() => {
              const current = tabs.find((t) => t.value === activeTab);
              if (!current) return null;
              const Icon = current.icon;
              return (
                <div className="flex items-start gap-3 pb-4 border-b border-border">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">{current.label}</h2>
                    <p className="text-sm text-muted-foreground">{current.description}</p>
                  </div>
                </div>
              );
            })()}
            {renderTabContent(activeTab)}
          </div>
        </div>
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

      case "team":
        return <TeamTab />;

      case "portaal":
        return <PortaalTab />;

      case "locaties":
        return <LocatiesTab />;

      case "autorisatie":
        return <AutorisatieTab />;

      case "goedkeuringen":
        return <GoedkeuringenTab />;

      case "integraties":
        return <IntegratiesTab />;

      case "api":
        return <ApiWebhooksTab />;

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
