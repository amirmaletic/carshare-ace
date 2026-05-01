import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export type TenantPortaal = {
  id: string;
  naam: string;
  slug: string | null;
  portaal_naam: string | null;
  portaal_logo_url: string | null;
  portaal_kleur: string | null;
  portaal_welkomtekst: string | null;
};

function detectHostOrSlug(slugParam?: string) {
  if (typeof window === "undefined") return { host: "", slug: slugParam ?? null };
  const host = window.location.hostname.toLowerCase();
  // Subdomein onder fleeflo.nl, behalve gereserveerde
  const reserved = new Set(["www", "app", "admin", "api", "mail", "notify", "id-preview", "carshare-ace"]);
  let slugFromHost: string | null = null;
  if (host.endsWith(".fleeflo.nl")) {
    const sub = host.split(".")[0];
    if (!reserved.has(sub)) slugFromHost = sub;
  }
  return { host, slug: slugParam ?? slugFromHost };
}

/**
 * Resolves the active tenant (organisatie) for the white-label portal.
 * Works via either a URL slug (/t/:slug/...) or a subdomain (slug.fleeflo.nl).
 */
export function useTenantPortaal() {
  const params = useParams<{ slug?: string }>();
  const { host, slug } = useMemo(() => detectHostOrSlug(params.slug), [params.slug]);

  const query = useQuery({
    queryKey: ["tenant-portaal", host, slug],
    queryFn: async (): Promise<TenantPortaal | null> => {
      // Primair: lookup via host (subdomein of custom domain)
      const { data: byHost, error: hostErr } = await supabase.rpc("get_portaal_by_host", { _host: host });
      if (!hostErr && Array.isArray(byHost) && byHost.length > 0) return byHost[0] as TenantPortaal;

      // Fallback: lookup via slug (voor /t/:slug en lokaal/preview)
      if (slug) {
        const { data: bySlug } = await supabase
          .from("organisaties")
          .select("id, naam, slug, portaal_naam, portaal_logo_url, portaal_kleur, portaal_welkomtekst, portaal_actief")
          .eq("slug", slug)
          .eq("portaal_actief", true)
          .maybeSingle();
        if (bySlug) return bySlug as TenantPortaal;
      }
      return null;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Apply primary color as CSS variable for live theming
  useEffect(() => {
    const tenant = query.data;
    if (!tenant?.portaal_kleur) return;
    const hsl = hexToHsl(tenant.portaal_kleur);
    if (!hsl) return;
    document.documentElement.style.setProperty("--primary", hsl);
    return () => {
      document.documentElement.style.removeProperty("--primary");
    };
  }, [query.data]);

  return { tenant: query.data ?? null, isLoading: query.isLoading, slug };
}

function hexToHsl(hex: string): string | null {
  const m = hex.replace("#", "").match(/^([0-9a-f]{6})$/i);
  if (!m) return null;
  const int = parseInt(m[1], 16);
  const r = ((int >> 16) & 255) / 255;
  const g = ((int >> 8) & 255) / 255;
  const b = (int & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}