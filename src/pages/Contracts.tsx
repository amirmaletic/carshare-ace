import { useState } from "react";
import { Search, Plus, FileText, Euro, AlertCircle, Bike, Zap, Car, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  contracts, getVehicleById, getContractStatusColor,
  getContractTypeLabel, getContractTypeIcon, getInvoiceStatusColor,
  type Contract, type ContractType,
} from "@/data/mockData";
import { cn } from "@/lib/utils";

const typeFilters: { value: string; label: string; icon: React.ReactNode }[] = [
  { value: 'Alle', label: 'Alle', icon: <FileText className="w-3.5 h-3.5" /> },
  { value: 'lease', label: 'Autolease', icon: <Car className="w-3.5 h-3.5" /> },
  { value: 'verhuur', label: 'Verhuur', icon: <FileText className="w-3.5 h-3.5" /> },
  { value: 'fietslease', label: 'Fietslease', icon: <Bike className="w-3.5 h-3.5" /> },
  { value: 'ev-lease', label: 'EV Lease', icon: <Zap className="w-3.5 h-3.5" /> },
];

const activeContracts = contracts.filter(c => c.status === 'actief');
const totalMonthlyRevenue = activeContracts.reduce((sum, c) => sum + c.maandprijs, 0);
const overdueInvoices = contracts.flatMap(c => c.facturen).filter(f => f.status === 'te_laat' || f.status === 'herinnering_verstuurd');
const totalOverdue = overdueInvoices.reduce((sum, f) => sum + f.bedrag, 0);

export default function Contracts() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("Alle");
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const filtered = contracts.filter(c => {
    const matchesSearch =
      c.contractNummer.toLowerCase().includes(search.toLowerCase()) ||
      c.klantNaam.toLowerCase().includes(search.toLowerCase()) ||
      (c.bedrijf && c.bedrijf.toLowerCase().includes(search.toLowerCase()));
    const matchesType = typeFilter === "Alle" || c.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const openContract = (contract: Contract) => {
    setSelectedContract(contract);
    setDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Contracten & Lease</h1>
          <p className="text-muted-foreground mt-1">{contracts.length} contracten — {activeContracts.length} actief</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nieuw contract
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-success/10">
            <Euro className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="text-lg font-display font-bold text-foreground">€{totalMonthlyRevenue.toLocaleString('nl-NL')}</p>
            <p className="text-xs text-muted-foreground">Maandelijkse lease-omzet</p>
          </div>
        </div>
        <div className="glass-card rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-lg font-display font-bold text-foreground">{activeContracts.length}</p>
            <p className="text-xs text-muted-foreground">Actieve contracten</p>
          </div>
        </div>
        <div className="glass-card rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-destructive/10">
            <AlertCircle className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <p className="text-lg font-display font-bold text-foreground">€{totalOverdue.toLocaleString('nl-NL')}</p>
            <p className="text-xs text-muted-foreground">{overdueInvoices.length} openstaande herinneringen</p>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Zoek op contractnummer, klant of bedrijf..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {typeFilters.map(tf => (
            <button
              key={tf.value}
              onClick={() => setTypeFilter(tf.value)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                typeFilter === tf.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-accent"
              )}
            >
              {tf.icon}
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contracts table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Contract</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Klant</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Voertuig</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Looptijd</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Maandprijs</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {filtered.map((c, i) => {
                const vehicle = c.voertuigId ? getVehicleById(c.voertuigId) : null;
                return (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors animate-fade-in cursor-pointer" style={{ animationDelay: `${i * 40}ms` }} onClick={() => openContract(c)}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getContractTypeIcon(c.type)}</span>
                        <div>
                          <p className="font-medium text-sm text-foreground font-mono">{c.contractNummer}</p>
                          <p className="text-xs text-muted-foreground">{getContractTypeLabel(c.type)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-foreground">{c.klantNaam}</p>
                      {c.bedrijf && <p className="text-xs text-muted-foreground">{c.bedrijf}</p>}
                    </td>
                    <td className="px-5 py-4">
                      {vehicle ? (
                        <div>
                          <p className="text-sm text-foreground">{vehicle.merk} {vehicle.model}</p>
                          <p className="text-xs text-muted-foreground font-mono">{vehicle.kenteken}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">{c.type === 'fietslease' ? '🚲 Fiets' : '—'}</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-foreground">{c.startDatum}</p>
                      <p className="text-xs text-muted-foreground">t/m {c.eindDatum}</p>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="font-medium text-foreground">€{c.maandprijs}/mnd</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <StatusBadge status={c.status} variant={getContractStatusColor(c.status)} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">Geen contracten gevonden</p>
          </div>
        )}
      </div>

      {/* Contract detail dialog */}
      <ContractDetail contract={selectedContract} open={detailOpen} onOpenChange={setDetailOpen} />
    </div>
  );
}

function ContractDetail({ contract, open, onOpenChange }: { contract: Contract | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  if (!contract) return null;
  const vehicle = contract.voertuigId ? getVehicleById(contract.voertuigId) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <span className="text-xl">{getContractTypeIcon(contract.type)}</span>
            {contract.contractNummer}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Contract info */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <InfoBlock label="Type" value={getContractTypeLabel(contract.type)} />
            <InfoBlock label="Status" value={contract.status} />
            <InfoBlock label="Maandprijs" value={`€${contract.maandprijs}`} />
            <InfoBlock label="Klant" value={contract.klantNaam} />
            {contract.bedrijf && <InfoBlock label="Bedrijf" value={contract.bedrijf} />}
            <InfoBlock label="Looptijd" value={`${contract.startDatum} — ${contract.eindDatum}`} />
            {contract.kmPerJaar && <InfoBlock label="Km/jaar" value={`${contract.kmPerJaar.toLocaleString('nl-NL')} km`} />}
            {vehicle && <InfoBlock label="Voertuig" value={`${vehicle.merk} ${vehicle.model} (${vehicle.kenteken})`} />}
          </div>

          {/* Inclusief */}
          {contract.inclusief.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Inclusief</p>
              <div className="flex gap-2 flex-wrap">
                {contract.inclusief.map(item => (
                  <span key={item} className="text-xs px-2.5 py-1 rounded-full bg-success/10 text-success border border-success/20">
                    ✓ {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {contract.notities && (
            <div className="p-3 rounded-lg bg-warning/5 border border-warning/15">
              <p className="text-xs text-muted-foreground mb-1">Notitie</p>
              <p className="text-sm text-foreground">{contract.notities}</p>
            </div>
          )}

          <Separator />

          {/* Invoices tab */}
          <Tabs defaultValue="facturen">
            <TabsList className="w-full grid grid-cols-1">
              <TabsTrigger value="facturen" className="gap-1.5">
                <Euro className="w-3.5 h-3.5" />
                Facturen ({contract.facturen.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="facturen" className="mt-4 space-y-2">
              {contract.facturen.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">Geen facturen</div>
              ) : (
                contract.facturen.map(f => (
                  <div key={f.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm font-medium text-foreground">Factuur {f.datum}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-foreground">€{f.bedrag}</span>
                      <StatusBadge
                        status={f.status === 'herinnering_verstuurd' ? 'herinnering' : f.status === 'te_laat' ? 'te laat' : f.status}
                        variant={getInvoiceStatusColor(f.status)}
                      />
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2.5 rounded-lg bg-muted/50">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground mt-0.5 capitalize">{value}</p>
    </div>
  );
}
