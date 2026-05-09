import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Car, UserPlus, FileText, Users, Gauge, AlertTriangle, Sparkles, ArrowRight, Mail } from "lucide-react";
import { MigratieWizard } from "@/components/migratie/MigratieWizard";
import { DATATYPES, type MigratieDatatype } from "@/lib/migratie-types";
import { Helmet } from "react-helmet-async";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Car, UserPlus, FileText, Users, Gauge, AlertTriangle,
};

export default function Migratie() {
  const [open, setOpen] = useState<MigratieDatatype | null>(null);

  return (
    <div className="space-y-6">
      <Helmet><title>Migratie | FleeFlo</title></Helmet>

      <div className="rounded-2xl premium-card p-6 relative overflow-hidden">
        <div className="absolute inset-0 mesh-bg opacity-50 pointer-events-none" />
        <div className="relative space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="w-3 h-3" /> AI-powered migratie
          </div>
          <h1 className="text-2xl font-bold gradient-text">Wagenpark migreren</h1>
          <p className="text-sm text-muted-foreground max-w-xl">
            Upload een Excel of CSV uit je vorige systeem. Onze AI herkent automatisch welke kolom welk veld is, ongeacht de taal of opmaak. Je hoeft alleen te bevestigen.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(Object.values(DATATYPES)).map((spec) => {
          const Icon = ICONS[spec.icon] ?? Car;
          return (
            <button key={spec.key} onClick={() => setOpen(spec.key)} className="text-left">
              <Card className="premium-card p-5 h-full transition-all hover:-translate-y-0.5 group">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </div>
                <h3 className="font-semibold mb-1">{spec.label}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">{spec.beschrijving}</p>
              </Card>
            </button>
          );
        })}
      </div>

      <Card className="premium-card p-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-500/5 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
          <Mail className="w-5 h-5 text-violet-500" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm">Liever niet zelf doen?</h3>
          <p className="text-xs text-muted-foreground">Mail je export naar support@fleeflo.nl, wij zetten je wagenpark binnen 1 werkdag voor je over.</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <a href="mailto:support@fleeflo.nl?subject=Wagenpark%20migratie%20hulp">Mail ons</a>
        </Button>
      </Card>

      {open && <MigratieWizard datatype={open} open={!!open} onOpenChange={(o) => !o && setOpen(null)} />}
    </div>
  );
}