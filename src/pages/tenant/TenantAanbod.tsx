import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTenantPortaal } from "@/hooks/useTenantPortaal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Car, Fuel, Calendar } from "lucide-react";

export default function TenantAanbod() {
  const { tenant, slug } = useTenantPortaal();
  const navigate = useNavigate();

  const { data: voertuigen = [], isLoading } = useQuery({
    queryKey: ["tenant-voertuigen", tenant?.id],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("voertuigen")
        .select("id, merk, model, bouwjaar, brandstof, categorie, kleur, dagprijs, image_url")
        .eq("organisatie_id", tenant!.id)
        .eq("status", "beschikbaar")
        .order("dagprijs", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (!tenant) return null;
  const base = slug ? `/t/${slug}` : "";

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-foreground">Welkom bij {tenant.portaal_naam || tenant.naam}</h1>
        <p className="text-muted-foreground">
          {tenant.portaal_welkomtekst || "Bekijk ons aanbod en boek direct online een voertuig."}
        </p>
      </header>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : voertuigen.length === 0 ? (
        <Card><CardContent className="p-12 text-center">
          <Car className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Op dit moment zijn er geen voertuigen beschikbaar.</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {voertuigen.map((v) => (
            <Card key={v.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-muted relative">
                {v.image_url ? (
                  <img src={v.image_url} alt={`${v.merk} ${v.model}`} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Car className="w-12 h-12 text-muted-foreground" /></div>
                )}
                <Badge className="absolute top-3 right-3" variant="secondary">{v.categorie}</Badge>
              </div>
              <CardContent className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-foreground">{v.merk} {v.model}</h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{v.bouwjaar}</span>
                    <span className="flex items-center gap-1"><Fuel className="w-3 h-3" />{v.brandstof}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div>
                    <p className="text-2xl font-bold text-foreground">€{Number(v.dagprijs).toFixed(0)}</p>
                    <p className="text-xs text-muted-foreground">per dag</p>
                  </div>
                  <Button onClick={() => navigate(`${base}/reserveren?voertuig=${v.id}`)}>Reserveer</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}