
# Vloot-Copilot · interactieve voertuigkaarten en directe acties

Doel: de Copilot moet niet alleen tekst geven maar ook **klikbare voertuigkaarten** tonen (zoals in de screenshot) waarmee je direct naar een voertuig springt of meteen een reservering / contract start, zonder de chat te verlaten.

## Wat er nu mist

1. Backend (`ai-assistant`) streamt alleen platte markdown · geen gestructureerde voertuigverwijzingen
2. Frontend (`AiAssistant.tsx`) rendert alleen markdown · geen knoppen, geen navigatie
3. Geen actie-tools in de Copilot · alleen lees-tools (`lijst_voertuigen`, `voertuig_beschikbaarheid`, etc.)

## Wat we toevoegen

### 1 · Backend uitbreiden (`supabase/functions/ai-assistant/index.ts`)

Voeg een **structureel actie-protocol** toe. Het model krijgt instructie om voertuigverwijzingen en vervolgacties te omkaderen in een blok dat de frontend herkent en parseert:

````text
[[fleeflo:actions
{
  "intro": "Ja, ik vond 3 bestelbussen die het hele venster vrij zijn:",
  "vehicles": [
    {"kenteken":"78-XY-901","label":"Mercedes Sprinter 314","sub":"3,5 m³ · 1.350 kg","status":"3 dagen vrij"},
    ...
  ],
  "primary": {"type":"reserveer","kenteken":"78-XY-901","klant":"Lisa van den Berg","label":"Reserveer 78-XY-901 voor Lisa van den Berg"}
}
]]
````

Aanpassingen:

- Systemprompt uitbreiden met regels: "wanneer je voertuigen voorstelt, sluit je antwoord af met een `[[fleeflo:actions ... ]]` blok in geldige JSON". Voorbeeld erbij.
- Nieuwe tools toevoegen die het model helpen die acties te bouwen:
  - `zoek_voertuig` (op kenteken / merk / model · returnt id + kenteken + samenvatting)
  - `zoek_klant` (op naam / bedrijf · returnt id + naam)
  - `start_reservering_link` (returnt een diepe link `/reserveringen?nieuw=1&voertuig=<id>&klant=<id>&start=...&eind=...`)
  - `open_voertuig_link` (returnt `/voertuigen?kenteken=<kenteken>`)
- Streaming blijft hetzelfde · het JSON-blok is gewoon onderdeel van de tekstuitvoer.

### 2 · Frontend renderer (`src/components/AiAssistant.tsx` + nieuw `src/components/CopilotActions.tsx`)

- Parse elk assistant-bericht: scheid markdown vs `[[fleeflo:actions ... ]]` blok
- Render het JSON-blok als een **CopilotActions** component:
  - `intro` als kleine tekstregel
  - `vehicles[]` als kaarten met kenteken-badge (geel, monospace), titel, sub, statusbadge rechts en een chevron · klik = `navigate('/voertuigen?kenteken=' + kenteken)` en sluit de chat
  - `primary` als prominente blauwe knop onderin · klik = navigate naar de meegegeven link (reservering, contract, betaal, etc.)
- Markdown blijft via `react-markdown` voor de rest van de tekst

### 3 · Bestemmingspagina's klaarzetten voor query-params

Kleine aanpassingen zodat de deep-links werken:

- `src/pages/Vehicles.tsx` · bij `?kenteken=XXX` automatisch detail-drawer openen + scrollen naar dat voertuig
- `src/pages/Reservations.tsx` · bij `?nieuw=1&voertuig=...&klant=...&start=...&eind=...` automatisch het nieuwe-reservering dialog openen met die waarden voorgevuld

### 4 · Suggesties bijwerken

Voeg in de openings-suggesties een actie-georiënteerde regel toe, bijv.:

- "Welke bestelbus is komende week 3 dagen vrij voor Lisa van den Berg?"

## Technische details

- Parser-regex: `/\[\[fleeflo:actions\s*(\{[\s\S]*?\})\s*\]\]/` · `JSON.parse` met try/catch · bij fout: blok als gewone tekst tonen
- Navigatie via `useNavigate()` uit react-router · chat sluit via bestaande `setOpen(false)` (state liften naar context of via callback prop)
- Chat-state lift: `AiAssistant` krijgt `onClose`/eigen navigate-handler · `CopilotActions` krijgt callbacks `onOpenVehicle(kenteken)` en `onPrimary(href)`
- Streaming-vriendelijk: het actieblok komt alleen in het laatste, niet-tool-call antwoord van het model · de parser draait op de **complete** assistant-content (niet per chunk) zodat halve JSON niet mis-rendert
- Geen em-dashes in UI-teksten · gebruik `·` of `|`

## Bestanden die wijzigen

- `supabase/functions/ai-assistant/index.ts` · prompt + 4 nieuwe tools
- `src/components/AiAssistant.tsx` · parser + render-logica + navigate-hook
- `src/components/CopilotActions.tsx` · nieuw · voertuigkaarten + primaire knop
- `src/pages/Vehicles.tsx` · query-param `kenteken` openen
- `src/pages/Reservations.tsx` · query-params voor pre-filled nieuwe reservering

## Resultaat

Een vraag als "welke bestelbus is komende week 3 dagen vrij voor Lisa?" geeft exact het voorbeeld uit de screenshot: drie kaarten met gele kenteken-badges, status rechts, en onderin een blauwe knop "Reserveer 78-XY-901 voor Lisa van den Berg" die direct het reserveringsformulier opent met alles voorgevuld.
