import { Tablet, Smartphone, PenLine, CheckCircle2 } from "lucide-react";
import productTerugmelden from "@/assets/screenshot-terugmelden.png";
import productDashboard from "@/assets/screenshot-dashboard.png";

export default function DevicesSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 border-b border-border bg-muted/20" id="devices">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
            <Tablet className="w-3.5 h-3.5" /> Tablet · Mobiel · Desktop
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Werkt op elk apparaat, ook bij de auto
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Onderteken op de tablet bij overdracht en terugmelding, beheer je vloot vanaf je telefoon
            en stuur het hele bedrijf vanaf je desktop. Zonder app installatie, direct in de browser.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Tablet - signing */}
          <div className="flex flex-col items-center">
            <div className="relative">
              {/* Tablet frame landscape */}
              <div className="relative bg-foreground rounded-[28px] p-3 shadow-2xl shadow-primary/20 border border-border/50">
                <div className="relative bg-background rounded-[18px] overflow-hidden border border-border/30" style={{ width: "min(520px, 80vw)", aspectRatio: "4 / 3" }}>
                  <img
                    src={productTerugmelden}
                    alt="Digitale handtekening op tablet bij overdracht en terugmelding van een huurauto"
                    className="w-full h-full object-cover object-top"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                {/* camera dot */}
                <div className="absolute top-1/2 -translate-y-1/2 right-1.5 w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-4 -left-4 bg-card border border-border rounded-xl shadow-lg px-3 py-2 flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/15">
                  <PenLine className="w-4 h-4 text-primary" />
                </div>
                <div className="text-xs">
                  <div className="font-semibold text-foreground">Digitaal ondertekenen</div>
                  <div className="text-muted-foreground">Pick up en return</div>
                </div>
              </div>
            </div>
            <div className="mt-10 text-center max-w-sm">
              <h3 className="text-xl font-bold text-foreground flex items-center justify-center gap-2">
                <Tablet className="w-5 h-5 text-primary" /> Tablet bij de auto
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Laat klanten direct tekenen op de iPad of Android tablet. Inclusief kilometerstand,
                fotobewijs en visuele schade inspectie op de SVG voertuigschets.
              </p>
              <ul className="mt-4 space-y-1.5 text-sm text-foreground text-left inline-block">
                {[
                  "Handtekening met vinger of stylus",
                  "Foto upload direct vanaf de camera",
                  "Werkt offline tolerant in de browser",
                ].map((i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    {i}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Phone */}
          <div className="flex flex-col items-center">
            <div className="relative">
              {/* Phone frame */}
              <div className="relative bg-foreground rounded-[42px] p-2.5 shadow-2xl shadow-primary/20 border border-border/50">
                <div className="relative bg-background rounded-[32px] overflow-hidden border border-border/30" style={{ width: "min(260px, 60vw)", aspectRatio: "9 / 19" }}>
                  <img
                    src={productDashboard}
                    alt="FleeFlo dashboard op mobiel met vloot, reserveringen en taken onderweg"
                    className="w-full h-full object-cover object-left-top"
                    loading="lazy"
                    decoding="async"
                  />
                  {/* Notch */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-5 bg-foreground rounded-full" />
                </div>
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-4 -right-4 bg-card border border-border rounded-xl shadow-lg px-3 py-2 flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/15">
                  <Smartphone className="w-4 h-4 text-primary" />
                </div>
                <div className="text-xs">
                  <div className="font-semibold text-foreground">Altijd in je broekzak</div>
                  <div className="text-muted-foreground">Geen app nodig</div>
                </div>
              </div>
            </div>
            <div className="mt-10 text-center max-w-sm">
              <h3 className="text-xl font-bold text-foreground flex items-center justify-center gap-2">
                <Smartphone className="w-5 h-5 text-primary" /> Mobiel onderweg
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Bekijk reserveringen, voeg snel een schade toe of zoek een voertuig op kenteken.
                Het volledige platform, geoptimaliseerd voor je telefoon.
              </p>
              <ul className="mt-4 space-y-1.5 text-sm text-foreground text-left inline-block">
                {[
                  "Reserveringen en planning op zak",
                  "Snel zoeken op kenteken of klant",
                  "Push notificaties via e mail",
                ].map((i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    {i}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}