import { useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";
import { type ContractWithInvoices } from "@/hooks/useContracts";
import { getVehicleById, getContractTypeLabel } from "@/data/mockData";

interface ContractDocumentProps {
  contract: ContractWithInvoices | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContractDocument({ contract, open, onOpenChange }: ContractDocumentProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!contract) return null;

  const vehicle = contract.voertuig_id ? getVehicleById(contract.voertuig_id) : null;
  const today = new Date().toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="nl">
      <head>
        <meta charset="UTF-8">
        <title>Contract ${contract.contract_nummer}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Inter', sans-serif; color: #1a1a2e; padding: 40px; line-height: 1.6; }
          h1, h2, h3 { font-family: 'Space Grotesk', sans-serif; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #e88c0a; }
          .logo-section h1 { font-size: 24px; color: #e88c0a; }
          .logo-section p { font-size: 12px; color: #666; }
          .contract-ref { text-align: right; }
          .contract-ref h2 { font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
          .contract-ref p { font-size: 18px; font-family: 'Space Grotesk', sans-serif; font-weight: 600; }
          .section { margin-bottom: 28px; }
          .section h3 { font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #e88c0a; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #eee; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
          .field { }
          .field-label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
          .field-value { font-size: 14px; font-weight: 500; margin-top: 2px; }
          .services { display: flex; flex-wrap: wrap; gap: 8px; }
          .service-tag { font-size: 12px; padding: 4px 12px; background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; border-radius: 20px; }
          .terms { font-size: 12px; color: #555; }
          .terms li { margin-bottom: 6px; }
          .signature-section { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; margin-top: 60px; padding-top: 20px; }
          .signature-block { }
          .signature-block p { font-size: 12px; color: #888; margin-bottom: 4px; }
          .signature-line { border-bottom: 1px solid #333; height: 60px; margin-bottom: 8px; }
          .signature-name { font-size: 13px; font-weight: 500; }
          .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #eee; text-align: center; font-size: 11px; color: #999; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>${content.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="w-5 h-5" />
            Contract document
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button size="sm" className="gap-1.5" onClick={handlePrint}>
            <Download className="w-3.5 h-3.5" /> Downloaden / Printen
          </Button>
        </div>

        {/* Printable document */}
        <div ref={printRef} className="bg-white text-foreground p-8 rounded-lg border border-border">
          {/* Header */}
          <div className="flex justify-between items-start mb-8 pb-4 border-b-2 border-primary">
            <div>
              <h1 className="text-2xl font-bold text-primary">FleetManager</h1>
              <p className="text-xs text-muted-foreground">Wagenpark & Leasebeheer</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Contractnummer</p>
              <p className="text-lg font-semibold font-mono">{contract.contract_nummer}</p>
              <p className="text-xs text-muted-foreground">Datum: {today}</p>
            </div>
          </div>

          {/* Contract type */}
          <div className="mb-6">
            <h3 className="text-xs uppercase tracking-wider text-primary font-semibold mb-3 pb-1.5 border-b border-border">
              Contractgegevens
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type" value={getContractTypeLabel(contract.type)} />
              <Field label="Status" value={contract.status} />
              <Field label="Startdatum" value={contract.start_datum} />
              <Field label="Einddatum" value={contract.eind_datum} />
              <Field label="Maandprijs" value={`€ ${Number(contract.maandprijs).toLocaleString("nl-NL", { minimumFractionDigits: 2 })}`} />
              {Number(contract.borg) > 0 && <Field label="Borg" value={`€ ${Number(contract.borg).toLocaleString("nl-NL", { minimumFractionDigits: 2 })}`} />}
              {contract.km_per_jaar && <Field label="Km/jaar" value={`${contract.km_per_jaar.toLocaleString("nl-NL")} km`} />}
              {contract.verlengbaar && <Field label="Verlengbaar" value={contract.verlengings_termijn || "Ja"} />}
            </div>
          </div>

          {/* Klantgegevens */}
          <div className="mb-6">
            <h3 className="text-xs uppercase tracking-wider text-primary font-semibold mb-3 pb-1.5 border-b border-border">
              Klantgegevens
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Naam" value={contract.klant_naam} />
              <Field label="E-mail" value={contract.klant_email} />
              {contract.klant_telefoon && <Field label="Telefoon" value={contract.klant_telefoon} />}
              {contract.klant_adres && <Field label="Adres" value={contract.klant_adres} />}
              {contract.bedrijf && <Field label="Bedrijf" value={contract.bedrijf} />}
              {contract.kvk_nummer && <Field label="KVK-nummer" value={contract.kvk_nummer} />}
              {contract.bedrijf_adres && <Field label="Bedrijfsadres" value={contract.bedrijf_adres} />}
            </div>
          </div>

          {/* Voertuig */}
          {vehicle && (
            <div className="mb-6">
              <h3 className="text-xs uppercase tracking-wider text-primary font-semibold mb-3 pb-1.5 border-b border-border">
                Voertuiggegevens
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Merk & Model" value={`${vehicle.merk} ${vehicle.model}`} />
                <Field label="Kenteken" value={vehicle.kenteken} />
                <Field label="Bouwjaar" value={String(vehicle.bouwjaar)} />
                <Field label="Brandstof" value={vehicle.brandstof} />
                <Field label="Categorie" value={vehicle.categorie} />
              </div>
            </div>
          )}

          {/* Inclusief */}
          {contract.inclusief.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs uppercase tracking-wider text-primary font-semibold mb-3 pb-1.5 border-b border-border">
                Inbegrepen services
              </h3>
              <div className="flex flex-wrap gap-2">
                {contract.inclusief.map((item) => (
                  <span key={item} className="text-xs px-3 py-1 rounded-full bg-success/10 text-success border border-success/20">
                    ✓ {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notities */}
          {contract.notities && (
            <div className="mb-6">
              <h3 className="text-xs uppercase tracking-wider text-primary font-semibold mb-3 pb-1.5 border-b border-border">
                Bijzonderheden
              </h3>
              <p className="text-sm">{contract.notities}</p>
            </div>
          )}

          {contract.boeteclausule && (
            <div className="mb-6">
              <h3 className="text-xs uppercase tracking-wider text-primary font-semibold mb-3 pb-1.5 border-b border-border">
                Boeteclausule
              </h3>
              <p className="text-sm">{contract.boeteclausule}</p>
            </div>
          )}

          {/* Voorwaarden */}
          <div className="mb-6">
            <h3 className="text-xs uppercase tracking-wider text-primary font-semibold mb-3 pb-1.5 border-b border-border">
              Algemene voorwaarden
            </h3>
            <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-4">
              <li>Dit contract is geldig voor de bovengenoemde looptijd en wordt automatisch beëindigd op de einddatum.</li>
              <li>Maandelijkse betalingen dienen vóór de 1e van elke maand te worden voldaan.</li>
              <li>Het voertuig dient in goede staat te worden geretourneerd aan het einde van het contract.</li>
              <li>Bij vroegtijdige beëindiging zijn de resterende termijnen verschuldigd, tenzij anders overeengekomen.</li>
              <li>De leasenemer is verantwoordelijk voor eventuele schade die niet onder de verzekering valt.</li>
              <li>Kilometrage boven het afgesproken aantal wordt in rekening gebracht tegen het geldende tarief.</li>
            </ul>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-16 mt-12 pt-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Verhuurder / Leasemaatschappij</p>
              <div className="border-b border-foreground h-16 mb-2" />
              <p className="text-sm font-medium">FleetManager B.V.</p>
              <p className="text-xs text-muted-foreground">Datum: _______________</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Leasenemer / Huurder</p>
              <div className="border-b border-foreground h-16 mb-2" />
              <p className="text-sm font-medium">{contract.klant_naam}</p>
              <p className="text-xs text-muted-foreground">Datum: _______________</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-10 pt-4 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              Dit document is gegenereerd op {today} — {contract.contract_nummer}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium mt-0.5 capitalize">{value}</p>
    </div>
  );
}
