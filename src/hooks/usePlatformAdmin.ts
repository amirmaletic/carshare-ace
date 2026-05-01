import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useIsPlatformAdmin() {
  const { user, loading } = useAuth();
  return useQuery({
    queryKey: ["is-platform-admin", user?.id],
    enabled: !loading && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .eq("role", "platform_admin" as any);
      if (error) throw error;
      return (data?.length ?? 0) > 0;
    },
  });
}

export interface AdminOrgRow {
  id: string;
  naam: string;
  eigenaar_id: string;
  eigenaar_email: string | null;
  is_active: boolean;
  trial_ends_at: string | null;
  created_at: string;
  user_count: number;
  voertuig_count: number;
  contract_count: number;
  klant_count: number;
  laatste_activiteit: string | null;
  eigenaar_last_sign_in_at: string | null;
  laatste_inlog_org: string | null;
}

export function useAdminOrganisaties() {
  return useQuery({
    queryKey: ["admin-organisaties"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_organisaties" as any);
      if (error) throw error;
      return (data ?? []) as AdminOrgRow[];
    },
  });
}

export function useAdminOrganisatieDetail(orgId: string | null) {
  return useQuery({
    queryKey: ["admin-organisatie", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_organisatie" as any, { _org_id: orgId });
      if (error) throw error;
      return data as any;
    },
  });
}

export function useUpdateOrganisatie() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      org_id: string;
      trial_ends_at?: string | null;
      is_active?: boolean;
      naam?: string;
    }) => {
      const { error } = await supabase.rpc("admin_update_organisatie" as any, {
        _org_id: input.org_id,
        _trial_ends_at: input.trial_ends_at ?? null,
        _is_active: input.is_active ?? null,
        _naam: input.naam ?? null,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["admin-organisaties"] });
      qc.invalidateQueries({ queryKey: ["admin-organisatie", vars.org_id] });
    },
  });
}

export function useGrantPlatformAdmin() {
  return useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.rpc("admin_grant_platform_admin" as any, { _user_email: email });
      if (error) throw error;
    },
  });
}

export function useDeleteOrganisatie() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orgId: string) => {
      const { error } = await supabase.rpc("admin_delete_organisatie" as any, { _org_id: orgId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-organisaties"] });
    },
  });
}