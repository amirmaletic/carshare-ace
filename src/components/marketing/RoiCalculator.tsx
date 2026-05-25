import { useMemo, useState } from "react";
import { TrendingUp, Clock, Euro, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

function fmtEuro(n: number): string {
  return n.toLocaleString("nl-NL", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function pricePerVehicle(n: number): number {
  if (n <= 10) return 4.5;
  if (n <= 50) return 3.75;
  if (n <= 150) return 3.0;
  return 2.25;
}

type FieldProps = {
  label: string;
  suffix?: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  step?: number;
};

function NumField({ label, suffix, value, onChange, min = 0, step = 1 }: FieldProps) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-foreground mb-1.5">{label}</span>
      <div className="relative">
        <Input
          type="number"
          inputMode="decimal"
          min={min}
          step={step}
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="pr-12"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}

export default function RoiCalculator() {
  const [voertuigen, setVoertuigen] = useState(15);
  const [urenPerWeek, setUrenPerWeek] = useState(12);
  const [uurloon, setUurloon] = useState(35);
  const [dagprijs, setDagprijs] = useState(65);
  const [bezettingsWinst, setBezettingsWinst] = useState(8);

  const result = useMemo(() => {
    const tijdsbesparingPct = 0.6;
    const uurBesparing = urenPerWeek * tijdsbesparingPct * 4.33;
    const tijdEuro = uurBesparing * uurloon;

    const extraDagenPerVoertuig = (bezettingsWinst / 100) * 30;
    const omzetUplift = voertuigen * extraDagenPerVoertuig * dagprijs;

    const schadeBesparing = voertuigen * 12;

    const totaal = tijdEuro + omzetUplift + schadeBesparing;
    const fleefloKosten = voertuigen * pricePerVehicle(voertuigen);
    const netto = totaal - fleefloKosten;
    const roi = fleefloKosten > 0 ? (netto / fleefloKosten) * 100 : 0;

    return {
      uurBesparing,
      tijdEuro,
      omzetUplift,
      schadeBesparing,
      totaal,
      fleefloKosten,
      netto,
      roi,
    };
  }, [voertuigen, urenPerWeek, uurloon, dagprijs, bezettingsWinst]);

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30 border-y border-border">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            ROI calculator
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Bereken wat FleeFlo jou oplevert
          </h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            Vul je situatie in. We tonen direct hoeveel tijd en omzet je per maand
            terugverdient ten opzichte van de kosten van FleeFlo.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Inputs */}
          <div className="lg:col-span-2 rounded-2xl border border-border bg-background p-6 space-y-4">
            <h3 className="font-semibold text-foreground mb-2">Jouw situatie</h3>
            <NumField
              label="Aantal voertuigen in je vloot"
              value={voertuigen}
              onChange={setVoertuigen}
              min={1}
            />
            <NumField
              label="Uren administratie per week"
              suffix="uur"
              value={urenPerWeek}
              onChange={setUrenPerWeek}
            />
            <NumField
              label="Gemiddeld uurloon medewerker"
              suffix="€"
              value={uurloon}
              onChange={setUurloon}
            />
            <NumField
              label="Gemiddelde dagprijs per voertuig"
              suffix="€"
              value={dagprijs}
              onChange={setDagprijs}
            />
            <NumField
              label="Verwachte stijging bezettingsgraad"
              suffix="%"
              value={bezettingsWinst}
              onChange={setBezettingsWinst}
              min={0}
            />
            <p className="text-xs text-muted-foreground pt-1">
              Aannames gebaseerd op gemiddelden van vergelijkbare verhuurders.
            </p>
          </div>

          {/* Results */}
          <div className="lg:col-span-3 rounded-2xl border border-primary/30 bg-card p-6 flex flex-col">
            <h3 className="font-semibold text-foreground mb-4">Jouw maandelijkse winst</h3>

            <div className="grid sm:grid-cols-3 gap-3 mb-6">
              <div className="rounded-xl bg-muted/50 p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-wide font-medium">Tijdwinst</span>
                </div>
                <p className="text-2xl font-bold text-foreground tabular-nums">
                  {Math.round(result.uurBesparing)} u
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  ≈ €{fmtEuro(result.tijdEuro)} p/m
                </p>
              </div>
              <div className="rounded-xl bg-muted/50 p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-wide font-medium">Extra omzet</span>
                </div>
                <p className="text-2xl font-bold text-foreground tabular-nums">
                  €{fmtEuro(result.omzetUplift)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">door hogere bezetting</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Euro className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-wide font-medium">Schade</span>
                </div>
                <p className="text-2xl font-bold text-foreground tabular-nums">
                  €{fmtEuro(result.schadeBesparing)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">minder discussie</p>
              </div>
            </div>

            <div className="rounded-xl bg-[linear-gradient(135deg,hsl(var(--primary)/0.12),hsl(var(--accent-violet)/0.12))] border border-primary/20 p-5 mb-5">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-sm text-muted-foreground">Totale besparing per maand</span>
                <span className="text-3xl font-extrabold text-foreground tabular-nums">
                  €{fmtEuro(result.totaal)}
                </span>
              </div>
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-muted-foreground">FleeFlo kosten</span>
                <span className="font-semibold text-foreground tabular-nums">
                  €{fmtEuro(result.fleefloKosten)}
                </span>
              </div>
              <div className="border-t border-primary/20 mt-3 pt-3 flex items-baseline justify-between">
                <span className="font-semibold text-foreground">Netto resultaat</span>
                <div className="text-right">
                  <div className="text-2xl font-extrabold text-primary tabular-nums">
                    €{fmtEuro(result.netto)}
                  </div>
                  <div className="text-xs text-muted-foreground tabular-nums">
                    ROI {Math.round(result.roi)}%
                  </div>
                </div>
              </div>
            </div>

            <Button asChild size="lg" className="mt-auto">
              <Link to="/auth?mode=signup">Start 30 dagen gratis</Link>
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-2">
              Geen creditcard nodig. Indicatieve berekening, geen garantie.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}