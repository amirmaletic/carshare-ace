import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOrganisatie } from "@/hooks/useOrganisatie";

export type GoedkeuringStatus = "in_behandeling" | "goedgekeurd" | "afgewezen";

export interface ActieType {
  key: string;
  label: string;
  category: "verwijderen" | "financieel";
  hasDrempel: boolean;
}

export const ACTIE_TYPES: ActieType[] = [
  { key: "contract.verwijderen", label: "Contract verwijderen", category: "verwijderen", hasDrempel: false },
  { key: "voertuig.verwijderen", label: "Voertuig verwijderen", category: "verwijderen", hasDrempel: false },
  { key: "klant.verwijderen", label: "Klant verwijderen", category: "verwijderen", hasDrempel: false },
  { key: "factuur.bedrag", label: "Factuur boven drempel", category: "financieel", hasDrempel: true },
  { key: "contract.maandprijs", label: "Contract maandprijs boven drempel", category: "financieel", hasDrempel: true },
  { key: "voertuig.dagprijs", label: "Voertuig dagprijs boven drempel", category: "financieel", hasDrempel: true },
];

export interface GoedkeuringRegel {
  id: string;
  organisatie_id: string;
  actie_type: string;
  actief: boolean;
  drempel_bedrag: number | null;
}

export interface Goedkeuring {
  id: string;
  organisatie_id: string;
  aangevraagd_door: string;
  beoordeeld_door: string | null;
  actie_type: string;
  entiteit_type: string | null;
  entiteit_id: string | null;
  beschrijving: string;
  bedrag: number | null;
  payload: Record<string, unknown>;
  status: GoedkeuringStatus;
  reden_afwijzing: string | null;
  beoordeeld_op: string | null;
  created_at: string;
}

export function useGoedkeuringRegels() {
  const { organisatieId } = useOrganisatie();
  const qc = useQueryClient();

  const { data: regels = [], isLoading } = useQuery({
    queryKey: ["goedkeuring_regels", organisatieId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("goedkeuring_regels")
        .select("*")
        .eq("organisatie_id", organisatieId!);
      if (error) throw error;
      return data as GoedkeuringRegel[];
    },
    enabled: !!organisatieId,
  });

  const upsert = useMutation({
    mutationFn: async (input: { actie_type: string; actief: boolean; drempel_bedrag: number | null }) => {
      if (!organisatieId) throw new Error("Geen organisatie");
      const existing = regels.find(r => r.actie_type === input.actie_type);
      if (existing) {
        const { error } = await supabase
          .from("goedkeuring_regels")
          .update({ actief: input.actief, drempel_bedrag: input.drempel_bedrag })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("goedkeuring_regels").insert({
          organisatie_id: organisatieId,
          actie_type: input.actie_type,
          actief: input.actief,
          drempel_bedrag: input.drempel_bedrag,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goedkeuring_regels"] }),
  });

  const getRegel = (actie_type: string): GoedkeuringRegel | undefined =>
    regels.find(r => r.actie_type === actie_type);

  return { regels, isLoading, upsert, getRegel };
}

export function useGoedkeuringen() {
  const { user } = useAuth();
  const { organisatieId } = useOrganisatie();
  const qc = useQueryClient();

  const { data: goedkeuringen = [], isLoading } = useQuery({
    queryKey: ["goedkeuringen", organisatieId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("goedkeuringen")
        .select("*")
        .eq("organisatie_id", organisatieId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Goedkeuring[];
    },
    enabled: !!organisatieId,
  });

  const aanvragen = useMutation({
    mutationFn: async (input: {
      actie_type: string;
      beschrijving: string;
      entiteit_type?: string;
      entiteit_id?: string;
      bedrag?: number;
      payload?: Record<string, unknown>;
    }) => {
      if (!user || !organisatieId) throw new Error("Niet ingelogd");
      const { data, error } = await supabase.from("goedkeuringen").insert({
        organisatie_id: organisatieId,
        aangevraagd_door: user.id,
        actie_type: input.actie_type,
        beschrijving: input.beschrijving,
        entiteit_type: input.entiteit_type,
        entiteit_id: input.entiteit_id,
        bedrag: input.bedrag,
        payload: input.payload ?? {},
      }).select().single();
      if (error) throw error;
      return data as Goedkeuring;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goedkeuringen"] }),
  });

  const beslissen = useMutation({
    mutationFn: async (input: { id: string; status: "goedgekeurd" | "afgewezen"; reden?: string }) => {
      if (!user) throw new Error("Niet ingelogd");
      const { error } = await supabase
        .from("goedkeuringen")
        .update({
          status: input.status,
          reden_afwijzing: input.reden ?? null,
          beoordeeld_door: user.id,
          beoordeeld_op: new Date().toISOString(),
        })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goedkeuringen"] }),
  });

  const inBehandeling = goedkeuringen.filter(g => g.status === "in_behandeling");

  return { goedkeuringen, inBehandeling, isLoading, aanvragen, beslissen };
}
