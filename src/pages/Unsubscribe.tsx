import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

type State = "loading" | "valid" | "already" | "invalid" | "success" | "error";

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [state, setState] = useState<State>("loading");
  const [email, setEmail] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_ANON_KEY } }
        );
        const data = await res.json().catch(() => ({}));
        if (res.ok && data?.valid) {
          setEmail(data.email ?? null);
          setState("valid");
        } else if (data?.alreadyUsed) {
          setEmail(data.email ?? null);
          setState("already");
        } else {
          setState("invalid");
        }
      } catch {
        setState("error");
      }
    })();
  }, [token]);

  const confirm = async () => {
    setSubmitting(true);
    const { error } = await supabase.functions.invoke("handle-email-unsubscribe", {
      body: { token },
    });
    setSubmitting(false);
    setState(error ? "error" : "success");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Uitschrijven</CardTitle>
          <CardDescription>
            {email ? `Voor ${email}` : "Beheer je e-mailvoorkeuren"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {state === "loading" && <p>Bezig met laden...</p>}
          {state === "valid" && (
            <>
              <p>Weet je zeker dat je geen e-mails meer wilt ontvangen?</p>
              <Button onClick={confirm} disabled={submitting}>
                {submitting ? "Bezig..." : "Uitschrijven bevestigen"}
              </Button>
            </>
          )}
          {state === "already" && <p>Je bent al uitgeschreven.</p>}
          {state === "success" && <p>Je bent succesvol uitgeschreven.</p>}
          {state === "invalid" && <p>Deze link is ongeldig of verlopen.</p>}
          {state === "error" && <p>Er ging iets mis. Probeer het later opnieuw.</p>}
        </CardContent>
      </Card>
    </div>
  );
}