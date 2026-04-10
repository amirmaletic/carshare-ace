import { useState } from "react";
import { ContractDocument } from "@/components/ContractDocument";
import { InvoicePdfButton } from "@/components/InvoicePdfExport";
import { KilometerTab } from "@/components/KilometerTab";
import { Search, Plus, FileText, Euro, AlertCircle, Bike, Zap, Car, Eye, Edit, XCircle, CheckCircle, Printer, Gauge, RotateCcw, Shield, CalendarCheck, Phone, Mail, Building2, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { VehicleTerugmeldingen } from "@/components/VehicleTerugmeldingen";

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
  const signedCount = contracts.filter((c) => c.ondertekend).length;

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
          <h1 className="text-2xl font-bold text-foreground">Contracten & Lease</h1>
          <p className="text-muted-foreground mt-1">{contracts.length} contracten — {activeContracts.length} actief</p>
        </div>
        <Button className="gap-2" onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Nieuw contract
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="clean-card p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-success/10">
            <Euro className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">€{totalMonthlyRevenue.toLocaleString("nl-NL")}</p>
            <p className="text-xs text-muted-foreground">Maandomzet</p>
          </div>
        </div>
        <div className="clean-card p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">{activeContracts.length}</p>
            <p className="text-xs text-muted-foreground">Actief</p>
          </div>
        </div>
        <div className="clean-card p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent">
            <CalendarCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">{signedCount}</p>
            <p className="text-xs text-muted-foreground">Ondertekend</p>
          </div>
        </div>
        <div className="clean-card p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-destructive/10">
            <AlertCircle className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">€{totalOverdue.toLocaleString("nl-NL")}</p>
            <p className="text-xs text-muted-foreground">{overdueInvoices.length} openstaand</p>
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

      {/* Contracts as cards on mobile, table on desktop */}
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 clean-card">
          <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">Geen contracten gevonden</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c, i) => {
            const vehicle = c.voertuig_id ? getVehicleById(c.voertuig_id) : null;
            const openInvoices = c.invoices.filter((inv) => inv.status !== "betaald").length;
            return (
              <div
                key={c.id}
                onClick={() => openContract(c)}
                className="clean-card p-4 cursor-pointer hover:shadow-md hover:border-primary/20 transition-all animate-fade-in group"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getContractTypeIcon(c.type)}</span>
                    <div>
                      <p className="font-mono text-sm font-semibold text-foreground">{c.contract_nummer}</p>
                      <p className="text-xs text-muted-foreground">{getContractTypeLabel(c.type)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {c.ondertekend && (
                      <Shield className="w-3.5 h-3.5 text-success" />
                    )}
                    <StatusBadge status={c.status} variant={getContractStatusColor(c.status)} />
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-foreground">
                    <span className="font-medium">{c.klant_naam}</span>
                    {c.bedrijf && <span className="text-xs text-muted-foreground">• {c.bedrijf}</span>}
                  </div>

                  {vehicle && (
                    <p className="text-xs text-muted-foreground">
                      {vehicle.merk} {vehicle.model} — <span className="font-mono">{vehicle.kenteken}</span>
                    </p>
                  )}

                  <Separator className="my-2" />

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-foreground">€{Number(c.maandprijs)}</span>
                      <span className="text-xs text-muted-foreground">/mnd</span>
                      {Number(c.borg) > 0 && (
                        <span className="text-xs text-muted-foreground ml-2">+ €{Number(c.borg)} borg</span>
                      )}
                    </div>
                    {openInvoices > 0 && (
                      <Badge variant="outline" className="text-xs border-warning text-warning">
                        {openInvoices} facturen
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {c.start_datum} — {c.eind_datum}
                    {c.verlengbaar && <span className="ml-1 text-primary">• verlengbaar</span>}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
  const [documentOpen, setDocumentOpen] = useState(false);

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

  const handleSign = async () => {
    try {
      await updateContract.mutateAsync({
        id: contract.id,
        ondertekend: true,
        ondertekend_op: new Date().toISOString(),
        status: "actief",
      });
      toast({ title: "Contract ondertekend en geactiveerd" });
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
            <DialogTitle className="flex items-center gap-2">
              <span className="text-xl">{getContractTypeIcon(contract.type)}</span>
              {contract.contract_nummer}
              {contract.ondertekend && (
                <Badge variant="outline" className="text-success border-success/30 bg-success/10 ml-2">
                  <Shield className="w-3 h-3 mr-1" /> Ondertekend
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {/* Action buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setDocumentOpen(true)}>
              <Printer className="w-3.5 h-3.5" /> Document
            </Button>
            {contract.status !== "opgezegd" && contract.status !== "verlopen" && (
              <>
                {!contract.ondertekend && (
                  <Button size="sm" variant="default" className="gap-1.5" onClick={handleSign}>
                    <Shield className="w-3.5 h-3.5" /> Ondertekenen
                  </Button>
                )}
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
            {/* Klantgegevens */}
            <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Klantgegevens</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-foreground">{contract.klant_naam}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Mail className="w-3.5 h-3.5" /> {contract.klant_email}
                </div>
                {contract.klant_telefoon && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Phone className="w-3.5 h-3.5" /> {contract.klant_telefoon}
                  </div>
                )}
                {contract.klant_adres && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5" /> {contract.klant_adres}
                  </div>
                )}
                {contract.bedrijf && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Building2 className="w-3.5 h-3.5" /> {contract.bedrijf}
                    {contract.kvk_nummer && <span className="font-mono text-xs">KVK {contract.kvk_nummer}</span>}
                  </div>
                )}
              </div>
            </div>

            {/* Contract details */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <InfoBlock label="Type" value={getContractTypeLabel(contract.type)} />
              <InfoBlock label="Status" value={contract.status} />
              <InfoBlock label="Maandprijs" value={`€${Number(contract.maandprijs)}`} />
              {Number(contract.borg) > 0 && <InfoBlock label="Borg" value={`€${Number(contract.borg)}`} />}
              <InfoBlock label="Looptijd" value={`${contract.start_datum} — ${contract.eind_datum}`} />
              {contract.km_per_jaar && <InfoBlock label="Km/jaar" value={`${contract.km_per_jaar.toLocaleString("nl-NL")} km`} />}
              {vehicle && <InfoBlock label="Voertuig" value={`${vehicle.merk} ${vehicle.model} (${vehicle.kenteken})`} />}
              {contract.verlengbaar && <InfoBlock label="Verlenging" value={contract.verlengings_termijn || "Ja"} />}
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

            {contract.boeteclausule && (
              <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/15">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Boeteclausule
                </p>
                <p className="text-sm text-foreground">{contract.boeteclausule}</p>
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
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="facturen" className="gap-1.5 text-xs">
                  <Euro className="w-3.5 h-3.5" />
                  Facturen
                </TabsTrigger>
                <TabsTrigger value="kilometers" className="gap-1.5 text-xs">
                  <Gauge className="w-3.5 h-3.5" />
                  Kilometers
                </TabsTrigger>
                <TabsTrigger value="retouren" className="gap-1.5 text-xs">
                  <RotateCcw className="w-3.5 h-3.5" />
                  Retouren
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
                        <InvoicePdfButton invoice={{
                          factuurNummer: `F-${f.datum.replace(/-/g, "")}-${f.id.slice(0, 4).toUpperCase()}`,
                          datum: f.datum,
                          klantNaam: contract.klant_naam,
                          klantEmail: contract.klant_email,
                          klantAdres: contract.klant_adres || undefined,
                          items: [{ beschrijving: `${getContractTypeLabel(contract.type)} — ${contract.contract_nummer}`, aantal: 1, prijs: Number(f.bedrag) }],
                          totaal: Number(f.bedrag),
                          btw: Number(f.bedrag) * 0.21,
                          totaalInclBtw: Number(f.bedrag) * 1.21,
                          status: f.status === "betaald" ? "Betaald" : "Openstaand",
                        }} />
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
              <TabsContent value="kilometers" className="mt-4">
                <KilometerTab
                  contractId={contract.id}
                  kmPerJaar={contract.km_per_jaar}
                  startDatum={contract.start_datum}
                  eindDatum={contract.eind_datum}
                />
              </TabsContent>
              <TabsContent value="retouren" className="mt-4">
                {vehicle ? (
                  <VehicleTerugmeldingen voertuigId={contract.voertuig_id || ""} kenteken={vehicle.kenteken} />
                ) : (
                  <div className="text-center py-6 text-muted-foreground text-sm">Geen voertuig gekoppeld</div>
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

      {/* Contract document */}
      <ContractDocument contract={contract} open={documentOpen} onOpenChange={setDocumentOpen} />
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
