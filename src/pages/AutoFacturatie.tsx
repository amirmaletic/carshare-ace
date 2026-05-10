import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Loader2, Send, RefreshCw, FileText } from "lucide-react";

interface ConceptFactuur {
  id: string;
  contract_id: string | null;
  bedrag: number;
  datum: string;
  vervaldatum: string | null;
  omschrijving: string | null;
  type: string | null;
  contracts?: {
    contract_nummer: string | null;
    klant_naam: string | null;
    klant_email: string | null;
  } | null;
}

export default function AutoFacturatie() {
  const qc = useQueryClient();
  const [genereren, setGenereren] = useState(false);
  const [versturen, setVersturen] = useState(false);
  const [selectie, setSelectie] = useState<Set<string>>(new Set());

  const { data: concepten = [], isLoading } = useQuery({
    queryKey: ["concept-facturen"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("id, contract_id, bedrag, datum, vervaldatum, omschrijving, type, contracts(contract_nummer, klant_naam, klant_email)")
        .eq("status", "concept")
        .order("datum", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ConceptFactuur[];
    },
  });

  const allesGeselecteerd = concepten.length > 0 && selectie.size === concepten.length;
  const totaalBedrag = concepten
    .filter((c) => selectie.size === 0 || selectie.has(c.id))
    .reduce((sum, c) => sum + Number(c.bedrag || 0), 0);

  const toggleAlles = () => {
    if (allesGeselecteerd) setSelectie(new Set());
    else setSelectie(new Set(concepten.map((c) => c.id)));
  };

  const toggleEen = (id: string) => {
    const next = new Set(selectie);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectie(next);
  };

  const handleGenereer = async () => {
    setGenereren(true);
    try {
      const { data, error } = await supabase.functions.invoke("auto-facturen-genereren", {
        body: {},
      });
      if (error) throw error;
      toast({
        title: "Concepten gegenereerd",
        description: `${data?.aangemaakt ?? 0} aangemaakt, ${data?.overgeslagen ?? 0} bestonden al.`,
      });
      qc.invalidateQueries({ queryKey: ["concept-facturen"] });
    } catch (e: any) {
      toast({ title: "Fout", description: e.message ?? "Kon niet genereren", variant: "destructive" });
    } finally {
      setGenereren(false);
    }
  };

  const handleVerstuur = async () => {
    if (concepten.length === 0) return;
    const ids = selectie.size > 0 ? Array.from(selectie) : [];
    const aantal = ids.length > 0 ? ids.length : concepten.length;
    if (!confirm(`Weet je zeker dat je ${aantal} factuur(en) wilt versturen naar de klanten?`)) return;

    setVersturen(true);
    try {
      const { data, error } = await supabase.functions.invoke("facturen-verstuur-batch", {
        body: { factuur_ids: ids },
      });
      if (error) throw error;
      toast({
        title: "Facturen verstuurd",
        description: `${data?.verstuurd ?? 0} factuur(en) verstuurd naar de klanten.`,
      });
      setSelectie(new Set());
      qc.invalidateQueries({ queryKey: ["concept-facturen"] });
    } catch (e: any) {
      toast({ title: "Fout", description: e.message ?? "Versturen mislukt", variant: "destructive" });
    } finally {
      setVersturen(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" /> Automatisch factureren
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Controleer de automatisch gegenereerde concept-facturen en verstuur ze in 1 keer.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleGenereer} disabled={genereren}>
            {genereren ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Genereer nu
          </Button>
          <Button onClick={handleVerstuur} disabled={versturen || concepten.length === 0}>
            {versturen ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            {selectie.size > 0 ? `Verstuur ${selectie.size} geselecteerde` : `Verstuur alle (${concepten.length})`}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Concept-facturen</span>
            <Badge variant="secondary">
              Totaal: € {totaalBedrag.toFixed(2).replace(".", ",")}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : concepten.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>Geen concept-facturen. Klik op "Genereer nu" om de maandtermijnen aan te maken.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox checked={allesGeselecteerd} onCheckedChange={toggleAlles} />
                    </TableHead>
                    <TableHead>Contract</TableHead>
                    <TableHead>Klant</TableHead>
                    <TableHead>Omschrijving</TableHead>
                    <TableHead>Vervaldatum</TableHead>
                    <TableHead className="text-right">Bedrag</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {concepten.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <Checkbox checked={selectie.has(c.id)} onCheckedChange={() => toggleEen(c.id)} />
                      </TableCell>
                      <TableCell className="font-mono text-xs">{c.contracts?.contract_nummer ?? "-"}</TableCell>
                      <TableCell>
                        <div>{c.contracts?.klant_naam ?? "-"}</div>
                        <div className="text-xs text-muted-foreground">{c.contracts?.klant_email ?? "geen e-mail"}</div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{c.omschrijving ?? "-"}</TableCell>
                      <TableCell>{c.vervaldatum ?? "-"}</TableCell>
                      <TableCell className="text-right font-medium">
                        € {Number(c.bedrag).toFixed(2).replace(".", ",")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}