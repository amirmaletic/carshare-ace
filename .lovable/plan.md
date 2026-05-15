## Doel

Aanvragen worden niet langer omgezet naar een losse reservering, maar naar een volwaardig **concept-contract**. Daarnaast komt er een lichtgewicht "planning-blokje" zodat je in de Gantt naast contracten ook eigen blokken (eigen gebruik, gereserveerd voor X, blokkade) kunt plaatsen met eigen titel en kleur.

---

## Wijzigingen

### 1. Database

**Nieuwe RPC `bevestig_aanvraag_naar_contract`**
- Input: `_aanvraag_id`, `_voertuig_id`, `_type` (verhuur of lease), optioneel `_dagprijs` of `_maandprijs`.
- Logica:
  - Klant ophalen of aanmaken (zoals `bevestig_aanvraag` nu doet).
  - Contractnummer genereren (`VC-YYYY-###` voor verhuur, `LC-YYYY-###` voor lease).
  - Periode: `gewenste_periode_start` t/m `gewenste_periode_eind`, fallback vandaag + 7 dagen.
  - Bedrag: bij verhuur `dagprijs * dagen` als maandprijs-veld of dagprijs in notities, bij lease `maandprijs` direct.
  - Insert in `contracts` met `status = 'concept'`. De bestaande trigger `auto_create_overdrachten_for_contract` maakt automatisch ophaal- en terugbreng-overdrachten.
  - Aanvraag op `omgezet`, koppel `gekoppeld_voertuig_id`.
  - Activiteiten-log entry.
- Returns: `contract_id`.

**Nieuwe tabel `planning_blokken`**
- Velden: `voertuig_id` (uuid), `start_datum`, `eind_datum`, `titel`, `kleur` (hex), `notitie`, plus `organisatie_id`, `user_id`, `created_at`.
- RLS: org-leden mogen aanmaken, lezen, updaten, verwijderen binnen eigen organisatie (zelfde patroon als `locaties`).

### 2. Frontend: aanvraag-conversie

**`src/pages/AanvragenPlanning.tsx`**
- Voeg `Select` toe voor contracttype (verhuur / lease) naast de "Bevestig"-knop.
- Vervang `supabase.rpc("bevestig_aanvraag", ...)` door `supabase.rpc("bevestig_aanvraag_naar_contract", ...)`.
- Toast met actie "Open contract" → navigeert naar `/contracts?open={id}`.
- Invalideer queries: `aanvragen`, `contracts`, `gantt-contracten`.

**`src/pages/Contracts.tsx`**
- Lees `?open=<id>` uit URL en open contract-detail/wizard om aanvulling/ondertekening te faciliteren.

### 3. Frontend: planning-blokjes

**Nieuwe hook `src/hooks/usePlanningBlokken.ts`**
- TanStack Query CRUD op `planning_blokken` (lijst, add, update, delete).

**Nieuw component `src/components/planning/PlanningBlokDialog.tsx`**
- Velden: voertuig (Select), periode (start + eind), titel (Input), kleur (color-picker met 6 voorgestelde kleuren + custom), notitie (Textarea).

**`src/components/VehicleGantt.tsx`**
- Extra query `gantt-blokken` op `planning_blokken` binnen zichtbare periode.
- Render blokken met `background: blok.kleur` en label `blok.titel`.
- Context-menu op een lege cel krijgt extra item "Blokje plaatsen" → opent `PlanningBlokDialog` met voor-ingevulde voertuig/datum.
- Klik op een blok opent dezelfde dialog in edit-modus (met "Verwijderen"-knop).

### 4. Backwards compatibility

- Oude `bevestig_aanvraag` blijft bestaan en wordt niet meer aangeroepen vanuit de UI (publieke booking-flow gebruikt een ander pad).
- Bestaande reserveringen blijven zichtbaar en functioneel; alleen nieuwe aanvragen volgen de contract-flow.

---

## Technische details

- Contractnummer-functie: SQL `format('VC-%s-%s', extract(year from now()), lpad((select count(*)+1 from contracts where ...)::text, 3, '0'))`. Eenvoudig en uniek-genoeg voor concept; admin kan handmatig aanpassen.
- `planning_blokken.kleur` standaard `#3B82F6` (brand-primary), opgeslagen als hex string.
- Geen overlap-validatie op blokken; ze zijn puur visueel en staan los van beschikbaarheid (wel zichtbaar in Gantt zodat planner conflicts ziet).

---

## Wat we niet doen (nu)

- Geen automatische factuur bij contract-aanmaak (blijft handmatig in concept-flow).
- Geen e-mail naar klant bij omzetten (kan later via bestaande contract-mail).
- Blokjes komen niet in publieke beschikbaarheids-API; alleen intern in Gantt.
