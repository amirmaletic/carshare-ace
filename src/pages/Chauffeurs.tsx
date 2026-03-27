import { useState } from "react";
import { Search, Plus, User, Phone, Mail, Car, CreditCard, AlertTriangle, Edit, Trash2 } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { nl } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { ChauffeurForm } from "@/components/ChauffeurForm";
import { useChauffeurs, type Chauffeur } from "@/hooks/useChauffeurs";
import { useVoertuigen } from "@/hooks/useVoertuigen";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const statusColors: Record<string, "success" | "warning" | "default"> = {
  actief: "success",
  inactief: "default",
  verlof: "warning",
};

export default function Chauffeurs() {
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editChauffeur, setEditChauffeur] = useState<Chauffeur | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { chauffeurs, isLoading, deleteChauffeur } = useChauffeurs();
  const { voertuigen } = useVoertuigen();

  const filtered = chauffeurs.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.voornaam.toLowerCase().includes(q) ||
      c.achternaam.toLowerCase().includes(q) ||
      (c.email?.toLowerCase().includes(q) ?? false) ||
      (c.telefoon?.includes(q) ?? false)
    );
  });

  const getVoertuig = (id: string | null) => {
    if (!id) return null;
    return voertuigen.find((v) => v.id === id);
  };

  const isRijbewijsBijnaVerlopen = (date: string | null) => {
    if (!date) return false;
    return differenceInDays(new Date(date), new Date()) <= 30;
  };

  const handleEdit = (c: Chauffeur) => {
    setEditChauffeur(c);
    setFormOpen(true);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteChauffeur.mutate(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Chauffeurs</h1>
          <p className="text-muted-foreground mt-1">{chauffeurs.length} chauffeur{chauffeurs.length !== 1 ? "s" : ""} geregistreerd</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Zoek op naam, e-mail of telefoon..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Button className="gap-2 w-full sm:w-auto" onClick={() => { setEditChauffeur(null); setFormOpen(true); }}>
            <Plus className="w-4 h-4" />
            Chauffeur toevoegen
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 clean-card">
          <User className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">
            {chauffeurs.length === 0 ? "Nog geen chauffeurs" : "Geen resultaten"}
          </p>
          {chauffeurs.length === 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              Voeg je eerste chauffeur toe om te beginnen
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((c, i) => {
            const voertuig = getVoertuig(c.voertuig_id);
            const rijbewijsWarning = isRijbewijsBijnaVerlopen(c.rijbewijs_verloopt);

            return (
              <div
                key={c.id}
                className="clean-card p-5 space-y-4 animate-fade-in hover:shadow-md transition-all"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {c.voornaam} {c.achternaam}
                      </h3>
                      <StatusBadge status={c.status} variant={statusColors[c.status] || "default"} />
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(c)} className="h-8 w-8 p-0">
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteId(c.id)} className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Contact */}
                <div className="space-y-1.5">
                  {c.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{c.email}</span>
                    </div>
                  )}
                  {c.telefoon && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                      <span>{c.telefoon}</span>
                    </div>
                  )}
                </div>

                {/* Rijbewijs + Voertuig */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                  <Badge variant="secondary" className={cn("gap-1 text-xs", rijbewijsWarning && "border-warning text-warning")}>
                    <CreditCard className="w-3 h-3" />
                    {c.rijbewijs_categorie}
                    {rijbewijsWarning && <AlertTriangle className="w-3 h-3" />}
                  </Badge>
                  {c.rijbewijs_verloopt && (
                    <span className={cn("text-xs", rijbewijsWarning ? "text-warning font-medium" : "text-muted-foreground")}>
                      Verloopt {format(new Date(c.rijbewijs_verloopt), "d MMM yyyy", { locale: nl })}
                    </span>
                  )}
                </div>

                {voertuig && (
                  <div className="flex items-center gap-2 text-sm bg-muted/50 rounded-lg px-3 py-2">
                    <Car className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-foreground font-medium truncate">
                      {voertuig.merk} {voertuig.model}
                    </span>
                    <span className="text-muted-foreground font-mono text-xs ml-auto">{voertuig.kenteken}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ChauffeurForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditChauffeur(null);
        }}
        chauffeur={editChauffeur}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Chauffeur verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              Deze actie kan niet ongedaan worden gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
