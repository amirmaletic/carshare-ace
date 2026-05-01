import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Globe2, Plus, Trash2, Copy, Check, ShieldCheck, Clock, AlertCircle } from "lucide-react";

type Domein = {
  id: string;
  hostname: string;
  status: string;
  verification_token: string;
  verified_at: string | null;
};

export default function CustomDomeinenSectie({ organisatieId }: { organisatieId: string }) {
  const qc = useQueryClient();
  const [hostname, setHostname] = useState("");

  const { data: domeinen = [], isLoading } = useQuery({
    queryKey: ["portaal-domeinen", organisatieId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("portaal_domeinen")
        .select("id, hostname, status, verification_token, verified_at")
        .eq("organisatie_id", organisatieId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Domein[];
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      const clean = hostname.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
      if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(clean)) throw new Error("Ongeldige hostname");
      const { error } = await supabase.from("portaal_domeinen").insert({
        organisatie_id: organisatieId,
        hostname: clean,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setHostname("");
      qc.invalidateQueries({ queryKey: ["portaal-domeinen", organisatieId] });
      toast({ title: "Domein toegevoegd", description: "Volg de DNS-instructies om te verifiëren." });
    },
    onError: (e: any) => toast({ title: "Kon niet toevoegen", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("portaal_domeinen").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["portaal-domeinen", organisatieId] });
      toast({ title: "Domein verwijderd" });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Globe2 className="w-4 h-4 text-primary" /> Eigen domein koppelen
        </CardTitle>
        <CardDescription>
          Gebruik je eigen domein zoals <code className="font-mono text-xs">boeken.jouwbedrijf.nl</code> in plaats van een fleeflo-subdomein.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="boeken.jouwbedrijf.nl"
            value={hostname}
            onChange={(e) => setHostname(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add.mutate()}
          />
          <Button onClick={() => add.mutate()} disabled={!hostname || add.isPending} className="gap-1.5">
            <Plus className="w-4 h-4" /> Toevoegen
          </Button>
        </div>

        {isLoading ? (
          <div className="h-20 bg-muted animate-pulse rounded-lg" />
        ) : domeinen.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Nog geen eigen domeinen toegevoegd.</p>
        ) : (
          <div className="space-y-3">
            {domeinen.map((d) => (
              <DomeinKaart key={d.id} domein={d} onDelete={() => remove.mutate(d.id)} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DomeinKaart({ domein, onDelete }: { domein: Domein; onDelete: () => void }) {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (val: string, key: string) => {
    await navigator.clipboard.writeText(val);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const statusBadge = {
    verified: { label: "Geverifieerd", icon: ShieldCheck, cls: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20" },
    pending: { label: "DNS controleren", icon: Clock, cls: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20" },
    failed: { label: "Verificatie mislukt", icon: AlertCircle, cls: "bg-destructive/10 text-destructive border-destructive/20" },
  }[domein.status] || { label: domein.status, icon: Clock, cls: "bg-muted text-muted-foreground" };

  const Icon = statusBadge.icon;

  return (
    <div className="border border-border rounded-lg p-4 space-y-3 bg-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-foreground font-mono text-sm">{domein.hostname}</p>
          <Badge variant="outline" className={`mt-1.5 gap-1 ${statusBadge.cls}`}>
            <Icon className="w-3 h-3" /> {statusBadge.label}
          </Badge>
        </div>
        <Button size="icon" variant="ghost" onClick={onDelete} className="text-muted-foreground hover:text-destructive shrink-0">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {domein.status !== "verified" && (
        <div className="bg-muted/50 rounded-md p-3 space-y-2 text-xs">
          <p className="font-medium text-foreground">DNS-records om te verifiëren:</p>
          <DnsRow label="CNAME" host={domein.hostname} value="proxy.fleeflo.nl" onCopy={(v) => copy(v, `cname-${domein.id}`)} copied={copied === `cname-${domein.id}`} />
          <DnsRow label="TXT (verificatie)" host={`_fleeflo.${domein.hostname}`} value={domein.verification_token} onCopy={(v) => copy(v, `txt-${domein.id}`)} copied={copied === `txt-${domein.id}`} />
          <p className="text-muted-foreground pt-1">DNS-wijzigingen kunnen tot 24 uur duren. Verificatie verloopt automatisch zodra de records zichtbaar zijn.</p>
        </div>
      )}
    </div>
  );
}

function DnsRow({ label, host, value, onCopy, copied }: { label: string; host: string; value: string; onCopy: (v: string) => void; copied: boolean }) {
  return (
    <div className="grid grid-cols-[80px_1fr_auto] gap-2 items-center">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="space-y-0.5">
        <code className="block bg-background border border-border rounded px-2 py-1 font-mono text-xs truncate">{host}</code>
        <code className="block bg-background border border-border rounded px-2 py-1 font-mono text-xs truncate">→ {value}</code>
      </div>
      <Button size="sm" variant="outline" onClick={() => onCopy(value)} className="gap-1 h-7">
        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      </Button>
    </div>
  );
}