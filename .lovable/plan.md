## Doel

Een conceptcontract krijgt een duidelijke "compleetheid"-status met checklist. Beheerder kan met één klik een aanvulverzoek mailen naar de klant; klant vult zelf NAW, geboortedatum en rijbewijs aan via een unieke link. De bestaande "Onderteken"-knop blijft de definitieve overgang naar `actief`, maar wordt pas klikbaar zodra de checklist 100% is.

## Checklist (definitie "compleet")

1. **Klantgegevens**: `klant_naam`, `klant_email`, `klant_telefoon`, en op de gekoppelde `klanten`-rij ook `adres`, `postcode`, `woonplaats`, `geboortedatum`.
2. **Rijbewijs op orde**: gekoppelde klant heeft `rijbewijs_nummer`, `rijbewijs_geldig_tot` in de toekomst, en (indien aanwezig) `rijbewijs_geverifieerd = true`.
3. **Voertuig, prijs & periode**: `voertuig_id` gevuld, `start_datum` & `eind_datum` geldig, `dagprijs > 0` (verhuur) of `maandprijs > 0` (lease).

Ontbrekende velden worden zichtbaar als checklist in het contract-detail.

## Database

Nieuwe tabel `contract_aanvul_verzoeken`:
- `id`, `contract_id`, `organisatie_id`, `klant_email`
- `token text unique` (32-byte hex via `extensions.gen_random_bytes`)
- `status` (`open` / `ingevuld` / `verlopen`)
- `verzonden_op`, `expires_at` (default 14 dagen), `ingevuld_op`
- RLS: org-leden kunnen lezen/aanmaken voor eigen org; publieke `SELECT` alleen via security-definer RPC `get_aanvul_verzoek(_token)` die contract + ontbrekende velden teruggeeft zonder gevoelige data.
- Tweede RPC `update_aanvul_verzoek(_token, _payload jsonb)` schrijft naar `klanten` + `contracts` (alleen toegestane kolommen) en zet status op `ingevuld`.

Geen automatische statuswijziging op `contracts` — ondertekening blijft de trigger naar `actief`.

## Backend / e-mail

- Nieuwe transactional template `contract-aanvulverzoek` (React Email): begroeting, lijst van wat ontbreekt (in de mail al concreet benoemd), grote knop naar `https://<app>/contract-aanvullen/<token>`, vervaldatum.
- Bestaande `send-transactional-email` edge function gebruiken; idempotency-key = `aanvulverzoek-<verzoek_id>`.
- Verzonden via bestaande `notify.fleeflo.nl`-infra.

## Frontend (beheerder)

In het contract-detail (`src/pages/Contracts.tsx`) bij conceptcontracten:
- **ChecklistCard** met de drie blokken; per item ✓/✗ en het ontbrekende veld benoemd.
- Knop **"Stuur aanvulverzoek per mail"** — disabled als checklist al 100%; toont laatst verzonden datum als er een open verzoek is. Bij klik: maak rij in `contract_aanvul_verzoeken`, roep `send-transactional-email` aan, log activiteit.
- Bestaande knop **"Onderteken & activeer"** wordt disabled met tooltip "Checklist nog niet compleet" zolang niet 100%.
- Statusbadge "Concept · 4/6 compleet".

## Frontend (klant, publiek)

Nieuwe publieke route `/contract-aanvullen/:token` (geen auth, zoals `/boeken`):
- Haalt verzoek op via RPC. Toont contractnummer + voertuig + verhuurder.
- Formulier met alleen de velden die nog ontbreken (NAW, geboortedatum, rijbewijsnummer + geldig tot + foto-upload naar bestaande `rijbewijs`-bucket).
- Submit roept `update_aanvul_verzoek` RPC aan; succespagina "Bedankt, je verhuurder neemt het verder op".
- Verlopen/al-ingevuld tokens tonen vriendelijke melding.

## Activiteiten-log

Via `useLogActiviteit`: `aanvulverzoek_verzonden`, `aanvulverzoek_ingevuld` (entiteit = contract).

## Niet in scope

- Geen automatische status-overgang naar `actief` (jouw keuze: alleen ondertekening).
- Geen SMS-variant.
- Geen herinneringsmail-cadans (kan later, knop is nu handmatig opnieuw te versturen).
- Geen wijzigingen aan ondertekenings-/overdrachtsflow zelf.
