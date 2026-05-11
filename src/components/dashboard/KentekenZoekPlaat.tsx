import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Car } from "lucide-react";
import { useVoertuigen } from "@/hooks/useVoertuigen";
import { toast } from "sonner";

function normaliseer(input: string) {
  return input.replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

/**
 * Plaatst streepjes volgens de Nederlandse sidecodes 1 t/m 14.
 * L = letter, C = cijfer. Patroon strings beschrijven 6 karakters
 * en de streepjes worden tussen de groepen gezet.
 */
const SIDECODES: string[] = [
  "LL-CC-CC", // 1
  "CC-CC-LL", // 2
  "CC-LL-CC", // 3
  "LL-CC-LL", // 4
  "LL-LL-CC", // 5
  "CC-LL-LL", // 6
  "CC-LLL-C", // 7
  "C-LLL-CC", // 8
  "LL-CCC-L", // 9
  "L-CCC-LL", // 10
  "LLL-CC-L", // 11
  "L-CC-LLL", // 12
  "C-LL-CCC", // 13
  "CCC-LL-C", // 14
];

function matchSidecode(k: string): string | null {
  if (k.length !== 6) return null;
  for (const code of SIDECODES) {
    const stripped = code.replace(/-/g, "");
    let ok = true;
    for (let i = 0; i < 6; i++) {
      const c = k[i];
      const t = stripped[i];
      if (t === "L" && !/[A-Z]/.test(c)) { ok = false; break; }
      if (t === "C" && !/[0-9]/.test(c)) { ok = false; break; }
    }
    if (ok) {
      // bouw geformatteerd resultaat met streepjes op juiste plek
      let out = "";
      let idx = 0;
      for (const ch of code) {
        if (ch === "-") out += "-";
        else { out += k[idx]; idx++; }
      }
      return out;
    }
  }
  return null;
}

function formatVoorWeergave(raw: string) {
  const k = normaliseer(raw);
  const sidecode = matchSidecode(k);
  if (sidecode) return sidecode;
  // fallback: 6 tekens als 2-2-2, anders ruw
  if (k.length === 6) return `${k.slice(0, 2)}-${k.slice(2, 4)}-${k.slice(4, 6)}`;
  return k;
}

function isGeldigKenteken(k: string): boolean {
  return matchSidecode(k) !== null;
}

/**
 * Nederlandse kentekenzoeker, gestyled als geel/blauwe NL plaat.
 * Bij submit wordt het kenteken doorgezet naar /voertuigen?kenteken=...
 * waar de Vehicles-pagina het bijbehorende voertuig direct opent.
 */
export function KentekenZoekPlaat() {
  const [waarde, setWaarde] = useState("");
  const [focus, setFocus] = useState(false);
  const navigate = useNavigate();
  const { voertuigen = [] } = useVoertuigen();

  const norm = normaliseer(waarde);
  const zoek = waarde.trim().toLowerCase();

  const suggesties = useMemo(() => {
    if (zoek.length < 1) return [];
    return voertuigen
      .filter((v) => {
        const k = normaliseer(v.kenteken ?? "");
        const merk = (v.merk ?? "").toLowerCase();
        const model = (v.model ?? "").toLowerCase();
        return (
          (norm.length > 0 && k.includes(norm)) ||
          merk.includes(zoek) ||
          model.includes(zoek) ||
          `${merk} ${model}`.includes(zoek)
        );
      })
      .slice(0, 6);
  }, [voertuigen, norm, zoek]);

  const gaNaar = (kenteken: string) => {
    navigate(`/voertuigen?kenteken=${encodeURIComponent(formatVoorWeergave(kenteken))}`);
  };

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (suggesties.length > 0) {
      gaNaar(suggesties[0].kenteken);
      return;
    }
    if (!isGeldigKenteken(norm)) {
      toast.error("Geen geldig Nederlands kenteken", {
        description: "Gebruik een sidecode 1 t/m 14, bijvoorbeeld 12-ABC-3.",
      });
      return;
    }
    toast.error(`Kenteken ${formatVoorWeergave(norm)} niet in je vloot`, {
      description: "Voeg het toe via voertuigen of de RDW lookup.",
    });
    gaNaar(norm);
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <form
        onSubmit={submit}
        className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4"
      >
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Kentekenzoeker
        </p>
        <p className="text-sm text-foreground mt-0.5">
          Vind direct een voertuig in je vloot
        </p>
      </div>

      {/* NL plaat */}
      <div className="flex items-stretch rounded-md overflow-hidden shadow-md ring-1 ring-black/10 select-none w-full sm:w-auto">
        {/* Blauwe EU band */}
        <div className="flex flex-col items-center justify-center bg-[#003399] text-white px-2 py-1.5 min-w-[34px]">
          <div className="flex flex-col gap-0.5" aria-hidden>
            {[0, 1, 2, 3].map((r) => (
              <div key={r} className="flex gap-0.5">
                {[0, 1, 2].map((c) => (
                  <span
                    key={c}
                    className="w-[3px] h-[3px] rounded-full"
                    style={{
                      background:
                        (r + c) % 2 === 0 ? "#FFCC00" : "transparent",
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
          <span className="mt-1 text-[10px] font-bold tracking-wide">NL</span>
        </div>

        {/* Gele input */}
        <label className="flex-1 sm:flex-none bg-[#FFCC00]">
          <span className="sr-only">Kenteken</span>
          <input
            value={waarde}
            onChange={(e) => setWaarde(e.target.value)}
            onFocus={() => setFocus(true)}
            onBlur={() => setTimeout(() => setFocus(false), 150)}
            placeholder="AB-12-CD"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            maxLength={10}
            className="bg-transparent w-full sm:w-[170px] px-3 py-2 text-center text-[#0a1f4a] placeholder:text-[#0a1f4a]/40 font-bold tracking-[0.18em] text-xl uppercase font-mono outline-none focus:outline-none"
            style={{ letterSpacing: "0.18em" }}
          />
        </label>
      </div>

      <button
        type="submit"
        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        Zoeken
        <ArrowRight className="w-4 h-4" />
      </button>
      </form>

      {focus && zoek.length > 0 && (
        <div className="border-t border-border bg-muted/30 animate-fade-in">
          {suggesties.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              Geen voertuigen gevonden voor "{waarde}"
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {suggesties.map((v) => (
                <li key={v.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      gaNaar(v.kenteken);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-accent/60 transition-colors"
                  >
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 text-primary shrink-0">
                      <Car className="w-4 h-4" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium text-foreground truncate">
                        {v.merk} {v.model}
                      </span>
                      <span className="block text-xs text-muted-foreground truncate">
                        {v.locatie ?? "Onbekende locatie"}
                      </span>
                    </span>
                    <span className="font-mono text-xs font-bold tracking-wider px-2 py-1 rounded bg-[#FFCC00] text-[#0a1f4a] ring-1 ring-black/10">
                      {formatVoorWeergave(v.kenteken)}
                    </span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}