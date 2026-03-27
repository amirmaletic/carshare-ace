

## Mobiele responsive aanpassingen

Het probleem is duidelijk zichtbaar: de sidebar neemt op mobiel (390px) bijna het hele scherm in beslag, waardoor de content onbruikbaar wordt.

### Aanpak

**1. Sidebar omzetten naar mobiel-vriendelijk menu**
- Op mobiel (`< 768px`): sidebar verbergen, hamburger-menu icon tonen in een sticky header
- Klikken op hamburger opent de sidebar als een `Sheet` (slide-in overlay van links)
- Na navigatie-klik sluit de sheet automatisch
- Op desktop: huidige sidebar-gedrag behouden

**2. AppLayout aanpassen**
- Mobiele header toevoegen met Waggie logo + hamburger-knop (alleen zichtbaar op `< md`)
- Content padding verkleinen op mobiel (`p-4` i.p.v. `p-6`)

**3. Dashboard responsive fixes**
- StatCards grid: `grid-cols-2` op mobiel i.p.v. `grid-cols-1` (compacter)
- Grafieken sectie: volledige breedte op mobiel
- Tabellen/lijsten: horizontale scroll waar nodig

**4. Overige pagina's**
- Voertuigen: kaarten al `grid-cols-1` op mobiel (OK), maar header-knoppen stacken verticaal
- Terugmelden/Contracten: formulieren en tabellen responsive controleren
- Padding en font-sizes op kleine schermen aanpassen

### Bestanden die wijzigen

| Bestand | Wijziging |
|---|---|
| `src/components/AppSidebar.tsx` | Accepteert `onClose` prop, mobiele Sheet-wrapper |
| `src/components/AppLayout.tsx` | Mobiele header met hamburger, `useIsMobile()` check |
| `src/pages/Dashboard.tsx` | Grid breakpoints en padding finetunen |
| `src/pages/Vehicles.tsx` | Knoppen en filters stapelen op mobiel |

