import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Key, Webhook, Plus, Trash2, AlertTriangle, CheckCircle2, XCircle, RefreshCcw, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

const API_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-api/v1`;

const SCOPE_OPTIONS = [
  { value: "read:all", label: "Lezen (alle resources)" },
  { value: "write:all", label: "Schrijven (alle resources)" },
  { value: "admin:all", label: "Volledige toegang (admin)" },
];

const EVENT_OPTIONS = [
  "*", "voertuig.created", "voertuig.updated", "voertuig.deleted",
  "contract.created", "contract.updated", "contract.deleted",
  "klant.created", "klant.updated", "klant.deleted",
  "schade.created", "schade.updated",
  "factuur.created", "factuur.updated",
  "rit.created", "rit.updated",
];

function generateSecret(): string {
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  return "whsec_" + Array.from(arr).map(b => b.toString(16).padStart(2, "0")).join("");
}

export default function ApiWebhooksTab() {
  const { toast } = useToast();
  const qc = useQueryClient();

  // ===== API KEYS =====
  const { data: keys = [] } = useQuery({
    queryKey: ["api_keys"],
    queryFn: async () => {
      const { data, error } = await supabase.from("api_keys").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const [keyDialog, setKeyDialog] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [keyScopes, setKeyScopes] = useState<string[]>(["read:all"]);
  const [newKey, setNewKey] = useState<string | null>(null);

  const createKey = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("create_api_key", {
        _naam: keyName, _scopes: keyScopes, _expires_at: undefined,
      });
      if (error) throw error;
      return data?.[0];
    },
    onSuccess: (row) => {
      setNewKey(row?.plain_key || null);
      setKeyName("");
      qc.invalidateQueries({ queryKey: ["api_keys"] });
    },
    onError: (e: Error) => toast({ title: "Aanmaken mislukt", description: e.message, variant: "destructive" }),
  });

  const revokeKey = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("revoke_api_key", { _id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "API key ingetrokken" });
      qc.invalidateQueries({ queryKey: ["api_keys"] });
    },
  });

  // ===== WEBHOOKS =====
  const { data: hooks = [] } = useQuery({
    queryKey: ["webhook_endpoints"],
    queryFn: async () => {
      const { data, error } = await supabase.from("webhook_endpoints").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const [hookDialog, setHookDialog] = useState(false);
  const [hookUrl, setHookUrl] = useState("");
  const [hookDesc, setHookDesc] = useState("");
  const [hookEvents, setHookEvents] = useState<string[]>(["*"]);

  const saveHook = useMutation({
    mutationFn: async () => {
      const { data: orgRow } = await supabase.rpc("get_user_organisatie_id", { _user_id: (await supabase.auth.getUser()).data.user?.id! });
      const { error } = await supabase.from("webhook_endpoints").insert({
        organisatie_id: orgRow as unknown as string,
        url: hookUrl, beschrijving: hookDesc, events: hookEvents, secret: generateSecret(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Webhook toegevoegd" });
      setHookDialog(false); setHookUrl(""); setHookDesc(""); setHookEvents(["*"]);
      qc.invalidateQueries({ queryKey: ["webhook_endpoints"] });
    },
    onError: (e: Error) => toast({ title: "Toevoegen mislukt", description: e.message, variant: "destructive" }),
  });

  const toggleHook = useMutation({
    mutationFn: async ({ id, actief }: { id: string; actief: boolean }) => {
      const { error } = await supabase.from("webhook_endpoints").update({ actief }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["webhook_endpoints"] }),
  });

  const deleteHook = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("webhook_endpoints").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Webhook verwijderd" });
      qc.invalidateQueries({ queryKey: ["webhook_endpoints"] });
    },
  });

  // ===== DELIVERIES =====
  const { data: deliveries = [], refetch: refetchDeliveries } = useQuery({
    queryKey: ["webhook_deliveries"],
    queryFn: async () => {
      const { data, error } = await supabase.from("webhook_deliveries")
        .select("*").order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data;
    },
  });

  const triggerDispatch = async () => {
    const { error } = await supabase.functions.invoke("webhook-dispatcher", { body: {} });
    if (error) toast({ title: "Dispatch mislukt", description: error.message, variant: "destructive" });
    else { toast({ title: "Webhooks verstuurd" }); refetchDeliveries(); }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Gekopieerd naar klembord" });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Key className="w-5 h-5" /> API endpoint</CardTitle>
          <CardDescription>Basis-URL voor alle requests. Stuur de API key mee als <code className="px-1 rounded bg-muted text-xs">X-API-Key</code> header.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Input readOnly value={API_BASE} className="font-mono text-xs" />
            <Button variant="outline" size="icon" onClick={() => copy(API_BASE)}><Copy className="w-4 h-4" /></Button>
          </div>
          <div className="text-xs text-muted-foreground">
            Voorbeelden: <code className="px-1 rounded bg-muted">{API_BASE}/voertuigen</code> · <code className="px-1 rounded bg-muted">{API_BASE}/contracten?limit=20</code> · <code className="px-1 rounded bg-muted">{API_BASE}/klanten/&lt;id&gt;</code>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="keys">
        <TabsList>
          <TabsTrigger value="keys"><Key className="w-4 h-4 mr-2" /> API keys</TabsTrigger>
          <TabsTrigger value="webhooks"><Webhook className="w-4 h-4 mr-2" /> Webhooks</TabsTrigger>
          <TabsTrigger value="deliveries">Deliveries</TabsTrigger>
        </TabsList>

        {/* API KEYS */}
        <TabsContent value="keys" className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>API keys</CardTitle>
                <CardDescription>Sleutels worden gehashed opgeslagen, je ziet de waarde maar 1x.</CardDescription>
              </div>
              <Button onClick={() => { setNewKey(null); setKeyDialog(true); }}><Plus className="w-4 h-4 mr-2" /> Nieuwe key</Button>
            </CardHeader>
            <CardContent>
              {keys.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Nog geen API keys aangemaakt.</p>
              ) : (
                <div className="space-y-2">
                  {keys.map((k) => (
                    <div key={k.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{k.naam}</span>
                          {k.revoked_at && <Badge variant="destructive">Ingetrokken</Badge>}
                          {!k.revoked_at && <Badge variant="secondary">Actief</Badge>}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono mt-1">{k.key_prefix}...</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Scopes: {k.scopes.join(", ")} · {k.laatst_gebruikt_op
                            ? `Laatst gebruikt ${format(new Date(k.laatst_gebruikt_op), "d MMM yyyy HH:mm", { locale: nl })}`
                            : "Nog niet gebruikt"}
                        </div>
                      </div>
                      {!k.revoked_at && (
                        <Button variant="ghost" size="icon" onClick={() => revokeKey.mutate(k.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* WEBHOOKS */}
        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Webhook endpoints</CardTitle>
                <CardDescription>Ontvang events bij wijzigingen. Elk request wordt HMAC-SHA256 ondertekend.</CardDescription>
              </div>
              <Button onClick={() => setHookDialog(true)}><Plus className="w-4 h-4 mr-2" /> Nieuwe webhook</Button>
            </CardHeader>
            <CardContent>
              {hooks.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Nog geen webhooks geconfigureerd.</p>
              ) : (
                <div className="space-y-2">
                  {hooks.map((h) => (
                    <div key={h.id} className="p-3 rounded-lg border bg-card">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm truncate">{h.url}</span>
                            <Badge variant={h.actief ? "secondary" : "outline"}>{h.actief ? "Actief" : "Uit"}</Badge>
                          </div>
                          {h.beschrijving && <div className="text-xs text-muted-foreground mt-1">{h.beschrijving}</div>}
                          <div className="text-xs text-muted-foreground mt-1">Events: {h.events.join(", ")}</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Switch checked={h.actief} onCheckedChange={(v) => toggleHook.mutate({ id: h.id, actief: v })} />
                          <Button variant="ghost" size="icon" onClick={() => copy(h.secret)} title="Kopieer signing secret">
                            <Key className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteHook.mutate(h.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* DELIVERIES */}
        <TabsContent value="deliveries" className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Recente deliveries</CardTitle>
                <CardDescription>Laatste 50 webhook-pogingen</CardDescription>
              </div>
              <Button variant="outline" onClick={triggerDispatch}><RefreshCcw className="w-4 h-4 mr-2" /> Verstuur openstaande</Button>
            </CardHeader>
            <CardContent>
              {deliveries.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Nog geen deliveries.</p>
              ) : (
                <div className="space-y-1.5">
                  {deliveries.map((d) => (
                    <div key={d.id} className="flex items-center gap-3 p-2 rounded border text-sm">
                      {d.status === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        : d.status === "failed" ? <XCircle className="w-4 h-4 text-destructive" />
                        : <AlertTriangle className="w-4 h-4 text-amber-500" />}
                      <span className="font-mono text-xs">{d.event}</span>
                      <span className="text-xs text-muted-foreground">{d.http_status || "-"}</span>
                      <span className="text-xs text-muted-foreground">attempts: {d.attempts}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {format(new Date(d.created_at), "d MMM HH:mm:ss", { locale: nl })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* CREATE KEY DIALOG */}
      <Dialog open={keyDialog} onOpenChange={(o) => { setKeyDialog(o); if (!o) setNewKey(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{newKey ? "API key aangemaakt" : "Nieuwe API key"}</DialogTitle>
            <DialogDescription>
              {newKey ? "Bewaar deze key direct, je kunt hem hierna niet meer inzien." : "Geef de key een herkenbare naam en kies de scopes."}
            </DialogDescription>
          </DialogHeader>

          {newKey ? (
            <div className="space-y-3">
              <div className="p-3 rounded bg-muted font-mono text-xs break-all">{newKey}</div>
              <Button onClick={() => copy(newKey)} className="w-full"><Copy className="w-4 h-4 mr-2" /> Kopieer</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label>Naam</Label>
                <Input value={keyName} onChange={(e) => setKeyName(e.target.value)} placeholder="bijv. Boekhouding integratie" />
              </div>
              <div className="space-y-2">
                <Label>Scopes</Label>
                {SCOPE_OPTIONS.map((s) => (
                  <div key={s.value} className="flex items-center gap-2">
                    <Checkbox
                      checked={keyScopes.includes(s.value)}
                      onCheckedChange={(v) => setKeyScopes((prev) => v ? [...prev, s.value] : prev.filter(x => x !== s.value))}
                    />
                    <span className="text-sm">{s.label} <code className="text-xs text-muted-foreground">({s.value})</code></span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            {newKey ? (
              <Button onClick={() => setKeyDialog(false)}>Sluiten</Button>
            ) : (
              <Button onClick={() => createKey.mutate()} disabled={!keyName || keyScopes.length === 0 || createKey.isPending}>
                Aanmaken
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CREATE WEBHOOK DIALOG */}
      <Dialog open={hookDialog} onOpenChange={setHookDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nieuwe webhook</DialogTitle>
            <DialogDescription>Wij sturen een POST naar deze URL bij geselecteerde events.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>URL</Label>
              <Input value={hookUrl} onChange={(e) => setHookUrl(e.target.value)} placeholder="https://example.com/webhooks/fleeflo" />
            </div>
            <div>
              <Label>Beschrijving</Label>
              <Input value={hookDesc} onChange={(e) => setHookDesc(e.target.value)} placeholder="optioneel" />
            </div>
            <div className="space-y-2">
              <Label>Events</Label>
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-auto p-2 border rounded">
                {EVENT_OPTIONS.map((ev) => (
                  <div key={ev} className="flex items-center gap-2">
                    <Checkbox
                      checked={hookEvents.includes(ev)}
                      onCheckedChange={(v) => setHookEvents((p) => v ? [...p, ev] : p.filter(x => x !== ev))}
                    />
                    <span className="text-xs font-mono">{ev}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Tip: kies <code>*</code> om op alle events te abonneren.</p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => saveHook.mutate()} disabled={!hookUrl || hookEvents.length === 0 || saveHook.isPending}>
              Opslaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}