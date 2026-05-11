import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useVoertuigen } from "@/hooks/useVoertuigen";
import { toast } from "sonner";

function normaliseer(input: string) {
  return input.replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

function formatVoorWeergave(raw: string) {
  const k = normaliseer(raw);
  if (k.length === 6) return `${k.slice(0, 2)}-${k.slice(2, 4)}-${k.slice(4, 6)}`;
  if (k.length > 6) return `${k.slice(0, 2)}-${k.slice(2, 4)}-${k.slice(4, 8)}`;
  return k;
}

/**
 * Nederlandse kentekenzoeker, gestyled als geel/blauwe NL plaat.
 * Bij submit wordt het kenteken doorgezet naar /voertuigen?kenteken=...
 * waar de Vehicles-pagina het bijbehorende voertuig direct opent.
 */
export function KentekenZoekPlaat() {
  const [waarde, setWaarde] = useState("");
  const navigate = useNavigate();
  const { data: voertuigen = [] } = useVoertuigen();

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const norm = normaliseer(waarde);
    if (norm.length < 4) {
      toast.error("Voer een geldig kenteken in");
      return;
    }
    const match = voertuigen.find(
      (v) => normaliseer(v.kenteken) === norm
    );
    if (!match) {
      toast.error(`Kenteken ${formatVoorWeergave(norm)} niet in je vloot`, {
        description: "Voeg het toe via voertuigen of de RDW lookup.",
      });
    }
    navigate(`/voertuigen?kenteken=${encodeURIComponent(formatVoorWeergave(norm))}`);
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-border bg-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4"
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
  );
}