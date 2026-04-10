import { useState } from "react";
import { Building2, Car, CheckCircle2, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useOrganisatie } from "@/hooks/useOrganisatie";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BedrijfsData {
  bedrijfsnaam: string;
  kvkNummer: string;
  telefoon: string;
  email: string;
  adres: string;
  postcode: string;
  plaats: string;
}

const defaultBedrijfsData: BedrijfsData = {
  bedrijfsnaam: "", kvkNummer: "", telefoon: "", email: "", adres: "", postcode: "", plaats: "",
};

const steps = [
  { icon: Sparkles, label: "Welkom" },
  { icon: Building2, label: "Bedrijf" },
  { icon: Car, label: "Eerste voertuig" },
  { icon: CheckCircle2, label: "Klaar" },
];

interface Props {
  onComplete: () => void;
}

export default function OnboardingWizard({ onComplete }: Props) {
  const { user } = useAuth();
  const { organisatieId } = useOrganisatie();
  const [step, setStep] = useState(0);
  const [bedrijf, setBedrijf] = useState<BedrijfsData>(defaultBedrijfsData);
  const [voertuig, setVoertuig] = useState({ kenteken: "", merk: "", model: "", bouwjaar: "" });
  const [saving, setSaving] = useState(false);

  const handleSaveBedrijf = () => {
    if (!bedrijf.bedrijfsnaam.trim()) {
      toast.error("Vul een bedrijfsnaam in");
      return;
    }
    // Save to localStorage (same keys as SettingsPage)
    localStorage.setItem("fleetflow_bedrijf", JSON.stringify(bedrijf));
    // Update organisatie naam
    if (organisatieId) {
      supabase.from("organisaties").update({ naam: bedrijf.bedrijfsnaam }).eq("id", organisatieId);
    }
    setStep(2);
  };

  const handleSaveVoertuig = async () => {
    if (!user || !organisatieId) return;
    if (!voertuig.kenteken.trim() || !voertuig.merk.trim() || !voertuig.model.trim()) {
      toast.error("Vul kenteken, merk en model in");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("voertuigen").insert({
      kenteken: voertuig.kenteken.toUpperCase().replace(/[^A-Z0-9]/g, "-"),
      merk: voertuig.merk,
      model: voertuig.model,
      bouwjaar: parseInt(voertuig.bouwjaar) || new Date().getFullYear(),
      user_id: user.id,
      organisatie_id: organisatieId,
    });
    setSaving(false);
    if (error) {
      toast.error("Fout bij opslaan: " + error.message);
      return;
    }
    setStep(3);
  };

  const handleFinish = () => {
    localStorage.setItem("fleetflow_onboarding_done", "true");
    onComplete();
  };

  const handleSkipVoertuig = () => {
    setStep(3);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                i <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                <s.icon className="w-4 h-4" />
              </div>
              {i < steps.length - 1 && (
                <div className={`w-8 h-0.5 transition-colors ${i < step ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 0: Welcome */}
        {step === 0 && (
          <Card>
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Welkom bij FleeFlo!</CardTitle>
              <CardDescription className="text-base mt-2">
                Laten we je account instellen. In een paar stappen heb je alles klaar om je wagenpark te beheren.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Button onClick={() => setStep(1)} className="w-full gap-2" size="lg">
                Aan de slag <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Bedrijfsgegevens */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" /> Bedrijfsgegevens
              </CardTitle>
              <CardDescription>Deze informatie verschijnt op je contracten en facturen.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ob-naam">Bedrijfsnaam *</Label>
                <Input id="ob-naam" value={bedrijf.bedrijfsnaam} onChange={(e) => setBedrijf({ ...bedrijf, bedrijfsnaam: e.target.value })} placeholder="Mijn Bedrijf B.V." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="ob-kvk">KVK-nummer</Label>
                  <Input id="ob-kvk" value={bedrijf.kvkNummer} onChange={(e) => setBedrijf({ ...bedrijf, kvkNummer: e.target.value })} placeholder="12345678" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ob-tel">Telefoon</Label>
                  <Input id="ob-tel" value={bedrijf.telefoon} onChange={(e) => setBedrijf({ ...bedrijf, telefoon: e.target.value })} placeholder="+31 6 12345678" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ob-email">E-mail</Label>
                <Input id="ob-email" type="email" value={bedrijf.email} onChange={(e) => setBedrijf({ ...bedrijf, email: e.target.value })} placeholder="info@bedrijf.nl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ob-adres">Adres</Label>
                <Input id="ob-adres" value={bedrijf.adres} onChange={(e) => setBedrijf({ ...bedrijf, adres: e.target.value })} placeholder="Straatnaam 123" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="ob-pc">Postcode</Label>
                  <Input id="ob-pc" value={bedrijf.postcode} onChange={(e) => setBedrijf({ ...bedrijf, postcode: e.target.value })} placeholder="1234 AB" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ob-plaats">Plaats</Label>
                  <Input id="ob-plaats" value={bedrijf.plaats} onChange={(e) => setBedrijf({ ...bedrijf, plaats: e.target.value })} placeholder="Amsterdam" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep(0)} className="gap-2">
                  <ArrowLeft className="w-4 h-4" /> Terug
                </Button>
                <Button onClick={handleSaveBedrijf} className="flex-1 gap-2">
                  Volgende <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Eerste voertuig */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Car className="w-5 h-5 text-primary" /> Je eerste voertuig
              </CardTitle>
              <CardDescription>Voeg je eerste voertuig toe. Je kunt later meer toevoegen via het dashboard.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ob-kenteken">Kenteken *</Label>
                <Input id="ob-kenteken" value={voertuig.kenteken} onChange={(e) => setVoertuig({ ...voertuig, kenteken: e.target.value })} placeholder="AB-123-CD" className="uppercase" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="ob-merk">Merk *</Label>
                  <Input id="ob-merk" value={voertuig.merk} onChange={(e) => setVoertuig({ ...voertuig, merk: e.target.value })} placeholder="Volkswagen" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ob-model">Model *</Label>
                  <Input id="ob-model" value={voertuig.model} onChange={(e) => setVoertuig({ ...voertuig, model: e.target.value })} placeholder="Golf" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ob-bouwjaar">Bouwjaar</Label>
                <Input id="ob-bouwjaar" type="number" value={voertuig.bouwjaar} onChange={(e) => setVoertuig({ ...voertuig, bouwjaar: e.target.value })} placeholder="2024" />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                  <ArrowLeft className="w-4 h-4" /> Terug
                </Button>
                <Button onClick={handleSaveVoertuig} disabled={saving} className="flex-1 gap-2">
                  {saving ? "Opslaan..." : "Voertuig toevoegen"} <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
              <Button variant="ghost" onClick={handleSkipVoertuig} className="w-full text-muted-foreground">
                Overslaan, ik voeg later voertuigen toe
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Done */}
        {step === 3 && (
          <Card>
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Je bent klaar! 🎉</CardTitle>
              <CardDescription className="text-base mt-2">
                Je account is ingesteld. Je kunt nu beginnen met het beheren van je wagenpark.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <Button onClick={handleFinish} className="w-full gap-2" size="lg">
                Ga naar het dashboard <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
