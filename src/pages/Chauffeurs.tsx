import { useState } from "react";
import { Search, Plus, User, Phone, Mail, Car, CreditCard, AlertTriangle, Edit, Trash2, LayoutGrid, List, Filter } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { nl } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { ChauffeurForm } from "@/components/ChauffeurForm";
import { ChauffeurDetail } from "@/components/ChauffeurDetail";
import { useChauffeurs, type Chauffeur } from "@/hooks/useChauffeurs";
import { useVoertuigen } from "@/hooks/useVoertuigen";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";

const statusColors: Record<string, "success" | "warning" | "muted"> = {
  actief: "success",
  inactief: "muted",
  verlof: "warning",
};

const statusFilters = [
  { value: "alle", label: "Alle" },
  { value: "actief", label: "Actief" },
  { value: "inactief", label: "Inactief" },
  { value: "verlof", label: "Verlof" },
];

export default function Chauffeurs() {
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("alle");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [formOpen, setFormOpen] = useState(false);
  const [editChauffeur, setEditChauffeur] = useState<Chauffeur | null>(null);
  const [selectedChauffeur, setSelectedChauffeur] = useState<Chauffeur | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { chauffeurs, isLoading, deleteChauffeur } = useChauffeurs();
  const { voertuigen } = useVoertuigen();

  const filtered = chauffeurs.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch = c.voornaam.toLowerCase().includes(q) ||
      c.achternaam.toLowerCase().includes(q) ||
      (c.email?.toLowerCase().includes(q) ?? false) ||
      (c.telefoon?.includes(q) ?? false);
    const matchStatus = statusFilter === "alle" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getVoertuig = (id: string | null) => id ? voertuigen.find((v) => v.id === id) : null;
  const isRijbewijsBijnaVerlopen = (date: string | null) => date ? differenceInDays(new Date(date), new Date()) <= 30 : false;

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

  // Stats
  const actief = chauffeurs.filter((c) => c.status === "actief").length;
  const opVerlof = chauffeurs.filter((c) => c.status === "verlof").length;
  const rijbewijsWaarschuwingen = chauffeurs.filter((c) => isRijbewijsBijnaVerlopen(c.rijbewijs_verloopt)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Chauffeurs</h1>
          <p className="text-muted-foreground mt-1">{chauffeurs.length} chauffeur{chauffeurs.length !== 1 ? "s" : ""} geregistreerd</p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="clean-card p-3 text-center">
            <p className="text-xl font-bold text-foreground">{actief}</p>
            <p className="text-xs text-muted-foreground">Actief</p>
          </div>
          <div className="clean-card p-3 text-center">
            <p className="text-xl font-bold text-warning">{opVerlof}</p>
            <p className="text-xs text-muted-foreground">Op verlof</p>
          </div>
          <div className="clean-card p-3 text-center">
            <p className={cn("text-xl font-bold", rijbewijsWaarschuwingen > 0 ? "text-destructive" : "text-foreground")}>{rijbewijsWaarschuwingen}</p>
            <p className="text-xs text-muted-foreground">Rijbewijs ⚠️</p>
          </div>
        </div>

        {/* Search + filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Zoek op naam, e-mail of telefoon..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <div className="flex gap-2">
            {/* Status filters */}
            <div className="flex bg-muted rounded-lg p-0.5">
              {statusFilters.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                    statusFilter === f.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            {/* View toggle */}
            <div className="flex bg-muted rounded-lg p-0.5">
              <button onClick={() => setViewMode("grid")} className={cn("p-1.5 rounded-md", viewMode === "grid" ? "bg-background shadow-sm" : "")}>
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode("list")} className={cn("p-1.5 rounded-md", viewMode === "list" ? "bg-background shadow-sm" : "")}>
                <List className="w-4 h-4" />
              </button>
            </div>
            <Button className="gap-2" onClick={() => { setEditChauffeur(null); setFormOpen(true); }}>
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Toevoegen</span>
            </Button>
          </div>
        </div>
      </div>

      <div className={cn("flex gap-6", selectedChauffeur && !isMobile ? "flex-col lg:flex-row" : "")}>
        {/* Main content */}
        <div className={cn("flex-1 min-w-0", selectedChauffeur && !isMobile && "lg:max-w-[50%]")}>
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
            </div>
          ) : viewMode === "list" ? (
            /* TABLE VIEW */
            <div className="clean-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left p-3 font-medium text-muted-foreground">Naam</th>
                      <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Contact</th>
                      <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Rijbewijs</th>
                      <th className="text-left p-3 font-medium text-muted-foreground hidden lg:table-cell">Voertuig</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Acties</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c) => {
                      const voertuig = getVoertuig(c.voertuig_id);
                      const rijbewijsWarning = isRijbewijsBijnaVerlopen(c.rijbewijs_verloopt);
                      return (
                        <tr
                          key={c.id}
                          className={cn("border-b border-border last:border-0 hover:bg-muted/20 cursor-pointer transition-colors", selectedChauffeur?.id === c.id && "bg-primary/5")}
                          onClick={() => setSelectedChauffeur(c)}
                        >
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4 text-primary" />
                              </div>
                              <span className="font-medium text-foreground">{c.voornaam} {c.achternaam}</span>
                            </div>
                          </td>
                          <td className="p-3 hidden sm:table-cell">
                            <div className="space-y-0.5">
                              {c.email && <p className="text-muted-foreground text-xs truncate max-w-[180px]">{c.email}</p>}
                              {c.telefoon && <p className="text-muted-foreground text-xs">{c.telefoon}</p>}
                            </div>
                          </td>
                          <td className="p-3 hidden md:table-cell">
                            <Badge variant="secondary" className={cn("gap-1 text-xs", rijbewijsWarning && "border-warning text-warning")}>
                              {c.rijbewijs_categorie}
                              {rijbewijsWarning && <AlertTriangle className="w-3 h-3" />}
                            </Badge>
                          </td>
                          <td className="p-3 hidden lg:table-cell">
                            {voertuig ? (
                              <span className="text-xs text-muted-foreground">{voertuig.merk} {voertuig.model}</span>
                            ) : (
                              <span className="text-xs text-muted-foreground/50">—</span>
                            )}
                          </td>
                          <td className="p-3">
                            <StatusBadge status={c.status} variant={statusColors[c.status] || "muted"} />
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(c)} className="h-7 w-7 p-0">
                                <Edit className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => setDeleteId(c.id)} className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive">
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* GRID VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((c, i) => {
                const voertuig = getVoertuig(c.voertuig_id);
                const rijbewijsWarning = isRijbewijsBijnaVerlopen(c.rijbewijs_verloopt);
                return (
                  <div
                    key={c.id}
                    className={cn("clean-card p-5 space-y-4 animate-fade-in hover:shadow-md transition-all cursor-pointer", selectedChauffeur?.id === c.id && "ring-2 ring-primary")}
                    style={{ animationDelay: `${i * 50}ms` }}
                    onClick={() => setSelectedChauffeur(c)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{c.voornaam} {c.achternaam}</h3>
                          <StatusBadge status={c.status} variant={statusColors[c.status] || "muted"} />
                        </div>
                      </div>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(c)} className="h-8 w-8 p-0">
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteId(c.id)} className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {c.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{c.email}</span>
                        </div>
                      )}
                      {c.telefoon && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="w-3.5 h-3.5 shrink-0" /><span>{c.telefoon}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                      <Badge variant="secondary" className={cn("gap-1 text-xs", rijbewijsWarning && "border-warning text-warning")}>
                        <CreditCard className="w-3 h-3" />{c.rijbewijs_categorie}
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
                        <span className="text-foreground font-medium truncate">{voertuig.merk} {voertuig.model}</span>
                        <span className="text-muted-foreground font-mono text-xs ml-auto">{voertuig.kenteken}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selectedChauffeur && !isMobile && (
          <div className="lg:w-[50%] flex-shrink-0">
            <ChauffeurDetail
              chauffeur={selectedChauffeur}
              onClose={() => setSelectedChauffeur(null)}
            />
          </div>
        )}
      </div>

      <Sheet
        open={isMobile && !!selectedChauffeur}
        onOpenChange={(open) => {
          if (!open) setSelectedChauffeur(null);
        }}
      >
        <SheetContent side="bottom" className="h-[88vh] rounded-t-2xl px-0 pb-0">
          {selectedChauffeur && (
            <div className="h-full overflow-hidden">
              <ChauffeurDetail
                chauffeur={selectedChauffeur}
                onClose={() => setSelectedChauffeur(null)}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>

      <ChauffeurForm
        open={formOpen}
        onOpenChange={(open) => { setFormOpen(open); if (!open) setEditChauffeur(null); }}
        chauffeur={editChauffeur}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Chauffeur verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>Deze actie kan niet ongedaan worden gemaakt.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Verwijderen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
