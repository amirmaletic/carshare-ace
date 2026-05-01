import { useMemo, useState } from "react";
import { useRijbewijsVerificaties, useVerstuurRijbewijsVerzoek, useBeoordeelRijbewijs, getStatusLabel, getStatusColor, type RijbewijsVerificatie, type RijbewijsStatus } from "@/hooks/useRijbewijsVerificaties";
import { useKlanten } from "@/hooks/useKlanten";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Mail, CheckCircle2, XCircle, Eye, IdCard, Sparkles, AlertCircle, ExternalLink, Copy } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { cn } from "@/lib/utils";

const filters: { value: RijbewijsStatus | "Alle"; label: string }[] = [
  { value: "Alle", label: "Alle" },
  { value: "in_afwachting", label: "Wacht op upload" },
  { value: "ingediend", label: "Te beoordelen" },
  { value: "goedgekeurd", label: "Goedgekeurd" },
  { value: "afgewezen", label: "Afgewezen" },
];

export default function Rijbewijzen() {
  const { data: verificaties = [], isLoading } = useRijbewijsVerificaties();
  const { klanten = [] } = useKlanten();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<RijbewijsStatus | "Alle">("Alle");
  const [selected, setSelected] = useState<RijbewijsVerificatie | null>(null);
  const verstuur = useVerstuurRijbewijsVerzoek();
  const beoordeel = useBeoordeelRijbewijs();

  const klantById = useMemo(() => {
    const m = new Map<string, any>();
    klanten.forEach((k: any) => m.set(k.id, k));
    return m;
  }, [klanten]);

  const filtered = verificaties.filter((v) => {
    const klant = klantById.get(v.klant_id);
    const naam = klant ? `${klant.voornaam} ${klant.achternaam}`.toLowerCase() : "";
    const matchesSearch = !search || naam.includes(search.toLowerCase()) || (klant?.email ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "Alle" || v.status === filter;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    open: verificaties.filter((v) => v.status === "in_afwachting").length,
    teBeoordelen: verificaties.filter((v) => v.status === "ingediend").length,
    goedgekeurd: verificaties.filter((v) => v.status === "goedgekeurd").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <IdCard className="w-6 h-6 text-primary" />
          Rijbewijsverificatie
        </h1>
        <p className="text-muted-foreground mt-1">
          AI-gestuurde controle van rijbewijzen. Klanten ontvangen automatisch een upload-link bij een nieuw contract.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatBox label="Wacht op upload" value={stats.open} />
        <StatBox label="Te beoordelen" value={stats.teBeoordelen} highlight={stats.teBeoordelen > 0} />
        <StatBox label="Goedgekeurd" value={stats.goedgekeurd} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Zoek op naam of email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                filter === f.value ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <IdCard className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
          <h3 className="font-semibold text-foreground mb-1">Geen verificaties gevonden</h3>
          <p className="text-sm text-muted-foreground">
            Verzoeken worden automatisch aangemaakt zodra je een nieuw contract maakt.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((v) => {
            const klant = klantById.get(v.klant_id);
            return (
              <Card key={v.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground">
                        {klant ? `${klant.voornaam} ${klant.achternaam}` : "Onbekende klant"}
                      </span>
                      <Badge variant={getStatusColor(v.status)}>{getStatusLabel(v.status)}</Badge>
                      {v.ai_confidence && (
                        <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          AI {Math.round(v.ai_confidence * 100)}%
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <div>{klant?.email}</div>
                      <div>Aangemaakt {format(new Date(v.created_at), "d MMM yyyy", { locale: nl })}</div>
                      {v.ai_vervaldatum && (
                        <div className={cn(
                          new Date(v.ai_vervaldatum) < new Date() ? "text-destructive font-medium" : ""
                        )}>
                          Rijbewijs vervalt {format(new Date(v.ai_vervaldatum), "d MMM yyyy", { locale: nl })}
                        </div>
                      )}
                      {v.validatie_notities && (
                        <div className="text-amber-600 inline-flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {v.validatie_notities}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {v.status === "in_afwachting" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        disabled={verstuur.isPending}
                        onClick={() => verstuur.mutate({ verificatie_id: v.id, is_herinnering: !!v.email_verzonden_op })}
                      >
                        <Mail className="w-3.5 h-3.5" />
                        {v.email_verzonden_op ? "Herinnering" : "Verstuur link"}
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => setSelected(v)}>
                      <Eye className="w-3.5 h-3.5" />
                      Bekijk
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <DetailDialog
        verificatie={selected}
        klant={selected ? klantById.get(selected.klant_id) : null}
        onClose={() => setSelected(null)}
        onBeoordeel={(status, reden) =>
          selected && beoordeel.mutate({ id: selected.id, status, reden }, { onSuccess: () => setSelected(null) })
        }
      />
    </div>
  );
}

function StatBox({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <Card className={cn("p-4", highlight && "border-primary/40 bg-primary/5")}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold text-foreground mt-1">{value}</div>
    </Card>
  );
}

function DetailDialog({
  verificatie, klant, onClose, onBeoordeel,
}: {
  verificatie: RijbewijsVerificatie | null;
  klant: any;
  onClose: () => void;
  onBeoordeel: (status: "goedgekeurd" | "afgewezen", reden?: string) => void;
}) {
  const [voorUrl, setVoorUrl] = useState<string | null>(null);
  const [achtUrl, setAchtUrl] = useState<string | null>(null);
  const [reden, setReden] = useState("");

  useState(() => {
    if (!verificatie) return;
  });

  // Genereer signed URLs bij opening
  useMemo(() => {
    if (!verificatie) {
      setVoorUrl(null);
      setAchtUrl(null);
      return;
    }
    (async () => {
      if (verificatie.voorkant_pad) {
        const { data } = await supabase.storage.from("rijbewijzen").createSignedUrl(verificatie.voorkant_pad, 600);
        setVoorUrl(data?.signedUrl ?? null);
      }
      if (verificatie.achterkant_pad) {
        const { data } = await supabase.storage.from("rijbewijzen").createSignedUrl(verificatie.achterkant_pad, 600);
        setAchtUrl(data?.signedUrl ?? null);
      }
    })();
  }, [verificatie?.id]);

  const uploadLink = verificatie ? `${window.location.origin}/rijbewijs/${verificatie.upload_token}` : "";

  return (
    <Dialog open={!!verificatie} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Rijbewijsverificatie · {klant?.voornaam} {klant?.achternaam}
          </DialogTitle>
        </DialogHeader>

        {verificatie && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-3">
                <div className="text-xs font-medium text-muted-foreground mb-2">Voorkant</div>
                {voorUrl ? (
                  <a href={voorUrl} target="_blank" rel="noreferrer">
                    <img src={voorUrl} alt="Voorkant" className="w-full rounded border" />
                  </a>
                ) : (
                  <div className="text-sm text-muted-foreground">Nog niet geüpload</div>
                )}
              </Card>
              <Card className="p-3">
                <div className="text-xs font-medium text-muted-foreground mb-2">Achterkant</div>
                {achtUrl ? (
                  <a href={achtUrl} target="_blank" rel="noreferrer">
                    <img src={achtUrl} alt="Achterkant" className="w-full rounded border" />
                  </a>
                ) : (
                  <div className="text-sm text-muted-foreground">Nog niet geüpload</div>
                )}
              </Card>
            </div>

            {verificatie.ai_naam && (
              <Card className="p-4 bg-muted/30">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold">AI-uitgelezen gegevens</span>
                  {verificatie.ai_confidence && (
                    <Badge variant="outline">Zekerheid {Math.round(verificatie.ai_confidence * 100)}%</Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <Field label="Naam" value={verificatie.ai_naam} />
                  <Field label="Geboortedatum" value={verificatie.ai_geboortedatum} />
                  <Field label="Documentnummer" value={verificatie.ai_rijbewijsnummer} />
                  <Field label="Categorieën" value={verificatie.ai_categorieen?.join(", ")} />
                  <Field label="Afgegeven" value={verificatie.ai_afgiftedatum} />
                  <Field
                    label="Vervaldatum"
                    value={verificatie.ai_vervaldatum}
                    danger={verificatie.ai_vervaldatum ? new Date(verificatie.ai_vervaldatum) < new Date() : false}
                  />
                </div>
                {verificatie.validatie_notities && (
                  <div className="mt-3 p-2 rounded bg-amber-50 dark:bg-amber-950/20 text-xs text-amber-800 dark:text-amber-200">
                    {verificatie.validatie_notities}
                  </div>
                )}
              </Card>
            )}

            <Card className="p-3 flex items-center gap-2">
              <Input value={uploadLink} readOnly className="text-xs" />
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 shrink-0"
                onClick={() => {
                  navigator.clipboard.writeText(uploadLink);
                  toast({ title: "Link gekopieerd" });
                }}
              >
                <Copy className="w-3.5 h-3.5" />
                Kopieer
              </Button>
              <Button size="sm" variant="ghost" className="gap-1.5 shrink-0" asChild>
                <a href={uploadLink} target="_blank" rel="noreferrer"><ExternalLink className="w-3.5 h-3.5" /></a>
              </Button>
            </Card>

            {(verificatie.status === "ingediend" || verificatie.status === "goedgekeurd" || verificatie.status === "afgewezen") && (
              <div className="space-y-2">
                {verificatie.status !== "afgewezen" && (
                  <Input
                    placeholder="Reden bij afwijzing (optioneel)"
                    value={reden}
                    onChange={(e) => setReden(e.target.value)}
                  />
                )}
                <div className="flex gap-2">
                  <Button
                    className="flex-1 gap-2"
                    onClick={() => onBeoordeel("goedgekeurd")}
                    disabled={verificatie.status === "goedgekeurd"}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Goedkeuren
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 gap-2"
                    onClick={() => onBeoordeel("afgewezen", reden)}
                    disabled={verificatie.status === "afgewezen"}
                  >
                    <XCircle className="w-4 h-4" />
                    Afwijzen
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value, danger }: { label: string; value?: string | null; danger?: boolean }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn("text-sm font-medium", danger ? "text-destructive" : "text-foreground")}>
        {value || "—"}
      </div>
    </div>
  );
}