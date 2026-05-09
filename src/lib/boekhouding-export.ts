import JSZip from "jszip";

export interface FactuurExport {
  id: string;
  factuurnummer: string;
  datum: string;
  omschrijving: string;
  bedrag_incl: number;
  btw_tarief: number;
  status: string;
  type: string;
  klant_naam: string;
  klant_email: string;
  klant_adres?: string;
  klant_postcode?: string;
  klant_plaats?: string;
  contract_id?: string | null;
  voertuig_kenteken?: string;
}

export interface BedrijfInfo {
  bedrijfsnaam: string;
  kvk_nummer: string;
  btw_nummer: string;
  adres: string;
  postcode: string;
  plaats: string;
  email: string;
  telefoon: string;
  iban?: string;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function splitsBtw(bedragIncl: number, btwTarief: number) {
  const factor = 1 + btwTarief / 100;
  const excl = round2(bedragIncl / factor);
  const btw = round2(bedragIncl - excl);
  return { excl, btw, incl: round2(bedragIncl) };
}

function csvEscape(v: unknown): string {
  const s = v == null ? "" : String(v);
  if (/[";\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Generieke CSV met kolommen die Exact, Moneybird, AFAS en Snelstart accepteren. */
export function buildGeneriekeCsv(rows: FactuurExport[]): string {
  const headers = [
    "Factuurnummer",
    "Factuurdatum",
    "Debiteur",
    "Debiteur e-mail",
    "Omschrijving",
    "Bedrag excl. BTW",
    "BTW-tarief",
    "BTW-bedrag",
    "Bedrag incl. BTW",
    "Valuta",
    "Status",
    "Type",
    "Kenteken",
    "Grootboek",
  ];
  const lines = [headers.join(";")];
  for (const r of rows) {
    const { excl, btw, incl } = splitsBtw(r.bedrag_incl, r.btw_tarief);
    const grootboek = r.type === "schade" ? "8020 Schade-opbrengsten" : "8000 Verhuuropbrengsten";
    lines.push([
      r.factuurnummer,
      r.datum,
      r.klant_naam,
      r.klant_email,
      r.omschrijving,
      excl.toFixed(2).replace(".", ","),
      `${r.btw_tarief}%`,
      btw.toFixed(2).replace(".", ","),
      incl.toFixed(2).replace(".", ","),
      "EUR",
      r.status,
      r.type,
      r.voertuig_kenteken ?? "",
      grootboek,
    ].map(csvEscape).join(";"));
  }
  // BOM voor Excel UTF-8
  return "\uFEFF" + lines.join("\r\n");
}

/** Moneybird-vriendelijke CSV (alleen relevante kolommen). */
export function buildMoneybirdCsv(rows: FactuurExport[]): string {
  const headers = [
    "factuurnummer", "datum", "klantnaam", "email",
    "regelomschrijving", "aantal", "prijs", "btw_percentage",
  ];
  const lines = [headers.join(",")];
  for (const r of rows) {
    const { excl } = splitsBtw(r.bedrag_incl, r.btw_tarief);
    lines.push([
      r.factuurnummer, r.datum, r.klant_naam, r.klant_email,
      r.omschrijving, "1", excl.toFixed(2), String(r.btw_tarief),
    ].map(csvEscape).join(","));
  }
  return "\uFEFF" + lines.join("\r\n");
}

function xmlEscape(s: string): string {
  return s.replace(/[<>&'"]/g, (c) =>
    c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === "&" ? "&amp;" : c === "'" ? "&apos;" : "&quot;");
}

/** SI-UBL 2.0 / NL Peppol e-factuur per stuk. */
export function buildUblXml(r: FactuurExport, b: BedrijfInfo): string {
  const { excl, btw, incl } = splitsBtw(r.bedrag_incl, r.btw_tarief);
  const issueDate = r.datum;
  const dueDate = r.datum;
  const supplierVat = b.btw_nummer || "";
  const supplierKvk = b.kvk_nummer || "";
  const customerName = r.klant_naam || "Onbekend";
  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:fdc:nen.nl:nlcius:v1.0</cbc:CustomizationID>
  <cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>
  <cbc:ID>${xmlEscape(r.factuurnummer)}</cbc:ID>
  <cbc:IssueDate>${issueDate}</cbc:IssueDate>
  <cbc:DueDate>${dueDate}</cbc:DueDate>
  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>
  <cac:AccountingSupplierParty><cac:Party>
    <cac:PartyName><cbc:Name>${xmlEscape(b.bedrijfsnaam || "Onbekend")}</cbc:Name></cac:PartyName>
    <cac:PostalAddress>
      <cbc:StreetName>${xmlEscape(b.adres || "")}</cbc:StreetName>
      <cbc:CityName>${xmlEscape(b.plaats || "")}</cbc:CityName>
      <cbc:PostalZone>${xmlEscape(b.postcode || "")}</cbc:PostalZone>
      <cac:Country><cbc:IdentificationCode>NL</cbc:IdentificationCode></cac:Country>
    </cac:PostalAddress>
    ${supplierVat ? `<cac:PartyTaxScheme><cbc:CompanyID>${xmlEscape(supplierVat)}</cbc:CompanyID><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme>` : ""}
    <cac:PartyLegalEntity>
      <cbc:RegistrationName>${xmlEscape(b.bedrijfsnaam || "Onbekend")}</cbc:RegistrationName>
      ${supplierKvk ? `<cbc:CompanyID schemeID="0106">${xmlEscape(supplierKvk)}</cbc:CompanyID>` : ""}
    </cac:PartyLegalEntity>
  </cac:Party></cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty><cac:Party>
    <cac:PartyName><cbc:Name>${xmlEscape(customerName)}</cbc:Name></cac:PartyName>
    <cac:PostalAddress>
      <cbc:StreetName>${xmlEscape(r.klant_adres || "")}</cbc:StreetName>
      <cbc:CityName>${xmlEscape(r.klant_plaats || "")}</cbc:CityName>
      <cbc:PostalZone>${xmlEscape(r.klant_postcode || "")}</cbc:PostalZone>
      <cac:Country><cbc:IdentificationCode>NL</cbc:IdentificationCode></cac:Country>
    </cac:PostalAddress>
    <cac:PartyLegalEntity><cbc:RegistrationName>${xmlEscape(customerName)}</cbc:RegistrationName></cac:PartyLegalEntity>
  </cac:Party></cac:AccountingCustomerParty>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="EUR">${btw.toFixed(2)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="EUR">${excl.toFixed(2)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="EUR">${btw.toFixed(2)}</cbc:TaxAmount>
      <cac:TaxCategory><cbc:ID>S</cbc:ID><cbc:Percent>${r.btw_tarief.toFixed(2)}</cbc:Percent>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="EUR">${excl.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="EUR">${excl.toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="EUR">${incl.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="EUR">${incl.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  <cac:InvoiceLine>
    <cbc:ID>1</cbc:ID>
    <cbc:InvoicedQuantity unitCode="EA">1</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="EUR">${excl.toFixed(2)}</cbc:LineExtensionAmount>
    <cac:Item><cbc:Name>${xmlEscape(r.omschrijving || "Factuurregel")}</cbc:Name>
      <cac:ClassifiedTaxCategory><cbc:ID>S</cbc:ID><cbc:Percent>${r.btw_tarief.toFixed(2)}</cbc:Percent>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:ClassifiedTaxCategory></cac:Item>
    <cac:Price><cbc:PriceAmount currencyID="EUR">${excl.toFixed(2)}</cbc:PriceAmount></cac:Price>
  </cac:InvoiceLine>
</Invoice>`;
}

export async function buildUblZip(rows: FactuurExport[], b: BedrijfInfo): Promise<Blob> {
  const zip = new JSZip();
  for (const r of rows) {
    const safeNr = (r.factuurnummer || r.id).replace(/[^a-zA-Z0-9_-]/g, "_");
    zip.file(`factuur-${safeNr}.xml`, buildUblXml(r, b));
  }
  return zip.generateAsync({ type: "blob" });
}

export function downloadBlob(content: Blob | string, filename: string, mime = "text/plain;charset=utf-8") {
  const blob = typeof content === "string" ? new Blob([content], { type: mime }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}