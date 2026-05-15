## Klantportaal upgrade · plan

Scope: alle `/t/:slug/*` schermen. Aanpak: in één slag, daarna per detail bijschaven indien nodig.

### Doel
Een Clean SaaS klantomgeving (licht, ruim, blauw accent) met een echt dashboard, sterkere boekflow, en self-service voor documenten en lopende huur.

### Huidige situatie
- Layout: `TenantPortaalLayout` met simpele sidebar (Aanbod, Reserveringen, Facturen, Profiel).
- Pagina's zijn lijst-only kaarten zonder filters, zonder detail, zonder acties.
- Geen overzicht, geen documenten-sectie, geen acties op lopende huur.

### Wat we bouwen

**1. Layout opwaarderen**
- Nieuwe `TenantPortaalLayout`: hogere top-bar met breadcrumb + accountmenu, sidebar met groepering (Algemeen / Mijn huur / Account), notificatiebel, sticky footer met support contact uit organisatie.
- Mobile: bottom-tab bar (Home, Boeken, Huur, Documenten, Profiel) i.p.v. hamburger sheet.
- Branding: portaalkleur als accent, fallback naar #3B82F6.

**2. Nieuwe `Home` pagina (`/t/:slug/home`)**
- Welkom met voornaam.
- Hero-card: "Lopende huur" als die er is (voertuig, periode, km-stand, dagen resterend, knoppen: verlengen, schade melden, terugbrengen).
- Quick stats: openstaand bedrag, volgende reservering, status rijbewijs.
- Action cards: Boek voertuig, Upload rijbewijs, Mijn documenten.

**3. Aanbod & boeken (`/t/:slug`)**
- Behoud bestaande `TenantAanbod`, maar nieuwe filterbar (categorie, brandstof, prijsrange, beschikbaarheid op datum).
- Voertuig-detailmodal met carousel, specs, dagprijs en directe "Reserveer" CTA.

**4. Mijn huur (`/t/:slug/reserveringen`)**
- Tabs: Lopend · Komend · Historie.
- Per kaart: voertuigfoto, periode, status badge, totaalprijs.
- Acties per status: Annuleren (komend), Verlengen (lopend), Terugbrengen melden (lopend), Factuur openen (historie).
- Detailpagina `/t/:slug/reserveringen/:id` met timeline (aangevraagd → bevestigd → opgehaald → ingeleverd) en gekoppelde documenten/facturen.

**5. Facturen (`/t/:slug/facturen`)**
- Filter op status (openstaand/betaald), totaal openstaand bovenaan.
- Per factuur: omschrijving, voertuig (indien gekoppeld), bedrag, status, knop "PDF" en "Online betalen" (link naar bestaande Stripe payment link in invoice).

**6. Documenten (`/t/:slug/documenten`)** — nieuw
- Sectie Rijbewijs: status-badge, knop uploaden/vervangen (gebruikt bestaande `rijbewijs_verificaties` flow).
- Sectie Overdrachten: lijst van getekende ophaal/inlever overdrachten met PDF-knop.
- Sectie Schade: lijst eigen schade-rapporten + knop "Schade melden" (formulier met foto-upload, locatie, omschrijving → maakt `schade_rapporten` rij).

**7. Profiel (`/t/:slug/profiel`)**
- Splits in 3 cards: Persoon, Adres, Bedrijf (indien zakelijk). 
- Aparte sectie "Account & beveiliging": email, wachtwoord wijzigen, uitloggen, account verwijderen.
- Notificatie-voorkeuren (email aan/uit per type).

**8. Visueel**
- Clean SaaS: bg `#fafbfc`, cards `#ffffff` met `border-border`, primaire knoppen in portaalkleur, sub-headings in `text-muted-foreground`.
- Consistentie: alle pagina's zelfde page-header pattern (titel + omschrijving + primaire actie rechts).
- Skeleton loaders i.p.v. spinners.
- Empty states met illustratie-iconen + heldere CTA.

### Technisch (kort)
- Nieuwe pagina's: `pages/portaal/Home.tsx`, `Documenten.tsx`, `ReserveringDetail.tsx`, `SchadeMelden.tsx`.
- Nieuwe componenten: `LopendeHuurCard`, `QuickStats`, `RijbewijsStatus`, `BottomTabBar`, `PortaalPageHeader`.
- Routes uitbreiden in `src/App.tsx` voor `/home`, `/documenten`, `/reserveringen/:id`, `/schade-melden`.
- Hooks: `useKlantProfiel`, `useLopendeHuur`, `useKlantDocumenten`, `useRijbewijsStatus`. Allemaal RLS-veilig (filteren via `klanten.auth_user_id = auth.uid()`).
- Geen DB-migraties nodig; alle data is al aanwezig (`reserveringen`, `invoices`, `overdrachten`, `schade_rapporten`, `rijbewijs_verificaties`).
- Bestaande `Mijn*`-pages worden vervangen, oude routes blijven werken.

### Wat er NIET in zit (bewust)
- Branding-uitbreidingen voor whitelabel (apart traject).
- Live chat met verhuurder.
- Documenten ondertekenen anders dan via bestaande overdracht-flow.
