import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Globe, Upload, Copy, ExternalLink, Check } from "lucide-react";
import CustomDomeinenSectie from "./CustomDomeinenSectie";

export default function PortaalTab() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: org, isLoading } = useQuery({
    queryKey: ["org-portaal-settings", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("organisatie_id")
        .eq("user_id", user!.id)
        .limit(1)
        .maybeSingle();
      if (!roles?.organisatie_id) return null;
      const { data, error } = await supabase
        .from("organisaties")
        .select("id, naam, slug, portaal_naam, portaal_logo_url, portaal_kleur, portaal_welkomtekst, portaal_actief")
        .eq("id", roles.organisatie_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [form, setForm] = useState({
    slug: "",
    portaal_naam: "",
    portaal_kleur: "#3B82F6",
    portaal_welkomtekst: "",
    portaal_actief: false,
    portaal_logo_url: "" as string | null,
  });

  useEffect(() => {
    if (!org) return;
    setForm({
      slug: org.slug ?? "",
      portaal_naam: org.portaal_naam ?? org.naam ?? "",
      portaal_kleur: org.portaal_kleur ?? "#3B82F6",
      portaal_welkomtekst: org.portaal_welkomtekst ?? "",
      portaal_actief: org.portaal_actief ?? false,
      portaal_logo_url: org.portaal_logo_url,
    });
  }, [org]);

  const save = useMutation({
    mutationFn: async () => {
      if (!org?.id) throw new Error("Geen organisatie");
      const { error } = await supabase
        .from("organisaties")
        .update({
          slug: form.slug || null,
          portaal_naam: form.portaal_naam || null,
          portaal_kleur: form.portaal_kleur || "#3B82F6",
          portaal_welkomtekst: form.portaal_welkomtekst || null,
          portaal_actief: form.portaal_actief,
        })
        .eq("id", org.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Opgeslagen", description: "Klantportaal-instellingen bijgewerkt." });
      qc.invalidateQueries({ queryKey: ["org-portaal-settings"] });
      qc.invalidateQueries({ queryKey: ["tenant-portaal"] });
    },
    onError: (e: any) => toast({ title: "Fout", description: e.message, variant: "destructive" }),
  });

  const onLogoUpload = async (file: File) => {
    if (!org?.id) return;
    const ext = file.name.split(".").pop() || "png";
    const path = `${org.id}/logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("portaal-assets").upload(path, file, { upsert: true });
    if (error) {
      toast({ title: "Upload mislukt", description: error.message, variant: "destructive" });
      return;
    }
    const { data } = supabase.storage.from("portaal-assets").getPublicUrl(path);
    await supabase.from("organisaties").update({ portaal_logo_url: data.publicUrl }).eq("id", org.id);
    setForm((f) => ({ ...f, portaal_logo_url: data.publicUrl }));
    qc.invalidateQueries({ queryKey: ["org-portaal-settings"] });
    toast({ title: "Logo geüpload" });
  };

  if (isLoading) return <div className="h-32 animate-pulse bg-muted rounded-lg" />;
  if (!org) return <Card><CardContent className="p-6">Geen organisatie gevonden.</CardContent></Card>;

  const previewUrl = form.slug ? `${window.location.origin}/t/${form.slug}` : null;
  const subdomeinUrl = form.slug ? `https://${form.slug}.fleeflo.nl` : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Globe className="w-5 h-5 text-primary" /> Klantportaal</CardTitle>
          <CardDescription>
            Geef je klanten een eigen white-label boekomgeving onder jouw merknaam.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border">
            <div>
              <p className="font-medium text-sm text-foreground">Portaal actief</p>
              <p className="text-xs text-muted-foreground">Wanneer uit, is het klantportaal niet bereikbaar.</p>
            </div>
            <Switch checked={form.portaal_actief} onCheckedChange={(v) => setForm({ ...form, portaal_actief: v })} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Slug (URL-naam)</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })}
                placeholder="bijv. mijnverhuur"
              />
              <p className="text-xs text-muted-foreground">3-40 tekens, alleen letters, cijfers en koppeltekens.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Portaalnaam (zichtbaar)</Label>
              <Input
                value={form.portaal_naam}
                onChange={(e) => setForm({ ...form, portaal_naam: e.target.value })}
                placeholder={org.naam}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
            <div className="space-y-1.5">
              <Label>Hoofdkleur</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={form.portaal_kleur}
                  onChange={(e) => setForm({ ...form, portaal_kleur: e.target.value })}
                  className="w-14 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={form.portaal_kleur}
                  onChange={(e) => setForm({ ...form, portaal_kleur: e.target.value })}
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Logo</Label>
              <div className="flex items-center gap-3">
                {form.portaal_logo_url && (
                  <img src={form.portaal_logo_url} alt="logo" className="w-12 h-12 rounded-lg object-cover border border-border" />
                )}
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && onLogoUpload(e.target.files[0])} />
                  <span className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-background hover:bg-accent text-sm">
                    <Upload className="w-4 h-4" /> Logo uploaden
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Welkomsttekst</Label>
            <Textarea
              value={form.portaal_welkomtekst}
              onChange={(e) => setForm({ ...form, portaal_welkomtekst: e.target.value })}
              placeholder="Welkom bij onze autoverhuur. Bekijk ons aanbod en boek direct online."
              rows={3}
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? "Opslaan..." : "Opslaan"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {form.slug ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Jouw portaal-URL</CardTitle>
            <CardDescription>Deel deze link met je klanten.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <UrlRow label="Direct beschikbaar" url={previewUrl!} />
            <UrlRow label="Via subdomein (zodra DNS actief is)" url={subdomeinUrl!} hint="Vereist wildcard DNS *.fleeflo.nl" />
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            Stel hierboven een <span className="font-medium text-foreground">slug</span> in en klik op <span className="font-medium text-foreground">Opslaan</span> om je portaal-URL en domein-instellingen te activeren.
          </CardContent>
        </Card>
      )}

      <CustomDomeinenSectie organisatieId={org.id} />
    </div>
  );
}

function UrlRow({ label, url, hint }: { label: string; url: string; hint?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 text-sm bg-muted px-3 py-2 rounded-md truncate font-mono">{url}</code>
        <Button size="sm" variant="outline" onClick={copy} className="gap-1.5">
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Gekopieerd" : "Kopieer"}
        </Button>
        <Button size="sm" variant="outline" asChild><a href={url} target="_blank" rel="noreferrer"><ExternalLink className="w-3.5 h-3.5" /></a></Button>
      </div>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}