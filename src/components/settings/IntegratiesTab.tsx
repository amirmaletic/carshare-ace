import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Plug, BookOpen, Webhook, FileSpreadsheet, ShieldCheck } from "lucide-react";

/**
 * Integraties-overzicht.
 *
 * Toont per categorie welke koppelingen actief, in voorbereiding of gepland zijn.
 * Speelt direct in op het belangrijkste pijnpunt uit het marktonderzoek:
 * Nederlands mkb mist combi van RDW + boekhouding + payments in 1 tool.
 */

type Status = "actief" | "binnenkort" | "gepland";

interface Integratie {
  naam: string;
  beschrijving: string;
  status: Status;
}

interface Categorie {
  titel: string;
  icon: React.ComponentType<{ className?: string }>;
  items: Integratie[];
}

const categorieen: Categorie[] = [
  {
    titel: "Voertuigdata",
    icon: ShieldCheck,
    items: [
      { naam: "RDW Kentekenregister", beschrijving: "Automatisch merk, model, APK en technische specs ophalen", status: "actief" },
      { naam: "Imagin Studio", beschrijving: "Realistische voertuigafbeeldingen op basis van merk en model", status: "actief" },
    ],
  },
  {
    titel: "Boekhouding",
    icon: FileSpreadsheet,
    items: [
      { naam: "Exact Online", beschrijving: "Automatische journaalposten per kostenplaats", status: "binnenkort" },
      { naam: "AFAS Profit", beschrijving: "Synchronisatie van facturen en bestuurders met AFAS", status: "binnenkort" },
      { naam: "Moneybird", beschrijving: "Facturen direct doorzetten met BTW-correcte boekingsregels", status: "binnenkort" },
      { naam: "Yuki", beschrijving: "Maandelijkse export van kosten naar de boekhouding", status: "gepland" },
      { naam: "e-Boekhouden", beschrijving: "Koppeling voor automatische factuurverwerking", status: "gepland" },
    ],
  },
  {
    titel: "Betalingen",
    icon: Plug,
    items: [
      { naam: "Stripe", beschrijving: "Borg-verificatie en facturen via creditcard en iDEAL", status: "actief" },
      { naam: "Mollie", beschrijving: "Native iDEAL en SEPA voor Nederlandse klanten", status: "gepland" },
    ],
  },
  {
    titel: "Externe gegevens",
    icon: BookOpen,
    items: [
      { naam: "KVK Handelsregister", beschrijving: "Bedrijfsgegevens automatisch invullen via KVK-nummer", status: "actief" },
      { naam: "Google Maps Routes", beschrijving: "Afstand- en tijdberekening voor ritregistratie", status: "actief" },
    ],
  },
  {
    titel: "Voor ontwikkelaars",
    icon: Webhook,
    items: [
      { naam: "Open API", beschrijving: "REST endpoints voor voertuigen, contracten en ritten", status: "gepland" },
      { naam: "Webhooks", beschrijving: "Realtime events bij overdracht, schade en terugmelding", status: "gepland" },
    ],
  },
];

function StatusBadge({ status }: { status: Status }) {
  if (status === "actief") {
    return (
      <Badge className="bg-success/15 text-success hover:bg-success/20 border-success/30 gap-1">
        <CheckCircle2 className="w-3 h-3" />
        Actief
      </Badge>
    );
  }
  if (status === "binnenkort") {
    return (
      <Badge className="bg-primary/10 text-primary hover:bg-primary/15 border-primary/30 gap-1">
        <Clock className="w-3 h-3" />
        Binnenkort
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="gap-1">
      <Clock className="w-3 h-3" />
      Gepland
    </Badge>
  );
}

export default function IntegratiesTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Integraties</CardTitle>
        <CardDescription>
          Overzicht van actieve en aankomende koppelingen met externe systemen.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {categorieen.map((cat) => {
          const Icon = cat.icon;
          return (
            <div key={cat.titel}>
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">{cat.titel}</h3>
              </div>
              <div className="space-y-2">
                {cat.items.map((item) => (
                  <div
                    key={item.naam}
                    className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/30 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{item.naam}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.beschrijving}</p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}