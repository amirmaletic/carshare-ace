
# Automatische Data Koppelingen voor Contracten

## Overzicht
Drie externe datakoppelingen worden toegevoegd aan het contractformulier en contractbeheer: **RDW voertuigdata**, **KVK bedrijfsgegevens**, en **kilometerregistratie**.

---

## 1. RDW Voertuigdata in Contractformulier

De bestaande `KentekenSearch`-component gebruikt al de gratis RDW Open Data API. Deze functionaliteit wordt geintegreerd in het contractformulier.

**Wat verandert:**
- In het contractformulier komt een **kentekeninvoerveld** naast de voertuigselectie
- Bij invoer van een kenteken worden automatisch de voertuiggegevens opgehaald via de RDW API (`opendata.rdw.nl`)
- Opgehaalde data (merk, model, brandstof, APK-datum, catalogusprijs, CO2-uitstoot) wordt getoond als preview
- Indien het voertuig al in het wagenpark zit, wordt het automatisch geselecteerd
- In het contractdetail worden RDW-gegevens (APK-status, verzekeringsstatus) ook getoond

**Geen API-key nodig** — RDW Open Data is gratis en publiek toegankelijk.

---

## 2. KVK Bedrijfsdata

Bij het invullen van het bedrijfsveld wordt automatisch gezocht in de KVK API.

**Wat verandert:**
- Het bedrijfsveld krijgt een **autocomplete/zoekfunctie**
- Bij typen wordt gezocht via een backend functie die de KVK API bevraagt
- Resultaten tonen: bedrijfsnaam, KVK-nummer, adres, rechtsvorm
- Bij selectie worden de gegevens automatisch ingevuld
- Nieuwe velden in de `contracts`-tabel: `kvk_nummer` (text, nullable) en `bedrijf_adres` (text, nullable)

**API-key nodig:** De KVK API vereist een API-key. Er wordt een edge function aangemaakt die de key veilig bewaart. Je krijgt een verzoek om je KVK API-key in te voeren.

---

## 3. Kilometerregistratie

Een nieuwe tabel voor het bijhouden van kilometerstanden per contract.

**Wat verandert:**
- Nieuwe `kilometer_registraties`-tabel met: `contract_id`, `datum`, `kilometerstand`, `notitie`
- In het contractdetail komt een nieuw tabblad "Kilometers" naast "Facturen"
- Handmatige invoer van kilometerstanden met datum
- Grafiek met kilometerverloop over tijd (via Recharts, al geinstalleerd)
- Waarschuwing als het huidige verbruik boven het contractuele km/jaar-limiet uitkomt
- Berekening van gemiddeld km/dag en verwacht jaareinde

---

## Technische Details

### Database migratie
- `contracts` tabel uitbreiden met `kvk_nummer` (text, nullable) en `bedrijf_adres` (text, nullable)
- Nieuwe tabel `kilometer_registraties`:
  - `id` (uuid, PK)
  - `contract_id` (uuid, FK naar contracts)
  - `user_id` (uuid, NOT NULL)
  - `datum` (date)
  - `kilometerstand` (integer)
  - `notitie` (text, nullable)
  - `created_at` (timestamptz)
- RLS policies: gebruikers zien alleen eigen registraties

### Edge function: `kvk-search`
- Zoekt bedrijven via de KVK API
- Vereist `KVK_API_KEY` als secret
- Retourneert bedrijfsnaam, KVK-nummer, adres, rechtsvorm

### Nieuwe/aangepaste bestanden
- `supabase/functions/kvk-search/index.ts` -- edge function voor KVK API
- `src/hooks/useKilometerRegistraties.ts` -- CRUD hooks voor km-registraties
- `src/components/KilometerTab.tsx` -- tabblad met km-invoer en grafiek
- `src/components/KvkSearch.tsx` -- autocomplete component voor bedrijfsgegevens
- `src/components/ContractForm.tsx` -- RDW-integratie en KVK-autocomplete toevoegen
- `src/pages/Contracts.tsx` -- km-tab toevoegen aan contractdetail

### Volgorde van implementatie
1. Database migratie (nieuwe kolommen + km-tabel + RLS)
2. KVK edge function + secret opvragen
3. KVK autocomplete component bouwen
4. RDW-lookup integreren in contractformulier
5. Kilometerregistratie hooks + UI bouwen
6. Km-tab met grafiek in contractdetail toevoegen
