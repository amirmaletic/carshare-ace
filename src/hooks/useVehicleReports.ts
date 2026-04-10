import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EigendomHistorie {
  id: string;
  voertuig_id: string;
  user_id: string;
  eigenaar_naam: string;
  eigenaar_type: string;
  start_datum: string;
  eind_datum: string | null;
  notitie: string | null;
  created_at: string;
}

export interface ServiceHistorie {
  id: string;
  voertuig_id: string;
  user_id: string;
  datum: string;
  type: string;
  omschrijving: string;
  kosten: number;
  garage: string | null;
  kilometerstand: number | null;
  notitie: string | null;
  created_at: string;
}

export interface SchadeRapport {
  id: string;
  voertuig_id: string;
  user_id: string;
  datum: string;
  omschrijving: string;
  locatie_schade: string | null;
  ernst: string;
  kosten: number;
  verzekerd: boolean;
  hersteld: boolean;
  herstel_datum: string | null;
  fotos: string[];
  notitie: string | null;
  created_at: string;
}

// Eigendom
export function useEigendomHistorie(voertuigId: string | null) {
  return useQuery({
    queryKey: ["eigendom_historie", voertuigId],
    enabled: !!voertuigId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("eigendom_historie")
        .select("*")
        .eq("voertuig_id", voertuigId!)
        .order("start_datum", { ascending: true });
      if (error) throw error;
      return data as EigendomHistorie[];
    },
  });
}

export function useCreateEigendom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<EigendomHistorie, "id" | "user_id" | "created_at">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Niet ingelogd");
      const { data: orgId } = await supabase.rpc("get_user_organisatie_id", { _user_id: user.id });
      const { data, error } = await supabase
        .from("eigendom_historie")
        .insert({ ...input, user_id: user.id, organisatie_id: orgId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["eigendom_historie", vars.voertuig_id] }),
  });
}

export function useDeleteEigendom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, voertuigId }: { id: string; voertuigId: string }) => {
      const { error } = await supabase.from("eigendom_historie").delete().eq("id", id);
      if (error) throw error;
      return voertuigId;
    },
    onSuccess: (voertuigId) => qc.invalidateQueries({ queryKey: ["eigendom_historie", voertuigId] }),
  });
}

// Service
export function useServiceHistorie(voertuigId: string | null) {
  return useQuery({
    queryKey: ["service_historie", voertuigId],
    enabled: !!voertuigId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_historie")
        .select("*")
        .eq("voertuig_id", voertuigId!)
        .order("datum", { ascending: false });
      if (error) throw error;
      return data as ServiceHistorie[];
    },
  });
}

export function useCreateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<ServiceHistorie, "id" | "user_id" | "created_at">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Niet ingelogd");
      const { data, error } = await supabase
        .from("service_historie")
        .insert({ ...input, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["service_historie", vars.voertuig_id] }),
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, voertuigId }: { id: string; voertuigId: string }) => {
      const { error } = await supabase.from("service_historie").delete().eq("id", id);
      if (error) throw error;
      return voertuigId;
    },
    onSuccess: (voertuigId) => qc.invalidateQueries({ queryKey: ["service_historie", voertuigId] }),
  });
}

// Schade
export function useSchadeRapporten(voertuigId: string | null) {
  return useQuery({
    queryKey: ["schade_rapporten", voertuigId],
    enabled: !!voertuigId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schade_rapporten")
        .select("*")
        .eq("voertuig_id", voertuigId!)
        .order("datum", { ascending: false });
      if (error) throw error;
      return data as SchadeRapport[];
    },
  });
}

export function useCreateSchade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<SchadeRapport, "id" | "user_id" | "created_at">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Niet ingelogd");
      const { data, error } = await supabase
        .from("schade_rapporten")
        .insert({ ...input, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["schade_rapporten", vars.voertuig_id] }),
  });
}

export function useDeleteSchade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, voertuigId }: { id: string; voertuigId: string }) => {
      const { error } = await supabase.from("schade_rapporten").delete().eq("id", id);
      if (error) throw error;
      return voertuigId;
    },
    onSuccess: (voertuigId) => qc.invalidateQueries({ queryKey: ["schade_rapporten", voertuigId] }),
  });
}
