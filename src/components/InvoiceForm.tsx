import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useCreateInvoice } from "@/hooks/useInvoices";

interface InvoiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId: string;
}

export function InvoiceForm({ open, onOpenChange, contractId }: InvoiceFormProps) {
  const createInvoice = useCreateInvoice();
  const [datum, setDatum] = useState("");
  const [bedrag, setBedrag] = useState(0);
  const [status, setStatus] = useState<"openstaand" | "betaald">("openstaand");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createInvoice.mutateAsync({
        contract_id: contractId,
        datum,
        bedrag,
        status,
      });
      toast({ title: "Factuur aangemaakt" });
      onOpenChange(false);
      setDatum("");
      setBedrag(0);
    } catch (err: any) {
      toast({ title: "Fout", description: err.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Factuur toevoegen</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Datum</Label>
            <Input type="date" value={datum} onChange={(e) => setDatum(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Bedrag (€)</Label>
            <Input type="number" min={0} step={0.01} value={bedrag} onChange={(e) => setBedrag(Number(e.target.value))} required />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="openstaand">Openstaand</SelectItem>
                <SelectItem value="betaald">Betaald</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuleren</Button>
            <Button type="submit" disabled={createInvoice.isPending}>
              {createInvoice.isPending ? "Opslaan..." : "Toevoegen"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
