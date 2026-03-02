
# Contractensectie Uitbreiding

## Overzicht
De contractensectie wordt volledig uitgebreid met CRUD-functionaliteit, facturatiebeheer en database-opslag. De huidige mock-data wordt vervangen door een database-gedreven systeem met authenticatie.

---

## 1. Database Setup

### Tabellen aanmaken

**contracts**
- `id` (uuid, PK)
- `user_id` (uuid, FK naar auth.users, NOT NULL)
- `contract_nummer` (text, uniek)
- `type` (enum: lease, verhuur, fietslease, ev-lease)
- `voertuig_id` (text, nullable — referentie naar voertuig)
- `klant_naam`, `klant_email` (text)
- `bedrijf` (text, nullable)
- `start_datum`, `eind_datum` (date)
- `maandprijs` (numeric)
- `status` (enum: actief, verlopen, opgezegd, concept)
- `km_per_jaar` (integer, nullable)
- `inclusief` (text[], services array)
- `notities` (text, nullable)
- `created_at`, `updated_at` (timestamptz)

**invoices**
- `id` (uuid, PK)
- `contract_id` (uuid, FK naar contracts)
- `datum` (date)
- `bedrag` (numeric)
- `status` (enum: betaald, openstaand, te_laat, herinnering_verstuurd)
- `created_at` (timestamptz)

### RLS-policies
- Gebruikers kunnen alleen hun eigen contracten en facturen lezen/schrijven
- Policies op basis van `user_id = auth.uid()`

### Seed data
- De bestaande mock-data wordt als seed-migratie ingevoegd, gekoppeld aan de ingelogde gebruiker via een database trigger

---

## 2. Authenticatie

- Login- en registratiepagina toevoegen (`/auth`)
- Beveiligde routes: gebruikers worden doorgestuurd naar `/auth` als ze niet ingelogd zijn
- AuthProvider component voor sessie-management

---

## 3. Nieuw Contract Aanmaken

- Formulier als dialog/drawer met velden:
  - Contracttype selectie (autolease, verhuur, fietslease, EV lease)
  - Klantnaam, e-mail, bedrijf (optioneel)
  - Voertuigselectie uit bestaand wagenpark (of overslaan bij fietslease)
  - Start- en einddatum met datumkiezer
  - Maandprijs, km/jaar
  - Inclusief-opties (checkboxes: onderhoud, verzekering, pechhulp, etc.)
  - Notities
- Validatie met Zod-schema
- Contract wordt opgeslagen in database met status "concept"

---

## 4. Contracten Bewerken en Opzeggen

- Bewerkknop in contractdetail-dialog opent bewerkformulier (zelfde formulier als aanmaken, voorgevuld)
- Opzeggen: bevestigingsdialog, status wordt gewijzigd naar "opgezegd"
- Verlengen: einddatum aanpassen met bevestiging
- Statuswijzigingen worden direct in de database bijgewerkt

---

## 5. Facturatie en Betalingen

- Tab "Facturen" in contractdetail uitbreiden met:
  - Knop "Factuur toevoegen" (datum, bedrag, status)
  - Status wijzigen per factuur (betaald markeren, herinnering versturen)
- Overzicht openstaande/verlopen facturen op de contractenpagina
- Visuele indicatoren voor betalingsstatus

---

## 6. Data-laag Refactoring

- React Query hooks aanmaken:
  - `useContracts()` — ophalen met filters
  - `useContract(id)` — enkel contract met facturen
  - `useCreateContract()` — mutatie
  - `useUpdateContract()` — mutatie
  - `useDeleteContract()` — mutatie
  - `useCreateInvoice()` / `useUpdateInvoice()` — factuurbeheer
- Mock-data wordt vervangen door database-queries
- Supabase client wordt gebruikt voor alle CRUD-operaties

---

## Technische Details

### Bestanden die worden aangemaakt
- `src/pages/Auth.tsx` — login/registratie pagina
- `src/components/ContractForm.tsx` — formulier voor aanmaken/bewerken
- `src/components/InvoiceForm.tsx` — factuur toevoegen/bewerken
- `src/hooks/useContracts.ts` — React Query hooks voor contracten
- `src/hooks/useInvoices.ts` — React Query hooks voor facturen
- `src/hooks/useAuth.ts` — authenticatie hook

### Bestanden die worden aangepast
- `src/pages/Contracts.tsx` — data ophalen via hooks, CRUD-acties toevoegen
- `src/App.tsx` — auth route en beveiligde routes
- `src/data/mockData.ts` — contract mock-data kan behouden blijven als fallback

### Volgorde van implementatie
1. Database migraties uitvoeren (tabellen + RLS + enums)
2. Authenticatie pagina en provider toevoegen
3. React Query hooks bouwen
4. Contractformulier (aanmaken + bewerken)
5. Contractdetail uitbreiden met bewerk/opzeg-acties
6. Factuurbeheer in contractdetail
7. Contractenpagina koppelen aan database
