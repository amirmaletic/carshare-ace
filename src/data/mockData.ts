import volkswagenGolf from '@/assets/vehicles/volkswagen-golf.png';
import teslaModel3 from '@/assets/vehicles/tesla-model3.png';
import bmwX3 from '@/assets/vehicles/bmw-x3.png';
import mercedesEklasse from '@/assets/vehicles/mercedes-eklasse.png';
import renaultKangoo from '@/assets/vehicles/renault-kangoo.png';
import audiA4 from '@/assets/vehicles/audi-a4.png';
import toyotaYaris from '@/assets/vehicles/toyota-yaris.png';
import fordTransit from '@/assets/vehicles/ford-transit.png';

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

import volkswagenGolf from '@/assets/vehicles/volkswagen-golf.png';
import teslaModel3 from '@/assets/vehicles/tesla-model3.png';
import bmwX3 from '@/assets/vehicles/bmw-x3.png';
import mercedesEklasse from '@/assets/vehicles/mercedes-eklasse.png';
import renaultKangoo from '@/assets/vehicles/renault-kangoo.png';
import audiA4 from '@/assets/vehicles/audi-a4.png';
import toyotaYaris from '@/assets/vehicles/toyota-yaris.png';
import fordTransit from '@/assets/vehicles/ford-transit.png';

const vehicleImageMap: Record<string, string> = {
  'volkswagen-golf': volkswagenGolf,
  'tesla-model': teslaModel3,
  'bmw-x3': bmwX3,
  'mercedes-benz-e-klasse': mercedesEklasse,
  'renault-kangoo': renaultKangoo,
  'audi-a4': audiA4,
  'toyota-yaris': toyotaYaris,
  'ford-transit': fordTransit,
};

export function getVehicleImageUrl(merk: string, model: string): string {
  const key = `${merk.toLowerCase()}-${model.split(' ')[0].toLowerCase()}`;
  return vehicleImageMap[key] || vehicleImageMap[Object.keys(vehicleImageMap).find(k => key.includes(k) || k.includes(key.split('-')[0])) || ''] || '';
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

export function getMaintenanceForVehicle(vehicleId: string): MaintenanceRecord[] {
  return maintenanceRecords.filter(m => m.voertuigId === vehicleId);
}

export function getReservationsForVehicle(vehicleId: string): Reservation[] {
  return reservations.filter(r => r.voertuigId === vehicleId);
}

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
    id: 'c4', contractNummer: 'EV-2026-001', type: 'ev-lease', voertuigId: 'v2',
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
