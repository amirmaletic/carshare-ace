import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, ExternalLink, Trash2, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";
import { useOrganisatie } from "@/hooks/useOrganisatie";

/**
 * Mollie-koppeling per organisatie.
 * Beheerder plakt eigen test_/live_ key. Wij testen 'm via edge function en slaan 'm op in mollie_instellingen (RLS: alleen beheerder eigen org).
 */
export default function MollieKoppelingCard() {
  const { isAdmin } = usePermissions();
  const { organisatieId } = useOrganisatie();
  const qc = useQueryClient();
  const [apiKey, setApiKey] = useState("");
  const [testing, setTesting] = useState(false);

  const { data: koppeling, isLoading } = useQuery({
    queryKey: ["mollie-instellingen"],
    queryFn: async () => {
      const { data, error } = await supabase.from("mollie_instellingen").select("*").maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (koppeling?.api_key) setApiKey(koppeling.api_key);
  }, [koppeling?.api_key]);

  const saveKoppeling = useMutation({
    mutationFn: async (payload: { api_key: string; modus: "test" | "live"; profile_id?: string; profile_naam?: string }) => {
      if (!organisatieId) throw new Error("Geen organisatie gevonden");
      if (koppeling?.id) {
        const { error } = await supabase.from("mollie_instellingen").update({
          ...payload,
          laatst_getest_op: new Date().toISOString(),
          laatst_getest_status: "ok",
        }).eq("id", koppeling.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("mollie_instellingen").insert({
          organisatie_id: organisatieId,
          ...payload,
          laatst_getest_op: new Date().toISOString(),
          laatst_getest_status: "ok",
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mollie-instellingen"] });
      toast({ title: "Mollie-koppeling opgeslagen" });
    },
    onError: (e: Error) => toast({ title: "Opslaan mislukt", description: e.message, variant: "destructive" }),
  });

  const verwijderKoppeling = useMutation({
    mutationFn: async () => {
      if (!koppeling?.id) return;
      const { error } = await supabase.from("mollie_instellingen").delete().eq("id", koppeling.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mollie-instellingen"] });
      setApiKey("");
      toast({ title: "Mollie-koppeling verwijderd" });
    },
  });

  const handleTestEnSave = async () => {
    if (!apiKey.trim()) {
      toast({ title: "Vul een API key in", variant: "destructive" });
      return;
    }
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("mollie-test-key", { body: { apiKey: apiKey.trim() } });
      if (error) throw error;
      if (!data?.ok) {
        toast({ title: "Verbinding mislukt", description: data?.error ?? "Onbekende fout", variant: "destructive" });
        return;
      }
      const modus: "test" | "live" = apiKey.trim().startsWith("live_") ? "live" : "test";
      await saveKoppeling.mutateAsync({
        api_key: apiKey.trim(),
        modus,
        profile_id: data.profile?.id,
        profile_naam: data.profile?.name,
      });
    } catch (e) {
      toast({ title: "Test mislukt", description: (e as Error).message, variant: "destructive" });
    } finally {
      setTesting(false);
    }
  };

  if (!isAdmin) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Alleen beheerders kunnen de Mollie-koppeling beheren.</AlertDescription>
      </Alert>
    );
  }

  const isVerbonden = !!koppeling?.api_key;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              Mollie
              {isVerbonden ? (
                <Badge className="bg-success/15 text-success border-success/30 gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Verbonden ({koppeling?.modus})
                </Badge>
              ) : (
                <Badge variant="secondary">Niet verbonden</Badge>
              )}
            </CardTitle>
            <CardDescription>
              iDEAL en SEPA via je eigen Mollie-account. Betalingen komen direct op jouw bankrekening binnen.
            </CardDescription>
          </div>
          <a
            href="https://my.mollie.com/dashboard/developers/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline flex items-center gap-1 shrink-0"
          >
            Mollie dashboard <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isVerbonden && koppeling?.profile_naam && (
          <div className="text-xs text-muted-foreground">
            Profiel: <span className="font-medium text-foreground">{koppeling.profile_naam}</span>
            {koppeling.laatst_getest_op && (
              <> · laatst getest {new Date(koppeling.laatst_getest_op).toLocaleString("nl-NL")}</>
            )}
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="mollie-key">API key</Label>
          <Input
            id="mollie-key"
            type="password"
            placeholder="test_xxx of live_xxx"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            disabled={isLoading}
            autoComplete="off"
          />
          <p className="text-xs text-muted-foreground">
            Begin met een <span className="font-medium">test_</span>-key om veilig te starten. Je vindt 'm in Mollie Dashboard → Developers → API keys.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleTestEnSave} disabled={testing || saveKoppeling.isPending}>
            {testing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isVerbonden ? "Bijwerken" : "Verbinden"}
          </Button>
          {isVerbonden && (
            <Button
              variant="outline"
              onClick={() => verwijderKoppeling.mutate()}
              disabled={verwijderKoppeling.isPending}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" /> Loskoppelen
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}