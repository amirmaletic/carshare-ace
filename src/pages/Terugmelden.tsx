import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { vehicles as mockVehicles } from "@/data/mockData";
import { useVoertuigen } from "@/hooks/useVoertuigen";
import { toast } from "sonner";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import {
  Car, Upload, Gauge, FileText, Loader2, Trash2, ExternalLink, Search, RotateCcw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Terugmelding {
  id: string;
  voertuig_id: string;
  voertuig_kenteken: string;
  voertuig_naam: string;
  kilometerstand: number;
  datum: string;
  bon_url: string | null;
  notitie: string | null;
  created_at: string;
}

function formatKentekenInput(input: string): string {
  return input.replace(/[\s]/g, "").toUpperCase();
}

export default function Terugmelden() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { voertuigen: dbVoertuigen } = useVoertuigen();

  const [kentekenQuery, setKentekenQuery] = useState("");
  const [matchedVehicle, setMatchedVehicle] = useState<{
    id: string; label: string; kenteken: string; laatsteKm: number;
  } | null>(null);
  const [kilometerstand, setKilometerstand] = useState("");
  const [kmError, setKmError] = useState("");
  const [notitie, setNotitie] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Build vehicle list from mock + db
  const allVehicles = [
    ...mockVehicles.map(v => ({ id: v.id, label: `${v.merk} ${v.model}`, kenteken: v.kenteken, km: v.kilometerstand })),
    ...dbVoertuigen.map(v => ({ id: v.id, label: `${v.merk} ${v.model}`, kenteken: v.kenteken, km: v.kilometerstand })),
  ];

  // Fetch existing terugmeldingen
  const { data: terugmeldingen = [], isLoading } = useQuery({
    queryKey: ["terugmeldingen"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("terugmeldingen")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Terugmelding[];
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("terugmeldingen").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["terugmeldingen"] });
      toast.success("Terugmelding verwijderd");
    },
  });

  // Find the highest km for this vehicle (from terugmeldingen or base data)
  const getMinKm = (vehicleId: string, baseKm: number): number => {
    const previous = terugmeldingen
      .filter(t => t.voertuig_id === vehicleId)
      .map(t => t.kilometerstand);
    return Math.max(baseKm, ...previous, 0);
  };

  const handleKentekenSearch = () => {
    const formatted = formatKentekenInput(kentekenQuery);
    const found = allVehicles.find(v =>
      v.kenteken.replace(/[\s-]/g, "").toUpperCase() === formatted
    );
    if (found) {
      const minKm = getMinKm(found.id, found.km);
      setMatchedVehicle({ id: found.id, label: found.label, kenteken: found.kenteken, laatsteKm: minKm });
      setKilometerstand("");
      setKmError("");
    } else {
      setMatchedVehicle(null);
      toast.error("Geen voertuig gevonden met dit kenteken");
    }
  };

  const handleKmChange = (value: string) => {
    setKilometerstand(value);
    if (matchedVehicle && value) {
      const num = parseInt(value);
      if (!isNaN(num) && num < matchedVehicle.laatsteKm) {
        setKmError(`Kilometerstand mag niet lager zijn dan ${matchedVehicle.laatsteKm.toLocaleString("nl-NL")} km`);
      } else {
        setKmError("");
      }
    } else {
      setKmError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !matchedVehicle || !kilometerstand) {
      toast.error("Vul alle verplichte velden in");
      return;
    }

    const kmNum = parseInt(kilometerstand);
    if (kmNum < matchedVehicle.laatsteKm) {
      setKmError(`Kilometerstand mag niet lager zijn dan ${matchedVehicle.laatsteKm.toLocaleString("nl-NL")} km`);
      return;
    }

    setUploading(true);
    let bonUrl: string | null = null;

    try {
      if (file) {
        const ext = file.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("bonnen").upload(path, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("bonnen").getPublicUrl(path);
        bonUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from("terugmeldingen").insert({
        user_id: user.id,
        voertuig_id: matchedVehicle.id,
        voertuig_kenteken: matchedVehicle.kenteken,
        voertuig_naam: matchedVehicle.label,
        kilometerstand: kmNum,
        bon_url: bonUrl,
        notitie: notitie.trim() || null,
      });
      if (error) throw error;

      // Update vehicle km + status in voertuigen table (if it exists there)
      await supabase
        .from("voertuigen")
        .update({ kilometerstand: kmNum, status: "beschikbaar" })
        .eq("id", matchedVehicle.id);

      queryClient.invalidateQueries({ queryKey: ["terugmeldingen"] });
      queryClient.invalidateQueries({ queryKey: ["voertuigen"] });
      toast.success("Voertuig succesvol teruggemeld");
      setMatchedVehicle(null);
      setKentekenQuery("");
      setKilometerstand("");
      setNotitie("");
      setFile(null);
      setKmError("");
    } catch (err: any) {
      toast.error("Fout bij terugmelden: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Terugmelden</h1>
        <p className="text-muted-foreground mt-1">Meld een voertuig terug met kilometerstand en bon</p>
      </div>

      {/* Search by kenteken */}
      <div className="clean-card p-6 space-y-5">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Search className="w-5 h-5 text-primary" />
          Voertuig zoeken op kenteken
        </h2>

        <div className="flex gap-2 max-w-md">
          <Input
            placeholder="Bijv. AB-123-CD"
            value={kentekenQuery}
            onChange={e => setKentekenQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleKentekenSearch())}
            className="uppercase font-mono tracking-wider"
          />
          <Button type="button" onClick={handleKentekenSearch}>
            <Search className="w-4 h-4" />
          </Button>
        </div>

        {/* Matched vehicle + form */}
        {matchedVehicle && (
          <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Car className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{matchedVehicle.label}</p>
                <p className="text-sm text-muted-foreground font-mono">{matchedVehicle.kenteken}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Laatste km-stand: {matchedVehicle.laatsteKm.toLocaleString("nl-NL")} km
                </p>
              </div>
            </div>

            {/* Kilometerstand */}
            <div className="space-y-2 max-w-md">
              <Label>Kilometerstand *</Label>
              <div className="relative">
                <Gauge className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder={`Min. ${matchedVehicle.laatsteKm.toLocaleString("nl-NL")}`}
                  value={kilometerstand}
                  onChange={e => handleKmChange(e.target.value)}
                  className={cn("pl-10", kmError && "border-destructive focus-visible:ring-destructive")}
                  min={matchedVehicle.laatsteKm}
                  max={999999}
                  required
                />
              </div>
              {kmError && <p className="text-xs text-destructive">{kmError}</p>}
            </div>

            {/* Receipt upload */}
            <div className="space-y-2">
              <Label>Bon uploaden</Label>
              <div
                className={cn(
                  "relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
                  file ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/30 hover:bg-muted/50"
                )}
                onClick={() => document.getElementById("bon-upload")?.click()}
              >
                <input
                  id="bon-upload"
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={e => setFile(e.target.files?.[0] || null)}
                />
                {file ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium text-foreground">{file.name}</span>
                    <Button type="button" variant="ghost" size="sm" className="ml-2"
                      onClick={e => { e.stopPropagation(); setFile(null); }}>
                      Verwijder
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Klik om een bon te uploaden (afbeelding of PDF)</p>
                  </>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notitie (optioneel)</Label>
              <Textarea
                placeholder="Opmerkingen bij terugmelding..."
                value={notitie}
                onChange={e => setNotitie(e.target.value)}
                rows={2}
                maxLength={500}
              />
            </div>

            <Button type="submit" disabled={uploading || !!kmError || !kilometerstand} className="gap-2">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
              {uploading ? "Bezig met verwerken..." : "Terugmelden"}
            </Button>
          </form>
        )}
      </div>

      {/* History */}
      <div className="clean-card overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="font-semibold text-foreground">Recente terugmeldingen</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{terugmeldingen.length} registraties</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : terugmeldingen.length === 0 ? (
          <div className="text-center py-12">
            <RotateCcw className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Nog geen terugmeldingen</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {terugmeldingen.map((t, i) => (
              <div
                key={t.id}
                className="p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors animate-fade-in"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="p-2.5 rounded-lg bg-muted">
                  <Car className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{t.voertuig_naam}</p>
                  <p className="text-xs text-muted-foreground font-mono">{t.voertuig_kenteken}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{t.kilometerstand.toLocaleString("nl-NL")} km</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(t.created_at), "d MMM yyyy", { locale: nl })}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {t.bon_url && (
                    <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                      <a href={t.bon_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => deleteMutation.mutate(t.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
