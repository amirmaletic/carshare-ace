export interface Vehicle {
  id: string;
  kenteken: string;
  merk: string;
  model: string;
  bouwjaar: number;
  brandstof: 'Benzine' | 'Diesel' | 'Elektrisch' | 'Hybride';
  kilometerstand: number;
  status: 'beschikbaar' | 'verhuurd' | 'onderhoud' | 'gereserveerd';
  apkVervaldatum: string;
  verzekeringsVervaldatum: string;
  dagprijs: number;
  categorie: 'Stadsauto' | 'SUV' | 'Bestelwagen' | 'Luxe' | 'Elektrisch';
  kleur: string;
  image?: string;
}

export interface Reservation {
  id: string;
  voertuigId: string;
  klantNaam: string;
  klantEmail: string;
  startDatum: string;
  eindDatum: string;
  status: 'bevestigd' | 'actief' | 'voltooid' | 'geannuleerd';
  totaalPrijs: number;
  extras: string[];
}

export interface MaintenanceRecord {
  id: string;
  voertuigId: string;
  type: 'APK' | 'Onderhoud' | 'Reparatie' | 'Bandenwissel';
  datum: string;
  beschrijving: string;
  kosten: number;
  status: 'gepland' | 'voltooid' | 'in_uitvoering';
}

export const vehicles: Vehicle[] = [
  { id: 'v1', kenteken: 'AB-123-CD', merk: 'Volkswagen', model: 'Golf 8', bouwjaar: 2023, brandstof: 'Benzine', kilometerstand: 15420, status: 'beschikbaar', apkVervaldatum: '2025-11-15', verzekeringsVervaldatum: '2026-01-01', dagprijs: 45, categorie: 'Stadsauto', kleur: 'Zwart' },
  { id: 'v2', kenteken: 'EF-456-GH', merk: 'Tesla', model: 'Model 3', bouwjaar: 2024, brandstof: 'Elektrisch', kilometerstand: 8200, status: 'verhuurd', apkVervaldatum: '2026-03-20', verzekeringsVervaldatum: '2026-06-01', dagprijs: 75, categorie: 'Elektrisch', kleur: 'Wit' },
  { id: 'v3', kenteken: 'IJ-789-KL', merk: 'BMW', model: 'X3', bouwjaar: 2022, brandstof: 'Diesel', kilometerstand: 42000, status: 'onderhoud', apkVervaldatum: '2025-08-10', verzekeringsVervaldatum: '2025-12-15', dagprijs: 65, categorie: 'SUV', kleur: 'Blauw' },
  { id: 'v4', kenteken: 'MN-012-OP', merk: 'Mercedes-Benz', model: 'E-Klasse', bouwjaar: 2023, brandstof: 'Hybride', kilometerstand: 22100, status: 'beschikbaar', apkVervaldatum: '2026-02-28', verzekeringsVervaldatum: '2026-05-01', dagprijs: 95, categorie: 'Luxe', kleur: 'Zilver' },
  { id: 'v5', kenteken: 'QR-345-ST', merk: 'Renault', model: 'Kangoo', bouwjaar: 2021, brandstof: 'Diesel', kilometerstand: 67800, status: 'beschikbaar', apkVervaldatum: '2025-06-30', verzekeringsVervaldatum: '2025-09-01', dagprijs: 40, categorie: 'Bestelwagen', kleur: 'Wit' },
  { id: 'v6', kenteken: 'UV-678-WX', merk: 'Audi', model: 'A4 Avant', bouwjaar: 2023, brandstof: 'Benzine', kilometerstand: 18500, status: 'gereserveerd', apkVervaldatum: '2026-01-15', verzekeringsVervaldatum: '2026-04-01', dagprijs: 60, categorie: 'Luxe', kleur: 'Grijs' },
  { id: 'v7', kenteken: 'YZ-901-AB', merk: 'Toyota', model: 'Yaris', bouwjaar: 2022, brandstof: 'Hybride', kilometerstand: 31200, status: 'beschikbaar', apkVervaldatum: '2025-09-20', verzekeringsVervaldatum: '2025-11-01', dagprijs: 35, categorie: 'Stadsauto', kleur: 'Rood' },
  { id: 'v8', kenteken: 'CD-234-EF', merk: 'Ford', model: 'Transit', bouwjaar: 2020, brandstof: 'Diesel', kilometerstand: 98500, status: 'verhuurd', apkVervaldatum: '2025-05-01', verzekeringsVervaldatum: '2025-08-01', dagprijs: 55, categorie: 'Bestelwagen', kleur: 'Blauw' },
];

export const reservations: Reservation[] = [
  { id: 'r1', voertuigId: 'v2', klantNaam: 'Jan de Vries', klantEmail: 'jan@email.nl', startDatum: '2026-03-01', eindDatum: '2026-03-07', status: 'actief', totaalPrijs: 525, extras: ['GPS', 'Verzekering+'] },
  { id: 'r2', voertuigId: 'v6', klantNaam: 'Maria Jansen', klantEmail: 'maria@email.nl', startDatum: '2026-03-05', eindDatum: '2026-03-10', status: 'bevestigd', totaalPrijs: 300, extras: ['Kinderzitje'] },
  { id: 'r3', voertuigId: 'v8', klantNaam: 'Peter Bakker', klantEmail: 'peter@email.nl', startDatum: '2026-02-25', eindDatum: '2026-03-04', status: 'actief', totaalPrijs: 440, extras: [] },
  { id: 'r4', voertuigId: 'v1', klantNaam: 'Sophie Mulder', klantEmail: 'sophie@email.nl', startDatum: '2026-02-15', eindDatum: '2026-02-20', status: 'voltooid', totaalPrijs: 225, extras: ['GPS'] },
  { id: 'r5', voertuigId: 'v4', klantNaam: 'Thomas van Dijk', klantEmail: 'thomas@email.nl', startDatum: '2026-03-10', eindDatum: '2026-03-15', status: 'bevestigd', totaalPrijs: 475, extras: ['Verzekering+', 'GPS'] },
  { id: 'r6', voertuigId: 'v7', klantNaam: 'Lisa de Boer', klantEmail: 'lisa@email.nl', startDatum: '2026-01-10', eindDatum: '2026-01-15', status: 'voltooid', totaalPrijs: 175, extras: [] },
];

export const maintenanceRecords: MaintenanceRecord[] = [
  { id: 'm1', voertuigId: 'v3', type: 'Onderhoud', datum: '2026-03-02', beschrijving: 'Grote beurt + remblokken', kosten: 650, status: 'in_uitvoering' },
  { id: 'm2', voertuigId: 'v5', type: 'APK', datum: '2026-06-25', beschrijving: 'Jaarlijkse APK keuring', kosten: 85, status: 'gepland' },
  { id: 'm3', voertuigId: 'v1', type: 'Bandenwissel', datum: '2026-04-01', beschrijving: 'Winterbanden → zomerbanden', kosten: 120, status: 'gepland' },
  { id: 'm4', voertuigId: 'v8', type: 'Reparatie', datum: '2026-02-20', beschrijving: 'Distributieriem vervangen', kosten: 890, status: 'voltooid' },
];

export function getVehicleById(id: string) {
  return vehicles.find(v => v.id === id);
}

export function getStatusColor(status: Vehicle['status']) {
  switch (status) {
    case 'beschikbaar': return 'success';
    case 'verhuurd': return 'info';
    case 'onderhoud': return 'warning';
    case 'gereserveerd': return 'primary';
    default: return 'muted';
  }
}

export function getReservationStatusColor(status: Reservation['status']) {
  switch (status) {
    case 'actief': return 'success';
    case 'bevestigd': return 'info';
    case 'voltooid': return 'muted';
    case 'geannuleerd': return 'destructive';
    default: return 'muted';
  }
}
