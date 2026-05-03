import { useEffect, useState } from "react";
import { Sparkles, Send, Check, ChevronRight, Car, Loader2 } from "lucide-react";

/**
 * Looping animatie van wat de Copilot kan:
 * 1. Vraag wordt getypt
 * 2. Copilot "denkt" (dots)
 * 3. Antwoord stroomt binnen met voertuigkaart
 * 4. Voorstel-kaart verschijnt met "Bevestig" knop
 * 5. Bevestiging → "Aangemaakt"
 * 6. Reset
 */

type Scene = {
  vraag: string;
  intro: string;
  voertuig: { kenteken: string; label: string; sub: string; status: string };
  voorstel: { kind: string; summary: string; confirm: string };
};

const SCENES: Scene[] = [
  {
    vraag: "Welke bestelbus is komende week 3 dagen vrij?",
    intro: "Eén bestelbus past perfect:",
    voertuig: {
      kenteken: "78-XY-901",
      label: "Mercedes Sprinter 314",
      sub: "3,5 m³ · 1.350 kg laadvermogen",
      status: "ma · di · wo vrij",
    },
    voorstel: {
      kind: "reservering",
      summary: "Reservering voor Lisa van den Berg, 4-6 mei in 78-XY-901, totaal € 270",
      confirm: "Bevestig en maak aan",
    },
  },
  {
    vraag: "Plan een rit Amsterdam → Rotterdam voor morgen",
    intro: "Voorbereid op basis van Google Routes:",
    voertuig: {
      kenteken: "12-AB-345",
      label: "VW Crafter L3H2",
      sub: "Chauffeur · Mark de Vries",
      status: "78 km · ± 1u05",
    },
    voorstel: {
      kind: "rit",
      summary: "Transport morgen 09:00, Amsterdam → Rotterdam, geschatte kosten € 27,30",
      confirm: "Bevestig en plan in",
    },
  },
  {
    vraag: "Welke 3 voertuigen kosten dit jaar het meest aan onderhoud?",
    intro: "Top 1 met afstand:",
    voertuig: {
      kenteken: "44-PQ-22",
      label: "Audi A4 Avant",
      sub: "€ 2.840 onderhoud · € 1.120 schade",
      status: "3 garagebezoeken",
    },
    voorstel: {
      kind: "onderhoud",
      summary: "APK + grote beurt inplannen op 12 mei bij Garage Bos, ± € 480",
      confirm: "Bevestig en plan onderhoud",
    },
  },
];

const TIMINGS = {
  type: 28,        // ms per char
  thinkAfterType: 500,
  think: 900,
  introDelay: 200,
  cardDelay: 400,
  voorstelDelay: 700,
  beforeConfirm: 1700,
  confirming: 900,
  done: 1900,
  reset: 700,
};

type Phase =
  | "typing"
  | "thinking"
  | "intro"
  | "card"
  | "voorstel"
  | "confirming"
  | "done";

export function CopilotShowcase() {
  const [sceneIdx, setSceneIdx] = useState(0);
  const [typed, setTyped] = useState("");
  const [phase, setPhase] = useState<Phase>("typing");
  const scene = SCENES[sceneIdx];

  // Type effect
  useEffect(() => {
    if (phase !== "typing") return;
    if (typed.length >= scene.vraag.length) {
      const t = setTimeout(() => setPhase("thinking"), TIMINGS.thinkAfterType);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setTyped(scene.vraag.slice(0, typed.length + 1)), TIMINGS.type);
    return () => clearTimeout(t);
  }, [typed, phase, scene.vraag]);

  // Phase progression
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    if (phase === "thinking") t = setTimeout(() => setPhase("intro"), TIMINGS.think);
    if (phase === "intro") t = setTimeout(() => setPhase("card"), TIMINGS.introDelay + TIMINGS.cardDelay);
    if (phase === "card") t = setTimeout(() => setPhase("voorstel"), TIMINGS.voorstelDelay);
    if (phase === "voorstel") t = setTimeout(() => setPhase("confirming"), TIMINGS.beforeConfirm);
    if (phase === "confirming") t = setTimeout(() => setPhase("done"), TIMINGS.confirming);
    if (phase === "done")
      t = setTimeout(() => {
        setTyped("");
        setSceneIdx((i) => (i + 1) % SCENES.length);
        setPhase("typing");
      }, TIMINGS.done + TIMINGS.reset);
    return () => clearTimeout(t);
  }, [phase]);

  const showAnswer = phase !== "typing" && phase !== "thinking";

  return (
    <div className="relative">
      {/* Glow */}
      <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent blur-2xl rounded-3xl pointer-events-none" />

      <div className="relative rounded-2xl border border-primary/20 bg-background shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground leading-tight">Vloot-Copilot</h3>
              <p className="text-[10px] text-muted-foreground leading-tight">Live data uit jouw vloot</p>
            </div>
          </div>
          <div className="flex gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-muted-foreground font-medium">online</span>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3 min-h-[420px] bg-gradient-to-b from-background to-muted/10">
          {/* User bubble */}
          <div className="flex justify-end animate-fade-in">
            <div className="max-w-[85%] rounded-xl px-3 py-2 text-sm bg-primary text-primary-foreground">
              {typed}
              {phase === "typing" && (
                <span className="inline-block w-[2px] h-3.5 bg-primary-foreground/80 ml-0.5 align-middle animate-pulse" />
              )}
            </div>
          </div>

          {/* Thinking */}
          {phase === "thinking" && (
            <div className="flex gap-2 animate-fade-in">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                <Sparkles className="w-3 h-3 text-primary" />
              </div>
              <div className="bg-muted rounded-xl px-3 py-2.5">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          {/* Answer */}
          {showAnswer && (
            <div className="flex gap-2 animate-fade-in">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                <Sparkles className="w-3 h-3 text-primary" />
              </div>
              <div className="max-w-[90%] rounded-xl px-3 py-2.5 text-sm bg-muted text-foreground space-y-2 flex-1">
                <p className="text-foreground">{scene.intro}</p>

                {/* Vehicle card */}
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-background border border-border animate-scale-in">
                  <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-yellow-300 text-black font-mono text-xs font-bold tracking-wider whitespace-nowrap">
                    {scene.voertuig.kenteken}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate flex items-center gap-1">
                      <Car className="w-3 h-3 text-muted-foreground" /> {scene.voertuig.label}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{scene.voertuig.sub}</p>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-medium whitespace-nowrap hidden sm:inline">
                    · {scene.voertuig.status}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </div>

                {/* Voorstel card */}
                {(phase === "voorstel" || phase === "confirming" || phase === "done") && (
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2 animate-scale-in">
                    <span className="inline-block text-[9px] uppercase tracking-wider font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                      Voorstel · {scene.voorstel.kind}
                    </span>
                    <p className="text-sm text-foreground">{scene.voorstel.summary}</p>
                    {phase === "done" ? (
                      <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
                        <Check className="w-4 h-4" /> Aangemaakt
                      </div>
                    ) : (
                      <button
                        className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground text-sm font-medium h-8 px-3"
                        disabled
                      >
                        {phase === "confirming" ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" /> Bezig...
                          </>
                        ) : (
                          scene.voorstel.confirm
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-3 border-t border-border bg-background">
          <div className="flex gap-2">
            <div className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm flex items-center text-muted-foreground">
              Vraag iets over je vloot...
            </div>
            <button className="h-9 w-9 rounded-md bg-primary text-primary-foreground inline-flex items-center justify-center" disabled>
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scene dots */}
        <div className="absolute top-3 right-16 flex gap-1">
          {SCENES.map((_, i) => (
            <span
              key={i}
              className={
                "w-1.5 h-1.5 rounded-full transition-colors " +
                (i === sceneIdx ? "bg-primary" : "bg-muted-foreground/30")
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}