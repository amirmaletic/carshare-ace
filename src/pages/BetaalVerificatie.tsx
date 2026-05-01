import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react";

export default function BetaalVerificatie() {
  const { token } = useParams<{ token: string }>();
  const [params] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<any>(null);
  const [status, setStatus] = useState<string>("in_afwachting");

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data } = await supabase.rpc("get_betaal_verzoek", { _token: token });
      const row = Array.isArray(data) ? data[0] : data;
      setInfo(row);
      setStatus(row?.status ?? "in_afwachting");
      // Indien net teruggekeerd uit Stripe checkout, poll status
      if (params.get("status") === "success" && row?.status !== "betaald") {
        for (let i = 0; i < 6; i++) {
          const { data: r } = await supabase.functions.invoke("verify-betaal-verificatie", { body: { token } });
          if ((r as any)?.status === "betaald") { setStatus("betaald"); break; }
          await new Promise((res) => setTimeout(res, 1500));
        }
      }
      setLoading(false);
    })();
  }, [token, params]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!info) return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-md w-full"><CardContent className="pt-6 text-center space-y-2">
        <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
        <p>Verzoek niet gevonden of verlopen.</p>
      </CardContent></Card>
    </div>
  );

  const betaald = status === "betaald";

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            {info.organisatie_logo && <img src={info.organisatie_logo} alt="" className="w-10 h-10 rounded" />}
            <div>
              <p className="text-xs text-muted-foreground">{info.organisatie_naam}</p>
              <CardTitle className="text-lg">Borg-verificatie</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {betaald ? (
            <div className="text-center space-y-3 py-4">
              <CheckCircle2 className="w-12 h-12 text-primary mx-auto" />
              <p className="font-medium">Bedankt! Je betaling is bevestigd.</p>
              <p className="text-sm text-muted-foreground">Je rekening is geverifieerd. Je kunt dit venster sluiten.</p>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-primary mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Eenmalige iDEAL-verificatie van € {Number(info.bedrag).toFixed(2).replace(".", ",")}</p>
                  <p className="text-muted-foreground mt-1">Hiermee verifiëren we je bankrekening en identiteit. Het bedrag wordt verrekend met je eerstvolgende factuur.</p>
                </div>
              </div>
              <Button className="w-full" onClick={async () => {
                const { data, error } = await supabase.functions.invoke("create-betaal-verificatie-resume", { body: { token } });
                // Hergebruik bestaande session_url uit info? We laten gebruiker via mail-link betalen.
                if (error) alert(error.message);
                else if ((data as any)?.checkout_url) window.location.href = (data as any).checkout_url;
              }}>
                Betaal € {Number(info.bedrag).toFixed(2).replace(".", ",")} met iDEAL
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Je hebt waarschijnlijk al een betaallink per e-mail ontvangen. Controleer je inbox.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}