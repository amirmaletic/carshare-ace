import volkswagenGolf from '@/assets/vehicles/volkswagen-golf.png';
import volkswagenPolo from '@/assets/vehicles/volkswagen-polo.png';
import volkswagenTiguan from '@/assets/vehicles/volkswagen-tiguan.png';
import volkswagenTransporter from '@/assets/vehicles/volkswagen-transporter.png';
import volkswagenId4 from '@/assets/vehicles/volkswagen-id4.png';
import volkswagenPassat from '@/assets/vehicles/volkswagen-passat.png';
import volkswagenTroc from '@/assets/vehicles/volkswagen-troc.png';
import volkswagenArteon from '@/assets/vehicles/volkswagen-arteon.png';
import volkswagenCaddy from '@/assets/vehicles/volkswagen-caddy.png';
import volkswagenId3 from '@/assets/vehicles/volkswagen-id3.png';
import volkswagenTouareg from '@/assets/vehicles/volkswagen-touareg.png';
import audiA1 from '@/assets/vehicles/audi-a1.png';
import audiA3 from '@/assets/vehicles/audi-a3.png';
import audiA4 from '@/assets/vehicles/audi-a4.png';
import audiA6 from '@/assets/vehicles/audi-a6.png';
import audiQ3 from '@/assets/vehicles/audi-q3.png';
import audiQ5 from '@/assets/vehicles/audi-q5.png';
import audiQ7 from '@/assets/vehicles/audi-q7.png';
import audiEtron from '@/assets/vehicles/audi-etron.png';
import skodaFabia from '@/assets/vehicles/skoda-fabia.png';
import skodaOctavia from '@/assets/vehicles/skoda-octavia.png';
import skodaSuperb from '@/assets/vehicles/skoda-superb.png';
import skodaKodiaq from '@/assets/vehicles/skoda-kodiaq.png';
import skodaEnyaq from '@/assets/vehicles/skoda-enyaq.png';
import seatIbiza from '@/assets/vehicles/seat-ibiza.png';
import seatLeon from '@/assets/vehicles/seat-leon.png';
import seatArona from '@/assets/vehicles/seat-arona.png';
import cupraLeon from '@/assets/vehicles/cupra-leon.png';
import cupraFormentor from '@/assets/vehicles/cupra-formentor.png';
import cupraBorn from '@/assets/vehicles/cupra-born.png';
import porsche911 from '@/assets/vehicles/porsche-911.png';
import porscheCayenne from '@/assets/vehicles/porsche-cayenne.png';
import porscheMacan from '@/assets/vehicles/porsche-macan.png';
import porschePanamera from '@/assets/vehicles/porsche-panamera.png';
import porscheTaycan from '@/assets/vehicles/porsche-taycan.png';

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

export type ContractType = 'lease' | 'verhuur' | 'fietslease' | 'ev-lease';
export type ContractStatus = 'actief' | 'verlopen' | 'opgezegd' | 'concept';

export interface Contract {
  id: string;
  contractNummer: string;
  type: ContractType;
  voertuigId: string | null;
  klantNaam: string;
  klantEmail: string;
  bedrijf?: string;
  startDatum: string;
  eindDatum: string;
  maandprijs: number;
  status: ContractStatus;
  kmPerJaar?: number;
  inclusief: string[];
  facturen: Invoice[];
  notities?: string;
}

export interface Invoice {
  id: string;
  datum: string;
  bedrag: number;
  status: 'betaald' | 'openstaand' | 'te_laat' | 'herinnering_verstuurd';
}

const vehicleImageMap: Record<string, string> = {
  'volkswagen-golf': volkswagenGolf,
  'volkswagen-polo': volkswagenPolo,
  'volkswagen-tiguan': volkswagenTiguan,
  'volkswagen-t-roc': volkswagenTroc,
  'volkswagen-transporter': volkswagenTransporter,
  'volkswagen-caddy': volkswagenCaddy,
  'volkswagen-id.4': volkswagenId4,
  'volkswagen-id.3': volkswagenId3,
  'volkswagen-passat': volkswagenPassat,
  'volkswagen-arteon': volkswagenArteon,
  'volkswagen-touareg': volkswagenTouareg,
  'audi-a1': audiA1,
  'audi-a3': audiA3,
  'audi-a4': audiA4,
  'audi-a6': audiA6,
  'audi-q3': audiQ3,
  'audi-q5': audiQ5,
  'audi-q7': audiQ7,
  'audi-e-tron': audiEtron,
  'škoda-fabia': skodaFabia,
  'škoda-octavia': skodaOctavia,
  'škoda-superb': skodaSuperb,
  'škoda-kodiaq': skodaKodiaq,
  'škoda-enyaq': skodaEnyaq,
  'seat-ibiza': seatIbiza,
  'seat-leon': seatLeon,
  'seat-arona': seatArona,
  'cupra-leon': cupraLeon,
  'cupra-formentor': cupraFormentor,
  'cupra-born': cupraBorn,
  'porsche-911': porsche911,
  'porsche-cayenne': porscheCayenne,
  'porsche-macan': porscheMacan,
  'porsche-panamera': porschePanamera,
  'porsche-taycan': porscheTaycan,
};

export function getVehicleImageUrl(merk: string, model: string): string {
  const key = `${merk.toLowerCase()}-${model.split(' ')[0].toLowerCase()}`;
  return vehicleImageMap[key] || '';
}

export const vehicles: Vehicle[] = [
  // Volkswagen (11 modellen)
  { id: 'v1', kenteken: 'AB-123-CD', merk: 'Volkswagen', model: 'Golf 8', bouwjaar: 2023, brandstof: 'Benzine', kilometerstand: 15420, status: 'beschikbaar', apkVervaldatum: '2025-11-15', verzekeringsVervaldatum: '2026-01-01', dagprijs: 45, categorie: 'Stadsauto', kleur: 'Zwart' },
  { id: 'v2', kenteken: 'EF-456-GH', merk: 'Volkswagen', model: 'Polo TSI', bouwjaar: 2022, brandstof: 'Benzine', kilometerstand: 28300, status: 'verhuurd', apkVervaldatum: '2025-09-10', verzekeringsVervaldatum: '2026-02-01', dagprijs: 35, categorie: 'Stadsauto', kleur: 'Wit' },
  { id: 'v3', kenteken: 'IJ-789-KL', merk: 'Volkswagen', model: 'Tiguan R-Line', bouwjaar: 2024, brandstof: 'Hybride', kilometerstand: 5200, status: 'beschikbaar', apkVervaldatum: '2026-08-20', verzekeringsVervaldatum: '2026-12-01', dagprijs: 65, categorie: 'SUV', kleur: 'Grijs' },
  { id: 'v4', kenteken: 'MN-012-OP', merk: 'Volkswagen', model: 'Transporter T6.1', bouwjaar: 2021, brandstof: 'Diesel', kilometerstand: 72400, status: 'verhuurd', apkVervaldatum: '2025-06-30', verzekeringsVervaldatum: '2025-09-01', dagprijs: 55, categorie: 'Bestelwagen', kleur: 'Wit' },
  { id: 'v5', kenteken: 'QR-345-ST', merk: 'Volkswagen', model: 'ID.4 Pro', bouwjaar: 2024, brandstof: 'Elektrisch', kilometerstand: 8100, status: 'beschikbaar', apkVervaldatum: '2026-10-15', verzekeringsVervaldatum: '2027-01-01', dagprijs: 70, categorie: 'Elektrisch', kleur: 'Blauw' },
  { id: 'v6', kenteken: 'UV-678-WX', merk: 'Volkswagen', model: 'Passat Variant', bouwjaar: 2023, brandstof: 'Diesel', kilometerstand: 34600, status: 'onderhoud', apkVervaldatum: '2026-03-20', verzekeringsVervaldatum: '2026-06-01', dagprijs: 55, categorie: 'Luxe', kleur: 'Blauw' },
  { id: 'v18', kenteken: 'QR-111-ST', merk: 'Volkswagen', model: 'T-Roc Style', bouwjaar: 2023, brandstof: 'Benzine', kilometerstand: 12800, status: 'beschikbaar', apkVervaldatum: '2026-06-10', verzekeringsVervaldatum: '2026-09-01', dagprijs: 50, categorie: 'SUV', kleur: 'Oranje' },
  { id: 'v19', kenteken: 'UV-222-WX', merk: 'Volkswagen', model: 'Arteon Shooting Brake', bouwjaar: 2023, brandstof: 'Benzine', kilometerstand: 21300, status: 'gereserveerd', apkVervaldatum: '2026-04-15', verzekeringsVervaldatum: '2026-07-01', dagprijs: 70, categorie: 'Luxe', kleur: 'Grijs' },
  { id: 'v20', kenteken: 'YZ-333-AB', merk: 'Volkswagen', model: 'Caddy Cargo', bouwjaar: 2022, brandstof: 'Diesel', kilometerstand: 54200, status: 'beschikbaar', apkVervaldatum: '2025-08-20', verzekeringsVervaldatum: '2025-11-01', dagprijs: 40, categorie: 'Bestelwagen', kleur: 'Wit' },
  { id: 'v21', kenteken: 'CD-444-EF', merk: 'Volkswagen', model: 'ID.3 Pro S', bouwjaar: 2024, brandstof: 'Elektrisch', kilometerstand: 4500, status: 'beschikbaar', apkVervaldatum: '2026-12-01', verzekeringsVervaldatum: '2027-03-01', dagprijs: 55, categorie: 'Elektrisch', kleur: 'Wit' },
  { id: 'v22', kenteken: 'GH-555-IJ', merk: 'Volkswagen', model: 'Touareg R', bouwjaar: 2023, brandstof: 'Hybride', kilometerstand: 18700, status: 'verhuurd', apkVervaldatum: '2026-05-20', verzekeringsVervaldatum: '2026-08-01', dagprijs: 110, categorie: 'Luxe', kleur: 'Zwart' },
  // Audi (7 modellen)
  { id: 'v23', kenteken: 'KL-666-MN', merk: 'Audi', model: 'A1 Sportback', bouwjaar: 2022, brandstof: 'Benzine', kilometerstand: 32100, status: 'beschikbaar', apkVervaldatum: '2025-11-05', verzekeringsVervaldatum: '2026-02-01', dagprijs: 40, categorie: 'Stadsauto', kleur: 'Geel' },
  { id: 'v7', kenteken: 'YZ-901-AB', merk: 'Audi', model: 'A3 Sportback', bouwjaar: 2023, brandstof: 'Benzine', kilometerstand: 19800, status: 'beschikbaar', apkVervaldatum: '2026-01-15', verzekeringsVervaldatum: '2026-04-01', dagprijs: 55, categorie: 'Stadsauto', kleur: 'Rood' },
  { id: 'v8', kenteken: 'CD-234-EF', merk: 'Audi', model: 'A4 Avant', bouwjaar: 2023, brandstof: 'Benzine', kilometerstand: 18500, status: 'gereserveerd', apkVervaldatum: '2026-01-15', verzekeringsVervaldatum: '2026-04-01', dagprijs: 60, categorie: 'Luxe', kleur: 'Grijs' },
  { id: 'v24', kenteken: 'OP-777-QR', merk: 'Audi', model: 'A6 Avant', bouwjaar: 2024, brandstof: 'Hybride', kilometerstand: 8900, status: 'beschikbaar', apkVervaldatum: '2026-09-15', verzekeringsVervaldatum: '2026-12-01', dagprijs: 80, categorie: 'Luxe', kleur: 'Blauw' },
  { id: 'v25', kenteken: 'ST-888-UV', merk: 'Audi', model: 'Q3 Sportback', bouwjaar: 2023, brandstof: 'Benzine', kilometerstand: 24600, status: 'verhuurd', apkVervaldatum: '2026-03-10', verzekeringsVervaldatum: '2026-06-01', dagprijs: 55, categorie: 'SUV', kleur: 'Wit' },
  { id: 'v9', kenteken: 'GH-567-IJ', merk: 'Audi', model: 'Q5 Sportback', bouwjaar: 2024, brandstof: 'Hybride', kilometerstand: 4300, status: 'beschikbaar', apkVervaldatum: '2026-11-20', verzekeringsVervaldatum: '2027-02-01', dagprijs: 85, categorie: 'SUV', kleur: 'Zwart' },
  { id: 'v26', kenteken: 'WX-999-YZ', merk: 'Audi', model: 'Q7 S line', bouwjaar: 2023, brandstof: 'Diesel', kilometerstand: 28400, status: 'beschikbaar', apkVervaldatum: '2026-02-15', verzekeringsVervaldatum: '2026-05-01', dagprijs: 100, categorie: 'SUV', kleur: 'Zilver' },
  { id: 'v10', kenteken: 'KL-890-MN', merk: 'Audi', model: 'e-tron GT', bouwjaar: 2024, brandstof: 'Elektrisch', kilometerstand: 6700, status: 'verhuurd', apkVervaldatum: '2026-09-10', verzekeringsVervaldatum: '2026-12-01', dagprijs: 120, categorie: 'Elektrisch', kleur: 'Zilver' },
  // Škoda (5 modellen)
  { id: 'v27', kenteken: 'AB-100-CD', merk: 'Škoda', model: 'Fabia Monte Carlo', bouwjaar: 2023, brandstof: 'Benzine', kilometerstand: 18200, status: 'beschikbaar', apkVervaldatum: '2026-03-25', verzekeringsVervaldatum: '2026-06-01', dagprijs: 32, categorie: 'Stadsauto', kleur: 'Rood' },
  { id: 'v11', kenteken: 'OP-123-QR', merk: 'Škoda', model: 'Octavia Combi', bouwjaar: 2022, brandstof: 'Benzine', kilometerstand: 41200, status: 'beschikbaar', apkVervaldatum: '2025-10-05', verzekeringsVervaldatum: '2026-01-01', dagprijs: 40, categorie: 'Stadsauto', kleur: 'Zilver' },
  { id: 'v28', kenteken: 'EF-200-GH', merk: 'Škoda', model: 'Superb Combi', bouwjaar: 2024, brandstof: 'Hybride', kilometerstand: 5400, status: 'gereserveerd', apkVervaldatum: '2026-10-20', verzekeringsVervaldatum: '2027-01-01', dagprijs: 55, categorie: 'Luxe', kleur: 'Blauw' },
  { id: 'v12', kenteken: 'ST-456-UV', merk: 'Škoda', model: 'Kodiaq RS', bouwjaar: 2023, brandstof: 'Diesel', kilometerstand: 22500, status: 'gereserveerd', apkVervaldatum: '2026-04-15', verzekeringsVervaldatum: '2026-07-01', dagprijs: 60, categorie: 'SUV', kleur: 'Groen' },
  { id: 'v29', kenteken: 'IJ-300-KL', merk: 'Škoda', model: 'Enyaq iV 80', bouwjaar: 2024, brandstof: 'Elektrisch', kilometerstand: 7100, status: 'beschikbaar', apkVervaldatum: '2026-11-15', verzekeringsVervaldatum: '2027-02-01', dagprijs: 60, categorie: 'Elektrisch', kleur: 'Grijs' },
  // SEAT (3 modellen)
  { id: 'v30', kenteken: 'MN-400-OP', merk: 'SEAT', model: 'Ibiza FR', bouwjaar: 2022, brandstof: 'Benzine', kilometerstand: 29800, status: 'beschikbaar', apkVervaldatum: '2025-10-15', verzekeringsVervaldatum: '2026-01-01', dagprijs: 30, categorie: 'Stadsauto', kleur: 'Wit' },
  { id: 'v13', kenteken: 'WX-789-YZ', merk: 'SEAT', model: 'Leon FR', bouwjaar: 2022, brandstof: 'Benzine', kilometerstand: 35800, status: 'beschikbaar', apkVervaldatum: '2025-12-20', verzekeringsVervaldatum: '2026-03-01', dagprijs: 42, categorie: 'Stadsauto', kleur: 'Blauw' },
  { id: 'v31', kenteken: 'QR-500-ST', merk: 'SEAT', model: 'Arona Xperience', bouwjaar: 2023, brandstof: 'Benzine', kilometerstand: 16400, status: 'verhuurd', apkVervaldatum: '2026-05-10', verzekeringsVervaldatum: '2026-08-01', dagprijs: 38, categorie: 'SUV', kleur: 'Oranje' },
  // CUPRA (3 modellen)
  { id: 'v32', kenteken: 'UV-600-WX', merk: 'CUPRA', model: 'Leon VZ', bouwjaar: 2024, brandstof: 'Hybride', kilometerstand: 6200, status: 'beschikbaar', apkVervaldatum: '2026-12-15', verzekeringsVervaldatum: '2027-03-01', dagprijs: 65, categorie: 'Stadsauto', kleur: 'Grijs' },
  { id: 'v14', kenteken: 'AB-012-CD', merk: 'CUPRA', model: 'Formentor VZ', bouwjaar: 2024, brandstof: 'Hybride', kilometerstand: 3200, status: 'beschikbaar', apkVervaldatum: '2026-12-01', verzekeringsVervaldatum: '2027-03-01', dagprijs: 75, categorie: 'SUV', kleur: 'Koper' },
  { id: 'v15', kenteken: 'EF-345-GH', merk: 'CUPRA', model: 'Born 58 kWh', bouwjaar: 2024, brandstof: 'Elektrisch', kilometerstand: 5600, status: 'verhuurd', apkVervaldatum: '2026-11-10', verzekeringsVervaldatum: '2027-02-01', dagprijs: 55, categorie: 'Elektrisch', kleur: 'Wit' },
  // Porsche (5 modellen)
  { id: 'v33', kenteken: 'YZ-700-AB', merk: 'Porsche', model: '911 Carrera S', bouwjaar: 2023, brandstof: 'Benzine', kilometerstand: 9800, status: 'beschikbaar', apkVervaldatum: '2026-07-20', verzekeringsVervaldatum: '2026-10-01', dagprijs: 250, categorie: 'Luxe', kleur: 'Rood' },
  { id: 'v16', kenteken: 'IJ-678-KL', merk: 'Porsche', model: 'Cayenne S', bouwjaar: 2023, brandstof: 'Hybride', kilometerstand: 14200, status: 'beschikbaar', apkVervaldatum: '2026-05-15', verzekeringsVervaldatum: '2026-08-01', dagprijs: 150, categorie: 'Luxe', kleur: 'Zwart' },
  { id: 'v34', kenteken: 'CD-800-EF', merk: 'Porsche', model: 'Macan S', bouwjaar: 2024, brandstof: 'Benzine', kilometerstand: 3900, status: 'gereserveerd', apkVervaldatum: '2026-11-25', verzekeringsVervaldatum: '2027-02-01', dagprijs: 130, categorie: 'SUV', kleur: 'Blauw' },
  { id: 'v35', kenteken: 'GH-900-IJ', merk: 'Porsche', model: 'Panamera 4', bouwjaar: 2023, brandstof: 'Hybride', kilometerstand: 17500, status: 'verhuurd', apkVervaldatum: '2026-06-10', verzekeringsVervaldatum: '2026-09-01', dagprijs: 180, categorie: 'Luxe', kleur: 'Wit' },
  { id: 'v17', kenteken: 'MN-901-OP', merk: 'Porsche', model: 'Taycan 4S', bouwjaar: 2024, brandstof: 'Elektrisch', kilometerstand: 7800, status: 'gereserveerd', apkVervaldatum: '2026-10-20', verzekeringsVervaldatum: '2027-01-01', dagprijs: 175, categorie: 'Elektrisch', kleur: 'Wit' },
];
export function getMaintenanceForVehicle(vehicleId: string): MaintenanceRecord[] {
  return maintenanceRecords.filter(m => m.voertuigId === vehicleId);
}

export function getReservationsForVehicle(vehicleId: string): Reservation[] {
  return reservations.filter(r => r.voertuigId === vehicleId);
}

export const reservations: Reservation[] = [
  { id: 'r1', voertuigId: 'v2', klantNaam: 'Jan de Vries', klantEmail: 'jan@email.nl', startDatum: '2026-03-01', eindDatum: '2026-03-07', status: 'actief', totaalPrijs: 245, extras: ['GPS', 'Verzekering+'] },
  { id: 'r2', voertuigId: 'v8', klantNaam: 'Maria Jansen', klantEmail: 'maria@email.nl', startDatum: '2026-03-05', eindDatum: '2026-03-10', status: 'bevestigd', totaalPrijs: 300, extras: ['Kinderzitje'] },
  { id: 'r3', voertuigId: 'v4', klantNaam: 'Peter Bakker', klantEmail: 'peter@email.nl', startDatum: '2026-02-25', eindDatum: '2026-03-04', status: 'actief', totaalPrijs: 440, extras: [] },
  { id: 'r4', voertuigId: 'v1', klantNaam: 'Sophie Mulder', klantEmail: 'sophie@email.nl', startDatum: '2026-02-15', eindDatum: '2026-02-20', status: 'voltooid', totaalPrijs: 225, extras: ['GPS'] },
  { id: 'r5', voertuigId: 'v10', klantNaam: 'Thomas van Dijk', klantEmail: 'thomas@email.nl', startDatum: '2026-03-10', eindDatum: '2026-03-15', status: 'bevestigd', totaalPrijs: 600, extras: ['Verzekering+', 'GPS'] },
  { id: 'r6', voertuigId: 'v15', klantNaam: 'Lisa de Boer', klantEmail: 'lisa@email.nl', startDatum: '2026-01-10', eindDatum: '2026-01-15', status: 'voltooid', totaalPrijs: 275, extras: [] },
  { id: 'r7', voertuigId: 'v17', klantNaam: 'Henk Smit', klantEmail: 'henk@email.nl', startDatum: '2026-03-15', eindDatum: '2026-03-20', status: 'bevestigd', totaalPrijs: 875, extras: ['Verzekering+'] },
  { id: 'r8', voertuigId: 'v12', klantNaam: 'Anna Dekker', klantEmail: 'anna@email.nl', startDatum: '2026-03-08', eindDatum: '2026-03-12', status: 'bevestigd', totaalPrijs: 240, extras: ['GPS'] },
];

export const maintenanceRecords: MaintenanceRecord[] = [
  { id: 'm1', voertuigId: 'v6', type: 'Onderhoud', datum: '2026-03-02', beschrijving: 'Grote beurt + remblokken', kosten: 650, status: 'in_uitvoering' },
  { id: 'm2', voertuigId: 'v11', type: 'APK', datum: '2026-06-25', beschrijving: 'Jaarlijkse APK keuring', kosten: 85, status: 'gepland' },
  { id: 'm3', voertuigId: 'v1', type: 'Bandenwissel', datum: '2026-04-01', beschrijving: 'Winterbanden → zomerbanden', kosten: 120, status: 'gepland' },
  { id: 'm4', voertuigId: 'v4', type: 'Reparatie', datum: '2026-02-20', beschrijving: 'Distributieriem vervangen', kosten: 890, status: 'voltooid' },
  { id: 'm5', voertuigId: 'v9', type: 'Onderhoud', datum: '2026-05-15', beschrijving: 'Kleine beurt + olie verversen', kosten: 280, status: 'gepland' },
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

export function getContractStatusColor(status: ContractStatus) {
  switch (status) {
    case 'actief': return 'success' as const;
    case 'verlopen': return 'destructive' as const;
    case 'opgezegd': return 'warning' as const;
    case 'concept': return 'muted' as const;
    default: return 'muted' as const;
  }
}

export function getContractTypeLabel(type: ContractType): string {
  switch (type) {
    case 'lease': return 'Autolease';
    case 'verhuur': return 'Verhuur';
    case 'fietslease': return 'Fietslease';
    case 'ev-lease': return 'EV Lease';
  }
}

export function getContractTypeIcon(type: ContractType): string {
  switch (type) {
    case 'lease': return '🚗';
    case 'verhuur': return '📋';
    case 'fietslease': return '🚲';
    case 'ev-lease': return '⚡';
  }
}

export function getInvoiceStatusColor(status: Invoice['status']) {
  switch (status) {
    case 'betaald': return 'success' as const;
    case 'openstaand': return 'info' as const;
    case 'te_laat': return 'destructive' as const;
    case 'herinnering_verstuurd': return 'warning' as const;
    default: return 'muted' as const;
  }
}

const invoicesBedrijfA: Invoice[] = [
  { id: 'f1', datum: '2026-01-01', bedrag: 850, status: 'betaald' },
  { id: 'f2', datum: '2026-02-01', bedrag: 850, status: 'betaald' },
  { id: 'f3', datum: '2026-03-01', bedrag: 850, status: 'openstaand' },
];

const invoicesJan: Invoice[] = [
  { id: 'f4', datum: '2025-12-01', bedrag: 395, status: 'betaald' },
  { id: 'f5', datum: '2026-01-01', bedrag: 395, status: 'betaald' },
  { id: 'f6', datum: '2026-02-01', bedrag: 395, status: 'te_laat' },
  { id: 'f7', datum: '2026-03-01', bedrag: 395, status: 'herinnering_verstuurd' },
];

const invoicesFiets: Invoice[] = [
  { id: 'f8', datum: '2026-01-01', bedrag: 75, status: 'betaald' },
  { id: 'f9', datum: '2026-02-01', bedrag: 75, status: 'betaald' },
  { id: 'f10', datum: '2026-03-01', bedrag: 75, status: 'betaald' },
];

const invoicesEV: Invoice[] = [
  { id: 'f11', datum: '2026-01-01', bedrag: 695, status: 'betaald' },
  { id: 'f12', datum: '2026-02-01', bedrag: 695, status: 'betaald' },
  { id: 'f13', datum: '2026-03-01', bedrag: 695, status: 'openstaand' },
];

export const contracts: Contract[] = [
  {
    id: 'c1', contractNummer: 'LC-2025-001', type: 'lease', voertuigId: 'v4',
    klantNaam: 'Bedrijf Van Dam B.V.', klantEmail: 'fleet@vandam.nl', bedrijf: 'Van Dam B.V.',
    startDatum: '2025-06-01', eindDatum: '2029-05-31', maandprijs: 850, status: 'actief',
    kmPerJaar: 30000, inclusief: ['Onderhoud', 'Verzekering', 'Pechhulp', 'Winterbanden'],
    facturen: invoicesBedrijfA,
  },
  {
    id: 'c2', contractNummer: 'LC-2025-002', type: 'lease', voertuigId: 'v6',
    klantNaam: 'Jan Pietersen', klantEmail: 'jan.p@email.nl',
    startDatum: '2025-09-01', eindDatum: '2028-08-31', maandprijs: 395, status: 'actief',
    kmPerJaar: 20000, inclusief: ['Onderhoud', 'Banden'],
    facturen: invoicesJan,
    notities: 'Betalingsherinnering verstuurd op 15-02-2026',
  },
  {
    id: 'c3', contractNummer: 'FC-2026-001', type: 'fietslease', voertuigId: null,
    klantNaam: 'Emma de Groot', klantEmail: 'emma@email.nl', bedrijf: 'TechStart B.V.',
    startDatum: '2026-01-15', eindDatum: '2029-01-14', maandprijs: 75, status: 'actief',
    inclusief: ['Verzekering', 'Onderhoud', 'Pechhulp'],
    facturen: invoicesFiets,
    notities: 'VanMoof S5 — fietslease via werkgever',
  },
  {
    id: 'c4', contractNummer: 'EV-2026-001', type: 'ev-lease', voertuigId: 'v5',
    klantNaam: 'Groen Transport B.V.', klantEmail: 'lease@groentransport.nl', bedrijf: 'Groen Transport B.V.',
    startDatum: '2026-02-01', eindDatum: '2030-01-31', maandprijs: 695, status: 'actief',
    kmPerJaar: 25000, inclusief: ['Onderhoud', 'Verzekering', 'Laadpas', 'Pechhulp'],
    facturen: invoicesEV,
  },
  {
    id: 'c5', contractNummer: 'LC-2023-015', type: 'lease', voertuigId: 'v7',
    klantNaam: 'Klaas Bakker', klantEmail: 'klaas@email.nl',
    startDatum: '2023-03-01', eindDatum: '2026-02-28', maandprijs: 310, status: 'verlopen',
    kmPerJaar: 15000, inclusief: ['Onderhoud'],
    facturen: [],
  },
  {
    id: 'c6', contractNummer: 'VC-2026-010', type: 'verhuur', voertuigId: 'v8',
    klantNaam: 'Bouwbedrijf Jansen', klantEmail: 'info@jansen-bouw.nl', bedrijf: 'Jansen Bouw B.V.',
    startDatum: '2026-02-01', eindDatum: '2026-08-31', maandprijs: 1200, status: 'actief',
    inclusief: ['Verzekering', 'Pechhulp'],
    facturen: [
      { id: 'f14', datum: '2026-02-01', bedrag: 1200, status: 'betaald' },
      { id: 'f15', datum: '2026-03-01', bedrag: 1200, status: 'openstaand' },
    ],
  },
  {
    id: 'c7', contractNummer: 'FC-2026-002', type: 'fietslease', voertuigId: null,
    klantNaam: 'Mark Visser', klantEmail: 'mark@email.nl', bedrijf: 'DesignHub',
    startDatum: '2026-03-01', eindDatum: '2029-02-28', maandprijs: 89, status: 'concept',
    inclusief: ['Verzekering', 'Onderhoud'],
    facturen: [],
    notities: 'Gazelle Ultimate C8 — wacht op goedkeuring werkgever',
  },
];
