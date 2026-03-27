import { useState } from "react";
import { Plus, Trash2, MapPin } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLocaties } from "@/hooks/useLocaties";

export default function LocatiesTab() {
  const { locaties, isLoading, addLocatie, deleteLocatie } = useLocaties();
  const [nieuw, setNieuw] = useState("");

  const handleAdd = () => {
    const naam = nieuw.trim();
    if (!naam) return;
    if (locaties.some((l) => l.naam.toLowerCase() === naam.toLowerCase())) return;
    addLocatie.mutate(naam);
    setNieuw("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Locatiebeheer</CardTitle>
        <CardDescription>
          Beheer de vestigingslocaties waar je voertuigen staan. Deze worden
          gebruikt op het kanban-bord.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Nieuwe locatie (bijv. Utrecht)"
            value={nieuw}
            onChange={(e) => setNieuw(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <Button onClick={handleAdd} disabled={!nieuw.trim() || addLocatie.isPending} className="gap-1.5 shrink-0">
            <Plus className="w-4 h-4" /> Toevoegen
          </Button>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Laden...</p>
        ) : locaties.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nog geen locaties. Voeg er een toe om het kanban-bord te gebruiken.
          </p>
        ) : (
          <div className="space-y-2">
            {locaties.map((loc) => (
              <div
                key={loc.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">{loc.naam}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteLocatie.mutate(loc.id)}
                  disabled={deleteLocatie.isPending}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
