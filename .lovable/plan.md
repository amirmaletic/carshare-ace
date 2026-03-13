

## Plan: Volledig Redesign — Minimalistisch & Clean met Blauw/Wit

Transformatie van het huidige donkere automotive-thema naar een licht, minimalistisch design geïnspireerd door Linear en Notion.

---

### 1. Kleurenpalet & Typografie (`src/index.css`)

**Nieuw kleurenschema:**
- **Light mode**: Wit (#FFFFFF) achtergrond, lichtgrijs (#F8FAFC) voor kaarten, blauw (#2563EB) als primary
- **Dark mode**: Donkergrijs (#0F172A) achtergrond, iets lichter voor kaarten, blauw blijft primary
- Sidebar: Wit met lichtgrijze border (geen donkere gradient meer)
- Verwijder `glass-card`, `stat-glow`, `sidebar-gradient` utilities — vervang door subtiele schaduwen

**Typografie**: Vervang Space Grotesk door Inter voor alles (één consistent lettertype, clean look)

---

### 2. Sidebar (`src/components/AppSidebar.tsx`)

- Witte/lichte achtergrond met subtiele border rechts
- Blauw actief-item highlight (lichtblauw bg + donkerblauw tekst)
- Grijs iconen en tekst voor inactieve items
- Verwijder sidebar-gradient class
- Logo: blauw icoon op witte achtergrond

---

### 3. StatCard (`src/components/StatCard.tsx`)

- Witte kaart met 1px border en subtiele schaduw
- Verwijder `glass-card` en `stat-glow`
- Trend badge: lichtgroen/lichtrood met subtiele styling
- Cleaner spacing

---

### 4. StatusBadge (`src/components/StatusBadge.tsx`)

- Subtielere kleuren: lichtere achtergronden, minder saturatie
- Pill-shaped met dunnere border

---

### 5. Dashboard (`src/pages/Dashboard.tsx`)

- Vervang `glass-card` door `bg-white border rounded-xl shadow-sm`
- Grafiek kleuren aanpassen naar blauw-tinten
- Meldingen-kaarten: subtielere achtergrondkleuren

---

### 6. Alle pagina's (Vehicles, Contracts, Reservations, Maintenance, Reports, Kosten, Settings)

- Vervang alle `glass-card` classes door clean witte kaarten
- Consistent border-radius en spacing
- Buttons: solid blue primary, outline voor secondary

---

### 7. AI-assistent (`src/components/AiAssistant.tsx`)

- Blauwe floating button ipv amber
- Chat panel: wit met lichtgrijze message bubbles
- Cleaner header styling

---

### 8. Tailwind config (`tailwind.config.ts`)

- Verwijder `fontFamily.display` (alles wordt Inter)
- Update animaties behouden maar vereenvoudigen

---

### Bestanden die wijzigen:

| Bestand | Wijziging |
|---------|-----------|
| `src/index.css` | Volledig nieuw kleurenpalet, verwijder glass/glow utilities |
| `tailwind.config.ts` | Verwijder display font, update kleurreferenties |
| `src/components/AppSidebar.tsx` | Lichte sidebar styling |
| `src/components/StatCard.tsx` | Clean witte kaart |
| `src/components/StatusBadge.tsx` | Subtielere kleuren |
| `src/components/AiAssistant.tsx` | Blauw thema |
| `src/components/AppLayout.tsx` | Geen wijzigingen nodig |
| `src/pages/Dashboard.tsx` | Vervang glass-card, blauwe grafieken |
| `src/pages/Vehicles.tsx` | Clean card styling |
| `src/pages/Contracts.tsx` | Clean card styling |
| `src/pages/Reservations.tsx` | Clean card styling |
| `src/pages/Maintenance.tsx` | Clean card styling |
| `src/pages/Reports.tsx` | Clean card styling |
| `src/pages/Kosten.tsx` | Clean card styling |
| `src/pages/SettingsPage.tsx` | Clean card styling |
| `src/pages/Auth.tsx` | Blauw thema login |

Geen database-wijzigingen nodig.

