import { useState } from "react";
import { useRitten } from "@/hooks/useRitten";
import { useVoertuigen } from "@/hooks/useVoertuigen";
import { useChauffeurs } from "@/hooks/useChauffeurs";
import { RitForm } from "@/components/RitForm";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, ArrowRight, Clock, Car, User, Euro, Trash2, Search, Route, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  gepland: { label: "Gepland", variant: "outline" },
  onderweg: { label: "Onderweg", variant: "default" },
  afgerond: { label: "Afgerond", variant: "secondary" },
  geannuleerd: { label: "Geannuleerd", variant: "destructive" },
};

const typeLabels: Record<string, string> = {
  transport: "Transport",
  vestiging: "Tussen vestigingen",
  klant: "Klantrit",
  prive: "Privé",
};

export default function Ritten() {
  const { ritten, isLoading, updateRit, deleteRit } = useRitten();
  const { voertuigen } = useVoertuigen();
  const { chauffeurs } = useChauffeurs();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("alle");

  const getVoertuig = (id: string | null) => voertuigen.find((v) => v.id === id);
  const getChauffeur = (id: string | null) => chauffeurs.find((c) => c.id === id);

  const filtered = ritten.filter((r) => {
    const matchSearch =
      r.van_locatie.toLowerCase().includes(search.toLowerCase()) ||
      r.naar_locatie.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "alle" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const geplande = filtered.filter((r) => r.status === "gepland");
  const actieve = filtered.filter((r) => r.status === "onderweg");
  const afgeronde = filtered.filter((r) => r.status === "afgerond" || r.status === "geannuleerd");

  const totaalKosten = ritten.filter((r) => r.status === "afgerond").reduce((sum, r) => sum + (r.kosten || 0), 0);
  const totaalKm = ritten.filter((r) => r.status === "afgerond").reduce((sum, r) => sum + (r.afstand_km || 0), 0);

  const handleStatusChange = (id: string, status: string) => {
    updateRit.mutate({ id, status });
  };

  const RitCard = ({ rit }: { rit: typeof ritten[0] }) => {
    const voertuig = getVoertuig(rit.voertuig_id);
    const chauffeur = getChauffeur(rit.chauffeur_id);
    const cfg = statusConfig[rit.status] || statusConfig.gepland;

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="w-4 h-4 text-primary" />
              <span>{rit.van_locatie}</span>
              <ArrowRight className="w-3 h-3 text-muted-foreground" />
              <span>{rit.naar_locatie}</span>
            </div>
            <Badge variant={cfg.variant}>{cfg.label}</Badge>
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {format(new Date(rit.datum), "d MMM yyyy", { locale: nl })}
              {rit.vertrek_tijd && ` ${rit.vertrek_tijd.slice(0, 5)}`}
              {rit.aankomst_tijd && ` - ${rit.aankomst_tijd.slice(0, 5)}`}
            </span>
            {voertuig && (
              <span className="flex items-center gap-1">
                <Car className="w-3 h-3" />
                {voertuig.merk} {voertuig.model}
              </span>
            )}
            {chauffeur && (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {chauffeur.voornaam} {chauffeur.achternaam}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-3 text-xs">
              {rit.afstand_km > 0 && (
                <span className="flex items-center gap-1">
                  <Route className="w-3 h-3" /> {rit.afstand_km} km
                </span>
              )}
              {rit.kosten > 0 && (
                <span className="flex items-center gap-1 text-primary font-medium">
                  <Euro className="w-3 h-3" /> €{rit.kosten.toFixed(2)}
                </span>
              )}
              <Badge variant="outline" className="text-[10px]">{typeLabels[rit.type] || rit.type}</Badge>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs gap-1"
                onClick={() => {
                  const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(rit.van_locatie)}&destination=${encodeURIComponent(rit.naar_locatie)}&travelmode=driving`;
                  window.open(url, "_blank");
                }}
              >
                <ExternalLink className="w-3 h-3" /> Route
              </Button>
              {rit.status === "gepland" && (
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleStatusChange(rit.id, "onderweg")}>
                  Start
                </Button>
              )}
              {rit.status === "onderweg" && (
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleStatusChange(rit.id, "afgerond")}>
                  Afronden
                </Button>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-7 w-7">
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Rit verwijderen?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Weet je zeker dat je deze rit wilt verwijderen?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuleren</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteRit.mutate(rit.id)}>Verwijderen</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>
    );
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
          <h1 className="text-2xl font-bold text-foreground">Ritregistratie & Transport</h1>
          <p className="text-sm text-muted-foreground">Plan ritten, volg transport en bereken kosten</p>
        </div>
        <RitForm />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{ritten.length}</p>
            <p className="text-xs text-muted-foreground">Totaal ritten</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{geplande.length + actieve.length}</p>
            <p className="text-xs text-muted-foreground">Actief / Gepland</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{totaalKm.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Totaal km</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">€{totaalKosten.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">Totaal kosten</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Zoek op locatie..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle statussen</SelectItem>
            <SelectItem value="gepland">Gepland</SelectItem>
            <SelectItem value="onderweg">Onderweg</SelectItem>
            <SelectItem value="afgerond">Afgerond</SelectItem>
            <SelectItem value="geannuleerd">Geannuleerd</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="alle">
        <TabsList>
          <TabsTrigger value="alle">Alle ({filtered.length})</TabsTrigger>
          <TabsTrigger value="gepland">Gepland ({geplande.length})</TabsTrigger>
          <TabsTrigger value="actief">Onderweg ({actieve.length})</TabsTrigger>
          <TabsTrigger value="afgerond">Afgerond ({afgeronde.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="alle" className="space-y-3 mt-4">
          {filtered.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Geen ritten gevonden. Plan je eerste rit!</CardContent></Card>
          ) : filtered.map((r) => <RitCard key={r.id} rit={r} />)}
        </TabsContent>

        <TabsContent value="gepland" className="space-y-3 mt-4">
          {geplande.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Geen geplande ritten</CardContent></Card>
          ) : geplande.map((r) => <RitCard key={r.id} rit={r} />)}
        </TabsContent>

        <TabsContent value="actief" className="space-y-3 mt-4">
          {actieve.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Geen actieve ritten</CardContent></Card>
          ) : actieve.map((r) => <RitCard key={r.id} rit={r} />)}
        </TabsContent>

        <TabsContent value="afgerond" className="space-y-3 mt-4">
          {afgeronde.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Geen afgeronde ritten</CardContent></Card>
          ) : afgeronde.map((r) => <RitCard key={r.id} rit={r} />)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
