import { useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download, IdCard, ShieldCheck, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { type ContractWithInvoices } from "@/hooks/useContracts";
import { getContractTypeLabel } from "@/data/mockData";
import { useVoertuigen } from "@/hooks/useVoertuigen";
import { useOrganisatie } from "@/hooks/useOrganisatie";
import logoUrl from "@/assets/fleeflo-logo-blue.png";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ContractDocumentProps {
  contract: ContractWithInvoices | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContractDocument({ contract, open, onOpenChange }: ContractDocumentProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const { voertuigen } = useVoertuigen();
  const { organisatieId } = useOrganisatie();
  const queryClient = useQueryClient();
  const [sendingRijbewijs, setSendingRijbewijs] = useState(false);
  const [sendingBorg, setSendingBorg] = useState(false);

  const { data: verificaties } = useQuery({
    queryKey: ["contract-verificaties", contract?.id],
    enabled: !!contract?.id && open,
    queryFn: async () => {
      const [rij, bet] = await Promise.all([
        supabase.from("rijbewijs_verificaties").select("status").eq("contract_id", contract!.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("betaal_verificaties").select("status").eq("contract_id", contract!.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      return { rijbewijs: rij.data?.status ?? null, borg: bet.data?.status ?? null };
    },
  });

  const stuurRijbewijs = async () => {
    if (!contract) return;
    setSendingRijbewijs(true);
    try {
      const { error } = await supabase.functions.invoke("send-rijbewijs-verzoek", {
        body: { contract_id: contract.id },
      });
      if (error) throw error;
      toast({ title: "Rijbewijsverzoek verstuurd", description: `Verstuurd naar ${contract.klant_email}` });
      queryClient.invalidateQueries({ queryKey: ["contract-verificaties", contract.id] });
    } catch (e: any) {
      toast({ title: "Versturen mislukt", description: e.message, variant: "destructive" });
    } finally { setSendingRijbewijs(false); }
  };

  const stuurBorg = async () => {
    if (!contract) return;
    setSendingBorg(true);
    try {
      const { error } = await supabase.functions.invoke("create-betaal-verificatie", { body: { contract_id: contract.id } });
      if (error) throw error;
      toast({ title: "Borg-verificatie verstuurd", description: `iDEAL link verstuurd naar ${contract.klant_email}` });
      queryClient.invalidateQueries({ queryKey: ["contract-verificaties", contract.id] });
    } catch (e: any) {
      toast({ title: "Versturen mislukt", description: e.message, variant: "destructive" });
    } finally { setSendingBorg(false); }
  };

  const statusBadge = (s: string | null, label: string) => {
    if (!s) return <Badge variant="outline" className="text-xs">{label}: nog niet verstuurd</Badge>;
    const map: Record<string, { v: any; l: string }> = {
      goedgekeurd: { v: "default", l: "geverifieerd" },
      betaald: { v: "default", l: "geverifieerd" },
      ingediend: { v: "secondary", l: "in beoordeling" },
      in_afwachting: { v: "secondary", l: "wacht op klant" },
      afgewezen: { v: "destructive", l: "afgewezen" },
      mislukt: { v: "destructive", l: "mislukt" },
      verlopen: { v: "destructive", l: "verlopen" },
    };
    const m = map[s] ?? { v: "outline", l: s };
    return <Badge variant={m.v} className="text-xs">{label}: {m.l}</Badge>;
  };

  const { data: organisatie } = useQuery({
    queryKey: ["organisatie-naam", organisatieId],
    enabled: !!organisatieId,
    queryFn: async () => {
      const { data } = await supabase
        .from("organisaties")
        .select("naam")
        .eq("id", organisatieId!)
        .maybeSingle();
      return data;
    },
  });

  if (!contract) return null;

  const vehicle = contract.voertuig_id ? voertuigen.find(v => v.id === contract.voertuig_id) : null;
  const today = new Date().toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
  const formatDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" }) : "-";
  const money = (n: number | string | null | undefined) =>
    `€ ${Number(n ?? 0).toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const orgNaam = organisatie?.naam ?? "FleeFlo";
  const logoSrc = `${window.location.origin}${logoUrl}`;

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const services = (contract.inclusief ?? []).map(
      (item) => `<span class="tag">✓ ${escapeHtml(item)}</span>`
    ).join("");

    const vehicleBlock = vehicle ? `
      <section class="block">
        <h3>Voertuig</h3>
        <div class="grid">
          ${field("Merk & model", `${vehicle.merk} ${vehicle.model}`)}
          ${field("Kenteken", vehicle.kenteken)}
          ${field("Bouwjaar", String(vehicle.bouwjaar))}
          ${field("Brandstof", vehicle.brandstof)}
          ${field("Categorie", vehicle.categorie)}
        </div>
      </section>` : "";

    const klantRows = [
      field("Naam", contract.klant_naam),
      field("E-mail", contract.klant_email),
      contract.klant_telefoon ? field("Telefoon", contract.klant_telefoon) : "",
      contract.klant_adres ? field("Adres", contract.klant_adres) : "",
      contract.bedrijf ? field("Bedrijf", contract.bedrijf) : "",
      contract.kvk_nummer ? field("KVK-nummer", contract.kvk_nummer) : "",
      contract.bedrijf_adres ? field("Bedrijfsadres", contract.bedrijf_adres) : "",
    ].join("");

    const contractRows = [
      field("Type", getContractTypeLabel(contract.type)),
      field("Status", contract.status),
      field("Startdatum", formatDate(contract.start_datum)),
      field("Einddatum", formatDate(contract.eind_datum)),
      field("Maandprijs", money(contract.maandprijs)),
      Number(contract.borg) > 0 ? field("Borg", money(contract.borg)) : "",
      contract.km_per_jaar ? field("Km per jaar", `${contract.km_per_jaar.toLocaleString("nl-NL")} km`) : "",
      contract.verlengbaar ? field("Verlengbaar", contract.verlengings_termijn || "Ja") : "",
    ].join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="nl">
      <head>
        <meta charset="UTF-8">
        <title>Contract ${contract.contract_nummer}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          :root {
            --primary: #3B82F6;
            --primary-dark: #1E40AF;
            --ink: #0F172A;
            --muted: #64748B;
            --line: #E2E8F0;
            --soft: #F8FAFC;
            --success: #16A34A;
            --success-soft: #ECFDF5;
          }
          * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          html, body { background: #fff; }
          body {
            font-family: 'Inter', -apple-system, system-ui, sans-serif;
            color: var(--ink);
            line-height: 1.55;
            font-size: 11pt;
            padding: 28mm 22mm 24mm;
          }
          .doc { max-width: 100%; }

          /* Header */
          .hdr { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; padding-bottom: 18px; margin-bottom: 26px; border-bottom: 1px solid var(--line); }
          .hdr-brand { display: flex; align-items: center; gap: 12px; }
          .hdr-brand img { height: 36px; width: auto; }
          .hdr-brand .org { font-weight: 700; font-size: 16px; letter-spacing: -0.01em; color: var(--ink); }
          .hdr-brand .tag { font-size: 10.5px; color: var(--muted); margin-top: 1px; }
          .hdr-meta { text-align: right; }
          .hdr-meta .label { font-size: 9.5px; text-transform: uppercase; letter-spacing: 1px; color: var(--muted); }
          .hdr-meta .ref { font-size: 14px; font-weight: 700; color: var(--primary-dark); margin-top: 2px; font-feature-settings: "tnum"; }
          .hdr-meta .date { font-size: 10.5px; color: var(--muted); margin-top: 2px; }

          /* Title strip */
          .title { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 14px 18px; border-radius: 10px; background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%); border: 1px solid #BFDBFE; margin-bottom: 26px; }
          .title h1 { font-size: 16px; font-weight: 700; color: var(--primary-dark); letter-spacing: -0.01em; }
          .title .pill { background: var(--primary); color: #fff; font-size: 10.5px; font-weight: 600; padding: 4px 10px; border-radius: 999px; text-transform: capitalize; letter-spacing: 0.2px; }

          /* Blocks */
          .block { margin-bottom: 22px; page-break-inside: avoid; }
          .block h3 { font-size: 10.5px; text-transform: uppercase; letter-spacing: 1.2px; font-weight: 700; color: var(--primary); margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid var(--line); }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 24px; }
          .field { padding: 8px 12px; background: var(--soft); border: 1px solid var(--line); border-radius: 8px; }
          .field .lbl { font-size: 9px; text-transform: uppercase; letter-spacing: 0.6px; color: var(--muted); font-weight: 600; }
          .field .val { font-size: 11.5px; font-weight: 500; color: var(--ink); margin-top: 2px; word-break: break-word; }

          /* Tags */
          .tags { display: flex; flex-wrap: wrap; gap: 6px; }
          .tag { display: inline-block; font-size: 10.5px; padding: 4px 10px; background: var(--success-soft); color: var(--success); border: 1px solid #BBF7D0; border-radius: 999px; font-weight: 500; }

          /* Notes */
          .note { padding: 12px 14px; background: var(--soft); border-left: 3px solid var(--primary); border-radius: 4px; font-size: 11pt; color: #334155; }

          /* Terms */
          .terms { padding-left: 18px; }
          .terms li { font-size: 10.5px; color: #475569; margin-bottom: 5px; line-height: 1.5; }

          /* Signatures */
          .sigs { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; page-break-inside: avoid; }
          .sig { }
          .sig .role { font-size: 9.5px; text-transform: uppercase; letter-spacing: 1px; color: var(--muted); font-weight: 600; margin-bottom: 28px; }
          .sig .line { border-bottom: 1.5px solid var(--ink); height: 1px; margin-bottom: 8px; }
          .sig .name { font-size: 11pt; font-weight: 600; color: var(--ink); }
          .sig .meta { font-size: 10px; color: var(--muted); margin-top: 2px; }

          /* Footer */
          .footer { margin-top: 36px; padding-top: 12px; border-top: 1px solid var(--line); display: flex; justify-content: space-between; font-size: 9.5px; color: var(--muted); }

          @page { size: A4; margin: 0; }
          @media print {
            body { padding: 18mm 16mm; }
            .block, .sigs { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="doc">
          <header class="hdr">
            <div class="hdr-brand">
              <img src="${logoSrc}" alt="${escapeHtml(orgNaam)}" />
              <div>
                <div class="org">${escapeHtml(orgNaam)}</div>
                <div class="tag">Wagenpark | Leasebeheer</div>
              </div>
            </div>
            <div class="hdr-meta">
              <div class="label">Contractnummer</div>
              <div class="ref">${escapeHtml(contract.contract_nummer)}</div>
              <div class="date">${today}</div>
            </div>
          </header>

          <div class="title">
            <h1>${escapeHtml(getContractTypeLabel(contract.type))} overeenkomst</h1>
            <span class="pill">${escapeHtml(contract.status)}</span>
          </div>

          <section class="block">
            <h3>Contractgegevens</h3>
            <div class="grid">${contractRows}</div>
          </section>

          <section class="block">
            <h3>Klantgegevens</h3>
            <div class="grid">${klantRows}</div>
          </section>

          ${vehicleBlock}

          ${services ? `<section class="block"><h3>Inbegrepen services</h3><div class="tags">${services}</div></section>` : ""}

          ${contract.notities ? `<section class="block"><h3>Bijzonderheden</h3><div class="note">${escapeHtml(contract.notities)}</div></section>` : ""}

          ${contract.boeteclausule ? `<section class="block"><h3>Boeteclausule</h3><div class="note">${escapeHtml(contract.boeteclausule)}</div></section>` : ""}

          <section class="sigs">
            <div class="sig">
              <div class="role">Verhuurder</div>
              <div class="line"></div>
              <div class="name">${escapeHtml(orgNaam)}</div>
              <div class="meta">Datum: _____________________</div>
            </div>
            <div class="sig">
              <div class="role">Huurder | Leasenemer</div>
              <div class="line"></div>
              <div class="name">${escapeHtml(contract.klant_naam)}</div>
              <div class="meta">Datum: _____________________</div>
            </div>
          </section>

          <footer class="footer">
            <span>${escapeHtml(orgNaam)} | Contract ${escapeHtml(contract.contract_nummer)}</span>
            <span>Gegenereerd op ${today}</span>
          </footer>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    // Wacht tot logo en fonts geladen zijn
    const triggerPrint = () => setTimeout(() => printWindow.print(), 250);
    if (printWindow.document.readyState === "complete") triggerPrint();
    else printWindow.onload = triggerPrint;
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
          <Button size="sm" variant="outline" className="gap-1.5" onClick={stuurRijbewijs} disabled={sendingRijbewijs}>
            {sendingRijbewijs ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <IdCard className="w-3.5 h-3.5" />}
            Stuur rijbewijsverzoek
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={stuurBorg} disabled={sendingBorg}>
            {sendingBorg ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
            Stuur borg-verificatie
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {statusBadge(verificaties?.rijbewijs ?? null, "Rijbewijs")}
          {statusBadge(verificaties?.borg ?? null, "Borg (iDEAL €0,01)")}
        </div>

        {/* Printable document */}
        <div ref={printRef} className="bg-white text-foreground p-8 rounded-lg border border-border">
          {/* Header */}
          <div className="flex justify-between items-start mb-8 pb-4 border-b-2 border-primary">
            <div>
              <h1 className="text-2xl font-bold text-primary">FleeFlo</h1>
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

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-16 mt-12 pt-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Verhuurder / Leasemaatschappij</p>
              <div className="border-b border-foreground h-16 mb-2" />
              <p className="text-sm font-medium">FleeFlo B.V.</p>
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
              Dit document is gegenereerd op {today} · {contract.contract_nummer}
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

function escapeHtml(s: string | null | undefined): string {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function field(label: string, value: string | null | undefined): string {
  return `<div class="field"><div class="lbl">${escapeHtml(label)}</div><div class="val">${escapeHtml(value || "-")}</div></div>`;
}
