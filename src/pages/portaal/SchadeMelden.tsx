import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useKlantReserveringen } from "@/hooks/useKlantData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Upload, X } from "lucide-react";
import { PortaalPageHeader } from "@/components/portaal/PortaalPageHeader";

export default function PortaalSchadeMelden() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const base = slug ? `/t/${slug}` : "";
  const { data: reserveringen = [] } = useKlantReserveringen();

  const today = new Date().toISOString().slice(0, 10);
  const opties = (reserveringen as any[]).filter(
    (r) => ["actief", "lopend", "bevestigd"].includes(r.status) && r.eind_datum >= today
  );

  const [reserveringId, setReserveringId] = useState(params.get("reservering") ?? opties[0]?.id ?? "");
  const [omschrijving, setOmschrijving] = useState("");
  const [locatie, setLocatie] = useState("");
  const [fotos, setFotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length || !user) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const f of files) {
        const ext = f.name.split(".").pop() ?? "jpg";
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from("schade-fotos").upload(path, f, { upsert: false });
        if (error) throw error;
        const { data } = supabase.storage.from("schade-fotos").getPublicUrl(path);
        urls.push(data.publicUrl);
      }
      setFotos((p) => [...p, ...urls]);
    } catch (err: any) {
      toast.error("Upload mislukt: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const submit = useMutation({
    mutationFn: async () => {
      if (!reserveringId) throw new Error("Kies een reservering");
      const { error } = await supabase.rpc("klant_meld_schade", {
        _reservering_id: reserveringId,
        _omschrijving: omschrijving,
        _locatie_schade: locatie || null,
        _fotos: fotos.length ? fotos : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Schade succesvol gemeld");
      navigate(`${base}/documenten`);
    },
    onError: (e: any) => toast.error("Fout: " + e.message),
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="-ml-2">
        <ArrowLeft className="w-4 h-4 mr-1" /> Terug
      </Button>
      <PortaalPageHeader
        titel="Schade melden"
        beschrijving="Meld schade aan een gehuurd voertuig zo snel mogelijk."
      />
      <Card className="p-5 space-y-4">
        {opties.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Geen actieve huur gevonden om schade voor te melden.
          </p>
        ) : (
          <>
            <div className="space-y-2">
              <Label>Reservering *</Label>
              <Select value={reserveringId} onValueChange={setReserveringId}>
                <SelectTrigger><SelectValue placeholder="Kies reservering" /></SelectTrigger>
                <SelectContent>
                  {opties.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.voertuig?.merk} {r.voertuig?.model} ({r.voertuig?.kenteken})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Omschrijving *</Label>
              <Textarea
                value={omschrijving}
                onChange={(e) => setOmschrijving(e.target.value)}
                placeholder="Wat is er gebeurd?"
                rows={4}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Locatie schade</Label>
              <Input
                value={locatie}
                onChange={(e) => setLocatie(e.target.value)}
                placeholder="Bv. linker voorbumper"
              />
            </div>
            <div className="space-y-2">
              <Label>Foto's</Label>
              <div className="flex flex-wrap gap-2">
                {fotos.map((u) => (
                  <div key={u} className="relative w-20 h-20">
                    <img src={u} alt="schade" className="w-full h-full object-cover rounded-md border" />
                    <button
                      type="button"
                      onClick={() => setFotos((p) => p.filter((x) => x !== u))}
                      className="absolute -top-2 -right-2 bg-background border rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <label className="w-20 h-20 border-2 border-dashed border-border rounded-md flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                  <Upload className="w-4 h-4 text-muted-foreground" />
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
                </label>
              </div>
            </div>
            <Button onClick={() => submit.mutate()} disabled={submit.isPending || !omschrijving || !reserveringId} className="w-full">
              {submit.isPending ? "Versturen..." : "Schade melden"}
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
