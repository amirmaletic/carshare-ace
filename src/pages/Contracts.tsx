import { useState } from "react";
import { Search, Plus, FileText, Euro, AlertCircle, Bike, Zap, Car, Eye, Edit, XCircle, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { useContracts, useUpdateContract, type ContractWithInvoices } from "@/hooks/useContracts";
import { useUpdateInvoice } from "@/hooks/useInvoices";
import { ContractForm } from "@/components/ContractForm";
import { InvoiceForm } from "@/components/InvoiceForm";
import { getVehicleById, getContractStatusColor, getContractTypeLabel, getContractTypeIcon, getInvoiceStatusColor } from "@/data/mockData";
import { cn } from "@/lib/utils";

const typeFilters: { value: string; label: string; icon: React.ReactNode }[] = [
  { value: "Alle", label: "Alle", icon: <FileText className="w-3.5 h-3.5" /> },
  { value: "lease", label: "Autolease", icon: <Car className="w-3.5 h-3.5" /> },
  { value: "verhuur", label: "Verhuur", icon: <FileText className="w-3.5 h-3.5" /> },
  { value: "fietslease", label: "Fietslease", icon: <Bike className="w-3.5 h-3.5" /> },
  { value: "ev-lease", label: "EV Lease", icon: <Zap className="w-3.5 h-3.5" /> },
];

export default function Contracts() {
  const { data: contracts = [], isLoading } = useContracts();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("Alle");
  const [selectedContract, setSelectedContract] = useState<ContractWithInvoices | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editContract, setEditContract] = useState<ContractWithInvoices | null>(null);

  const activeContracts = contracts.filter((c) => c.status === "actief");
  const totalMonthlyRevenue = activeContracts.reduce((sum, c) => sum + Number(c.maandprijs), 0);
  const overdueInvoices = contracts.flatMap((c) => c.invoices).filter((f) => f.status === "te_laat" || f.status === "herinnering_verstuurd");
  const totalOverdue = overdueInvoices.reduce((sum, f) => sum + Number(f.bedrag), 0);

  const filtered = contracts.filter((c) => {
    const matchesSearch =
      c.contract_nummer.toLowerCase().includes(search.toLowerCase()) ||
      c.klant_naam.toLowerCase().includes(search.toLowerCase()) ||
      (c.bedrijf && c.bedrijf.toLowerCase().includes(search.toLowerCase()));
    const matchesType = typeFilter === "Alle" || c.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const openContract = (contract: ContractWithInvoices) => {
    setSelectedContract(contract);
    setDetailOpen(true);
  };

  const openCreate = () => {
    setEditContract(null);
    setFormOpen(true);
  };

  const openEdit = (contract: ContractWithInvoices) => {
    setEditContract(contract);
    setFormOpen(true);
    setDetailOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Contracten & Lease</h1>
          <p className="text-muted-foreground mt-1">{contracts.length} contracten — {activeContracts.length} actief</p>
        </div>
        <Button className="gap-2" onClick={openCreate}>
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
            <p className="text-lg font-display font-bold text-foreground">€{totalMonthlyRevenue.toLocaleString("nl-NL")}</p>
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
            <p className="text-lg font-display font-bold text-foreground">€{totalOverdue.toLocaleString("nl-NL")}</p>
            <p className="text-xs text-muted-foreground">{overdueInvoices.length} openstaande herinneringen</p>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Zoek op contractnummer, klant of bedrijf..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {typeFilters.map((tf) => (
            <button
              key={tf.value}
              onClick={() => setTypeFilter(tf.value)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                typeFilter === tf.value ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"
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
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (
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
                  const vehicle = c.voertuig_id ? getVehicleById(c.voertuig_id) : null;
                  return (
                    <tr key={c.id} className="hover:bg-muted/30 transition-colors animate-fade-in cursor-pointer" style={{ animationDelay: `${i * 40}ms` }} onClick={() => openContract(c)}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getContractTypeIcon(c.type)}</span>
                          <div>
                            <p className="font-medium text-sm text-foreground font-mono">{c.contract_nummer}</p>
                            <p className="text-xs text-muted-foreground">{getContractTypeLabel(c.type)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-foreground">{c.klant_naam}</p>
                        {c.bedrijf && <p className="text-xs text-muted-foreground">{c.bedrijf}</p>}
                      </td>
                      <td className="px-5 py-4">
                        {vehicle ? (
                          <div>
                            <p className="text-sm text-foreground">{vehicle.merk} {vehicle.model}</p>
                            <p className="text-xs text-muted-foreground font-mono">{vehicle.kenteken}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">{c.type === "fietslease" ? "🚲 Fiets" : "—"}</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-foreground">{c.start_datum}</p>
                        <p className="text-xs text-muted-foreground">t/m {c.eind_datum}</p>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="font-medium text-foreground">€{Number(c.maandprijs)}/mnd</span>
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
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">Geen contracten gevonden</p>
          </div>
        )}
      </div>

      {/* Contract detail dialog */}
      <ContractDetail
        contract={selectedContract}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={openEdit}
      />

      {/* Create/Edit form */}
      <ContractForm open={formOpen} onOpenChange={setFormOpen} editContract={editContract} />
    </div>
  );
}

function ContractDetail({
  contract,
  open,
  onOpenChange,
  onEdit,
}: {
  contract: ContractWithInvoices | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onEdit: (c: ContractWithInvoices) => void;
}) {
  const updateContract = useUpdateContract();
  const updateInvoice = useUpdateInvoice();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [invoiceFormOpen, setInvoiceFormOpen] = useState(false);

  if (!contract) return null;
  const vehicle = contract.voertuig_id ? getVehicleById(contract.voertuig_id) : null;

  const handleCancel = async () => {
    try {
      await updateContract.mutateAsync({ id: contract.id, status: "opgezegd" });
      toast({ title: "Contract opgezegd" });
      setCancelOpen(false);
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Fout", description: err.message, variant: "destructive" });
    }
  };

  const markInvoicePaid = async (invoiceId: string) => {
    try {
      await updateInvoice.mutateAsync({ id: invoiceId, status: "betaald" });
      toast({ title: "Factuur als betaald gemarkeerd" });
    } catch (err: any) {
      toast({ title: "Fout", description: err.message, variant: "destructive" });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <span className="text-xl">{getContractTypeIcon(contract.type)}</span>
              {contract.contract_nummer}
            </DialogTitle>
          </DialogHeader>

          {/* Action buttons */}
          <div className="flex gap-2 flex-wrap">
            {contract.status !== "opgezegd" && contract.status !== "verlopen" && (
              <>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => onEdit(contract)}>
                  <Edit className="w-3.5 h-3.5" /> Bewerken
                </Button>
                <Button size="sm" variant="destructive" className="gap-1.5" onClick={() => setCancelOpen(true)}>
                  <XCircle className="w-3.5 h-3.5" /> Opzeggen
                </Button>
              </>
            )}
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <InfoBlock label="Type" value={getContractTypeLabel(contract.type)} />
              <InfoBlock label="Status" value={contract.status} />
              <InfoBlock label="Maandprijs" value={`€${Number(contract.maandprijs)}`} />
              <InfoBlock label="Klant" value={contract.klant_naam} />
              {contract.bedrijf && <InfoBlock label="Bedrijf" value={contract.bedrijf} />}
              <InfoBlock label="Looptijd" value={`${contract.start_datum} — ${contract.eind_datum}`} />
              {contract.km_per_jaar && <InfoBlock label="Km/jaar" value={`${contract.km_per_jaar.toLocaleString("nl-NL")} km`} />}
              {vehicle && <InfoBlock label="Voertuig" value={`${vehicle.merk} ${vehicle.model} (${vehicle.kenteken})`} />}
            </div>

            {contract.inclusief.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Inclusief</p>
                <div className="flex gap-2 flex-wrap">
                  {contract.inclusief.map((item) => (
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

            <Tabs defaultValue="facturen">
              <TabsList className="w-full grid grid-cols-1">
                <TabsTrigger value="facturen" className="gap-1.5">
                  <Euro className="w-3.5 h-3.5" />
                  Facturen ({contract.invoices.length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="facturen" className="mt-4 space-y-2">
                <Button size="sm" variant="outline" className="gap-1.5 mb-2" onClick={() => setInvoiceFormOpen(true)}>
                  <Plus className="w-3.5 h-3.5" /> Factuur toevoegen
                </Button>
                {contract.invoices.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">Geen facturen</div>
                ) : (
                  contract.invoices.map((f) => (
                    <div key={f.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="text-sm font-medium text-foreground">Factuur {f.datum}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-foreground">€{Number(f.bedrag)}</span>
                        <StatusBadge
                          status={f.status === "herinnering_verstuurd" ? "herinnering" : f.status === "te_laat" ? "te laat" : f.status}
                          variant={getInvoiceStatusColor(f.status)}
                        />
                        {f.status !== "betaald" && (
                          <Button size="sm" variant="ghost" className="gap-1 h-7 text-xs" onClick={() => markInvoicePaid(f.id)}>
                            <CheckCircle className="w-3 h-3" /> Betaald
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel confirmation */}
      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Contract opzeggen?</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je contract {contract.contract_nummer} wilt opzeggen? Dit kan niet ongedaan worden gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Opzeggen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Invoice form */}
      <InvoiceForm open={invoiceFormOpen} onOpenChange={setInvoiceFormOpen} contractId={contract.id} />
    </>
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
