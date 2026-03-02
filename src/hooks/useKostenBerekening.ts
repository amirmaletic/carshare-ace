import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subMonths, format, addMonths, differenceInMonths, parseISO } from "date-fns";

export interface VoertuigKosten {
  voertuigId: string;
  leaseKosten: number;
  serviceKosten: number;
  schadeKosten: number;
  totaalKosten: number;
  totaalKm: number;
  kostenPerKm: number | null;
  contractNummer: string | null;
  klantNaam: string | null;
}

export interface MaandKosten {
  maand: string;
  lease: number;
  service: number;
  schade: number;
  totaal: number;
}

export interface KostenSamenvatting {
  totaalTCO: number;
  gemiddeldeKostenPerKm: number | null;
  prognoseKomendeMaand: number;
  aantalVoertuigen: number;
  voertuigKosten: VoertuigKosten[];
  maandOverzicht: MaandKosten[];
}

export function useKostenBerekening() {
  return useQuery({
    queryKey: ["kosten-berekening"],
    queryFn: async (): Promise<KostenSamenvatting> => {
      const [contractsRes, serviceRes, schadeRes, kmRes] = await Promise.all([
        supabase.from("contracts").select("*").eq("status", "actief"),
        supabase.from("service_historie").select("*"),
        supabase.from("schade_rapporten").select("*"),
        supabase.from("kilometer_registraties").select("*"),
      ]);

      if (contractsRes.error) throw contractsRes.error;
      if (serviceRes.error) throw serviceRes.error;
      if (schadeRes.error) throw schadeRes.error;
      if (kmRes.error) throw kmRes.error;

      const contracts = contractsRes.data ?? [];
      const services = serviceRes.data ?? [];
      const schades = schadeRes.data ?? [];
      const kms = kmRes.data ?? [];

      // Per-voertuig kosten
      const voertuigIds = [...new Set([
        ...contracts.filter(c => c.voertuig_id).map(c => c.voertuig_id!),
        ...services.map(s => s.voertuig_id),
        ...schades.map(s => s.voertuig_id),
      ])];

      const voertuigKosten: VoertuigKosten[] = voertuigIds.map(vid => {
        const contract = contracts.find(c => c.voertuig_id === vid);
        const maanden = contract
          ? Math.max(1, differenceInMonths(new Date(contract.eind_datum), new Date(contract.start_datum)))
          : 0;
        const leaseKosten = contract ? contract.maandprijs * maanden : 0;
        const serviceKosten = services.filter(s => s.voertuig_id === vid).reduce((s, r) => s + (r.kosten ?? 0), 0);
        const schadeKosten = schades.filter(s => s.voertuig_id === vid).reduce((s, r) => s + (r.kosten ?? 0), 0);
        const totaalKosten = leaseKosten + serviceKosten + schadeKosten;

        // Km for this vehicle via contract
        const contractKms = contract
          ? kms.filter(k => k.contract_id === contract.id)
          : [];
        const totaalKm = contractKms.length >= 2
          ? contractKms[contractKms.length - 1].kilometerstand - contractKms[0].kilometerstand
          : 0;

        return {
          voertuigId: vid,
          leaseKosten,
          serviceKosten,
          schadeKosten,
          totaalKosten,
          totaalKm,
          kostenPerKm: totaalKm > 0 ? totaalKosten / totaalKm : null,
          contractNummer: contract?.contract_nummer ?? null,
          klantNaam: contract?.klant_naam ?? null,
        };
      });

      // Maandoverzicht (laatste 6 maanden)
      const now = new Date();
      const maandOverzicht: MaandKosten[] = Array.from({ length: 6 }, (_, i) => {
        const date = subMonths(now, 5 - i);
        const m = format(date, "yyyy-MM");
        const label = format(date, "MMM");

        const lease = contracts.reduce((sum, c) => {
          const start = c.start_datum.slice(0, 7);
          const end = c.eind_datum.slice(0, 7);
          return m >= start && m <= end ? sum + c.maandprijs : sum;
        }, 0);

        const service = services
          .filter(s => s.datum.startsWith(m))
          .reduce((sum, s) => sum + (s.kosten ?? 0), 0);

        const schade = schades
          .filter(s => s.datum.startsWith(m))
          .reduce((sum, s) => sum + (s.kosten ?? 0), 0);

        return { maand: label, lease, service, schade, totaal: lease + service + schade };
      });

      const totaalTCO = voertuigKosten.reduce((s, v) => s + v.totaalKosten, 0);
      const metKm = voertuigKosten.filter(v => v.kostenPerKm !== null);
      const gemiddeldeKostenPerKm = metKm.length > 0
        ? metKm.reduce((s, v) => s + v.kostenPerKm!, 0) / metKm.length
        : null;

      // Prognose: gemiddelde van laatste 3 maanden
      const laatste3 = maandOverzicht.slice(-3);
      const prognoseKomendeMaand = laatste3.length > 0
        ? laatste3.reduce((s, m) => s + m.totaal, 0) / laatste3.length
        : 0;

      return {
        totaalTCO,
        gemiddeldeKostenPerKm,
        prognoseKomendeMaand,
        aantalVoertuigen: voertuigIds.length,
        voertuigKosten,
        maandOverzicht,
      };
    },
  });
}
