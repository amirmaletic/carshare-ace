import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ContractType, ContractStatus } from "@/data/mockData";
import { useApprovalGuard } from "@/hooks/useGoedkeuringen";

export interface DbContract {
  id: string;
  user_id: string;
  contract_nummer: string;
  type: ContractType;
  voertuig_id: string | null;
  klant_naam: string;
  klant_email: string;
  klant_telefoon: string | null;
  klant_adres: string | null;
  bedrijf: string | null;
  kvk_nummer: string | null;
  bedrijf_adres: string | null;
  start_datum: string;
  eind_datum: string;
  maandprijs: number;
  borg: number;
  status: ContractStatus;
  km_per_jaar: number | null;
  inclusief: string[];
  notities: string | null;
  boeteclausule: string | null;
  verlengbaar: boolean;
  verlengings_termijn: string | null;
  ondertekend: boolean;
  ondertekend_op: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbInvoice {
  id: string;
  contract_id: string;
  user_id: string;
  datum: string;
  bedrag: number;
  status: 'betaald' | 'openstaand' | 'te_laat' | 'herinnering_verstuurd';
  created_at: string;
}

export type ContractWithInvoices = DbContract & { invoices: DbInvoice[] };

export function useContracts() {
  return useQuery({
    queryKey: ["contracts"],
    queryFn: async (): Promise<ContractWithInvoices[]> => {
      const { data: contracts, error } = await supabase
        .from("contracts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const { data: invoices, error: invError } = await supabase
        .from("invoices")
        .select("*")
        .order("datum", { ascending: true });

      if (invError) throw invError;

      return (contracts as DbContract[]).map((c) => ({
        ...c,
        invoices: (invoices as DbInvoice[]).filter((i) => i.contract_id === c.id),
      }));
    },
  });
}

export function useContract(id: string | null) {
  return useQuery({
    queryKey: ["contract", id],
    enabled: !!id,
    queryFn: async (): Promise<ContractWithInvoices | null> => {
      if (!id) return null;
      const { data: contract, error } = await supabase
        .from("contracts")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      const { data: invoices, error: invError } = await supabase
        .from("invoices")
        .select("*")
        .eq("contract_id", id)
        .order("datum", { ascending: true });

      if (invError) throw invError;

      return { ...(contract as DbContract), invoices: invoices as DbInvoice[] };
    },
  });
}

export type CreateContractInput = Omit<DbContract, "id" | "user_id" | "created_at" | "updated_at">;

export function useCreateContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateContractInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Niet ingelogd");
      const { data: orgId } = await supabase.rpc("get_user_organisatie_id", { _user_id: user.id });

      const { data, error } = await supabase
        .from("contracts")
        .insert({ ...input, user_id: user.id, organisatie_id: orgId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contracts"] }),
  });
}

export function useUpdateContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DbContract> & { id: string }) => {
      const { data, error } = await supabase
        .from("contracts")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contracts"] }),
  });
}

export function useDeleteContract() {
  const qc = useQueryClient();
  const { checkAndRequest } = useApprovalGuard();
  return useMutation({
    mutationFn: async (input: string | { id: string; contractNummer?: string; klantNaam?: string }) => {
      const id = typeof input === "string" ? input : input.id;
      const beschrijving = typeof input === "string"
        ? `Contract ${id} verwijderen`
        : `Contract ${input.contractNummer ?? id} (${input.klantNaam ?? "onbekend"}) verwijderen`;

      const mayProceed = await checkAndRequest({
        actie_type: "contract.verwijderen",
        beschrijving,
        entiteit_type: "contract",
        entiteit_id: id,
      });
      if (!mayProceed) {
        return { pending: true as const };
      }
      const { error } = await supabase.from("contracts").delete().eq("id", id);
      if (error) throw error;
      return { pending: false as const };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contracts"] }),
  });
}
