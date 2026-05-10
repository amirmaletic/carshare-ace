import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, ArrowUp, ArrowDown, Type, AlignLeft, MousePointerClick, Image as ImageIcon, Minus, Move, Eye, ChevronLeft, Save } from "lucide-react";
import {
  EmailBlok,
  EmailBlokType,
  EmailTemplateContent,
  maakNieuwBlok,
  renderTemplateHtml,
  BESCHIKBARE_VARIABELEN,
} from "@/lib/email-blokken";

type Row = {
  id: string;
  organisatie_id: string;
  slug: string;
  naam: string;
  onderwerp: string;
  blokken: EmailBlok[];
  achtergrond_kleur: string;
  accent_kleur: string;
  actief: boolean;
  updated_at: string;
};

const slugify = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60);

export default function EmailTemplatesTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["email_templates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("email_templates" as any).select("*").order("naam");
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const aanmaken = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Niet ingelogd");
      const { data: org } = await supabase.from("user_roles").select("organisatie_id").eq("user_id", user.id).limit(1).maybeSingle();
      const organisatie_id = (org as any)?.organisatie_id;
      if (!organisatie_id) throw new Error("Geen organisatie gevonden");
      const naam = "Nieuwe template";
      const baseSlug = slugify(naam);
      const bestaand = new Set(templates.map((t) => t.slug));
      let slug = baseSlug;
      let i = 2;
      while (bestaand.has(slug)) slug = `${baseSlug}-${i++}`;
      const { data, error } = await supabase.from("email_templates" as any).insert({
        organisatie_id, slug, naam, onderwerp: "Onderwerp van je e-mail",
        blokken: [maakNieuwBlok("heading"), maakNieuwBlok("tekst"), maakNieuwBlok("knop")],
      }).select("id").single();
      if (error) throw error;
      return (data as any).id as string;
    },
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: ["email_templates"] });
      setActiveId(id);
    },
    onError: (e: Error) => toast({ title: "Aanmaken mislukt", description: e.message, variant: "destructive" }),
  });

  const verwijderen = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("email_templates" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["email_templates"] }); setActiveId(null); },
  });

  const actief = useMemo(() => templates.find((t) => t.id === activeId) ?? null, [templates, activeId]);

  if (activeId && actief) {
    return <Editor template={actief} onTerug={() => setActiveId(null)} onVerwijder={() => verwijderen.mutate(actief.id)} />;
  }

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">E-mailtemplates</h3>
          <p className="text-xs text-muted-foreground">Bouw eigen templates met de visuele editor en gebruik ze in transactionele e-mails.</p>
        </div>
        <Button onClick={() => aanmaken.mutate()} disabled={aanmaken.isPending} className="gap-1.5">
          <Plus className="w-4 h-4" /> Nieuwe template
        </Button>
      </div>
      <Separator />
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Laden...</p>
      ) : templates.length === 0 ? (
        <div className="text-center py-10 text-sm text-muted-foreground">
          Nog geen templates. Maak je eerste aan met de knop hierboven.
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {templates.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{t.naam}</span>
                  {!t.actief && <Badge variant="secondary" className="text-[10px]">Inactief</Badge>}
                </div>
                <p className="text-xs text-muted-foreground truncate">{t.onderwerp || "Geen onderwerp"} · slug: {t.slug}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setActiveId(t.id)}>Bewerken</Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

const BLOK_TYPES: { type: EmailBlokType; label: string; icon: any }[] = [
  { type: "heading", label: "Titel", icon: Type },
  { type: "tekst", label: "Tekst", icon: AlignLeft },
  { type: "knop", label: "Knop", icon: MousePointerClick },
  { type: "afbeelding", label: "Afbeelding", icon: ImageIcon },
  { type: "divider", label: "Lijn", icon: Minus },
  { type: "spacer", label: "Ruimte", icon: Move },
];

function Editor({ template, onTerug, onVerwijder }: { template: Row; onTerug: () => void; onVerwijder: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [naam, setNaam] = useState(template.naam);
  const [onderwerp, setOnderwerp] = useState(template.onderwerp);
  const [actief, setActief] = useState(template.actief);
  const [accent, setAccent] = useState(template.accent_kleur);
  const [bg, setBg] = useState(template.achtergrond_kleur);
  const [blokken, setBlokken] = useState<EmailBlok[]>(template.blokken ?? []);
  const [selectedId, setSelectedId] = useState<string | null>(blokken[0]?.id ?? null);

  useEffect(() => {
    setNaam(template.naam); setOnderwerp(template.onderwerp); setActief(template.actief);
    setAccent(template.accent_kleur); setBg(template.achtergrond_kleur);
    setBlokken(template.blokken ?? []);
  }, [template.id]);

  const opslaan = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("email_templates" as any).update({
        naam, onderwerp, actief, accent_kleur: accent, achtergrond_kleur: bg, blokken,
      }).eq("id", template.id);
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: "Opgeslagen" }); qc.invalidateQueries({ queryKey: ["email_templates"] }); },
    onError: (e: Error) => toast({ title: "Opslaan mislukt", description: e.message, variant: "destructive" }),
  });

  const voegToe = (type: EmailBlokType) => {
    const nieuw = maakNieuwBlok(type);
    setBlokken((b) => [...b, nieuw]);
    setSelectedId(nieuw.id);
  };
  const update = (id: string, patch: Partial<EmailBlok>) =>
    setBlokken((b) => b.map((blk) => (blk.id === id ? ({ ...blk, ...patch } as EmailBlok) : blk)));
  const verwijder = (id: string) => setBlokken((b) => b.filter((x) => x.id !== id));
  const verplaats = (id: string, dir: -1 | 1) =>
    setBlokken((b) => {
      const i = b.findIndex((x) => x.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= b.length) return b;
      const c = b.slice(); [c[i], c[j]] = [c[j], c[i]]; return c;
    });

  const previewData = Object.fromEntries(BESCHIKBARE_VARIABELEN.map((v) => [v.sleutel, v.voorbeeld]));
  const previewHtml = renderTemplateHtml({ blokken, accent_kleur: accent, achtergrond_kleur: bg }, previewData);
  const selected = blokken.find((b) => b.id === selectedId) ?? null;

  return (
    <Card className="p-5 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={onTerug} className="gap-1"><ChevronLeft className="w-4 h-4" /> Terug</Button>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onVerwijder} className="text-destructive gap-1"><Trash2 className="w-4 h-4" /> Verwijderen</Button>
          <Button onClick={() => opslaan.mutate()} disabled={opslaan.isPending} className="gap-1"><Save className="w-4 h-4" /> {opslaan.isPending ? "Opslaan..." : "Opslaan"}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5"><Label>Naam</Label><Input value={naam} onChange={(e) => setNaam(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Onderwerp</Label><Input value={onderwerp} onChange={(e) => setOnderwerp(e.target.value)} placeholder="Bijv. Je factuur {{factuur_nr}}" /></div>
        <div className="space-y-1.5"><Label>Achtergrondkleur</Label><Input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="h-9 w-20 p-1" /></div>
        <div className="space-y-1.5"><Label>Accent (knoppen)</Label><Input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="h-9 w-20 p-1" /></div>
        <div className="flex items-center gap-2 col-span-full"><Switch checked={actief} onCheckedChange={setActief} /><span className="text-sm">Template actief</span></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr_300px] gap-4">
        {/* Blok-bibliotheek */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Blokken toevoegen</p>
          {BLOK_TYPES.map((b) => (
            <button key={b.type} onClick={() => voegToe(b.type)} className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors text-left">
              <b.icon className="w-4 h-4 text-muted-foreground" /> {b.label}
            </button>
          ))}
          <Separator className="my-3" />
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Variabelen</p>
          <div className="text-xs text-muted-foreground space-y-1">
            {BESCHIKBARE_VARIABELEN.map((v) => (
              <code key={v.sleutel} className="block bg-muted/50 px-1.5 py-0.5 rounded text-[11px]">{`{{${v.sleutel}}}`}</code>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div className="space-y-2 min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Eye className="w-3 h-3" /> Voorvertoning (klik om te bewerken)</div>
          <div className="rounded-lg overflow-hidden border border-border" style={{ background: "#f1f5f9" }}>
            <div className="p-4">
              <div className="mx-auto max-w-[560px] rounded-lg" style={{ background: bg }}>
                <div className="p-6 space-y-1">
                  {blokken.length === 0 && (
                    <div className="text-center py-12 text-sm text-muted-foreground">Voeg blokken toe links.</div>
                  )}
                  {blokken.map((b) => (
                    <BlokRender key={b.id} blok={b} accent={accent} selected={selectedId === b.id} onClick={() => setSelectedId(b.id)} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Inspector */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Eigenschappen</p>
          {!selected ? (
            <p className="text-xs text-muted-foreground">Klik op een blok in de voorvertoning om te bewerken.</p>
          ) : (
            <div className="space-y-3">
              <Inspector blok={selected} onUpdate={(p) => update(selected.id, p)} />
              <div className="flex items-center gap-1 pt-2 border-t border-border">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => verplaats(selected.id, -1)}><ArrowUp className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => verplaats(selected.id, 1)}><ArrowDown className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 ml-auto text-destructive" onClick={() => { verwijder(selected.id); setSelectedId(null); }}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <details className="text-xs">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">HTML-uitvoer bekijken</summary>
        <pre className="mt-2 p-3 bg-muted/40 rounded text-[10px] overflow-auto max-h-60">{previewHtml}</pre>
      </details>
    </Card>
  );
}

function BlokRender({ blok, accent, selected, onClick }: { blok: EmailBlok; accent: string; selected: boolean; onClick: () => void }) {
  const wrap = (inner: React.ReactNode) => (
    <div onClick={onClick} className={`cursor-pointer rounded outline outline-2 ${selected ? "outline-primary" : "outline-transparent hover:outline-primary/30"} transition`}>
      {inner}
    </div>
  );
  switch (blok.type) {
    case "heading": {
      const Tag = (`h${blok.niveau}`) as keyof JSX.IntrinsicElements;
      const sz = blok.niveau === 1 ? "text-2xl" : blok.niveau === 2 ? "text-xl" : "text-base";
      return wrap(<Tag className={`${sz} font-semibold text-slate-900 mb-3`}>{blok.tekst}</Tag>);
    }
    case "tekst":
      return wrap(<p className="text-[15px] text-slate-700 leading-relaxed whitespace-pre-wrap mb-3">{blok.tekst}</p>);
    case "knop":
      return wrap(<div className="my-2"><span className="inline-block px-5 py-2.5 rounded-lg text-white text-sm font-semibold" style={{ background: accent }}>{blok.tekst}</span></div>);
    case "afbeelding":
      return wrap(<img src={blok.src} alt={blok.alt ?? ""} className="max-w-full h-auto rounded mb-3" />);
    case "divider":
      return wrap(<hr className="border-t border-slate-200 my-4" />);
    case "spacer":
      return wrap(<div style={{ height: blok.hoogte }} className="bg-slate-50/50" />);
  }
}

function Inspector({ blok, onUpdate }: { blok: EmailBlok; onUpdate: (p: Partial<EmailBlok>) => void }) {
  switch (blok.type) {
    case "heading":
      return (
        <>
          <div className="space-y-1.5"><Label className="text-xs">Tekst</Label><Input value={blok.tekst} onChange={(e) => onUpdate({ tekst: e.target.value } as any)} /></div>
          <div className="space-y-1.5"><Label className="text-xs">Niveau</Label>
            <select value={blok.niveau} onChange={(e) => onUpdate({ niveau: Number(e.target.value) as 1|2|3 } as any)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
              <option value={1}>H1 - Groot</option><option value={2}>H2 - Medium</option><option value={3}>H3 - Klein</option>
            </select>
          </div>
        </>
      );
    case "tekst":
      return <div className="space-y-1.5"><Label className="text-xs">Tekst</Label><Textarea rows={6} value={blok.tekst} onChange={(e) => onUpdate({ tekst: e.target.value } as any)} /></div>;
    case "knop":
      return (
        <>
          <div className="space-y-1.5"><Label className="text-xs">Knoptekst</Label><Input value={blok.tekst} onChange={(e) => onUpdate({ tekst: e.target.value } as any)} /></div>
          <div className="space-y-1.5"><Label className="text-xs">URL</Label><Input value={blok.url} onChange={(e) => onUpdate({ url: e.target.value } as any)} placeholder="https:// of {{betaal_link}}" /></div>
        </>
      );
    case "afbeelding":
      return (
        <>
          <div className="space-y-1.5"><Label className="text-xs">Afbeelding URL</Label><Input value={blok.src} onChange={(e) => onUpdate({ src: e.target.value } as any)} /></div>
          <div className="space-y-1.5"><Label className="text-xs">Alt-tekst</Label><Input value={blok.alt ?? ""} onChange={(e) => onUpdate({ alt: e.target.value } as any)} /></div>
        </>
      );
    case "divider":
      return <p className="text-xs text-muted-foreground">Een horizontale scheidingslijn. Geen instellingen.</p>;
    case "spacer":
      return <div className="space-y-1.5"><Label className="text-xs">Hoogte (px)</Label><Input type="number" min={0} max={200} value={blok.hoogte} onChange={(e) => onUpdate({ hoogte: Number(e.target.value) } as any)} /></div>;
  }
}