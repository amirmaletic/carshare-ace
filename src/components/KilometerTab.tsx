import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useKilometerRegistraties, useCreateKilometerRegistratie, useDeleteKilometerRegistratie } from "@/hooks/useKilometerRegistraties";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface KilometerTabProps {
  contractId: string;
  kmPerJaar: number | null;
  startDatum: string;
  eindDatum: string;
}

export function KilometerTab({ contractId, kmPerJaar, startDatum, eindDatum }: KilometerTabProps) {
  const { data: registraties = [], isLoading } = useKilometerRegistraties(contractId);
  const createMutation = useCreateKilometerRegistratie();
  const deleteMutation = useDeleteKilometerRegistratie();

  const [datum, setDatum] = useState(new Date().toISOString().split("T")[0]);
  const [kilometerstand, setKilometerstand] = useState("");
  const [notitie, setNotitie] = useState("");

  const handleAdd = async () => {
    const km = parseInt(kilometerstand);
    if (!km || km <= 0) {
      toast({ title: "Voer een geldige kilometerstand in", variant: "destructive" });
      return;
    }
    try {
      await createMutation.mutateAsync({
        contract_id: contractId,
        datum,
        kilometerstand: km,
        notitie: notitie.trim() || undefined,
      });
      toast({ title: "Kilometerstand toegevoegd" });
      setKilometerstand("");
      setNotitie("");
    } catch (err: any) {
      toast({ title: "Fout", description: err.message, variant: "destructive" });
    }
  };

  // Calculate stats
  const sorted = [...registraties].sort((a, b) => a.datum.localeCompare(b.datum));
  const chartData = sorted.map((r) => ({
    datum: r.datum,
    km: r.kilometerstand,
  }));

  let avgKmPerDay = 0;
  let projectedYearKm = 0;
  let overLimit = false;

  if (sorted.length >= 2) {
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const days = (new Date(last.datum).getTime() - new Date(first.datum).getTime()) / (1000 * 60 * 60 * 24);
    const kmDiff = last.kilometerstand - first.kilometerstand;
    if (days > 0) {
      avgKmPerDay = Math.round(kmDiff / days);
      projectedYearKm = avgKmPerDay * 365;
      if (kmPerJaar && projectedYearKm > kmPerJaar) {
        overLimit = true;
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* Add form */}
      <div className="flex flex-wrap gap-2 items-end">
        <div className="space-y-1">
          <Label className="text-xs">Datum</Label>
          <Input type="date" value={datum} onChange={(e) => setDatum(e.target.value)} className="w-36 h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Kilometerstand</Label>
          <Input type="number" value={kilometerstand} onChange={(e) => setKilometerstand(e.target.value)} placeholder="km" className="w-28 h-8 text-sm" />
        </div>
        <div className="space-y-1 flex-1 min-w-[120px]">
          <Label className="text-xs">Notitie</Label>
          <Input value={notitie} onChange={(e) => setNotitie(e.target.value)} placeholder="Optioneel" className="h-8 text-sm" />
        </div>
        <Button size="sm" onClick={handleAdd} disabled={createMutation.isPending} className="gap-1 h-8">
          <Plus className="w-3 h-3" /> Toevoegen
        </Button>
      </div>

      {/* Warning */}
      {overLimit && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20 text-sm">
          <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
          <span className="text-foreground">
            Verwacht jaarverbruik: <strong>{projectedYearKm.toLocaleString("nl-NL")} km</strong> — limiet is {kmPerJaar?.toLocaleString("nl-NL")} km/jaar
          </span>
        </div>
      )}

      {/* Stats */}
      {sorted.length >= 2 && (
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>Gem. {avgKmPerDay} km/dag</span>
          <span>Verwacht: {projectedYearKm.toLocaleString("nl-NL")} km/jaar</span>
        </div>
      )}

      {/* Chart */}
      {chartData.length >= 2 && (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="datum" tick={{ fontSize: 10 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
              <Tooltip />
              <Line type="monotone" dataKey="km" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Laden...</p>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">Nog geen kilometerstanden geregistreerd</p>
      ) : (
        <div className="space-y-1">
          {sorted.map((r) => (
            <div key={r.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm">
              <div>
                <span className="font-medium">{r.kilometerstand.toLocaleString("nl-NL")} km</span>
                <span className="text-muted-foreground ml-2">{r.datum}</span>
                {r.notitie && <span className="text-muted-foreground ml-2">— {r.notitie}</span>}
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => deleteMutation.mutate({ id: r.id, contractId })}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
