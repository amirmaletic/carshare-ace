import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X, Mail, Loader2, ClipboardList } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { buildContractChecklist, checklistComplete, ontbrekendeLabels } from "@/lib/contractChecklist";
import { useContractKlant } from "@/hooks/useContractKlant";
import type { ContractWithInvoices } from "@/hooks/useContracts";

interface Props {
  contract: ContractWithInvoices;
}

export function ContractChecklistCard({ contract }: Props) {
  const qc = useQueryClient();
  const { data: klant } = useContractKlant(contract.klant_email);
  const items = buildContractChecklist(contract, klant);
  const totaal = items.length;
  const compleet = items.filter((i) => i.ok).length;
  const isCompleet = checklistComplete(items);

  const { data: laatsteVerzoek, refetch } = useQuery({
    queryKey: ["aanvul-verzoek", contract.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contract_aanvul_verzoeken")
        .select("id, status, verzonden_op, expires_at")
        .eq("contract_id", contract.id)
        .order("verzonden_op", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [verstuurd, setVerstuurd] = useState(false);

  const verstuur = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("maak_aanvul_verzoek", { _contract_id: contract.id });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      const token = (row as any)?.token;
      const verzoekId = (row as any)?.id;
      if (!token) throw new Error("Geen token ontvangen");

      const url = `${window.location.origin}/contract-aanvullen/${token}`;
      const ontbrekend = ontbrekendeLabels(items);
      const orgNaam = await getOrganisatieNaam();

      const { error: mailErr } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "contract-aanvulverzoek",
          recipientEmail: contract.klant_email,
          idempotencyKey: `aanvulverzoek-${verzoekId}`,
          templateData: {
            klantNaam: contract.klant_naam,
            organisatieNaam: orgNaam,
            contractNummer: contract.contract_nummer,
            ontbrekend,
            url,
            vervaltOp: new Date(Date.now() + 14 * 86400000).toLocaleDateString("nl-NL"),
          },
        },
      });
      if (mailErr) throw mailErr;
      return { url };
    },
    onSuccess: () => {
      setVerstuurd(true);
      toast({ title: "Aanvulverzoek verstuurd", description: `Mail verzonden naar ${contract.klant_email}` });
      refetch();
      qc.invalidateQueries({ queryKey: ["activiteiten"] });
    },
    onError: (e: any) => toast({ title: "Versturen mislukt", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <ClipboardList className="w-3.5 h-3.5" /> Checklist · {compleet}/{totaal} compleet
        </h4>
        {isCompleet ? (
          <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20">Klaar voor ondertekening</span>
        ) : (
          <span className="text-xs px-2 py-0.5 rounded-full bg-warning/10 text-warning border border-warning/20">Nog niet compleet</span>
        )}
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-4">
        {items.map((item) => (
          <li key={item.key} className="flex items-center gap-2 text-sm">
            {item.ok ? (
              <Check className="w-3.5 h-3.5 text-success shrink-0" />
            ) : (
              <X className="w-3.5 h-3.5 text-destructive shrink-0" />
            )}
            <span className={item.ok ? "text-foreground" : "text-muted-foreground"}>{item.label}</span>
            {item.hint && <span className="text-xs text-destructive">({item.hint})</span>}
          </li>
        ))}
      </ul>
      {!isCompleet && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2 border-t border-border/50">
          <Button
            size="sm"
            variant="default"
            className="gap-1.5"
            onClick={() => verstuur.mutate()}
            disabled={verstuur.isPending || !contract.klant_email}
          >
            {verstuur.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
            Stuur aanvulverzoek per mail
          </Button>
          {laatsteVerzoek && !verstuurd && (
            <span className="text-xs text-muted-foreground">
              Laatst verzonden op {new Date(laatsteVerzoek.verzonden_op as string).toLocaleString("nl-NL")} · status {String(laatsteVerzoek.status)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

async function getOrganisatieNaam(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  const user = data?.user;
  if (!user) return "FleeFlo";
  const { data: roles } = await supabase
    .from("user_roles")
    .select("organisatie_id, organisaties(naam)")
    .eq("user_id", user.id)
    .not("organisatie_id", "is", null)
    .limit(1)
    .maybeSingle();
  return (roles as any)?.organisaties?.naam ?? "FleeFlo";
}