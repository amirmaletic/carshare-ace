import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, FileSpreadsheet, AlertTriangle, Trash2, ExternalLink } from "lucide-react";

type Row = {
  id: string;
  provider: string;
  access_token: string;
  administration_id: string | null;
  administration_naam: string | null;
  actief: boolean;
  laatst_getest_status: string | null;
  laatst_getest_op: string | null;
};

export default function MoneybirdKoppelingCard() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [token, setToken] = useState("");
  const [adminId, setAdminId] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["boekhoud_koppeling", "moneybird"],
    queryFn: async () => {
      const { data, error } = await supabase.from("boekhoud_koppelingen" as any).select("*").eq("provider", "moneybird").maybeSingle();
      if (error && error.code !== "PGRST116") throw error;
      return (data as unknown) as Row | null;
    },
  });

  const opslaan = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: org } = await supabase.from("user_roles").select("organisatie_id").eq("user_id", user!.id).limit(1).maybeSingle();
      const organisatie_id = (org as any)?.organisatie_id;
      if (!organisatie_id) throw new Error("Geen organisatie gevonden");
      // Test eerst de token via edge function
      const { data: test, error: testErr } = await supabase.functions.invoke("moneybird-test", {
        body: { token, administration_id: adminId || null },
      });
      if (testErr) throw new Error(testErr.message);
      if (!test?.ok) throw new Error(test?.error || "Token-test mislukt");
      const payload: any = {
        organisatie_id, provider: "moneybird", access_token: token,
        administration_id: test.administration_id ?? adminId ?? null,
        administration_naam: test.administration_naam ?? null,
        actief: true, laatst_getest_status: "ok", laatst_getest_op: new Date().toISOString(),
      };
      if (data?.id) {
        const { error } = await supabase.from("boekhoud_koppelingen" as any).update(payload).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("boekhoud_koppelingen" as any).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: "Moneybird gekoppeld", description: "Verbinding gevalideerd en opgeslagen." });
      setToken(""); setAdminId("");
      qc.invalidateQueries({ queryKey: ["boekhoud_koppeling", "moneybird"] });
    },
    onError: (e: Error) => toast({ title: "Koppelen mislukt", description: e.message, variant: "destructive" }),
  });

  const toggle = useMutation({
    mutationFn: async (next: boolean) => {
      if (!data?.id) return;
      const { error } = await supabase.from("boekhoud_koppelingen" as any).update({ actief: next }).eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["boekhoud_koppeling", "moneybird"] }),
  });

  const verwijderen = useMutation({
    mutationFn: async () => {
      if (!data?.id) return;
      const { error } = await supabase.from("boekhoud_koppelingen" as any).delete().eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: "Koppeling verwijderd" }); qc.invalidateQueries({ queryKey: ["boekhoud_koppeling", "moneybird"] }); },
  });

  const verbonden = !!data?.id && data.actief;

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><FileSpreadsheet className="w-5 h-5 text-primary" /></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold">Moneybird</h3>
            {verbonden ? (
              <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 gap-1"><CheckCircle2 className="w-3 h-3" /> Verbonden</Badge>
            ) : data?.id ? (
              <Badge variant="secondary" className="gap-1"><AlertTriangle className="w-3 h-3" /> Inactief</Badge>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Push facturen direct als verkoopfactuur naar Moneybird.</p>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Laden...</p>
      ) : data?.id ? (
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-3 p-3 bg-muted/40 rounded-md">
            <div className="min-w-0">
              <p className="font-medium truncate">{data.administration_naam || "Onbekende administratie"}</p>
              <p className="text-xs text-muted-foreground">ID: {data.administration_id} {data.laatst_getest_op && `· laatst getest ${new Date(data.laatst_getest_op).toLocaleDateString("nl-NL")}`}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Switch checked={data.actief} onCheckedChange={(v) => toggle.mutate(v)} />
              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => verwijderen.mutate()}><Trash2 className="w-4 h-4" /></Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="mb-token">Persoonlijk access token</Label>
            <Input id="mb-token" type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="van moneybird.com/applications" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mb-admin">Administratie ID (optioneel)</Label>
            <Input id="mb-admin" value={adminId} onChange={(e) => setAdminId(e.target.value)} placeholder="laat leeg voor automatische detectie" />
          </div>
          <div className="flex items-center justify-between gap-2">
            <a href="https://moneybird.com/user/applications/new" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
              Token aanmaken in Moneybird <ExternalLink className="w-3 h-3" />
            </a>
            <Button onClick={() => opslaan.mutate()} disabled={!token || opslaan.isPending}>{opslaan.isPending ? "Testen..." : "Verbinden"}</Button>
          </div>
        </div>
      )}
    </Card>
  );
}