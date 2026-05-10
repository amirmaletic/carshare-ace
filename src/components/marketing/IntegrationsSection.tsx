import { Sparkles, Plug } from "lucide-react";

type Status = "actief" | "binnenkort" | "gepland";

interface Integratie {
  naam: string;
  slug?: string; // simpleicons slug
  kleur?: string; // hex zonder #
  letter?: string; // fallback letter
  beschrijving: string;
  status: Status;
  categorie: string;
}

const integraties: Integratie[] = [
  // Voertuigdata
  { naam: "RDW", letter: "R", kleur: "1E3A8A", beschrijving: "Kenteken lookup met merk, APK en specs", status: "actief", categorie: "Voertuigdata" },
  { naam: "Imagin Studio", letter: "I", kleur: "0EA5E9", beschrijving: "Realistische voertuigafbeeldingen", status: "actief", categorie: "Voertuigdata" },
  { naam: "KVK", letter: "K", kleur: "0F172A", beschrijving: "Bedrijfsgegevens via KVK nummer", status: "actief", categorie: "Voertuigdata" },
  // Betalingen
  { naam: "Stripe", slug: "stripe", kleur: "635BFF", beschrijving: "Borg, betaalverificatie en betaallinks", status: "actief", categorie: "Betalingen" },
  { naam: "Mollie", slug: "mollie", kleur: "00B4C7", beschrijving: "Native iDEAL en SEPA via eigen Mollie account", status: "actief", categorie: "Betalingen" },
  // Boekhouding
  { naam: "Moneybird", slug: "moneybird", kleur: "2EBB7F", beschrijving: "Facturen direct doorzetten met BTW correct", status: "binnenkort", categorie: "Boekhouding" },
  { naam: "Exact Online", letter: "E", kleur: "DC2626", beschrijving: "Automatische journaalposten per kostenplaats", status: "binnenkort", categorie: "Boekhouding" },
  { naam: "AFAS Profit", letter: "A", kleur: "F97316", beschrijving: "Synchronisatie van facturen en bestuurders", status: "binnenkort", categorie: "Boekhouding" },
  { naam: "Yuki", letter: "Y", kleur: "B91C1C", beschrijving: "Maandelijkse export van kosten", status: "gepland", categorie: "Boekhouding" },
  { naam: "e-Boekhouden", letter: "e", kleur: "2563EB", beschrijving: "Automatische factuurverwerking", status: "gepland", categorie: "Boekhouding" },
  // Externe gegevens
  { naam: "Google Maps", slug: "googlemaps", kleur: "4285F4", beschrijving: "Afstand en tijd voor ritregistratie", status: "actief", categorie: "Externe data" },
  { naam: "Google Login", slug: "google", kleur: "4285F4", beschrijving: "Single sign on voor klantportaal en app", status: "actief", categorie: "Externe data" },
  // Communicatie
  { naam: "Resend", slug: "resend", kleur: "0F172A", beschrijving: "Transactionele e mail vanuit eigen domein", status: "actief", categorie: "Communicatie" },
  // AI
  { naam: "Lovable AI", letter: "L", kleur: "3B82F6", beschrijving: "AI Vloot Copilot met live data toegang", status: "actief", categorie: "AI" },
  // Developer
  { naam: "Open API", letter: "{ }", kleur: "0F172A", beschrijving: "REST endpoints voor voertuigen en contracten", status: "gepland", categorie: "Developer" },
  { naam: "Webhooks", letter: "↯", kleur: "0F172A", beschrijving: "Realtime events bij overdracht en schade", status: "gepland", categorie: "Developer" },
];

const statusLabel: Record<Status, string> = {
  actief: "Beschikbaar",
  binnenkort: "Binnenkort",
  gepland: "Gepland",
};

const statusClasses: Record<Status, string> = {
  actief: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  binnenkort: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  gepland: "bg-muted text-muted-foreground border-border",
};

function LogoMark({ item }: { item: Integratie }) {
  if (item.slug) {
    return (
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center bg-white border border-border shadow-sm overflow-hidden"
        style={{ boxShadow: `0 0 0 1px hsl(var(--border)), 0 4px 12px -4px #${item.kleur}33` }}
      >
        <img
          src={`https://cdn.simpleicons.org/${item.slug}/${item.kleur ?? "0F172A"}`}
          alt={`${item.naam} logo`}
          className="w-7 h-7 object-contain"
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
            (e.currentTarget.parentElement as HTMLElement).innerText = item.letter ?? item.naam[0];
          }}
        />
      </div>
    );
  }
  return (
    <div
      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm"
      style={{ backgroundColor: `#${item.kleur ?? "0F172A"}` }}
    >
      {item.letter ?? item.naam[0]}
    </div>
  );
}

export default function IntegrationsSection() {
  return (
    <section id="integraties" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-border bg-muted/20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
            <Plug className="w-3.5 h-3.5" /> Koppelingen en integraties
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            Werkt naadloos met de tools die jij al gebruikt
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Van RDW kenteken lookup tot Stripe betaallinks, Moneybird boekhouding en Google Maps
            ritafstanden. FleeFlo verbindt automatisch met de partijen die jouw werk vereenvoudigen.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {integraties.map((item) => (
            <article
              key={item.naam}
              className="group relative p-5 rounded-2xl border border-border bg-background hover:border-primary/30 hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-start gap-4">
                <LogoMark item={item} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-foreground truncate">{item.naam}</h3>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${statusClasses[item.status]}`}
                    >
                      {statusLabel[item.status]}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-snug">{item.beschrijving}</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-2 uppercase tracking-wide">
                    {item.categorie}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 text-center">
          <p className="text-sm text-muted-foreground inline-flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Mis je een koppeling? Vraag het via support en we nemen het mee in de roadmap.
          </p>
        </div>
      </div>
    </section>
  );
}