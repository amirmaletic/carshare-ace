import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BASE_SYSTEM_PROMPT = `Je bent **Fleeflo Copilot**: een data-bewuste assistent voor het wagenparkbeheer van de gebruiker.

Je hebt toegang tot live data via tools (lezen) en kunt mutaties voorbereiden als VOORSTEL (de gebruiker bevestigt zelf met één klik). Verzin nooit cijfers of namen.

Werkwijze:
1. Begrijp de vraag in context van de huidige pagina en eerdere gesprekken/feiten.
2. Roep zo nodig één of meer tools aan om de echte data op te halen.
3. Geef een kort, concreet antwoord in het Nederlands met markdown (bullets, tabellen, **bold** voor cijfers).
4. Voeg waar zinvol een [[fleeflo:actions ...]] blok toe met klikbare voertuigkaarten en/of een primary-actie of voorstel.

Stijl:
- Kort, concreet, Nederlands. Geen em-dashes; gebruik | · of woorden.
- Vermeld altijd tijdvenster en aantal records.
- Eerlijk als data ontbreekt; stel concrete vervolgstap voor.

ACTIE-PROTOCOL:
Voeg maximaal één actieblok toe aan het einde van je antwoord:

[[fleeflo:actions
{
  "intro": "korte zin boven de kaarten (optioneel)",
  "vehicles": [
    {"id":"<uuid>","kenteken":"78-XY-901","label":"Mercedes Sprinter 314","sub":"3,5 m³ · 1.350 kg","status":"3 dagen vrij","href":"/voertuigen?kenteken=78-XY-901"}
  ],
  "primary": {"type":"reserveer","kenteken":"78-XY-901","voertuig_id":"<uuid>","klant_id":"<uuid>","klant_naam":"Lisa","start_datum":"2026-05-04","eind_datum":"2026-05-06","label":"Reserveer 78-XY-901 voor Lisa"},
  "voorstel": {
    "kind": "reservering",
    "summary": "Reservering voor Lisa van 4-6 mei in Mercedes Sprinter 78-XY-901, totaal € 270",
    "payload": {
      "voertuig_id":"<uuid>",
      "klant_id":"<uuid>",
      "start_datum":"2026-05-04",
      "eind_datum":"2026-05-06",
      "dagprijs": 90,
      "totaalprijs": 270
    },
    "confirm_label": "Bevestig en maak aan",
    "open_after": "/reserveringen"
  }
}
]]

Voorstellen (kind):
- "reservering" → maakt rij in 'reserveringen'. Vereist: voertuig_id, klant_id, start_datum, eind_datum, dagprijs, totaalprijs.
- "rit" → maakt rij in 'ritten'. Vereist: van_locatie, naar_locatie, datum (en optioneel voertuig_id, chauffeur_id, afstand_km).
- "onderhoud" → maakt rij in 'service_historie'. Vereist: voertuig_id, datum, omschrijving (optioneel kosten, garage, type).
- "klant" → maakt rij in 'klanten'. Vereist: voornaam, achternaam, email (optioneel telefoon, type).

Regels voor het actieblok:
- Geldig JSON, geen commentaar, geen trailing comma's.
- Gebruik altijd zoek_voertuig/zoek_klant om echte id's te krijgen vóór je een voorstel/primary maakt.
- Vraag NIET nogmaals om bevestiging in tekst; de Bevestig-knop staat al in het voorstel.
- Als er niets klikbaars relevant is, laat het blok weg.
- Houd markdown-tekst kort: 1-2 regels zijn ideaal.`;

// ----------------- Tool definitions -----------------
const tools = [
  {
    type: "function",
    function: {
      name: "lijst_voertuigen",
      description: "Lijst van voertuigen in de vloot, met optionele filters op status of brandstof. Default limiet 50.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["beschikbaar", "verhuurd", "onderhoud", "gereserveerd"], description: "Optioneel statusfilter" },
          brandstof: { type: "string", description: "Optioneel brandstoffilter (Benzine, Diesel, Elektrisch, Hybride)" },
          limit: { type: "number", description: "Max aantal records (1-200)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "voertuig_beschikbaarheid",
      description: "Welke voertuigen zijn beschikbaar tussen twee datums (geen actief contract of reservering).",
      parameters: {
        type: "object",
        properties: {
          start_datum: { type: "string", description: "ISO datum YYYY-MM-DD" },
          eind_datum: { type: "string", description: "ISO datum YYYY-MM-DD" },
        },
        required: ["start_datum", "eind_datum"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "actieve_contracten",
      description: "Contracten die op een datum (of vandaag) actief lopen. Optioneel filter op klant of binnen N dagen aflopend.",
      parameters: {
        type: "object",
        properties: {
          aflopend_binnen_dagen: { type: "number", description: "Toon contracten die binnen X dagen aflopen" },
          klant_zoek: { type: "string", description: "Vrije tekst zoekopdracht in klant_naam of bedrijf" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "aflopende_apk",
      description: "Voertuigen waarvan de APK binnen X dagen verloopt (of al verlopen is).",
      parameters: {
        type: "object",
        properties: {
          binnen_dagen: { type: "number", description: "Standaard 60" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "omzet_periode",
      description: "Som van facturen (alle statussen + uitsplitsing) tussen twee datums.",
      parameters: {
        type: "object",
        properties: {
          start_datum: { type: "string", description: "YYYY-MM-DD" },
          eind_datum: { type: "string", description: "YYYY-MM-DD" },
        },
        required: ["start_datum", "eind_datum"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "openstaande_facturen",
      description: "Facturen met status 'openstaand' of 'verlopen', gesorteerd op oudste.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "schade_overzicht",
      description: "Overzicht schades, optioneel alleen niet-herstelde of binnen periode.",
      parameters: {
        type: "object",
        properties: {
          alleen_open: { type: "boolean" },
          sinds: { type: "string", description: "YYYY-MM-DD" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "vloot_statistieken",
      description: "Snelle KPI: aantal voertuigen per status, totale fiscale waarde, gemiddelde dagprijs, bezettingsgraad laatste 30 dagen.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "zoek_voertuig",
      description: "Zoek voertuigen op (deel van) kenteken, merk of model. Geeft id, kenteken en samenvatting terug, voor gebruik in actieblokken.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Vrije tekst, bv. 'sprinter' of '78-XY'" },
          limit: { type: "number", description: "Max aantal (1-20)" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "zoek_klant",
      description: "Zoek klanten op naam, bedrijf of email. Geeft id en naam terug voor gebruik in actieblokken (bv. reservering).",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
          limit: { type: "number" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "start_reservering_link",
      description: "Bouw een diepe link naar het reserveringsformulier met voorgevulde waarden.",
      parameters: {
        type: "object",
        properties: {
          voertuig_id: { type: "string" },
          klant_id: { type: "string" },
          start_datum: { type: "string" },
          eind_datum: { type: "string" },
        },
        required: ["voertuig_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "open_voertuig_link",
      description: "Bouw een diepe link naar de voertuigpagina met dat voertuig direct geopend.",
      parameters: {
        type: "object",
        properties: {
          kenteken: { type: "string" },
        },
        required: ["kenteken"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "voertuig_detail",
      description: "Volledige details van één voertuig op kenteken of id (incl. APK, KM, brandstof, status, dagprijs, locatie).",
      parameters: { type: "object", properties: { kenteken: { type: "string" }, id: { type: "string" } } },
    },
  },
  {
    type: "function",
    function: {
      name: "voertuig_geschiedenis",
      description: "Toon recente activiteit voor een voertuig: laatste schades, onderhoud, ritten en contracten.",
      parameters: { type: "object", properties: { voertuig_id: { type: "string" }, kenteken: { type: "string" }, limit: { type: "number" } } },
    },
  },
  {
    type: "function",
    function: {
      name: "klant_detail",
      description: "Klantprofiel met contracten, reserveringen en openstaande facturen.",
      parameters: { type: "object", properties: { klant_id: { type: "string" }, query: { type: "string" } } },
    },
  },
  {
    type: "function",
    function: {
      name: "lijst_chauffeurs",
      description: "Lijst chauffeurs met status en rijbewijs vervaldatum.",
      parameters: { type: "object", properties: { status: { type: "string" } } },
    },
  },
  {
    type: "function",
    function: {
      name: "ritten_overzicht",
      description: "Recente ritten (transport), optioneel filter op periode of chauffeur.",
      parameters: { type: "object", properties: { sinds: { type: "string" }, chauffeur_id: { type: "string" }, limit: { type: "number" } } },
    },
  },
  {
    type: "function",
    function: {
      name: "onderhoud_overzicht",
      description: "Service-historie / onderhoud per voertuig of recent.",
      parameters: { type: "object", properties: { voertuig_id: { type: "string" }, sinds: { type: "string" }, limit: { type: "number" } } },
    },
  },
  {
    type: "function",
    function: {
      name: "kosten_per_voertuig",
      description: "Totale kosten (onderhoud + schade) per voertuig in een periode. Toont top kostenposten.",
      parameters: { type: "object", properties: { sinds: { type: "string" }, limit: { type: "number" } } },
    },
  },
  {
    type: "function",
    function: {
      name: "agenda_vandaag",
      description: "Wat gebeurt er vandaag/morgen: ophaalmomenten, retourmomenten, ritten, aflopende contracten en APKs.",
      parameters: { type: "object", properties: { dagen: { type: "number" } } },
    },
  },
  {
    type: "function",
    function: {
      name: "onthoud_feit",
      description: "Sla een blijvend feit op over de gebruiker of zijn vloot dat in latere gesprekken gebruikt mag worden (bv. voorkeur, vaste klant, standaardprijs).",
      parameters: { type: "object", properties: { feit: { type: "string", description: "Korte zin." } }, required: ["feit"] },
    },
  },
  {
    type: "function",
    function: {
      name: "vergeet_feit",
      description: "Verwijder een eerder onthouden feit op id (gebruik onthouden_feiten om id's te zien).",
      parameters: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
    },
  },
];

// ----------------- Tool executor -----------------
async function runTool(name: string, args: any, sb: any, ctx: { userId?: string; orgId?: string }): Promise<any> {
  try {
    switch (name) {
      case "lijst_voertuigen": {
        let q = sb.from("voertuigen").select("kenteken,merk,model,bouwjaar,brandstof,status,kilometerstand,dagprijs,apk_vervaldatum,catalogusprijs,kleur").limit(Math.min(args.limit ?? 50, 200));
        if (args.status) q = q.eq("status", args.status);
        if (args.brandstof) q = q.eq("brandstof", args.brandstof);
        const { data, error } = await q;
        if (error) throw error;
        return { count: data?.length ?? 0, voertuigen: data };
      }
      case "voertuig_beschikbaarheid": {
        const { start_datum, eind_datum } = args;
        const { data: voertuigen } = await sb.from("voertuigen").select("id,kenteken,merk,model,dagprijs,status").neq("status", "onderhoud");
        const { data: contracten } = await sb.from("contracts").select("voertuig_id,start_datum,eind_datum").or(`and(start_datum.lte.${eind_datum},eind_datum.gte.${start_datum})`);
        const { data: reserveringen } = await sb.from("reserveringen").select("voertuig_id,start_datum,eind_datum,status").in("status", ["aangevraagd", "bevestigd"]).or(`and(start_datum.lte.${eind_datum},eind_datum.gte.${start_datum})`);
        const bezet = new Set([
          ...(contracten ?? []).map((c: any) => String(c.voertuig_id)),
          ...(reserveringen ?? []).map((r: any) => String(r.voertuig_id)),
        ]);
        const beschikbaar = (voertuigen ?? []).filter((v: any) => !bezet.has(String(v.id)) && !bezet.has(v.kenteken));
        return { periode: `${start_datum} t/m ${eind_datum}`, totaal: voertuigen?.length ?? 0, beschikbaar_aantal: beschikbaar.length, beschikbaar };
      }
      case "actieve_contracten": {
        const today = new Date().toISOString().slice(0, 10);
        let q = sb.from("contracts").select("contract_nummer,klant_naam,bedrijf,voertuig_id,type,start_datum,eind_datum,maandprijs,status").lte("start_datum", today).gte("eind_datum", today);
        if (args.klant_zoek) q = q.or(`klant_naam.ilike.%${args.klant_zoek}%,bedrijf.ilike.%${args.klant_zoek}%`);
        if (args.aflopend_binnen_dagen) {
          const limit = new Date(Date.now() + args.aflopend_binnen_dagen * 86400000).toISOString().slice(0, 10);
          q = q.lte("eind_datum", limit);
        }
        const { data, error } = await q.order("eind_datum");
        if (error) throw error;
        return { count: data?.length ?? 0, contracten: data };
      }
      case "aflopende_apk": {
        const dagen = args.binnen_dagen ?? 60;
        const limit = new Date(Date.now() + dagen * 86400000).toISOString().slice(0, 10);
        const { data, error } = await sb.from("voertuigen").select("kenteken,merk,model,apk_vervaldatum").lte("apk_vervaldatum", limit).order("apk_vervaldatum");
        if (error) throw error;
        return { binnen_dagen: dagen, count: data?.length ?? 0, voertuigen: data };
      }
      case "omzet_periode": {
        const { data, error } = await sb.from("invoices").select("bedrag,status,datum").gte("datum", args.start_datum).lte("datum", args.eind_datum);
        if (error) throw error;
        const totaal = (data ?? []).reduce((s: number, i: any) => s + Number(i.bedrag || 0), 0);
        const perStatus: Record<string, number> = {};
        for (const inv of data ?? []) perStatus[inv.status] = (perStatus[inv.status] || 0) + Number(inv.bedrag || 0);
        return { periode: `${args.start_datum} t/m ${args.eind_datum}`, aantal_facturen: data?.length ?? 0, totaal_euro: totaal, per_status: perStatus };
      }
      case "openstaande_facturen": {
        const { data, error } = await sb.from("invoices").select("bedrag,status,datum,contract_id").in("status", ["openstaand", "verlopen"]).order("datum");
        if (error) throw error;
        const totaal = (data ?? []).reduce((s: number, i: any) => s + Number(i.bedrag || 0), 0);
        return { count: data?.length ?? 0, totaal_open_euro: totaal, facturen: data?.slice(0, 30) };
      }
      case "schade_overzicht": {
        let q = sb.from("schade_rapporten").select("voertuig_id,datum,omschrijving,ernst,kosten,hersteld,verzekerd").order("datum", { ascending: false });
        if (args.alleen_open) q = q.eq("hersteld", false);
        if (args.sinds) q = q.gte("datum", args.sinds);
        const { data, error } = await q.limit(50);
        if (error) throw error;
        const totaal_kosten = (data ?? []).reduce((s: number, r: any) => s + Number(r.kosten || 0), 0);
        return { count: data?.length ?? 0, totaal_kosten_euro: totaal_kosten, schades: data };
      }
      case "vloot_statistieken": {
        const { data: vts } = await sb.from("voertuigen").select("status,dagprijs,catalogusprijs");
        const today = new Date().toISOString().slice(0, 10);
        const dertigDag = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
        const { data: actieveContracten } = await sb.from("contracts").select("voertuig_id").lte("start_datum", today).gte("eind_datum", today);
        const perStatus: Record<string, number> = {};
        let fiscaal = 0;
        let dagprijsSom = 0;
        let dagprijsAantal = 0;
        for (const v of vts ?? []) {
          perStatus[v.status] = (perStatus[v.status] || 0) + 1;
          fiscaal += Number(v.catalogusprijs || 0);
          if (v.dagprijs) { dagprijsSom += Number(v.dagprijs); dagprijsAantal++; }
        }
        const totaal = vts?.length ?? 0;
        const bezet = new Set((actieveContracten ?? []).map((c: any) => String(c.voertuig_id))).size;
        const bezetting = totaal > 0 ? Math.round((bezet / totaal) * 100) : 0;
        return {
          totaal_voertuigen: totaal,
          per_status: perStatus,
          fiscale_waarde_totaal_euro: fiscaal,
          gem_dagprijs_euro: dagprijsAantal ? Math.round(dagprijsSom / dagprijsAantal) : 0,
          actieve_contracten: actieveContracten?.length ?? 0,
          bezettingsgraad_procent: bezetting,
          peildatum: today,
        };
      }
      case "zoek_voertuig": {
        const q = String(args.query ?? "").trim();
        const lim = Math.min(args.limit ?? 8, 20);
        if (!q) return { count: 0, voertuigen: [] };
        const pattern = `%${q}%`;
        const { data, error } = await sb
          .from("voertuigen")
          .select("id,kenteken,merk,model,bouwjaar,brandstof,categorie,status,dagprijs")
          .or(`kenteken.ilike.${pattern},merk.ilike.${pattern},model.ilike.${pattern}`)
          .limit(lim);
        if (error) throw error;
        return { count: data?.length ?? 0, voertuigen: data };
      }
      case "zoek_klant": {
        const q = String(args.query ?? "").trim();
        const lim = Math.min(args.limit ?? 8, 20);
        if (!q) return { count: 0, klanten: [] };
        const pattern = `%${q}%`;
        const { data, error } = await sb
          .from("klanten")
          .select("id,voornaam,achternaam,bedrijfsnaam,email")
          .or(`voornaam.ilike.${pattern},achternaam.ilike.${pattern},bedrijfsnaam.ilike.${pattern},email.ilike.${pattern}`)
          .limit(lim);
        if (error) throw error;
        return { count: data?.length ?? 0, klanten: data };
      }
      case "start_reservering_link": {
        const params = new URLSearchParams();
        params.set("nieuw", "1");
        if (args.voertuig_id) params.set("voertuig", String(args.voertuig_id));
        if (args.klant_id) params.set("klant", String(args.klant_id));
        if (args.start_datum) params.set("start", String(args.start_datum));
        if (args.eind_datum) params.set("eind", String(args.eind_datum));
        return { href: `/reserveringen?${params.toString()}` };
      }
      case "open_voertuig_link": {
        const k = String(args.kenteken ?? "").trim();
        if (!k) return { error: "kenteken vereist" };
        return { href: `/voertuigen?kenteken=${encodeURIComponent(k)}` };
      }
      case "voertuig_detail": {
        let q = sb.from("voertuigen").select("*").limit(1);
        if (args.id) q = q.eq("id", args.id);
        else if (args.kenteken) q = q.ilike("kenteken", String(args.kenteken));
        else return { error: "kenteken of id vereist" };
        const { data, error } = await q.maybeSingle();
        if (error) throw error;
        return { voertuig: data };
      }
      case "voertuig_geschiedenis": {
        const lim = Math.min(args.limit ?? 10, 30);
        let vid = args.voertuig_id ? String(args.voertuig_id) : null;
        let kent = args.kenteken ? String(args.kenteken) : null;
        if (!vid && kent) {
          const { data: v } = await sb.from("voertuigen").select("id,kenteken").ilike("kenteken", kent).maybeSingle();
          vid = v?.id ? String(v.id) : null;
          kent = v?.kenteken ?? kent;
        } else if (vid && !kent) {
          const { data: v } = await sb.from("voertuigen").select("kenteken").eq("id", vid).maybeSingle();
          kent = v?.kenteken ?? null;
        }
        const filterIds = [vid, kent].filter(Boolean);
        const ids = `(${filterIds.map(x => `"${x}"`).join(",")})`;
        const [schade, onderh, contr, ritt] = await Promise.all([
          sb.from("schade_rapporten").select("datum,omschrijving,ernst,kosten,hersteld").in("voertuig_id", filterIds).order("datum", { ascending: false }).limit(lim),
          sb.from("service_historie").select("datum,type,omschrijving,kosten,garage,kilometerstand").in("voertuig_id", filterIds).order("datum", { ascending: false }).limit(lim),
          sb.from("contracts").select("contract_nummer,klant_naam,start_datum,eind_datum,status,maandprijs").in("voertuig_id", filterIds).order("start_datum", { ascending: false }).limit(lim),
          sb.from("ritten").select("datum,van_locatie,naar_locatie,afstand_km,kosten,status").in("voertuig_id", filterIds).order("datum", { ascending: false }).limit(lim),
        ]);
        return { kenteken: kent, schade: schade.data, onderhoud: onderh.data, contracten: contr.data, ritten: ritt.data };
      }
      case "klant_detail": {
        let kid = args.klant_id ? String(args.klant_id) : null;
        if (!kid && args.query) {
          const p = `%${String(args.query).trim()}%`;
          const { data: k } = await sb.from("klanten").select("id").or(`voornaam.ilike.${p},achternaam.ilike.${p},bedrijfsnaam.ilike.${p},email.ilike.${p}`).limit(1).maybeSingle();
          kid = k?.id ? String(k.id) : null;
        }
        if (!kid) return { error: "klant niet gevonden" };
        const { data: klant } = await sb.from("klanten").select("*").eq("id", kid).maybeSingle();
        const email = klant?.email;
        const [contr, res] = await Promise.all([
          email ? sb.from("contracts").select("contract_nummer,start_datum,eind_datum,status,maandprijs,voertuig_id").eq("klant_email", email).order("start_datum", { ascending: false }) : Promise.resolve({ data: [] }),
          sb.from("reserveringen").select("start_datum,eind_datum,status,totaalprijs,voertuig_id").eq("klant_id", kid).order("start_datum", { ascending: false }),
        ]);
        return { klant, contracten: contr.data, reserveringen: res.data };
      }
      case "lijst_chauffeurs": {
        let q = sb.from("chauffeurs").select("id,voornaam,achternaam,status,rijbewijs_categorie,rijbewijs_verloopt,telefoon").limit(100);
        if (args.status) q = q.eq("status", args.status);
        const { data, error } = await q;
        if (error) throw error;
        return { count: data?.length ?? 0, chauffeurs: data };
      }
      case "ritten_overzicht": {
        const lim = Math.min(args.limit ?? 30, 100);
        let q = sb.from("ritten").select("datum,van_locatie,naar_locatie,afstand_km,kosten,status,chauffeur_id,voertuig_id,type").order("datum", { ascending: false }).limit(lim);
        if (args.sinds) q = q.gte("datum", args.sinds);
        if (args.chauffeur_id) q = q.eq("chauffeur_id", args.chauffeur_id);
        const { data, error } = await q;
        if (error) throw error;
        const totaal_km = (data ?? []).reduce((s: number, r: any) => s + Number(r.afstand_km || 0), 0);
        const totaal_kosten = (data ?? []).reduce((s: number, r: any) => s + Number(r.kosten || 0), 0);
        return { count: data?.length ?? 0, totaal_km, totaal_kosten_euro: totaal_kosten, ritten: data };
      }
      case "onderhoud_overzicht": {
        const lim = Math.min(args.limit ?? 30, 100);
        let q = sb.from("service_historie").select("datum,type,omschrijving,kosten,garage,voertuig_id,kilometerstand").order("datum", { ascending: false }).limit(lim);
        if (args.voertuig_id) q = q.eq("voertuig_id", args.voertuig_id);
        if (args.sinds) q = q.gte("datum", args.sinds);
        const { data, error } = await q;
        if (error) throw error;
        const totaal = (data ?? []).reduce((s: number, r: any) => s + Number(r.kosten || 0), 0);
        return { count: data?.length ?? 0, totaal_kosten_euro: totaal, items: data };
      }
      case "kosten_per_voertuig": {
        const sinds = args.sinds || new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10);
        const lim = Math.min(args.limit ?? 10, 50);
        const [{ data: onderh }, { data: schade }] = await Promise.all([
          sb.from("service_historie").select("voertuig_id,kosten,datum").gte("datum", sinds),
          sb.from("schade_rapporten").select("voertuig_id,kosten,datum").gte("datum", sinds),
        ]);
        const map = new Map<string, { onderhoud: number; schade: number }>();
        for (const r of onderh ?? []) {
          const k = String(r.voertuig_id);
          const v = map.get(k) || { onderhoud: 0, schade: 0 };
          v.onderhoud += Number(r.kosten || 0);
          map.set(k, v);
        }
        for (const r of schade ?? []) {
          const k = String(r.voertuig_id);
          const v = map.get(k) || { onderhoud: 0, schade: 0 };
          v.schade += Number(r.kosten || 0);
          map.set(k, v);
        }
        const ids = [...map.keys()];
        const { data: vts } = ids.length
          ? await sb.from("voertuigen").select("id,kenteken,merk,model").or(ids.map(i => `id.eq.${i},kenteken.eq.${i}`).join(","))
          : { data: [] as any[] };
        const lookup = new Map<string, any>();
        for (const v of vts ?? []) {
          lookup.set(String(v.id), v);
          if (v.kenteken) lookup.set(String(v.kenteken), v);
        }
        const rows = ids.map(id => {
          const v = lookup.get(id);
          const m = map.get(id)!;
          return { id, kenteken: v?.kenteken, merk: v?.merk, model: v?.model, onderhoud_euro: m.onderhoud, schade_euro: m.schade, totaal_euro: m.onderhoud + m.schade };
        }).sort((a, b) => b.totaal_euro - a.totaal_euro).slice(0, lim);
        return { sinds, top: rows };
      }
      case "agenda_vandaag": {
        const dagen = args.dagen ?? 2;
        const today = new Date().toISOString().slice(0, 10);
        const horizon = new Date(Date.now() + dagen * 86400000).toISOString().slice(0, 10);
        const [overdr, ritt, contr, apk] = await Promise.all([
          sb.from("overdrachten").select("type,datum,voertuig_kenteken,klant_naam,status").gte("datum", today).lte("datum", horizon).order("datum"),
          sb.from("ritten").select("datum,vertrek_tijd,van_locatie,naar_locatie,chauffeur_id,voertuig_id,status").gte("datum", today).lte("datum", horizon).order("datum"),
          sb.from("contracts").select("contract_nummer,klant_naam,eind_datum,status").gte("eind_datum", today).lte("eind_datum", horizon).order("eind_datum"),
          sb.from("voertuigen").select("kenteken,merk,model,apk_vervaldatum").gte("apk_vervaldatum", today).lte("apk_vervaldatum", horizon).order("apk_vervaldatum"),
        ]);
        return { periode: `${today} t/m ${horizon}`, overdrachten: overdr.data, ritten: ritt.data, aflopende_contracten: contr.data, aflopende_apk: apk.data };
      }
      case "onthoud_feit": {
        if (!ctx.userId) return { error: "geen ingelogde gebruiker" };
        const feit = String(args.feit || "").trim();
        if (!feit) return { error: "feit vereist" };
        const { data, error } = await sb.from("copilot_geheugen").insert({ user_id: ctx.userId, organisatie_id: ctx.orgId, feit }).select("id").maybeSingle();
        if (error) return { error: error.message };
        return { ok: true, id: data?.id };
      }
      case "vergeet_feit": {
        if (!ctx.userId || !args.id) return { error: "id vereist" };
        const { error } = await sb.from("copilot_geheugen").delete().eq("id", args.id).eq("user_id", ctx.userId);
        if (error) return { error: error.message };
        return { ok: true };
      }
      default:
        return { error: `Onbekende tool: ${name}` };
    }
  } catch (e: any) {
    return { error: e?.message || String(e) };
  }
}

// ----------------- SSE helpers -----------------
function sseEncode(deltaContent: string): Uint8Array {
  const payload = { choices: [{ delta: { content: deltaContent } }] };
  return new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`);
}
function sseDone(): Uint8Array {
  return new TextEncoder().encode(`data: [DONE]\n\n`);
}

async function callGateway(messages: any[], apiKey: string, withTools: boolean) {
  return await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages,
      ...(withTools ? { tools, tool_choice: "auto" } : {}),
    }),
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { messages, context, voorstel } = body || {};
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY niet geconfigureerd");

    const authHeader = req.headers.get("Authorization") || "";
    const sb = createClient(SUPABASE_URL, SUPABASE_ANON, {
      global: { headers: { Authorization: authHeader } },
    });

    // Resolve user + org for memory & write actions
    const { data: userData } = await sb.auth.getUser();
    const userId = userData?.user?.id;
    let orgId: string | undefined;
    if (userId) {
      const { data: orgRes } = await sb.rpc("get_user_organisatie_id", { _user_id: userId });
      orgId = (orgRes as string) || undefined;
    }

    // Voorstel uitvoeren (1-klik bevestiging vanuit client)
    if (voorstel && voorstel.kind && voorstel.payload) {
      try {
        const result = await executeVoorstel(voorstel, sb, { userId, orgId });
        return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch (e: any) {
        return new Response(JSON.stringify({ error: e?.message || "Kon voorstel niet uitvoeren" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // Geheugen ophalen (max 20 recente feiten)
    let memorySnippet = "";
    if (userId) {
      const { data: feiten } = await sb.from("copilot_geheugen").select("id,feit,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(20);
      if (feiten && feiten.length > 0) {
        memorySnippet = "\n\nONTHOUDEN FEITEN (gebruik wanneer relevant, anders negeren):\n" + feiten.map((f: any) => `- [${f.id}] ${f.feit}`).join("\n");
      }
    }

    // Pagina context
    let contextSnippet = "";
    if (context) {
      const parts: string[] = [];
      if (context.path) parts.push(`Huidige pagina: ${context.path}`);
      if (context.kenteken) parts.push(`Geopend voertuig: ${context.kenteken}`);
      if (context.klant) parts.push(`Geopende klant: ${context.klant}`);
      if (context.now) parts.push(`Lokale tijd: ${context.now}`);
      if (parts.length) contextSnippet = "\n\nCONTEXT:\n" + parts.map(p => `- ${p}`).join("\n");
    }

    const SYSTEM_PROMPT = BASE_SYSTEM_PROMPT + contextSnippet + memorySnippet;

    // Agentic loop: tot N tool-rondes, dan stream final answer
    const convo: any[] = [{ role: "system", content: SYSTEM_PROMPT }, ...messages];
    const MAX_ROUNDS = 6;

    for (let round = 0; round < MAX_ROUNDS; round++) {
      const resp = await callGateway(convo, LOVABLE_API_KEY, true);
      if (!resp.ok) {
        if (resp.status === 429) return new Response(JSON.stringify({ error: "Te veel verzoeken. Probeer later opnieuw." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (resp.status === 402) return new Response(JSON.stringify({ error: "AI tegoed op. Voeg credits toe aan je workspace." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const t = await resp.text();
        console.error("Gateway error:", resp.status, t);
        return new Response(JSON.stringify({ error: "AI gateway fout" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const data = await resp.json();
      const choice = data.choices?.[0];
      const msg = choice?.message;
      const toolCalls = msg?.tool_calls;

      if (toolCalls && toolCalls.length > 0) {
        convo.push({ role: "assistant", content: msg.content ?? "", tool_calls: toolCalls });
        for (const call of toolCalls) {
          let parsedArgs: any = {};
          try { parsedArgs = JSON.parse(call.function.arguments || "{}"); } catch {}
          console.log("[copilot] tool", call.function.name, parsedArgs);
          const result = await runTool(call.function.name, parsedArgs, sb, { userId, orgId });
          convo.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result).slice(0, 12000) });
        }
        continue; // volgende ronde
      }

      // Geen tool calls: stream final content terug naar client
      const finalText: string = msg?.content || "Geen antwoord ontvangen.";
      const stream = new ReadableStream({
        start(controller) {
          // chunked om streaming-gevoel te geven
          const chunks = finalText.match(/.{1,40}/gs) || [finalText];
          (async () => {
            for (const c of chunks) {
              controller.enqueue(sseEncode(c));
              await new Promise(r => setTimeout(r, 15));
            }
            controller.enqueue(sseDone());
            controller.close();
          })();
        },
      });
      return new Response(stream, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
    }

    // Fallback als max rounds bereikt
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(sseEncode("Het lukt me niet om dit binnen redelijke stappen te beantwoorden. Stel je vraag iets specifieker?"));
        controller.enqueue(sseDone());
        controller.close();
      },
    });
    return new Response(stream, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    console.error("ai-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Onbekende fout" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ----------------- Voorstel uitvoeren -----------------
async function executeVoorstel(voorstel: any, sb: any, ctx: { userId?: string; orgId?: string }): Promise<any> {
  const { kind, payload } = voorstel;
  if (!ctx.userId) throw new Error("Niet ingelogd");
  if (!ctx.orgId) throw new Error("Geen organisatie gevonden");
  if (kind === "reservering") {
    const required = ["voertuig_id", "klant_id", "start_datum", "eind_datum"];
    for (const r of required) if (!payload[r]) throw new Error(`Veld ontbreekt: ${r}`);
    const { data, error } = await sb.from("reserveringen").insert({
      voertuig_id: payload.voertuig_id,
      klant_id: payload.klant_id,
      start_datum: payload.start_datum,
      eind_datum: payload.eind_datum,
      dagprijs: Number(payload.dagprijs || 0),
      totaalprijs: Number(payload.totaalprijs || 0),
      status: payload.status || "bevestigd",
      notities: payload.notities || "Aangemaakt via Copilot",
    }).select("id").maybeSingle();
    if (error) throw new Error(error.message);
    return { ok: true, kind, id: data?.id, href: voorstel.open_after || `/reserveringen` };
  }
  if (kind === "rit") {
    const { data, error } = await sb.from("ritten").insert({
      organisatie_id: ctx.orgId,
      user_id: ctx.userId,
      datum: payload.datum,
      van_locatie: payload.van_locatie,
      naar_locatie: payload.naar_locatie,
      voertuig_id: payload.voertuig_id || null,
      chauffeur_id: payload.chauffeur_id || null,
      afstand_km: Number(payload.afstand_km || 0),
      kosten: Number(payload.kosten || 0),
      type: payload.type || "transport",
      status: payload.status || "gepland",
      notitie: payload.notitie || "Aangemaakt via Copilot",
    }).select("id").maybeSingle();
    if (error) throw new Error(error.message);
    return { ok: true, kind, id: data?.id, href: voorstel.open_after || `/ritten` };
  }
  if (kind === "onderhoud") {
    const { data, error } = await sb.from("service_historie").insert({
      organisatie_id: ctx.orgId,
      user_id: ctx.userId,
      voertuig_id: payload.voertuig_id,
      datum: payload.datum,
      omschrijving: payload.omschrijving,
      type: payload.type || "onderhoud",
      kosten: Number(payload.kosten || 0),
      garage: payload.garage || null,
      kilometerstand: payload.kilometerstand || null,
      notitie: payload.notitie || "Aangemaakt via Copilot",
    }).select("id").maybeSingle();
    if (error) throw new Error(error.message);
    return { ok: true, kind, id: data?.id, href: voorstel.open_after || `/onderhoud` };
  }
  if (kind === "klant") {
    const { data, error } = await sb.from("klanten").insert({
      organisatie_id: ctx.orgId,
      voornaam: payload.voornaam,
      achternaam: payload.achternaam,
      email: payload.email,
      telefoon: payload.telefoon || null,
      type: payload.type || "particulier",
      bedrijfsnaam: payload.bedrijfsnaam || null,
    }).select("id").maybeSingle();
    if (error) throw new Error(error.message);
    return { ok: true, kind, id: data?.id, href: voorstel.open_after || `/klanten` };
  }
  throw new Error(`Onbekend voorstel-type: ${kind}`);
}
