

## Plan: Kostenberekening, AI-assistent en Mobiele App

Dit plan voegt drie grote features toe aan FleetFlow: een kostenmodule met prognoses, een AI-assistent voor slimme aanbevelingen, en PWA-ondersteuning voor mobiel gebruik.

---

### 1. Kostenberekening en Prognoses

**Nieuwe pagina: `/kosten`**

Een dedicated kostenpagina met:
- **Kostenberekening per voertuig**: Berekent totale kosten op basis van bestaande data uit `service_historie`, `schade_rapporten`, contractgegevens (maandprijs), en kilometerregistraties
- **Kosten per km**: Automatisch berekend uit totale kosten / gereden kilometers
- **Prognoses (6-12 maanden)**: Lineaire trendanalyse op basis van historische kosten, getoond in een lijndiagram
- **Vergelijking lease vs. koop**: Simpele vergelijkingswidget waar je parameters invult (aanschafprijs, afschrijving, verwachte onderhoudskosten) en vergelijkt met de huidige leaseprijs
- **Dashboard-kaarten**: TCO (Total Cost of Ownership) per voertuig, gemiddelde kosten/km, prognose komende maand

**Wijzigingen:**
- Nieuw bestand: `src/pages/Kosten.tsx` - Kostenoverzicht met grafieken (recharts)
- Nieuw bestand: `src/hooks/useKostenBerekening.ts` - Hook die data aggregeert uit contracts, service_historie, schade_rapporten
- Update: `src/App.tsx` - Route `/kosten` toevoegen
- Update: `src/components/AppSidebar.tsx` - Menu-item "Kosten" toevoegen

Geen database-wijzigingen nodig; alle berekeningen worden gedaan op basis van bestaande tabellen.

---

### 2. AI-assistent voor Aanbevelingen

**Chatinterface in de sidebar of als floating widget**

Een AI-assistent die Lovable AI (Gemini) gebruikt om aanbevelingen te geven over:
- Beste voertuig voor een klant (op basis van budget, km-behoefte, type gebruik)
- Onderhoudsplanning suggesties (op basis van servicehistorie en km-stand)
- Lease-opties vergelijken en adviseren
- Kostenbesparing tips

**Wijzigingen:**
- Nieuw bestand: `supabase/functions/ai-assistant/index.ts` - Edge function die Lovable AI Gateway aanroept met context over het wagenpark
- Nieuw bestand: `src/components/AiAssistant.tsx` - Floating chatwidget met streaming berichten
- Nieuw bestand: `src/hooks/useAiChat.ts` - Hook voor SSE streaming chat
- Update: `src/components/AppLayout.tsx` - AI-assistent widget toevoegen
- Update: `supabase/config.toml` - Functie registreren

De assistent krijgt een system prompt met context over FleetFlow (wagenpark, contracten, kosten) zodat antwoorden relevant zijn.

---

### 3. Mobiele App (PWA)

**Installeerbare web-app voor telefoon en tablet**

De app wordt een Progressive Web App (PWA) zodat gebruikers hem kunnen installeren op hun telefoon vanuit de browser. Dit geeft:
- Installatie op homescreen (ziet eruit als een echte app)
- Werkt offline (cached pagina's)
- Snelle laadtijden
- Geen app store nodig

**Wijzigingen:**
- Installatie van `vite-plugin-pwa` dependency
- Update: `vite.config.ts` - PWA plugin configureren met manifest
- Update: `index.html` - Meta tags voor mobiel (viewport, theme-color, apple-touch-icon)
- Nieuw bestand: `public/manifest.json` - App manifest met naam, iconen, kleuren
- Nieuw bestand: `src/pages/Install.tsx` - Installatiepagina met instructies
- PWA iconen aanmaken in `public/`

---

### Technische Details

**Kostenmodule**
- Gebruikt `useContracts`, `useServiceHistorie`, `useSchadeRapporten` hooks om data te aggregeren
- Prognose: simpel lineair gemiddelde over de laatste 6 maanden, geextrapoleerd
- Grafieken via recharts (al geinstalleerd)

**AI-assistent**
- Gebruikt `LOVABLE_API_KEY` (al geconfigureerd) via Lovable AI Gateway
- Model: `google/gemini-3-flash-preview` (snel en goedkoop)
- SSE streaming voor realtime antwoorden
- System prompt bevat context over wagenpark-management in het Nederlands

**PWA**
- `vite-plugin-pwa` met workbox voor service worker
- `navigateFallbackDenylist: [/^\/~oauth/]` voor OAuth compatibiliteit
- Manifest met FleetFlow branding

### Volgorde van implementatie
1. Kostenberekening pagina (geen backend-wijzigingen nodig)
2. AI-assistent (edge function + UI widget)
3. PWA configuratie (build tooling)

