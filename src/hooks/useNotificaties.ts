import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type Notificatie = {
  id: string;
  organisatie_id: string;
  user_id: string | null;
  titel: string;
  bericht: string | null;
  type: "info" | "succes" | "waarschuwing" | "fout";
  categorie: string | null;
  entiteit_type: string | null;
  entiteit_id: string | null;
  link_url: string | null;
  gelezen: boolean;
  gelezen_op: string | null;
  created_at: string;
};

export function useNotificaties() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["notificaties"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notificaties")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as Notificatie[];
    },
  });

  // Realtime subscribe
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("notificaties-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "notificaties" }, () => {
        qc.invalidateQueries({ queryKey: ["notificaties"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, qc]);

  const markeerGelezen = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notificaties")
        .update({ gelezen: true, gelezen_op: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notificaties"] }),
  });

  const markeerAllesGelezen = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notificaties")
        .update({ gelezen: true, gelezen_op: new Date().toISOString() })
        .eq("gelezen", false);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notificaties"] }),
  });

  const verwijder = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notificaties").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notificaties"] }),
  });

  return {
    notificaties: query.data ?? [],
    isLoading: query.isLoading,
    ongelezen: (query.data ?? []).filter((n) => !n.gelezen).length,
    markeerGelezen,
    markeerAllesGelezen,
    verwijder,
  };
}