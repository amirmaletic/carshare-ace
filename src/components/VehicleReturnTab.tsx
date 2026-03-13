import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { vehicles as mockVehicles, getVehicleImageUrl } from "@/data/mockData";
import { useVoertuigen } from "@/hooks/useVoertuigen";
import { toast } from "sonner";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import {
  Car, Upload, Gauge, FileText, Loader2, Trash2, ExternalLink,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
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

export function VehicleReturnTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { voertuigen: dbVoertuigen } = useVoertuigen();

  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [kilometerstand, setKilometerstand] = useState("");
  const [notitie, setNotitie] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Build vehicle options from mock + db
  const allVehicles = [
    ...mockVehicles.map(v => ({ id: v.id, label: `${v.merk} ${v.model}`, kenteken: v.kenteken })),
    ...dbVoertuigen.map(v => ({ id: v.id, label: `${v.merk} ${v.model}`, kenteken: v.kenteken })),
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedVehicleId || !kilometerstand) {
      toast.error("Vul alle verplichte velden in");
      return;
    }

    const vehicle = allVehicles.find(v => v.id === selectedVehicleId);
    if (!vehicle) return;

    setUploading(true);
    let bonUrl: string | null = null;

    try {
      // Upload receipt if provided
      if (file) {
        const ext = file.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("bonnen")
          .upload(path, file);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("bonnen").getPublicUrl(path);
        bonUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from("terugmeldingen").insert({
        user_id: user.id,
        voertuig_id: selectedVehicleId,
        voertuig_kenteken: vehicle.kenteken,
        voertuig_naam: vehicle.label,
        kilometerstand: parseInt(kilometerstand),
        bon_url: bonUrl,
        notitie: notitie.trim() || null,
      });
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["terugmeldingen"] });
      toast.success("Voertuig succesvol teruggemeld");
      setSelectedVehicleId("");
      setKilometerstand("");
      setNotitie("");
      setFile(null);
    } catch (err: any) {
      toast.error("Fout bij terugmelden: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Return form */}
      <div className="clean-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Car className="w-5 h-5 text-primary" />
          Voertuig terugmelden
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Vehicle select */}
            <div className="space-y-2">
              <Label>Voertuig *</Label>
              <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer voertuig" />
                </SelectTrigger>
                <SelectContent>
                  {allVehicles.map(v => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.label} — {v.kenteken}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Kilometerstand */}
            <div className="space-y-2">
              <Label>Kilometerstand *</Label>
              <div className="relative">
                <Gauge className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="bijv. 45230"
                  value={kilometerstand}
                  onChange={e => setKilometerstand(e.target.value)}
                  className="pl-10"
                  min={0}
                  max={999999}
                  required
                />
              </div>
            </div>
          </div>

          {/* Receipt upload */}
          <div className="space-y-2">
            <Label>Bon uploaden</Label>
            <div
              className={cn(
                "relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
                file
                  ? "border-primary/50 bg-primary/5"
                  : "border-border hover:border-primary/30 hover:bg-muted/50"
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
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="ml-2"
                    onClick={e => { e.stopPropagation(); setFile(null); }}
                  >
                    Verwijder
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Klik om een bon te uploaden (afbeelding of PDF)
                  </p>
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

          <Button type="submit" disabled={uploading || !selectedVehicleId || !kilometerstand} className="gap-2">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Car className="w-4 h-4" />}
            {uploading ? "Bezig met verwerken..." : "Terugmelden"}
          </Button>
        </form>
      </div>

      {/* History */}
      <div className="clean-card overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="font-semibold text-foreground">Terugmeldingen</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{terugmeldingen.length} registraties</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : terugmeldingen.length === 0 ? (
          <div className="text-center py-12">
            <Car className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
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
