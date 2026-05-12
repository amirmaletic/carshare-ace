## Doel

Een nieuw planning-onderdeel waar alle inkomende aanvragen samenkomen. Per aanvraag wordt automatisch het beste beschikbare voertuig voor de gewenste periode voorgesteld (bijv. klant vraagt Polo → eerste vrije Polo in die periode). De gebruiker hoeft enkel "Bevestigen" te drukken en de reservering wordt direct aangemaakt.

## Nieuwe pagina: Planning Aanvragen

Route: `/aanvragen-planning` (nieuwe sidebar-item onder Planning, naast Reserveringen).

Layout:
- Bovenin: filterbalk (status: nieuw / gekoppeld / wacht op bevestiging / omgezet, zoekveld op klantnaam, periode-picker).
- Linkerkolom: lijst met aanvraagkaarten, gesorteerd op aanvraagdatum (nieuwste eerst, urgent bovenaan).
- Rechterkolom (detail): geselecteerde aanvraag met:
  - klantgegevens
  - gewenst type/categorie/brandstof/budget/periode/notitie
  - **Voorgesteld voertuig** (groot, met foto, kenteken, dagprijs)
  - dropdown "Andere keuze" met alle alternatieve beschikbare voertuigen voor die periode
  - knoppen: **Bevestigen** (primair, groot), Wijzig periode, Andere klant, Afwijzen

## Slimme matching-logica

Bij openen van de planning-pagina draait een matching per open aanvraag:

1. Filter alle voertuigen die voldoen aan harde criteria: `gewenst_type` (merk/model bevat), `gewenste_categorie`, `gewenste_brandstof`, optioneel `budget_max ≥ dagprijs`.
2. Filter daarvan alle voertuigen die in de periode `gewenste_periode_start..eind` géén overlap hebben met:
   - bestaande `reserveringen` (status ≠ geannuleerd)
   - actieve `contracts` (start_datum..eind_datum overlap)
   - geplande items in `service_historie` (onderhoud)
   - `voertuigen.status` in {onderhoud, schade, verkocht}
3. Sorteer kandidaten op: exacte modelmatch > zelfde categorie > prijs dichtst bij budget > minst recent verhuurd (eerlijke rotatie).
4. De top-1 wordt voorstel; rest verschijnt in dropdown "Andere keuze".
5. Resultaten worden gecached per aanvraag-id en automatisch geherevalueerd als de aanvraag wijzigt of als de planning verandert (realtime invalidate).

## 1-klik bevestigen

Knop "Bevestigen" doet in één RPC-call:
- maakt klant aan als die nog niet bestaat (op basis van email/telefoon)
- maakt `reserveringen` rij aan (status `bevestigd`, dagprijs uit voertuig, totaalprijs = dagen × dagprijs)
- update aanvraag naar status `omgezet` met `gekoppeld_voertuig_id`
- toont toast met link naar nieuwe reservering en optie "Direct contract opmaken"

## Sidebar / navigatie

- Nieuwe sidebar entry "Aanvragen" onder de Planning-sectie met badge die aantal open aanvragen toont (live via subscription op `aanvragen`).
- De bestaande tab "Aanvragen" op `/reserveringen` blijft werken maar krijgt een banner "Bekijk in nieuwe Aanvragen-planning →".

## Realtime

Supabase realtime subscription op `aanvragen` (insert/update) zodat nieuwe aanvragen direct in de lijst poppen, met subtiele toast-notificatie en geluidloze badge-update.

## Technische details

- Nieuwe pagina `src/pages/AanvragenPlanning.tsx`.
- Nieuwe hook `src/hooks/useAanvraagMatching.ts`: voor één aanvraag retourneert gesorteerde lijst beschikbare voertuigen, gebruikt bestaande availability-logica uit `VehicleGantt` (helper extraheren naar `src/lib/availability.ts`).
- Nieuwe Supabase RPC `bevestig_aanvraag(_aanvraag_id, _voertuig_id, _dagprijs)` die transactioneel klant + reservering aanmaakt en aanvraag bijwerkt.
- Sidebar wijziging in `src/components/AppSidebar.tsx` (of equivalent) met badge-count via `useAanvragen`.
- Route toevoegen in `src/App.tsx`.
- Realtime subscriptie via bestaand patroon (zie `useNotificaties` of `messages` voorbeeld).

## Buiten scope

- Geen wijzigingen aan publiek aanvraagformulier (`/boeken`).
- Geen wijziging aan AI-matching edge function (`match-vehicle`); de nieuwe deterministische matcher draait clientside bovenop. AI-motivatie wordt indien aanwezig getoond als extra hint.
