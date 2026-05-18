import { useEffect, useMemo, useRef, useState } from "react";
import {
  Building2, Car, CheckCircle2, ArrowRight, ArrowLeft, Sparkles,
  Users, Plug, Layers, Upload, MapPin, Trash2, FileText, Plus, Loader2, Image as ImageIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useOrganisatie } from "@/hooks/useOrganisatie";
import { useLocaties } from "@/hooks/useLocaties";
import { supabase } from "@/integrations/supabase/client";
import { KvkSearch } from "@/components/KvkSearch";
import { RdwLookup, type RdwVehicleInfo } from "@/components/RdwLookup";
import { AlgemeneVoorwaardenUpload } from "@/components/settings/AlgemeneVoorwaardenUpload";
import { ROLES, type AppRole } from "@/hooks/usePermissions";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

type StepKey = "bedrijf" | "voertuigen" | "team" | "modus";

interface Props {
  onComplete: () => void;
  /** Hervatten vanaf een specifieke stap (vanuit checklist op dashboard). */
  startAt?: StepKey;
}

const stepsMeta: { key: StepKey; icon: any; label: string; sub: string }[] = [
  { key: "bedrijf",    icon: Building2, label: "Bedrijf",       sub: "KVK, logo, locaties, voorwaarden" },
  { key: "voertuigen", icon: Car,       label: "Voertuigen",    sub: "Eerste voertuig of bulk-import" },
  { key: "team",       icon: Users,     label: "Team",          sub: "Collega's uitnodigen, integraties" },
  { key: "modus",      icon: Layers,    label: "Modus",         sub: "Verhuur of wagenpark, klantportaal" },
];

export default function OnboardingWizard({ onComplete, startAt }: Props) {
  const { user } = useAuth();
  const { organisatieId, isLoading: organisatieLoading } = useOrganisatie();
  const qc = useQueryClient();
  const navigate = useNavigate();

  // 0 = welkom, 1..4 = stappen, 5 = klaar
  const startIndex = startAt ? stepsMeta.findIndex((s) => s.key === startAt) + 1 : 0;
  const [step, setStep] = useState(Math.max(0, startIndex));

  const markStep = async (key: StepKey, value: any = true) => {
    if (!organisatieId) return;
    const { data: cur } = await supabase
      .from("organisaties")
      .select("onboarding_steps_completed")
      .eq("id", organisatieId)
      .maybeSingle();
    const next = { ...(cur?.onboarding_steps_completed as any || {}), [key]: value };
    await supabase.from("organisaties").update({ onboarding_steps_completed: next }).eq("id", organisatieId);
    qc.invalidateQueries({ queryKey: ["onboarding-state"] });
  };

  const finish = async () => {
    if (organisatieId) {
      const { data: cur } = await supabase
        .from("organisaties")
        .select("onboarding_steps_completed")
        .eq("id", organisatieId)
        .maybeSingle();
      const next = { ...(cur?.onboarding_steps_completed as any || {}), done: true };
      await supabase.from("organisaties").update({ onboarding_steps_completed: next }).eq("id", organisatieId);
    }
    localStorage.setItem("fleetflow_onboarding_done", "true");
    qc.invalidateQueries({ queryKey: ["onboarding-state"] });
    qc.invalidateQueries({ queryKey: ["onboarding-check"] });
    onComplete();
  };

  const goNext = () => setStep((s) => Math.min(s + 1, 5));
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div className="min-h-screen bg-background grid lg:grid-cols-[320px_1fr]">
      {/* Sidebar met progress */}
      <aside className="hidden lg:flex flex-col border-r border-border bg-muted/30 p-8">
        <div className="flex items-center gap-2 mb-12">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <span className="text-lg font-semibold tracking-tight">FleeFlo setup</span>
        </div>
        <nav className="space-y-1 flex-1">
          {stepsMeta.map((s, i) => {
            const idx = i + 1;
            const active = step === idx;
            const done = step > idx;
            return (
              <button
                key={s.key}
                onClick={() => organisatieId && setStep(idx)}
                className={`w-full text-left flex items-start gap-3 rounded-lg px-3 py-3 transition-colors ${
                  active ? "bg-primary/10 text-foreground" : done ? "text-foreground" : "text-muted-foreground hover:bg-accent"
                }`}
              >
                <div className={`mt-0.5 w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
                  active ? "bg-primary text-primary-foreground" : done ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                }`}>
                  {done ? <CheckCircle2 className="w-4 h-4" /> : idx}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-tight">{s.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
                </div>
              </button>
            );
          })}
        </nav>
        <div className="text-xs text-muted-foreground mt-8">
          Alleen <span className="font-medium text-foreground">bedrijfsnaam</span> is verplicht. De rest kan je later afmaken vanaf je dashboard.
        </div>
      </aside>

      {/* Content */}
      <main className="flex flex-col">
        {/* Mobile progress */}
        <div className="lg:hidden border-b border-border px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Setup</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {step === 0 ? "Welkom" : step === 5 ? "Klaar" : `Stap ${step} van ${stepsMeta.length}`}
          </span>
        </div>

        <div className="flex-1 flex items-center justify-center p-5 sm:p-10">
          <div className="w-full max-w-2xl">
            {step === 0 && <WelcomeStep onNext={() => setStep(1)} />}
            {step === 1 && (
              <BedrijfStep
                onSkip={() => goNext()}
                onSaved={async () => { await markStep("bedrijf"); goNext(); }}
                organisatieLoading={organisatieLoading}
                organisatieId={organisatieId}
              />
            )}
            {step === 2 && (
              <VoertuigStep
                onSkip={() => goNext()}
                onSaved={async () => { await markStep("voertuigen"); goNext(); }}
                userId={user?.id}
                organisatieId={organisatieId}
                onBulkImport={async () => { await markStep("voertuigen", "redirected"); await finish(); navigate("/voertuigen?import=1"); }}
                onBack={goBack}
              />
            )}
            {step === 3 && (
              <TeamStep
                onSkip={() => goNext()}
                onSaved={async () => { await markStep("team"); goNext(); }}
                onBack={goBack}
                userId={user?.id}
                organisatieId={organisatieId}
              />
            )}
            {step === 4 && (
              <ModusStep
                onSkip={() => goNext()}
                onSaved={async () => { await markStep("modus"); goNext(); }}
                onBack={goBack}
                organisatieId={organisatieId}
              />
            )}
            {step === 5 && <DoneStep onFinish={finish} />}
          </div>
        </div>
      </main>
    </div>
  );
}

/* ──────────── Stap 0: Welkom ──────────── */
function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="text-center space-y-8 animate-fade-in">
      <div className="mx-auto w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Sparkles className="w-10 h-10 text-primary" />
      </div>
      <div className="space-y-3">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">Welkom bij FleeFlo</h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto">
          In een paar minuten staat je wagenpark klaar. Je kunt elke stap overslaan en later afmaken.
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto">
        {stepsMeta.map((s) => (
          <div key={s.key} className="rounded-xl border border-border bg-card p-4 text-left">
            <s.icon className="w-5 h-5 text-primary mb-2" />
            <p className="text-sm font-medium">{s.label}</p>
          </div>
        ))}
      </div>
      <Button onClick={onNext} size="lg" className="gap-2">
        Aan de slag <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

/* ──────────── Stap 1: Bedrijf ──────────── */
function BedrijfStep({ onSkip, onSaved, organisatieLoading, organisatieId }: {
  onSkip: () => void; onSaved: () => Promise<void>; organisatieLoading: boolean; organisatieId: string | null;
}) {
  const [form, setForm] = useState({
    naam: "", kvk_nummer: "", telefoon: "", email: "",
    adres: "", postcode: "", plaats: "",
  });
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [logoBusy, setLogoBusy] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);
  const { locaties, addLocatie, deleteLocatie } = useLocaties();
  const [newLoc, setNewLoc] = useState("");

  useEffect(() => {
    if (!organisatieId) return;
    supabase.from("organisaties")
      .select("naam, kvk_nummer, telefoon, email, adres, postcode, plaats, portaal_logo_url")
      .eq("id", organisatieId).maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setForm({
          naam: data.naam ?? "", kvk_nummer: data.kvk_nummer ?? "",
          telefoon: data.telefoon ?? "", email: data.email ?? "",
          adres: data.adres ?? "", postcode: data.postcode ?? "", plaats: data.plaats ?? "",
        });
        setLogoUrl(data.portaal_logo_url ?? null);
      });
  }, [organisatieId]);

  const handleLogo = async (file: File) => {
    if (!organisatieId) return;
    setLogoBusy(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `${organisatieId}/logo-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("portaal-assets").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("portaal-assets").getPublicUrl(path);
      await supabase.from("organisaties").update({ portaal_logo_url: data.publicUrl }).eq("id", organisatieId);
      setLogoUrl(data.publicUrl);
      toast.success("Logo geüpload");
    } catch (e: any) {
      toast.error("Logo upload mislukt: " + e.message);
    } finally { setLogoBusy(false); }
  };

  const save = async () => {
    if (!form.naam.trim()) { toast.error("Vul minimaal een bedrijfsnaam in"); return; }
    if (!organisatieId) { toast.error("Organisatie wordt nog geladen"); return; }
    setSaving(true);
    const { error } = await supabase.from("organisaties").update({
      naam: form.naam.trim(),
      kvk_nummer: form.kvk_nummer.trim() || null,
      telefoon: form.telefoon.trim() || null,
      email: form.email.trim() || null,
      adres: form.adres.trim() || null,
      postcode: form.postcode.trim() || null,
      plaats: form.plaats.trim() || null,
    }).eq("id", organisatieId);
    setSaving(false);
    if (error) { toast.error("Fout bij opslaan: " + error.message); return; }
    await onSaved();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Header icon={Building2} title="Vertel ons over je bedrijf" sub="Deze gegevens verschijnen op contracten, facturen en in mails." />

      <Card><CardContent className="p-5 space-y-4">
        <KvkSearch
          value={form.naam}
          kvkNummer={form.kvk_nummer}
          bedrijfAdres={form.adres}
          onChange={(naam, kvk, adres) => setForm((f) => ({ ...f, naam, kvk_nummer: kvk, adres: adres || f.adres }))}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Bedrijfsnaam *" value={form.naam} onChange={(v) => setForm({ ...form, naam: v })} placeholder="Mijn Bedrijf B.V." />
          <Field label="KVK-nummer" value={form.kvk_nummer} onChange={(v) => setForm({ ...form, kvk_nummer: v })} placeholder="12345678" />
          <Field label="Telefoon" value={form.telefoon} onChange={(v) => setForm({ ...form, telefoon: v })} placeholder="+31 6 ..." />
          <Field label="E-mail" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="info@bedrijf.nl" type="email" />
          <Field label="Adres" value={form.adres} onChange={(v) => setForm({ ...form, adres: v })} placeholder="Straat 123" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Postcode" value={form.postcode} onChange={(v) => setForm({ ...form, postcode: v })} placeholder="1234 AB" />
            <Field label="Plaats" value={form.plaats} onChange={(v) => setForm({ ...form, plaats: v })} placeholder="Amsterdam" />
          </div>
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-primary" />
          <Label className="m-0">Logo</Label>
        </div>
        <p className="text-xs text-muted-foreground">Wordt gebruikt op contracten, facturen en in het klantportaal.</p>
        <div className="flex items-center gap-4">
          {logoUrl ? (
            <img src={logoUrl} alt="logo" className="w-16 h-16 rounded-xl object-cover border border-border" />
          ) : (
            <div className="w-16 h-16 rounded-xl border border-dashed border-border flex items-center justify-center text-muted-foreground">
              <ImageIcon className="w-6 h-6" />
            </div>
          )}
          <input ref={logoRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogo(f); }} />
          <Button type="button" variant="outline" onClick={() => logoRef.current?.click()} disabled={logoBusy} className="gap-2">
            {logoBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {logoUrl ? "Vervangen" : "Logo uploaden"}
          </Button>
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-5 space-y-3">
        <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /><Label className="m-0">Locaties</Label></div>
        <p className="text-xs text-muted-foreground">Bijvoorbeeld je depot of vestigingen waar voertuigen opgehaald/ingeleverd worden.</p>
        <div className="flex gap-2">
          <Input value={newLoc} onChange={(e) => setNewLoc(e.target.value)} placeholder="Bijv. Amsterdam West"
            onKeyDown={(e) => { if (e.key === "Enter" && newLoc.trim()) { addLocatie.mutate(newLoc.trim()); setNewLoc(""); } }} />
          <Button type="button" variant="outline" onClick={() => { if (newLoc.trim()) { addLocatie.mutate(newLoc.trim()); setNewLoc(""); } }} className="gap-2">
            <Plus className="w-4 h-4" /> Toevoegen
          </Button>
        </div>
        {locaties.length > 0 && (
          <ul className="space-y-1 pt-1">
            {locaties.map((l) => (
              <li key={l.id} className="flex items-center justify-between text-sm px-3 py-2 rounded-lg bg-muted/40">
                <span>{l.naam}</span>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteLocatie.mutate(l.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent></Card>

      <Card><CardContent className="p-5">
        <AlgemeneVoorwaardenUpload />
      </CardContent></Card>

      <StepFooter onSkip={onSkip} onNext={save} nextDisabled={saving || organisatieLoading} nextLabel={saving ? "Opslaan..." : "Volgende"} />
    </div>
  );
}

/* ──────────── Stap 2: Voertuig ──────────── */
function VoertuigStep({ onSkip, onSaved, userId, organisatieId, onBulkImport, onBack }: {
  onSkip: () => void; onSaved: () => Promise<void>; userId?: string; organisatieId: string | null; onBulkImport: () => void; onBack: () => void;
}) {
  const [found, setFound] = useState<RdwVehicleInfo | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!found || !userId || !organisatieId) return;
    setSaving(true);
    const { error } = await supabase.from("voertuigen").insert({
      kenteken: found.kenteken.toUpperCase(),
      merk: found.merk, model: found.model,
      brandstof: found.brandstof || null,
      kleur: found.kleur || null,
      bouwjaar: new Date().getFullYear(),
      user_id: userId, organisatie_id: organisatieId,
    });
    setSaving(false);
    if (error) { toast.error("Fout: " + error.message); return; }
    toast.success("Voertuig toegevoegd");
    await onSaved();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Header icon={Car} title="Voeg je eerste voertuig toe" sub="Vul een kenteken in en wij halen automatisch merk, model en APK op via de RDW." />

      <Card><CardContent className="p-5">
        <RdwLookup onVehicleFound={setFound} />
      </CardContent></Card>

      <Card><CardContent className="p-5 flex items-center justify-between gap-4">
        <div>
          <p className="font-medium text-sm">Meerdere voertuigen?</p>
          <p className="text-xs text-muted-foreground">Importeer in één keer via een CSV-bestand.</p>
        </div>
        <Button type="button" variant="outline" onClick={onBulkImport} className="gap-2">
          <Upload className="w-4 h-4" /> Bulk-import
        </Button>
      </CardContent></Card>

      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={onBack} className="gap-2"><ArrowLeft className="w-4 h-4" /> Terug</Button>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onSkip}>Overslaan</Button>
          <Button onClick={save} disabled={!found || saving} className="gap-2">
            {saving ? "Opslaan..." : "Voertuig toevoegen"} <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ──────────── Stap 3: Team + Integraties ──────────── */
function TeamStep({ onSkip, onSaved, onBack, userId, organisatieId }: {
  onSkip: () => void; onSaved: () => Promise<void>; onBack: () => void; userId?: string; organisatieId: string | null;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AppRole>("medewerker");
  const [busy, setBusy] = useState(false);
  const invitable = useMemo(() => ROLES.filter((r) => r.key !== "klant"), []);

  const invite = async () => {
    if (!email.trim() || !userId || !organisatieId) return;
    setBusy(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const { data: inserted, error } = await supabase.from("uitnodigingen")
        .insert({ email: cleanEmail, role: role as any, organisatie_id: organisatieId, uitgenodigd_door: userId })
        .select("id, token").single();
      if (error) throw error;
      const { data: org } = await supabase.from("organisaties").select("naam").eq("id", organisatieId).maybeSingle();
      const origin = typeof window !== "undefined" ? window.location.origin : "https://fleeflo.nl";
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "team-invite",
          recipientEmail: cleanEmail,
          idempotencyKey: `team-invite-${inserted.id}`,
          templateData: {
            organisatieNaam: org?.naam ?? "FleeFlo",
            rolLabel: ROLES.find((r) => r.key === role)?.label ?? role,
            acceptUrl: `${origin}/auth?invite=${inserted.token}`,
          },
        },
      });
      toast.success(`${cleanEmail} uitgenodigd`);
      setEmail("");
    } catch (e: any) {
      toast.error(e.message);
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Header icon={Users} title="Nodig collega's uit en koppel je tools" sub="Optioneel. Je kunt dit later vanuit Instellingen aanpassen." />

      <Card><CardContent className="p-5 space-y-3">
        <Label>Collega uitnodigen</Label>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input value={email} type="email" placeholder="collega@bedrijf.nl"
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && invite()} className="flex-1" />
          <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
            <SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              {invitable.map((r) => <SelectItem key={r.key} value={r.key}>{r.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={invite} disabled={busy || !email.trim()} className="gap-2">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Uitnodigen
          </Button>
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-5 space-y-3">
        <div className="flex items-center gap-2"><Plug className="w-4 h-4 text-primary" /><Label className="m-0">Integraties</Label></div>
        <p className="text-xs text-muted-foreground">Koppel Moneybird, Mollie of Stripe voor automatische facturatie en betalingen.</p>
        <div className="grid sm:grid-cols-3 gap-2">
          {[
            { naam: "Moneybird", desc: "Facturen pushen" },
            { naam: "Mollie",    desc: "iDEAL-betalingen" },
            { naam: "Stripe",    desc: "Verificatie & links" },
          ].map((i) => (
            <div key={i.naam} className="rounded-lg border border-border p-3">
              <p className="text-sm font-medium">{i.naam}</p>
              <p className="text-xs text-muted-foreground">{i.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Koppelen kan straks vanuit <span className="font-medium text-foreground">Instellingen → Integraties</span>.</p>
      </CardContent></Card>

      <StepFooter onSkip={onSkip} onBack={onBack} onNext={onSaved} nextLabel="Volgende" />
    </div>
  );
}

/* ──────────── Stap 4: Modus + Portaal ──────────── */
function ModusStep({ onSkip, onSaved, onBack, organisatieId }: {
  onSkip: () => void; onSaved: () => Promise<void>; onBack: () => void; organisatieId: string | null;
}) {
  const [modus, setModus] = useState<"autoverhuur" | "wagenpark">("autoverhuur");
  const [portaalActief, setPortaalActief] = useState(false);
  const [slug, setSlug] = useState("");
  const [portaalNaam, setPortaalNaam] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!organisatieId) return;
    supabase.from("organisaties")
      .select("module_modus, portaal_actief, slug, portaal_naam, naam")
      .eq("id", organisatieId).maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setModus((data.module_modus as any) || "autoverhuur");
        setPortaalActief(!!data.portaal_actief);
        setSlug(data.slug ?? "");
        setPortaalNaam(data.portaal_naam ?? data.naam ?? "");
      });
  }, [organisatieId]);

  const save = async () => {
    if (!organisatieId) return;
    setSaving(true);
    const payload: any = { module_modus: modus, portaal_actief: portaalActief };
    if (modus === "autoverhuur" && portaalActief) {
      if (slug.trim()) payload.slug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
      if (portaalNaam.trim()) payload.portaal_naam = portaalNaam.trim();
    }
    const { error } = await supabase.from("organisaties").update(payload).eq("id", organisatieId);
    setSaving(false);
    if (error) { toast.error("Fout: " + error.message); return; }
    await onSaved();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Header icon={Layers} title="Hoe gebruik je FleeFlo?" sub="Dit bepaalt welke modules zichtbaar zijn. Je kunt dit later wijzigen." />

      <Card><CardContent className="p-5">
        <RadioGroup value={modus} onValueChange={(v) => setModus(v as any)} className="grid sm:grid-cols-2 gap-3">
          <ModeCard value="autoverhuur" current={modus} title="Autoverhuur" desc="Verhuur aan klanten, contracten, klantportaal, facturen." />
          <ModeCard value="wagenpark"   current={modus} title="Wagenpark"   desc="Intern beheer: bijtelling, onderhoud, kilometers, kosten." />
        </RadioGroup>
      </CardContent></Card>

      {modus === "autoverhuur" && (
        <Card><CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Label className="m-0">Klantportaal activeren</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Klanten kunnen reserveren, hun facturen bekijken en schades melden.</p>
            </div>
            <Switch checked={portaalActief} onCheckedChange={setPortaalActief} />
          </div>
          {portaalActief && (
            <div className="grid sm:grid-cols-2 gap-3 pt-1">
              <Field label="Subdomein (slug)" value={slug} onChange={setSlug} placeholder="mijnbedrijf" />
              <Field label="Naam in portaal" value={portaalNaam} onChange={setPortaalNaam} placeholder="Mijn Bedrijf Verhuur" />
            </div>
          )}
        </CardContent></Card>
      )}

      <StepFooter onSkip={onSkip} onBack={onBack} onNext={save} nextLabel={saving ? "Opslaan..." : "Volgende"} nextDisabled={saving} />
    </div>
  );
}

function ModeCard({ value, current, title, desc }: { value: string; current: string; title: string; desc: string }) {
  const active = value === current;
  return (
    <label className={`cursor-pointer rounded-xl border p-4 transition-colors ${active ? "border-primary bg-primary/5" : "border-border hover:bg-accent/50"}`}>
      <div className="flex items-start gap-3">
        <RadioGroupItem value={value} className="mt-1" />
        <div>
          <p className="font-medium text-sm">{title}</p>
          <p className="text-xs text-muted-foreground mt-1">{desc}</p>
        </div>
      </div>
    </label>
  );
}

/* ──────────── Stap 5: Klaar ──────────── */
function DoneStep({ onFinish }: { onFinish: () => void }) {
  return (
    <div className="text-center space-y-8 animate-fade-in">
      <div className="mx-auto w-20 h-20 rounded-2xl bg-success/10 flex items-center justify-center">
        <CheckCircle2 className="w-10 h-10 text-success" />
      </div>
      <div className="space-y-3">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">Je bent klaar 🎉</h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto">
          Eventuele openstaande stappen vind je terug als checklist op je dashboard.
        </p>
      </div>
      <Button onClick={onFinish} size="lg" className="gap-2">
        Ga naar dashboard <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

/* ──────────── Helpers ──────────── */
function Header({ icon: Icon, title, sub }: { icon: any; title: string; sub: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">{title}</h2>
      </div>
      <p className="text-sm text-muted-foreground">{sub}</p>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function StepFooter({ onSkip, onBack, onNext, nextLabel, nextDisabled }: {
  onSkip?: () => void; onBack?: () => void; onNext: () => void | Promise<void>; nextLabel: string; nextDisabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 pt-2">
      {onBack ? (
        <Button variant="ghost" onClick={onBack} className="gap-2"><ArrowLeft className="w-4 h-4" /> Terug</Button>
      ) : <span />}
      <div className="flex items-center gap-3">
        {onSkip && <Button variant="ghost" onClick={onSkip}>Overslaan</Button>}
        <Button onClick={onNext} disabled={nextDisabled} className="gap-2">{nextLabel} <ArrowRight className="w-4 h-4" /></Button>
      </div>
    </div>
  );
}