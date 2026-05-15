import { useEffect, useRef, useState } from "react";
import { Upload, FileText, Trash2, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useOrganisatie } from "@/hooks/useOrganisatie";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export function AlgemeneVoorwaardenUpload({ disabled }: { disabled?: boolean }) {
  const { organisatieId } = useOrganisatie();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const { data: pad } = useQuery({
    queryKey: ["av-pad", organisatieId],
    enabled: !!organisatieId,
    queryFn: async (): Promise<string | null> => {
      const { data } = await supabase
        .from("organisaties")
        .select("algemene_voorwaarden_pad")
        .eq("id", organisatieId!)
        .maybeSingle();
      return (data as any)?.algemene_voorwaarden_pad ?? null;
    },
  });

  const handleUpload = async (file: File) => {
    if (!organisatieId) return;
    if (file.type !== "application/pdf") {
      toast({ title: "Alleen PDF toegestaan", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const path = `${organisatieId}/algemene-voorwaarden.pdf`;
      const { error: upErr } = await supabase.storage
        .from("organisatie-documenten")
        .upload(path, file, { upsert: true, contentType: "application/pdf" });
      if (upErr) throw upErr;
      const { error: dbErr } = await supabase
        .from("organisaties")
        .update({ algemene_voorwaarden_pad: path })
        .eq("id", organisatieId);
      if (dbErr) throw dbErr;
      qc.invalidateQueries({ queryKey: ["av-pad"] });
      toast({ title: "Algemene voorwaarden opgeslagen" });
    } catch (e: any) {
      toast({ title: "Upload mislukt", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDelete = async () => {
    if (!organisatieId || !pad) return;
    setBusy(true);
    try {
      await supabase.storage.from("organisatie-documenten").remove([pad]);
      await supabase.from("organisaties").update({ algemene_voorwaarden_pad: null }).eq("id", organisatieId);
      qc.invalidateQueries({ queryKey: ["av-pad"] });
      toast({ title: "Verwijderd" });
    } catch (e: any) {
      toast({ title: "Verwijderen mislukt", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const handleDownload = async () => {
    if (!pad) return;
    const { data, error } = await supabase.storage
      .from("organisatie-documenten")
      .createSignedUrl(pad, 60);
    if (error) {
      toast({ title: "Kon link niet ophalen", description: error.message, variant: "destructive" });
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  return (
    <div className="space-y-3">
      <div>
        <Label>Algemene voorwaarden (PDF)</Label>
        <p className="text-xs text-muted-foreground">
          Wordt automatisch als bijlage meegestuurd bij het ondertekenen van een contract.
        </p>
      </div>
      {pad ? (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2.5">
          <FileText className="w-5 h-5 text-primary shrink-0" />
          <span className="text-sm flex-1 truncate">algemene-voorwaarden.pdf</span>
          <Button type="button" variant="ghost" size="sm" onClick={handleDownload} disabled={busy}>
            <Download className="w-4 h-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={handleDelete} disabled={disabled || busy} className="text-destructive">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f);
            }}
          />
          <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={disabled || busy} className="gap-2">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            PDF uploaden
          </Button>
        </div>
      )}
    </div>
  );
}