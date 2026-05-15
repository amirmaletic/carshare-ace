import type { ContractWithInvoices } from "@/hooks/useContracts";

export interface KlantData {
  telefoon?: string | null;
  adres?: string | null;
  rijbewijs_nummer?: string | null;
  rijbewijs_verloopt?: string | null;
}

export interface ChecklistItem {
  key: string;
  label: string;
  ok: boolean;
  hint?: string;
}

export function buildContractChecklist(
  contract: ContractWithInvoices,
  klant?: KlantData | null,
): ChecklistItem[] {
  const telefoon = contract.klant_telefoon ?? klant?.telefoon ?? null;
  const adres = contract.klant_adres ?? klant?.adres ?? null;
  const rbNummer = klant?.rijbewijs_nummer ?? null;
  const rbVerloopt = klant?.rijbewijs_verloopt ? new Date(klant.rijbewijs_verloopt) : null;
  const rbGeldig = !!rbVerloopt && rbVerloopt.getTime() > Date.now();

  return [
    {
      key: "naam",
      label: "Volledige naam",
      ok: !!contract.klant_naam && contract.klant_naam.trim().length >= 2,
    },
    {
      key: "email",
      label: "E-mailadres",
      ok: !!contract.klant_email && /\S+@\S+\.\S+/.test(contract.klant_email),
    },
    {
      key: "telefoon",
      label: "Telefoonnummer",
      ok: !!telefoon && telefoon.trim().length >= 6,
    },
    {
      key: "adres",
      label: "Adres",
      ok: !!adres && adres.trim().length >= 4,
    },
    {
      key: "rijbewijs",
      label: "Rijbewijs (nummer + geldig tot)",
      ok: !!rbNummer && rbGeldig,
      hint: rbNummer && !rbGeldig ? "Geldigheidsdatum is verlopen of leeg" : undefined,
    },
    {
      key: "voertuig",
      label: "Voertuig gekoppeld",
      ok: !!contract.voertuig_id,
    },
    {
      key: "periode",
      label: "Start- en einddatum",
      ok: !!contract.start_datum && !!contract.eind_datum && contract.eind_datum >= contract.start_datum,
    },
    {
      key: "prijs",
      label: "Prijs ingevuld",
      ok: Number(contract.maandprijs) > 0,
    },
  ];
}

export function checklistComplete(items: ChecklistItem[]) {
  return items.every((i) => i.ok);
}

export function ontbrekendeLabels(items: ChecklistItem[]) {
  return items.filter((i) => !i.ok).map((i) => i.label);
}