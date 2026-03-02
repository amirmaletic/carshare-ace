import { Settings, Shield, Bell, Database } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Instellingen</h1>
        <p className="text-muted-foreground mt-1">Beheer je account en applicatie-instellingen</p>
      </div>

      <div className="grid gap-4 max-w-2xl">
        {[
          { icon: Shield, title: 'Gebruikersbeheer', desc: 'Beheerders, medewerkers, chauffeurs en klanten beheren' },
          { icon: Bell, title: 'Notificaties', desc: 'Automatische meldingen voor APK, verzekering en onderhoud' },
          { icon: Database, title: 'Integraties', desc: 'Koppel externe APIs voor kentekeninformatie en betalingen' },
          { icon: Settings, title: 'Algemeen', desc: 'Bedrijfsgegevens, tarieven en voorwaarden instellen' },
        ].map((item, i) => (
          <div key={i} className="glass-card rounded-xl p-5 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="p-2.5 rounded-lg bg-primary/10">
              <item.icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
