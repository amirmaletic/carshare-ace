// RDW Open Data lookup - geen API key nodig
// Bron: https://opendata.rdw.nl

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function normaliseerKenteken(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function mapBrandstof(rdw: string | undefined): "Benzine" | "Diesel" | "Elektrisch" | "Hybride" {
  if (!rdw) return "Benzine";
  const v = rdw.toLowerCase();
  if (v.includes("elektr")) return "Elektrisch";
  if (v.includes("diesel")) return "Diesel";
  if (v.includes("hybride") || v.includes("lpg") || v.includes("cng")) return "Hybride";
  return "Benzine";
}

function titleCase(s: string | undefined): string {
  if (!s) return "";
  return s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()).trim();
}

function formatYmd(rdwDate: string | undefined): string | null {
  // RDW levert "20180317" of "2018-03-17"
  if (!rdwDate) return null;
  const clean = rdwDate.replace(/-/g, "");
  if (clean.length !== 8) return null;
  return `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const url = new URL(req.url);
    let kenteken = url.searchParams.get("kenteken") ?? "";
    if (!kenteken && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      kenteken = body.kenteken ?? "";
    }
    const norm = normaliseerKenteken(kenteken);
    if (norm.length < 4 || norm.length > 8) {
      return new Response(JSON.stringify({ error: "Ongeldig kenteken" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Hoofdtabel: voertuigen
    const baseUrl = `https://opendata.rdw.nl/resource/m9d7-ebf2.json?kenteken=${norm}`;
    const brandstofUrl = `https://opendata.rdw.nl/resource/8ys7-d773.json?kenteken=${norm}`;

    const [baseRes, fuelRes] = await Promise.all([
      fetch(baseUrl, { headers: { Accept: "application/json" } }),
      fetch(brandstofUrl, { headers: { Accept: "application/json" } }),
    ]);

    if (!baseRes.ok) throw new Error(`RDW status ${baseRes.status}`);
    const baseArr = await baseRes.json();
    if (!Array.isArray(baseArr) || baseArr.length === 0) {
      return new Response(JSON.stringify({ error: "Kenteken niet gevonden bij RDW" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const v = baseArr[0];
    const fuelArr = fuelRes.ok ? await fuelRes.json() : [];
    const f = Array.isArray(fuelArr) && fuelArr.length > 0 ? fuelArr[0] : {};

    const eersteToelating = formatYmd(v.datum_eerste_toelating);
    const apk = formatYmd(v.vervaldatum_apk);
    const bouwjaar = eersteToelating ? Number(eersteToelating.slice(0, 4)) : null;

    const result = {
      kenteken: norm,
      merk: titleCase(v.merk),
      model: titleCase(v.handelsbenaming),
      bouwjaar,
      kleur: titleCase(v.eerste_kleur) || "Onbekend",
      brandstof: mapBrandstof(f.brandstof_omschrijving),
      apk_vervaldatum: apk,
      eerste_toelating: eersteToelating,
      voertuigsoort: titleCase(v.voertuigsoort),
      catalogusprijs: v.catalogusprijs ? Number(v.catalogusprijs) : null,
      cilinderinhoud: v.cilinderinhoud ? Number(v.cilinderinhoud) : null,
      massa_ledig: v.massa_ledig_voertuig ? Number(v.massa_ledig_voertuig) : null,
      co2_uitstoot: f.co2_uitstoot_gecombineerd ? Number(f.co2_uitstoot_gecombineerd) : null,
    };

    return new Response(JSON.stringify(result), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("rdw-lookup error", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});