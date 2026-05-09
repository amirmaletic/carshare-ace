# Migratie Hub | super eenvoudige overstap vanuit elk systeem

## Doel
Een nieuwe FleeFlo-klant moet binnen 5 minuten zijn complete wagenpark uit een ander systeem (Excel-export, lease-portal, oud beheersysteem) kunnen overzetten, zonder kennis van kolomnamen of veldformaten.

## Eindplaatje voor de gebruiker

1. Sidebar krijgt nieuw item **Migratie** (alleen zichtbaar voor beheerders).
2. Pagina `/migratie` toont 6 tegels per datatype:
   - Voertuigen, Klanten, Contracten, Chauffeurs, Kilometerhistorie, Schadehistorie
3. Per tegel: drie routes
   - **Snel via kenteken** (alleen voertuigen, bestaande RDW-flow, hergebruikt)
   - **Bestand uploaden** (CSV / Excel / TXT)
   - **Plakken** (tabel uit clipboard)
4. Na upload: AI leest het bestand, herkent kolommen automatisch, toont een preview met groen-vinkjes per kolom-koppeling. Gebruiker kan koppelingen overrulen via dropdown.
5. Validatie-rij per rij met duidelijke fouten, daarna één-klik importeren met progress.
6. "Doe het voor mij" knop: stuurt het bestand naar het support-mailadres met organisatie-context, klant krijgt bevestiging.

## Datatype-dekking (wat kan er per type geïmporteerd worden)

| Type | Verplicht | Optioneel (AI herkent) |
|------|-----------|------------------------|
| Voertuigen | kenteken | merk, model, bouwjaar, brandstof, km-stand, categorie, kleur, dagprijs, locatie, APK datum, verzekering datum, fiscale waarde |
| Klanten | naam OF email | voornaam, achternaam, email, telefoon, adres, postcode, plaats, type (particulier/zakelijk), bedrijfsnaam, KVK, rijbewijsnummer |
| Contracten | klant-email, kenteken, start, eind | type (huur/lease), maandprijs, dagprijs, borg, km/jaar, status |
| Chauffeurs | voornaam, achternaam | email, telefoon, rijbewijs categorie/nummer/verloopdatum, geboortedatum, adres |
| Km-historie | kenteken, datum, kmstand | notitie |
| Schadehistorie | kenteken, datum, omschrijving | ernst, kosten, locatie, hersteld |

Voor voertuigen/klanten: ontbrekende verplichte velden worden via RDW (kenteken) of best-effort split (volledige naam → voornaam/achternaam) aangevuld.

## Hoe slim de AI is

- Edge function `migration-automap` ontvangt: datatype + eerste 5 rijen + headers.
- Vraagt Lovable AI (`google/gemini-2.5-flash`) om JSON: `{ kolom_in_bestand: doel_veld_in_fleeflo | null }`.
- Werkt ongeacht taal van de header (Engels, Duits, Nederlands), ongeacht volgorde, herkent ook varianten ("plate", "registration", "Kenteken", "Nr").
- Detecteert datumformaten (`dd-mm-yyyy`, `yyyy-mm-dd`, Excel-serial).
- Detecteert prijs-formaten (`€ 1.234,56`, `1234.56`).

## Koppelingen tussen types

- Bij contract-import wordt het kenteken opgezocht in de eerder geïmporteerde voertuigen; geen match → rij krijgt warning.
- Bij contract-import wordt klant gematcht op email; geen match → klant wordt automatisch aangemaakt met de email + naam uit het contract-bestand.

## Fouten & duplicaten

- Per type een unieke sleutel (kenteken voor voertuigen, email voor klanten, contract_nummer of kenteken+startdatum voor contracten).
- Bestaande records worden overgeslagen met duidelijke vermelding, optie "ook bijwerken" als checkbox.
- Volledige resultatenlog wordt gelogd in `activiteiten_log`.

## Technische uitwerking

**Nieuwe bestanden**
- `src/pages/Migratie.tsx` | hub-pagina met 6 tegels
- `src/components/migratie/MigratieWizard.tsx` | shared wizard-shell (4 stappen: bron → preview-mapping → valideer → importeer)
- `src/components/migratie/FileDropzone.tsx` | drop voor csv/xlsx/txt + plak-tab
- `src/components/migratie/ColumnMapper.tsx` | tabel met dropdowns per kolom + AI-suggestie chip
- `src/components/migratie/ImportProgress.tsx` | progress + foutenlijst
- `src/hooks/useMigratie.ts` | per-type insert-logica (gebruikt bestaande hooks waar mogelijk)
- `src/lib/migratie-types.ts` | per datatype: doelvelden, validators, normalizers
- `supabase/functions/migration-automap/index.ts` | AI auto-mapping van headers
- Route `/migratie` in `App.tsx` + sidebar item in `AppSidebar.tsx` (achter `PermissionGuard` beheerder)

**Bestaande hergebruik**
- Excel parsing via `xlsx` package (toevoegen)
- Voertuig-import logica uit `VehicleImport.tsx` wordt gerefactored zodat de RDW lookup en duplicate-check herbruikbaar zijn vanuit de hub
- `useVoertuigen`, `useKlanten`, `useContracts`, `useChauffeurs`, `useKilometerRegistraties` hooks voor de inserts

**Dependency**
- `bun add xlsx` voor `.xlsx` parsing in de browser

## Wat valt buiten scope (kunnen later)
- Directe API-koppeling met specifieke fleet-software (Bynco, RentMagic, etc.)
- Foto van papieren lijst via vision-AI
- Onboarding-call-agenda

## Resultaat
Eén plek waar een nieuwe organisatie haar volledige operationele data uit een ander systeem in een paar minuten in FleeFlo zet, met AI die de saaie kolom-mapping voor zijn rekening neemt.
