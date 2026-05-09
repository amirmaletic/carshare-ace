/**
 * Centrale definitie van wat gemigreerd kan worden.
 * Per datatype: doelvelden, normalizers, validators en de daadwerkelijke insert.
 */
import { supabase } from "@/integrations/supabase/client";

export type MigratieDatatype =
  | "voertuigen"
  | "klanten"
  | "contracten"
  | "chauffeurs"
  | "kilometer"
  | "schade";

export interface TargetField {
  key: string;
  label: string;
  required?: boolean;
  type?: "text" | "number" | "date" | "email" | "kenteken";
}

export interface DatatypeSpec {
  key: MigratieDatatype;
  label: string;
  beschrijving: string;
  icon: string;
  fields: TargetField[];
  /** Welke velden verplicht zijn (subset van fields). */
  required: string[];
  /** Unieke sleutel voor duplicate-detectie binnen het bestand. */
  uniqueKey: (row: Record<string, unknown>) => string;
}

export const DATATYPES: Record<MigratieDatatype, DatatypeSpec> = {
  voertuigen: {
    key: "voertuigen",
    label: "Voertuigen",
    beschrijving: "Kentekens, merk, model, bouwjaar, brandstof, km-stand, prijs, locatie",
    icon: "Car",
    fields: [
      { key: "kenteken", label: "Kenteken", required: true, type: "kenteken" },
      { key: "merk", label: "Merk" },
      { key: "model", label: "Model" },
      { key: "bouwjaar", label: "Bouwjaar", type: "number" },
      { key: "brandstof", label: "Brandstof" },
      { key: "kilometerstand", label: "Kilometerstand", type: "number" },
      { key: "categorie", label: "Categorie" },
      { key: "kleur", label: "Kleur" },
      { key: "dagprijs", label: "Dagprijs", type: "number" },
      { key: "locatie", label: "Locatie" },
      { key: "apk_vervaldatum", label: "APK vervaldatum", type: "date" },
      { key: "verzekering_vervaldatum", label: "Verzekering vervaldatum", type: "date" },
    ],
    required: ["kenteken"],
    uniqueKey: (r) => normalizeKenteken(String(r.kenteken ?? "")),
  },
  klanten: {
    key: "klanten",
    label: "Klanten",
    beschrijving: "Naam, email, telefoon, adres, type particulier of zakelijk",
    icon: "UserPlus",
    fields: [
      { key: "voornaam", label: "Voornaam" },
      { key: "achternaam", label: "Achternaam" },
      { key: "naam_volledig", label: "Volledige naam (wordt gesplitst)" },
      { key: "email", label: "E-mail", required: true, type: "email" },
      { key: "telefoon", label: "Telefoon" },
      { key: "adres", label: "Adres" },
      { key: "postcode", label: "Postcode" },
      { key: "plaats", label: "Plaats" },
      { key: "type", label: "Type (particulier/zakelijk)" },
      { key: "bedrijfsnaam", label: "Bedrijfsnaam" },
      { key: "kvk_nummer", label: "KVK-nummer" },
      { key: "rijbewijs_nummer", label: "Rijbewijsnummer" },
    ],
    required: ["email"],
    uniqueKey: (r) => String(r.email ?? "").trim().toLowerCase(),
  },
  contracten: {
    key: "contracten",
    label: "Contracten",
    beschrijving: "Lopende huur of lease contracten met klant en kenteken",
    icon: "FileText",
    fields: [
      { key: "contract_nummer", label: "Contract nummer" },
      { key: "klant_email", label: "Klant e-mail", required: true, type: "email" },
      { key: "klant_naam", label: "Klant naam" },
      { key: "kenteken", label: "Kenteken voertuig", required: true, type: "kenteken" },
      { key: "type", label: "Type (huur/lease)" },
      { key: "start_datum", label: "Startdatum", required: true, type: "date" },
      { key: "eind_datum", label: "Einddatum", required: true, type: "date" },
      { key: "maandprijs", label: "Maandprijs", type: "number" },
      { key: "borg", label: "Borg", type: "number" },
      { key: "km_per_jaar", label: "Km per jaar", type: "number" },
      { key: "status", label: "Status" },
    ],
    required: ["klant_email", "kenteken", "start_datum", "eind_datum"],
    uniqueKey: (r) => `${r.kenteken}|${r.start_datum}`,
  },
  chauffeurs: {
    key: "chauffeurs",
    label: "Chauffeurs",
    beschrijving: "Chauffeursprofielen met rijbewijs en contactgegevens",
    icon: "Users",
    fields: [
      { key: "voornaam", label: "Voornaam", required: true },
      { key: "achternaam", label: "Achternaam", required: true },
      { key: "email", label: "E-mail", type: "email" },
      { key: "telefoon", label: "Telefoon" },
      { key: "rijbewijs_categorie", label: "Rijbewijs categorie" },
      { key: "rijbewijs_nummer", label: "Rijbewijs nummer" },
      { key: "rijbewijs_verloopt", label: "Rijbewijs verloopdatum", type: "date" },
      { key: "geboortedatum", label: "Geboortedatum", type: "date" },
      { key: "adres", label: "Adres" },
      { key: "postcode", label: "Postcode" },
      { key: "plaats", label: "Plaats" },
    ],
    required: ["voornaam", "achternaam"],
    uniqueKey: (r) => `${r.voornaam}|${r.achternaam}|${r.email ?? ""}`.toLowerCase(),
  },
  kilometer: {
    key: "kilometer",
    label: "Kilometerhistorie",
    beschrijving: "Historische km-standen per voertuig",
    icon: "Gauge",
    fields: [
      { key: "kenteken", label: "Kenteken", required: true, type: "kenteken" },
      { key: "datum", label: "Datum", required: true, type: "date" },
      { key: "kilometerstand", label: "Kilometerstand", required: true, type: "number" },
      { key: "notitie", label: "Notitie" },
    ],
    required: ["kenteken", "datum", "kilometerstand"],
    uniqueKey: (r) => `${r.kenteken}|${r.datum}|${r.kilometerstand}`,
  },
  schade: {
    key: "schade",
    label: "Schadehistorie",
    beschrijving: "Historische schadegevallen per voertuig",
    icon: "AlertTriangle",
    fields: [
      { key: "kenteken", label: "Kenteken", required: true, type: "kenteken" },
      { key: "datum", label: "Datum", required: true, type: "date" },
      { key: "omschrijving", label: "Omschrijving", required: true },
      { key: "ernst", label: "Ernst (licht/middel/zwaar)" },
      { key: "kosten", label: "Kosten", type: "number" },
      { key: "locatie_schade", label: "Locatie op voertuig" },
      { key: "hersteld", label: "Hersteld (ja/nee)" },
    ],
    required: ["kenteken", "datum", "omschrijving"],
    uniqueKey: (r) => `${r.kenteken}|${r.datum}|${r.omschrijving}`.slice(0, 100),
  },
};

/* ========== normalizers ========== */

export function normalizeKenteken(s: string): string {
  return (s ?? "").toString().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function normalizeNumber(v: unknown): number | null {
  if (v == null || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  let s = String(v).trim();
  s = s.replace(/[€$£\s]/g, "");
  // Dutch format: 1.234,56 -> 1234.56
  if (s.includes(",") && s.lastIndexOf(",") > s.lastIndexOf(".")) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    s = s.replace(/,/g, "");
  }
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

export function normalizeDate(v: unknown): string | null {
  if (v == null || v === "") return null;
  // Excel serial number
  if (typeof v === "number" && v > 20000 && v < 80000) {
    const d = new Date(Math.round((v - 25569) * 86400 * 1000));
    return d.toISOString().slice(0, 10);
  }
  const s = String(v).trim();
  // dd-mm-yyyy or dd/mm/yyyy
  const dm = s.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/);
  if (dm) {
    const [, d, m, y] = dm;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  // yyyy-mm-dd
  const ymd = s.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/);
  if (ymd) {
    const [, y, m, d] = ymd;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}

export function normalizeEmail(v: unknown): string | null {
  if (!v) return null;
  const s = String(v).trim().toLowerCase();
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s) ? s : null;
}

export function splitNaam(volledig: string): { voornaam: string; achternaam: string } {
  const parts = volledig.trim().split(/\s+/);
  if (parts.length === 1) return { voornaam: parts[0], achternaam: "-" };
  return { voornaam: parts[0], achternaam: parts.slice(1).join(" ") };
}

/**
 * Past per-veld normalisatie toe op basis van de field type.
 */
export function normalizeRow(spec: DatatypeSpec, raw: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...raw };
  for (const f of spec.fields) {
    if (!(f.key in out)) continue;
    const v = out[f.key];
    if (v === null || v === undefined || v === "") {
      out[f.key] = null;
      continue;
    }
    switch (f.type) {
      case "number":
        out[f.key] = normalizeNumber(v);
        break;
      case "date":
        out[f.key] = normalizeDate(v);
        break;
      case "email":
        out[f.key] = normalizeEmail(v);
        break;
      case "kenteken":
        out[f.key] = normalizeKenteken(String(v));
        break;
      default:
        out[f.key] = String(v).trim();
    }
  }
  // Naam splitsen indien volledige naam aanwezig en voornaam ontbreekt
  if (spec.key === "klanten" && out.naam_volledig && (!out.voornaam || !out.achternaam)) {
    const { voornaam, achternaam } = splitNaam(String(out.naam_volledig));
    out.voornaam = out.voornaam || voornaam;
    out.achternaam = out.achternaam || achternaam;
  }
  return out;
}

export function validateRow(spec: DatatypeSpec, row: Record<string, unknown>): string[] {
  const errors: string[] = [];
  for (const key of spec.required) {
    const v = row[key];
    if (v === null || v === undefined || v === "") {
      errors.push(`${key} ontbreekt`);
    }
  }
  return errors;
}

/* ========== inserts per datatype ========== */

export interface InsertContext {
  organisatieId: string;
  userId: string;
  /** Cache: kenteken -> voertuig_id */
  voertuigByKenteken: Map<string, string>;
  /** Cache: email -> klant_id */
  klantByEmail: Map<string, string>;
}

export async function insertRow(
  datatype: MigratieDatatype,
  row: Record<string, unknown>,
  ctx: InsertContext,
): Promise<{ success: boolean; error?: string }> {
  try {
    switch (datatype) {
      case "voertuigen": {
        const { error } = await supabase.from("voertuigen").insert({
          kenteken: String(row.kenteken),
          merk: String(row.merk ?? "ONBEKEND"),
          model: String(row.model ?? "ONBEKEND"),
          bouwjaar: Number(row.bouwjaar ?? new Date().getFullYear()),
          brandstof: String(row.brandstof ?? "Benzine"),
          kilometerstand: Number(row.kilometerstand ?? 0),
          categorie: String(row.categorie ?? "Stadsauto"),
          kleur: String(row.kleur ?? "Onbekend"),
          dagprijs: Number(row.dagprijs ?? 0),
          locatie: row.locatie ? String(row.locatie) : null,
          apk_vervaldatum: row.apk_vervaldatum as string | null,
          verzekering_vervaldatum: row.verzekering_vervaldatum as string | null,
          status: "beschikbaar",
          user_id: ctx.userId,
          organisatie_id: ctx.organisatieId,
        });
        if (error) return { success: false, error: error.message };
        return { success: true };
      }
      case "klanten": {
        const { data, error } = await supabase.from("klanten").insert({
          voornaam: String(row.voornaam ?? "-"),
          achternaam: String(row.achternaam ?? "-"),
          email: String(row.email),
          telefoon: row.telefoon ? String(row.telefoon) : null,
          adres: row.adres ? String(row.adres) : null,
          postcode: row.postcode ? String(row.postcode) : null,
          plaats: row.plaats ? String(row.plaats) : null,
          type: String(row.type ?? "particulier").toLowerCase().includes("zak") ? "zakelijk" : "particulier",
          bedrijfsnaam: row.bedrijfsnaam ? String(row.bedrijfsnaam) : null,
          kvk_nummer: row.kvk_nummer ? String(row.kvk_nummer) : null,
          rijbewijs_nummer: row.rijbewijs_nummer ? String(row.rijbewijs_nummer) : null,
          organisatie_id: ctx.organisatieId,
        }).select("id").single();
        if (error) return { success: false, error: error.message };
        if (data) ctx.klantByEmail.set(String(row.email).toLowerCase(), data.id);
        return { success: true };
      }
      case "chauffeurs": {
        const { error } = await supabase.from("chauffeurs").insert({
          voornaam: String(row.voornaam),
          achternaam: String(row.achternaam),
          email: row.email ? String(row.email) : null,
          telefoon: row.telefoon ? String(row.telefoon) : null,
          rijbewijs_categorie: String(row.rijbewijs_categorie ?? "B"),
          rijbewijs_nummer: row.rijbewijs_nummer ? String(row.rijbewijs_nummer) : null,
          rijbewijs_verloopt: row.rijbewijs_verloopt as string | null,
          geboortedatum: row.geboortedatum as string | null,
          adres: row.adres ? String(row.adres) : null,
          postcode: row.postcode ? String(row.postcode) : null,
          plaats: row.plaats ? String(row.plaats) : null,
          status: "actief",
          user_id: ctx.userId,
          organisatie_id: ctx.organisatieId,
        });
        if (error) return { success: false, error: error.message };
        return { success: true };
      }
      case "contracten": {
        const kenteken = normalizeKenteken(String(row.kenteken));
        const voertuigId = ctx.voertuigByKenteken.get(kenteken);
        if (!voertuigId) return { success: false, error: `Geen voertuig met kenteken ${kenteken} gevonden, importeer eerst voertuigen` };
        const email = String(row.klant_email).toLowerCase();
        let klantId = ctx.klantByEmail.get(email);
        if (!klantId) {
          // auto-create minimal klant
          const naam = String(row.klant_naam ?? email);
          const { voornaam, achternaam } = splitNaam(naam);
          const { data: kdata, error: kerr } = await supabase.from("klanten").insert({
            email, voornaam, achternaam, type: "particulier",
            organisatie_id: ctx.organisatieId,
          }).select("id").single();
          if (kerr) return { success: false, error: `Klant aanmaken faalde: ${kerr.message}` };
          klantId = kdata!.id;
          ctx.klantByEmail.set(email, klantId);
        }
        const contractNummer = row.contract_nummer
          ? String(row.contract_nummer)
          : `IMP-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
        const typeRaw = String(row.type ?? "huur").toLowerCase();
        const contractType = typeRaw.includes("lease") ? "lease" : "huur";
        const { error } = await supabase.from("contracts").insert({
          contract_nummer: contractNummer,
          klant_naam: String(row.klant_naam ?? email),
          klant_email: email,
          voertuig_id: kenteken,
          type: contractType as "huur" | "lease",
          start_datum: row.start_datum as string,
          eind_datum: row.eind_datum as string,
          maandprijs: Number(row.maandprijs ?? 0),
          borg: Number(row.borg ?? 0),
          km_per_jaar: row.km_per_jaar ? Number(row.km_per_jaar) : null,
          status: (String(row.status ?? "actief").toLowerCase() === "concept" ? "concept" : "actief") as "concept" | "actief",
          inclusief: [],
          user_id: ctx.userId,
          organisatie_id: ctx.organisatieId,
        } as never);
        if (error) return { success: false, error: error.message };
        return { success: true };
      }
      case "kilometer": {
        // km registratie vereist een contract_id, dus we koppelen via huidig actief contract van het voertuig
        const kenteken = normalizeKenteken(String(row.kenteken));
        const { data: cdata } = await supabase
          .from("contracts")
          .select("id")
          .eq("organisatie_id", ctx.organisatieId)
          .eq("voertuig_id", kenteken)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!cdata?.id) {
          return { success: false, error: `Geen contract voor ${kenteken}, importeer eerst contracten` };
        }
        const { error } = await supabase.from("kilometer_registraties").insert({
          datum: row.datum as string,
          kilometerstand: Number(row.kilometerstand),
          notitie: row.notitie ? String(row.notitie) : `Geïmporteerd: ${kenteken}`,
          contract_id: cdata.id,
          user_id: ctx.userId,
          organisatie_id: ctx.organisatieId,
        });
        if (error) return { success: false, error: error.message };
        return { success: true };
      }
      case "schade": {
        const kenteken = normalizeKenteken(String(row.kenteken));
        const ernst = String(row.ernst ?? "licht").toLowerCase();
        const { error } = await supabase.from("schade_rapporten").insert({
          voertuig_id: kenteken,
          datum: row.datum as string,
          omschrijving: String(row.omschrijving),
          ernst: ["licht", "middel", "zwaar"].includes(ernst) ? ernst : "licht",
          kosten: Number(row.kosten ?? 0),
          locatie_schade: row.locatie_schade ? String(row.locatie_schade) : null,
          hersteld: String(row.hersteld ?? "").toLowerCase().match(/(ja|true|1|yes)/) ? true : false,
          user_id: ctx.userId,
          organisatie_id: ctx.organisatieId,
        });
        if (error) return { success: false, error: error.message };
        return { success: true };
      }
      default:
        return { success: false, error: "Onbekend datatype" };
    }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Onbekende fout" };
  }
}