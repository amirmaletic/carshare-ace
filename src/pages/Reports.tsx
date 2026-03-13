import { BarChart3, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

const costData = [
  { maand: 'Okt', brandstof: 1200, onderhoud: 800, verzekering: 600 },
  { maand: 'Nov', brandstof: 1100, onderhoud: 1400, verzekering: 600 },
  { maand: 'Dec', brandstof: 900, onderhoud: 400, verzekering: 600 },
  { maand: 'Jan', brandstof: 1300, onderhoud: 600, verzekering: 600 },
  { maand: 'Feb', brandstof: 1150, onderhoud: 900, verzekering: 600 },
  { maand: 'Mrt', brandstof: 1250, onderhoud: 750, verzekering: 600 },
];

const occupancyData = [
  { maand: 'Okt', bezetting: 72 },
  { maand: 'Nov', bezetting: 68 },
  { maand: 'Dec', bezetting: 55 },
  { maand: 'Jan', bezetting: 78 },
  { maand: 'Feb', bezetting: 82 },
  { maand: 'Mrt', bezetting: 85 },
];

export default function Reports() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rapportages</h1>
          <p className="text-muted-foreground mt-1">Inzicht in kosten, opbrengsten en bezettingsgraad</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Exporteer rapport
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="clean-card p-6">
          <h3 className="font-semibold text-foreground mb-4">Kosten per categorie</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={costData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 92%)" />
              <XAxis dataKey="maand" tick={{ fill: 'hsl(215, 14%, 46%)', fontSize: 12 }} />
              <YAxis tick={{ fill: 'hsl(215, 14%, 46%)', fontSize: 12 }} tickFormatter={v => `€${v}`} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(214, 20%, 92%)' }} />
              <Bar dataKey="brandstof" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} name="Brandstof" />
              <Bar dataKey="onderhoud" fill="hsl(221, 83%, 70%)" radius={[4, 4, 0, 0]} name="Onderhoud" />
              <Bar dataKey="verzekering" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} name="Verzekering" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="clean-card p-6">
          <h3 className="font-semibold text-foreground mb-4">Bezettingsgraad (%)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={occupancyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 92%)" />
              <XAxis dataKey="maand" tick={{ fill: 'hsl(215, 14%, 46%)', fontSize: 12 }} />
              <YAxis tick={{ fill: 'hsl(215, 14%, 46%)', fontSize: 12 }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(214, 20%, 92%)' }} formatter={(v: number) => [`${v}%`, 'Bezetting']} />
              <Line type="monotone" dataKey="bezetting" stroke="hsl(221, 83%, 53%)" strokeWidth={2.5} dot={{ r: 4, fill: 'hsl(221, 83%, 53%)' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="clean-card p-6">
        <h3 className="font-semibold text-foreground mb-4">KPI Overzicht</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Gem. dagprijs', value: '€57' },
            { label: 'Bezettingsgraad', value: '85%' },
            { label: 'Gem. huurperiode', value: '5,2 dagen' },
            { label: 'Onderhoudskosten/voertuig', value: '€218/mnd' },
          ].map(kpi => (
            <div key={kpi.label} className="text-center">
              <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{kpi.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
