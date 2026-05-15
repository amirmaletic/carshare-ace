
## Doel
Zodra een beheerder op **Ondertekenen** klikt en het contract op `actief` springt, krijgt de klant automatisch een mail met het huurcontract en de algemene voorwaarden als echte PDF-bijlagen. De overdrachtsbon volgt later (bij de uitgifte) en valt buiten deze scope.

## Stappen

### 1. Resend connector koppelen
- Connect de **Resend** standard connector (API-key beheert Lovable, hoeft niet handmatig).
- Resend ondersteunt PDF-bijlagen via base64 in het `attachments` veld.

### 2. Algemene voorwaarden opslag
- Nieuwe kolom `algemene_voorwaarden_url` op `organisaties`.
- Nieuwe storage bucket `organisatie-documenten` (private, signed URL).
- Nieuwe kaart in **Instellingen → Bedrijf**: upload veld voor AV-PDF (één bestand per organisatie). Bij upload bucket-pad opslaan in de kolom.

### 3. Contract-PDF client-side renderen
- Bestaande `ContractDocument.tsx` rendert al de print-HTML. Hergebruik die HTML in een nieuwe util `generateContractPdf(contract)` die met **jsPDF + html2canvas** (al voor invoices gebruikt: `InvoicePdfExport.tsx`) een blob produceert.
- Functie levert `{ filename, base64 }`.

### 4. Edge function `verstuur-contract-mail`
- Input: `contract_id`, `contract_pdf_base64`, `voorwaarden_pdf_base64?`
- Server-side:
  - Auth-check via JWT, RLS-check op `organisatie_id`.
  - Download AV-PDF uit storage (via service role) als die niet meegegeven is, en stuur naar base64.
  - Stuur via Resend connector gateway naar `klant_email`:
    - From: `notify@notify.fleeflo.nl` (bestaande Lovable Email blijft voor andere flows; deze ene mail gaat via Resend wegens bijlagen).
    - Subject: `Uw huurcontract {contract_nummer}`
    - HTML body: korte branded mail met link naar klantportaal en uitleg.
    - Attachments: `[contract.pdf, algemene-voorwaarden.pdf]`.
  - Log in `email_send_log` met `template_name = 'contract-ondertekend'`, en in `activiteiten_log` (`contract_mail_verzonden`).
- `verify_jwt = true` (gewone authenticated call vanuit app).

### 5. Trigger in `handleSign` (Contracts.tsx)
```text
1. updateContract → status actief
2. await generateContractPdf(contract) op client
3. supabase.functions.invoke('verstuur-contract-mail', { body: { contract_id, contract_pdf_base64 } })
4. toast: "Contract ondertekend en verzonden naar {email}"
```
- Falende mail blokkeert de ondertekening niet — toon waarschuwingstoast met retry-knop "Mail opnieuw versturen" in `ContractDocument.tsx`.

### 6. Handmatig opnieuw versturen
- Knop **Stuur contract per mail** in `ContractDocument.tsx` (alleen zichtbaar als `ondertekend = true`) gebruikt dezelfde flow.

## Bestanden

**Nieuw**
- `supabase/migrations/<ts>_av_kolom.sql` — kolom + bucket + RLS.
- `supabase/functions/verstuur-contract-mail/index.ts`
- `src/lib/contractPdf.ts` — helper voor client-side PDF generatie.

**Gewijzigd**
- `src/pages/SettingsBedrijf.tsx` (of huidige bedrijfssettings) — AV upload veld.
- `src/pages/Contracts.tsx` — `handleSign` triggert mail.
- `src/components/ContractDocument.tsx` — knop "Mail naar klant".

## Buiten scope
- Overdrachtsbon (komt later bij uitgifte-flow).
- SMS, herinneringen, marketing.
- Wijzigingen aan bestaande Lovable Emails / auth-mails.
