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

// ─── Types ───────────────────────────────────────────────
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

export type ContractType = 'lease' | 'verhuur' | 'fietslease' | 'ev-lease';
export type ContractStatus = 'actief' | 'verlopen' | 'opgezegd' | 'concept';

// ─── Vehicle Image Map ───────────────────────────────────
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
  if (vehicleImageMap[key]) return vehicleImageMap[key];
  const make = encodeURIComponent(merk.toLowerCase());
  const modelFamily = encodeURIComponent(model.split(' ')[0].toLowerCase());
  return `https://cdn.imagin.studio/getimage?customer=hrjavascript-masede&make=${make}&modelFamily=${modelFamily}&paintId=pspc0040&angle=01`;
}

// ─── Utility / helper functions ──────────────────────────
export function getStatusColor(status: string) {
  switch (status) {
    case 'beschikbaar': return 'success';
    case 'verhuurd': return 'info';
    case 'onderhoud': return 'warning';
    case 'gereserveerd': return 'primary';
    default: return 'muted';
  }
}

export function getReservationStatusColor(status: string) {
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

export function getInvoiceStatusColor(status: string) {
  switch (status) {
    case 'betaald': return 'success' as const;
    case 'openstaand': return 'info' as const;
    case 'te_laat': return 'destructive' as const;
    case 'herinnering_verstuurd': return 'warning' as const;
    default: return 'muted' as const;
  }
}
