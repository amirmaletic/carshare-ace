import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface InvoiceData {
  factuurNummer: string;
  datum: string;
  klantNaam: string;
  klantEmail: string;
  klantAdres?: string;
  items: { beschrijving: string; aantal: number; prijs: number }[];
  totaal: number;
  btw: number;
  totaalInclBtw: number;
  status: string;
}

export function generateInvoiceHtml(invoice: InvoiceData): string {
  const itemRows = invoice.items.map(item => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;">${item.beschrijving}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${item.aantal}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">€${item.prijs.toFixed(2)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">€${(item.aantal * item.prijs).toFixed(2)}</td>
    </tr>
  `).join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Factuur ${invoice.factuurNummer}</title></head>
<body style="font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:40px;color:#333;">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px;">
    <div>
      <h1 style="font-size:28px;margin:0 0 4px;color:#1a1a1a;">FACTUUR</h1>
      <p style="color:#666;margin:0;">${invoice.factuurNummer}</p>
    </div>
    <div style="text-align:right;">
      <p style="font-weight:bold;margin:0;">De Waal Autoverhuur</p>
      <p style="color:#666;margin:4px 0 0;font-size:13px;">info@dewaalautoverhuur.nl</p>
    </div>
  </div>

  <div style="display:flex;justify-content:space-between;margin-bottom:30px;">
    <div>
      <p style="font-size:12px;color:#999;margin:0 0 4px;">FACTUUR AAN</p>
      <p style="font-weight:bold;margin:0;">${invoice.klantNaam}</p>
      <p style="color:#666;margin:2px 0;font-size:13px;">${invoice.klantEmail}</p>
      ${invoice.klantAdres ? `<p style="color:#666;margin:2px 0;font-size:13px;">${invoice.klantAdres}</p>` : ""}
    </div>
    <div style="text-align:right;">
      <p style="font-size:12px;color:#999;margin:0 0 4px;">DATUM</p>
      <p style="margin:0;">${invoice.datum}</p>
      <p style="font-size:12px;color:#999;margin:12px 0 4px;">STATUS</p>
      <p style="margin:0;font-weight:bold;">${invoice.status}</p>
    </div>
  </div>

  <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
    <thead>
      <tr style="background:#f8f9fa;">
        <th style="padding:10px 12px;text-align:left;font-size:12px;color:#666;border-bottom:2px solid #ddd;">Beschrijving</th>
        <th style="padding:10px 12px;text-align:center;font-size:12px;color:#666;border-bottom:2px solid #ddd;">Aantal</th>
        <th style="padding:10px 12px;text-align:right;font-size:12px;color:#666;border-bottom:2px solid #ddd;">Prijs</th>
        <th style="padding:10px 12px;text-align:right;font-size:12px;color:#666;border-bottom:2px solid #ddd;">Totaal</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <div style="display:flex;justify-content:flex-end;">
    <table style="width:250px;">
      <tr><td style="padding:4px 0;color:#666;">Subtotaal</td><td style="text-align:right;padding:4px 0;">€${invoice.totaal.toFixed(2)}</td></tr>
      <tr><td style="padding:4px 0;color:#666;">BTW (21%)</td><td style="text-align:right;padding:4px 0;">€${invoice.btw.toFixed(2)}</td></tr>
      <tr style="font-weight:bold;font-size:16px;"><td style="padding:8px 0;border-top:2px solid #333;">Totaal</td><td style="text-align:right;padding:8px 0;border-top:2px solid #333;">€${invoice.totaalInclBtw.toFixed(2)}</td></tr>
    </table>
  </div>

  <div style="margin-top:40px;padding-top:20px;border-top:1px solid #eee;font-size:12px;color:#999;">
    <p>Betaling binnen 14 dagen na factuurdatum. Vermeld het factuurnummer bij betaling.</p>
  </div>
</body>
</html>`;
}

export function InvoicePdfButton({ invoice }: { invoice: InvoiceData }) {
  const handleExport = () => {
    const html = generateInvoiceHtml(invoice);
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({ title: "Fout", description: "Pop-up geblokkeerd. Sta pop-ups toe.", variant: "destructive" });
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
      <Download className="w-4 h-4" />
      PDF Export
    </Button>
  );
}
