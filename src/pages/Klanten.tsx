import { useState } from "react";
import { useAanvragen } from "@/hooks/useAanvragen";
import { useVoertuigen } from "@/hooks/useVoertuigen";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Car, Sparkles, Trash2, User, Clock, Search } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import ReactMarkdown from "react-markdown";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  nieuw: { label: "Nieuw", variant: "outline" },
  gekoppeld: { label: "Gekoppeld", variant: "default" },
  goedgekeurd: { label: "Goedgekeurd", variant: "secondary" },
  afgewezen: { label: "Afgewezen", variant: "destructive" },
};

export default function Klanten() {
  const { aanvragen, isLoading, addAanvraag, deleteAanvraag } = useAanvragen();
  const { voertuigen } = useVoertuigen();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    klant_naam: "",
    klant_email: "",
    klant_telefoon: "",
    gewenst_type: "",
    gewenste_categorie: "",
    gewenste_brandstof: "",
    gewenste_periode_start: "",
    gewenste_periode_eind: "",
    budget_max: "",
    notitie: "",
  });

  const getVoertuig = (id: string | null) => voertuigen.find((v) => v.id === id);

  const filtered = aanvragen.filter((a) =>
    a.klant_naam.toLowerCase().includes(search.toLowerCase()) ||
    (a.klant_email || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.klant_naam) return;
    setIsSubmitting(true);

    try {
      await addAanvraag.mutateAsync({
        klant_naam: form.klant_naam,
        klant_email: form.klant_email || null,
        klant_telefoon: form.klant_telefoon || null,
        gewenst_type: form.gewenst_type || null,
        gewenste_categorie: form.gewenste_categorie || null,
        gewenste_brandstof: form.gewenste_brandstof || null,
        gewenste_periode_start: form.gewenste_periode_start || null,
        gewenste_periode_eind: form.gewenste_periode_eind || null,
        budget_max: form.budget_max ? Number(form.budget_max) : null,
        notitie: form.notitie || null,
      });
      setFormOpen(false);
      setForm({
        klant_naam: "", klant_email: "", klant_telefoon: "", gewenst_type: "",
        gewenste_categorie: "", gewenste_brandstof: "", gewenste_periode_start: "",
        gewenste_periode_eind: "", budget_max: "", notitie: "",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Klantaanvragen</h1>
          <p className="text-sm text-muted-foreground">Aanvragen worden automatisch gekoppeld aan beschikbare voertuigen via AI</p>
        </div>
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Nieuwe aanvraag</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" /> Nieuwe klantaanvraag
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Klantnaam *</Label>
                <Input value={form.klant_naam} onChange={(e) => setForm({ ...form, klant_naam: e.target.value })} placeholder="Volledige naam" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>E-mail</Label>
                  <Input type="email" value={form.klant_email} onChange={(e) => setForm({ ...form, klant_email: e.target.value })} placeholder="klant@bedrijf.nl" />
                </div>
                <div className="space-y-1.5">
                  <Label>Telefoon</Label>
                  <Input value={form.klant_telefoon} onChange={(e) => setForm({ ...form, klant_telefoon: e.target.value })} placeholder="06-12345678" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Gewenst merk/type</Label>
                  <Input value={form.gewenst_type} onChange={(e) => setForm({ ...form, gewenst_type: e.target.value })} placeholder="Bijv. Toyota Corolla" />
                </div>
                <div className="space-y-1.5">
                  <Label>Categorie</Label>
                  <Select value={form.gewenste_categorie} onValueChange={(v) => setForm({ ...form, gewenste_categorie: v })}>
                    <SelectTrigger><SelectValue placeholder="Kies categorie" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Stadsauto">Stadsauto</SelectItem>
                      <SelectItem value="Sedan">Sedan</SelectItem>
                      <SelectItem value="SUV">SUV</SelectItem>
                      <SelectItem value="Bus">Bus</SelectItem>
                      <SelectItem value="Bestelwagen">Bestelwagen</SelectItem>
                      <SelectItem value="Elektrisch">Elektrisch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Brandstof</Label>
                  <Select value={form.gewenste_brandstof} onValueChange={(v) => setForm({ ...form, gewenste_brandstof: v })}>
                    <SelectTrigger><SelectValue placeholder="Kies brandstof" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Benzine">Benzine</SelectItem>
                      <SelectItem value="Diesel">Diesel</SelectItem>
                      <SelectItem value="Elektrisch">Elektrisch</SelectItem>
                      <SelectItem value="Hybride">Hybride</SelectItem>
                      <SelectItem value="LPG">LPG</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Max dagprijs (€)</Label>
                  <Input type="number" value={form.budget_max} onChange={(e) => setForm({ ...form, budget_max: e.target.value })} placeholder="Bijv. 75" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Startdatum</Label>
                  <Input type="date" value={form.gewenste_periode_start} onChange={(e) => setForm({ ...form, gewenste_periode_start: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Einddatum</Label>
                  <Input type="date" value={form.gewenste_periode_eind} onChange={(e) => setForm({ ...form, gewenste_periode_eind: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Opmerking / wensen</Label>
                <Textarea value={form.notitie} onChange={(e) => setForm({ ...form, notitie: e.target.value })} placeholder="Aanvullende wensen van de klant..." rows={2} />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 animate-pulse" /> AI koppelt voertuig...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Indienen & AI-koppeling
                  </span>
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{aanvragen.length}</p>
            <p className="text-xs text-muted-foreground">Totaal aanvragen</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{aanvragen.filter((a) => a.status === "gekoppeld").length}</p>
            <p className="text-xs text-muted-foreground">Gekoppeld</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{aanvragen.filter((a) => a.status === "nieuw").length}</p>
            <p className="text-xs text-muted-foreground">Nieuw</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{voertuigen.filter((v) => v.status === "beschikbaar").length}</p>
            <p className="text-xs text-muted-foreground">Beschikbaar</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Zoek op klantnaam of e-mail..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">Nog geen aanvragen. Maak een nieuwe aanvraag aan!</CardContent></Card>
        ) : (
          filtered.map((aanvraag) => {
            const voertuig = getVoertuig(aanvraag.gekoppeld_voertuig_id);
            const cfg = statusConfig[aanvraag.status] || statusConfig.nieuw;

            return (
              <Card key={aanvraag.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-foreground">{aanvraag.klant_naam}</span>
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      </div>
                      <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                        {aanvraag.klant_email && <span>{aanvraag.klant_email}</span>}
                        {aanvraag.klant_telefoon && <span>{aanvraag.klant_telefoon}</span>}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(aanvraag.created_at), "d MMM yyyy HH:mm", { locale: nl })}
                        </span>
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-7 w-7">
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Aanvraag verwijderen?</AlertDialogTitle>
                          <AlertDialogDescription>Dit kan niet ongedaan worden.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuleren</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteAanvraag.mutate(aanvraag.id)}>Verwijderen</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  {/* Preferences */}
                  <div className="flex flex-wrap gap-2 text-xs">
                    {aanvraag.gewenst_type && <Badge variant="outline">{aanvraag.gewenst_type}</Badge>}
                    {aanvraag.gewenste_categorie && <Badge variant="outline">{aanvraag.gewenste_categorie}</Badge>}
                    {aanvraag.gewenste_brandstof && <Badge variant="outline">{aanvraag.gewenste_brandstof}</Badge>}
                    {aanvraag.budget_max && <Badge variant="outline">Max €{aanvraag.budget_max}/dag</Badge>}
                  </div>

                  {/* AI Match Result */}
                  {voertuig && (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-primary">
                        <Sparkles className="w-4 h-4" />
                        <span>AI-koppeling</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Car className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{voertuig.merk} {voertuig.model}</span>
                        <span className="text-muted-foreground">({voertuig.kenteken})</span>
                        <Badge variant="secondary">€{voertuig.dagprijs}/dag</Badge>
                      </div>
                      {aanvraag.ai_motivatie && (
                        <div className="text-xs text-muted-foreground prose prose-sm max-w-none">
                          <ReactMarkdown>{aanvraag.ai_motivatie}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  )}

                  {aanvraag.status === "nieuw" && !voertuig && (
                    <div className="rounded-lg border border-muted bg-muted/30 p-3 text-xs text-muted-foreground">
                      Geen passend voertuig gevonden. Controleer de vloot of pas de aanvraag aan.
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
