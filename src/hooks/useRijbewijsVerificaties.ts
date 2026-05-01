import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type RijbewijsStatus = "in_afwachting" | "ingediend" | "goedgekeurd" | "afgewezen" | "verlopen";

export interface RijbewijsVerificatie {
  id: string;
  organisatie_id: string;
  klant_id: string;
  contract_id: string | null;
  status: RijbewijsStatus;
  upload_token: string;
  token_expires_at: string;
  voorkant_pad: string | null;
  achterkant_pad: string | null;
  ingediend_op: string | null;
  ai_naam: string | null;
  ai_geboortedatum: string | null;
  ai_rijbewijsnummer: string | null;
  ai_categorieen: string[] | null;
  ai_afgiftedatum: string | null;
  ai_vervaldatum: string | null;
  ai_confidence: number | null;
  validatie_notities: string | null;
  beoordeeld_op: string | null;
  reden_afwijzing: string | null;
  email_verzonden_op: string | null;
  herinnering_verzonden_op: string | null;
  created_at: string;
  updated_at: string;
}

export function useRijbewijsVerificaties(klantId?: string) {
  return useQuery({
    queryKey: ["rijbewijs-verificaties", klantId ?? "all"],
    queryFn: async () => {
      let q = supabase
        .from("rijbewijs_verificaties")
        .select("*")
        .order("created_at", { ascending: false });
      if (klantId) q = q.eq("klant_id", klantId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as RijbewijsVerificatie[];
    },
  });
}

export function useVerstuurRijbewijsVerzoek() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { verificatie_id: string; is_herinnering?: boolean }) => {
      const { data, error } = await supabase.functions.invoke("send-rijbewijs-verzoek", {
        body: params,
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rijbewijs-verificaties"] });
      toast({ title: "E-mail verstuurd", description: "Klant heeft een upload-link ontvangen." });
    },
    onError: (e: any) => {
      toast({ title: "Versturen mislukt", description: e.message, variant: "destructive" });
    },
  });
}

export function useMaakRijbewijsVerzoek() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { klant_id: string; organisatie_id: string; contract_id?: string }) => {
      // Genereer token client-side via crypto
      const tokenBytes = new Uint8Array(24);
      crypto.getRandomValues(tokenBytes);
      const token = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, "0")).join("");

      const { data, error } = await supabase
        .from("rijbewijs_verificaties")
        .insert({
          klant_id: params.klant_id,
          organisatie_id: params.organisatie_id,
          contract_id: params.contract_id ?? null,
          upload_token: token,
          status: "in_afwachting",
        })
        .select()
        .single();
      if (error) throw error;
      return data as RijbewijsVerificatie;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rijbewijs-verificaties"] });
    },
  });
}

export function useBeoordeelRijbewijs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; status: "goedgekeurd" | "afgewezen"; reden?: string }) => {
      const { error } = await supabase
        .from("rijbewijs_verificaties")
        .update({
          status: params.status,
          reden_afwijzing: params.status === "afgewezen" ? params.reden ?? null : null,
          beoordeeld_op: new Date().toISOString(),
        })
        .eq("id", params.id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["rijbewijs-verificaties"] });
      toast({
        title: vars.status === "goedgekeurd" ? "Goedgekeurd" : "Afgewezen",
      });
    },
    onError: (e: any) => {
      toast({ title: "Mislukt", description: e.message, variant: "destructive" });
    },
  });
}

export function getStatusLabel(s: RijbewijsStatus): string {
  switch (s) {
    case "in_afwachting": return "Wacht op upload";
    case "ingediend": return "Te beoordelen";
    case "goedgekeurd": return "Goedgekeurd";
    case "afgewezen": return "Afgewezen";
    case "verlopen": return "Verlopen";
  }
}

export function getStatusColor(s: RijbewijsStatus): "default" | "secondary" | "destructive" | "outline" {
  switch (s) {
    case "goedgekeurd": return "default";
    case "ingediend": return "secondary";
    case "afgewezen": return "destructive";
    case "verlopen": return "destructive";
    case "in_afwachting": return "outline";
  }
}