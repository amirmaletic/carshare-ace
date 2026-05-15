import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { CheckCircle2, Loader2 } from "lucide-react";

interface Verzoek {
  found: boolean;
  status?: string;
  expired?: boolean;
  contract_nummer?: string;
  organisatie_naam?: string;
  klant?: {
    naam?: string;
    email?: string;
    telefoon?: string | null;
    adres?: string | null;
    rijbewijs_nummer?: string | null;
    rijbewijs_verloopt?: string | null;
  };
}

export default function ContractAanvullen() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [verzoek, setVerzoek] = useState<Verzoek | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    klant_naam: "",
    klant_telefoon: "",
    klant_adres: "",
    rijbewijs_nummer: "",
    rijbewijs_verloopt: "",
  });

  useEffect(() => {
    (async () => {
      if (!token) return;
      const { data, error } = await supabase.rpc("get_aanvul_verzoek", { _token: token });
      if (error) {
        toast({ title: "Fout", description: error.message, variant: "destructive" });
      } else {
        const v = data as unknown as Verzoek;
        setVerzoek(v);
        if (v?.klant) {
          setForm({
            klant_naam: v.klant.naam ?? "",
            klant_telefoon: v.klant.telefoon ?? "",
            klant_adres: v.klant.adres ?? "",
            rijbewijs_nummer: v.klant.rijbewijs_nummer ?? "",
            rijbewijs_verloopt: v.klant.rijbewijs_verloopt ?? "",
          });
        }
      }
      setLoading(false);
    })();
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    const { error } = await supabase.rpc("submit_aanvul_verzoek", { _token: token, _payload: form as any });
    setSubmitting(false);
    if (error) {
      toast({ title: "Versturen mislukt", description: error.message, variant: "destructive" });
      return;
    }
    setDone(true);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  if (!verzoek?.found) {
    return <Centered title="Link niet gevonden" message="Deze link is ongeldig. Vraag de verhuurder om een nieuwe." />;
  }
  if (verzoek.expired || verzoek.status === "verlopen") {
    return <Centered title="Link verlopen" message="Deze aanvulpagina is verlopen. Vraag de verhuurder om een nieuwe link." />;
  }
  if (verzoek.status === "ingevuld" || done) {
    return (
      <Centered
        title="Bedankt!"
        message={`Je gegevens voor contract ${verzoek.contract_nummer ?? ""} zijn ontvangen. ${verzoek.organisatie_naam ?? ""} neemt het verder op.`}
        icon
      />
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 space-y-5 shadow-sm">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{verzoek.organisatie_naam}</p>
          <h1 className="text-xl font-bold text-foreground mt-1">Vul je gegevens aan</h1>
          <p className="text-sm text-muted-foreground mt-1">Contract {verzoek.contract_nummer}</p>
        </div>

        <Field label="Volledige naam" value={form.klant_naam} onChange={(v) => setForm({ ...form, klant_naam: v })} required />
        <Field label="Telefoonnummer" value={form.klant_telefoon} onChange={(v) => setForm({ ...form, klant_telefoon: v })} required />
        <Field label="Adres (straat, huisnr, postcode, plaats)" value={form.klant_adres} onChange={(v) => setForm({ ...form, klant_adres: v })} required />
        <Field label="Rijbewijsnummer" value={form.rijbewijs_nummer} onChange={(v) => setForm({ ...form, rijbewijs_nummer: v })} required />
        <Field label="Rijbewijs geldig tot" type="date" value={form.rijbewijs_verloopt} onChange={(v) => setForm({ ...form, rijbewijs_verloopt: v })} required />

        <Button type="submit" disabled={submitting} className="w-full gap-2">
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          Gegevens versturen
        </Button>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} maxLength={255} />
    </div>
  );
}

function Centered({ title, message, icon }: { title: string; message: string; icon?: boolean }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md text-center space-y-3 bg-card border border-border rounded-2xl p-8">
        {icon && <CheckCircle2 className="w-10 h-10 text-success mx-auto" />}
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}