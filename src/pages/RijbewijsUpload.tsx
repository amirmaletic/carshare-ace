import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, CheckCircle2, AlertTriangle, Loader2, Upload, RefreshCw, ShieldCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface VerzoekInfo {
  id: string;
  status: string;
  klant_voornaam: string;
  klant_achternaam: string;
  organisatie_naam: string;
  organisatie_logo: string | null;
  organisatie_kleur: string | null;
  expired: boolean;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function compressImage(file: File, maxDim = 1800, quality = 0.85): Promise<{ dataUrl: string; mime: string }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    const data = await fileToBase64(file);
    return { dataUrl: data, mime: file.type };
  }
  ctx.drawImage(bitmap, 0, 0, w, h);
  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  return { dataUrl, mime: "image/jpeg" };
}

export default function RijbewijsUpload() {
  const { token } = useParams<{ token: string }>();
  const [verzoek, setVerzoek] = useState<VerzoekInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voorkant, setVoorkant] = useState<{ dataUrl: string; mime: string } | null>(null);
  const [achterkant, setAchterkant] = useState<{ dataUrl: string; mime: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const voorRef = useRef<HTMLInputElement>(null);
  const achtRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const { data, error } = await supabase.rpc("get_rijbewijs_verzoek", { _token: token });
        if (error) throw error;
        const row = (data as any[])?.[0];
        if (!row) {
          setError("Deze upload-link is ongeldig.");
        } else if (row.expired) {
          setError("Deze upload-link is verlopen. Vraag een nieuwe link aan.");
        } else if (row.status === "goedgekeurd") {
          setError("Je rijbewijs is al geverifieerd. Je hoeft niets meer te doen.");
          setDone(true);
        } else if (row.status === "ingediend") {
          setError("Je upload is al ontvangen en wordt beoordeeld.");
          setDone(true);
        } else {
          setVerzoek(row);
        }
      } catch (e: any) {
        setError(e.message ?? "Kon verzoek niet laden");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const onPick = async (which: "voor" | "achter", file?: File) => {
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      toast({ title: "Foto te groot", description: "Maximaal 15MB per foto.", variant: "destructive" });
      return;
    }
    try {
      const compressed = await compressImage(file);
      if (which === "voor") setVoorkant(compressed);
      else setAchterkant(compressed);
    } catch (e) {
      // Fallback zonder compressie
      const dataUrl = await fileToBase64(file);
      if (which === "voor") setVoorkant({ dataUrl, mime: file.type });
      else setAchterkant({ dataUrl, mime: file.type });
    }
  };

  const submit = async () => {
    if (!voorkant || !achterkant || !token) return;
    setUploading(true);
    try {
      const { data, error } = await supabase.functions.invoke("upload-rijbewijs", {
        body: {
          token,
          voorkant_base64: voorkant.dataUrl,
          achterkant_base64: achterkant.dataUrl,
          voorkant_mime: voorkant.mime,
          achterkant_mime: achterkant.mime,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setDone(true);
    } catch (e: any) {
      toast({ title: "Upload mislukt", description: e.message ?? "Probeer opnieuw", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-6 px-4">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-6">
          {verzoek?.organisatie_logo ? (
            <img src={verzoek.organisatie_logo} alt={verzoek.organisatie_naam} className="h-10 mx-auto mb-3" />
          ) : (
            <div className="text-sm font-semibold text-muted-foreground mb-2">
              {verzoek?.organisatie_naam ?? "FleeFlo"}
            </div>
          )}
          <h1 className="text-2xl font-bold text-foreground">Upload je rijbewijs</h1>
          {verzoek && (
            <p className="text-sm text-muted-foreground mt-1">
              Hoi {verzoek.klant_voornaam}, we hebben een geldig rijbewijs nodig voor je huurovereenkomst.
            </p>
          )}
        </div>

        {error && !done && (
          <Card className="p-5 border-destructive/30 bg-destructive/5">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">{error}</p>
              </div>
            </div>
          </Card>
        )}

        {done && (
          <Card className="p-6 text-center border-primary/30 bg-primary/5">
            <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-foreground mb-1">Bedankt!</h2>
            <p className="text-sm text-muted-foreground">
              {error ?? "Je rijbewijs is ontvangen. Je krijgt bericht zodra het is gecontroleerd."}
            </p>
          </Card>
        )}

        {verzoek && !done && !error && (
          <div className="space-y-4">
            <Card className="p-5">
              <div className="flex items-start gap-3 mb-4">
                <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  Maak een duidelijke foto van <strong className="text-foreground">beide kanten</strong> van je
                  rijbewijs. Zorg dat alle hoeken zichtbaar zijn en de tekst goed leesbaar is.
                </div>
              </div>

              <div className="space-y-3">
                <PhotoUploader
                  label="Voorkant rijbewijs"
                  preview={voorkant?.dataUrl}
                  onPick={(f) => onPick("voor", f)}
                  inputRef={voorRef}
                />
                <PhotoUploader
                  label="Achterkant rijbewijs"
                  preview={achterkant?.dataUrl}
                  onPick={(f) => onPick("achter", f)}
                  inputRef={achtRef}
                />
              </div>
            </Card>

            <Button
              size="lg"
              className="w-full gap-2"
              disabled={!voorkant || !achterkant || uploading}
              onClick={submit}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Bezig met versturen...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Rijbewijs versturen
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Je gegevens worden veilig opgeslagen en alleen gebruikt voor je huurovereenkomst.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function PhotoUploader({
  label, preview, onPick, inputRef,
}: {
  label: string;
  preview?: string;
  onPick: (f?: File) => void;
  inputRef: React.RefObject<HTMLInputElement>;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground mb-2 block">{label}</label>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0])}
      />
      {preview ? (
        <div className="relative">
          <img src={preview} alt={label} className="w-full rounded-lg border border-border object-cover max-h-72" />
          <Button
            size="sm"
            variant="secondary"
            className="absolute top-2 right-2 gap-1.5"
            onClick={() => inputRef.current?.click()}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Opnieuw
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-colors"
        >
          <Camera className="w-8 h-8 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Tik om foto te maken of te kiezen</span>
        </button>
      )}
    </div>
  );
}