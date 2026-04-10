

## Plan: Marketing/Pricing loskoppelen van de applicatie

### Probleem
De pricing-pagina en publieke boekingspagina delen nu dezelfde React-app en routing als de medewerker- en klantkant. Dit moet een volledig losstaande ervaring worden.

### Aanpak

**1. Nieuw marketing-layout component maken**
- `src/components/MarketingLayout.tsx` — bevat eigen header (logo, navigatie naar Home, Prijzen, Inloggen) en footer
- Consistent design, maar volledig los van `AppLayout` en `KlantLayout`

**2. Marketing-pagina's bundelen**
- **Homepage** (`/`): De publieke boekingspagina (`PubliekBoeken`) inbedden in het marketing-layout, met hero-sectie en CTA's naar pricing en registratie
- **Prijzen** (`/prijzen`): Bestaande `Pricing.tsx` refactoren om `MarketingLayout` te gebruiken (eigen header/footer uit Pricing verwijderen)
- Optioneel later uitbreidbaar met bijv. `/over-ons`, `/contact`

**3. Routing aanpassen in `App.tsx`**
- Publieke routes (`/`, `/prijzen`, `/boeken`) wrappen in `MarketingLayout`
- Auth-routes (`/auth`, `/klant-login`) blijven standalone
- Staff-routes (`/dashboard`, etc.) blijven in `AppLayout`
- Klantportaal (`/portaal/*`) blijft in `KlantLayout`

**4. Navigatie in MarketingLayout**
- Links: Home, Prijzen, Voertuigen bekijken
- Rechts: "Inloggen" (klant) en "Medewerker login" knoppen
- Geen verwijzingen naar interne dashboards of portaal-functies

### Bestanden
| Actie | Bestand |
|-------|---------|
| Nieuw | `src/components/MarketingLayout.tsx` |
| Wijzig | `src/pages/Pricing.tsx` — header/footer verwijderen, layout via wrapper |
| Wijzig | `src/App.tsx` — publieke routes wrappen in MarketingLayout |

