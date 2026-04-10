import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { User, Save } from "lucide-react";

export default function MijnProfiel() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profiel, isLoading } = useQuery({
    queryKey: ["klant-profiel", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("klanten")
        .select("*")
        .eq("auth_user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const [form, setForm] = useState({
    voornaam: "",
    achternaam: "",
    email: "",
    telefoon: "",
    adres: "",
    postcode: "",
    plaats: "",
    rijbewijs_nummer: "",
    type: "particulier",
    bedrijfsnaam: "",
    kvk_nummer: "",
  });

  useEffect(() => {
    if (profiel) {
      setForm({
        voornaam: profiel.voornaam ?? "",
        achternaam: profiel.achternaam ?? "",
        email: profiel.email ?? user?.email ?? "",
        telefoon: profiel.telefoon ?? "",
        adres: profiel.adres ?? "",
        postcode: profiel.postcode ?? "",
        plaats: profiel.plaats ?? "",
        rijbewijs_nummer: profiel.rijbewijs_nummer ?? "",
        type: profiel.type ?? "particulier",
        bedrijfsnaam: profiel.bedrijfsnaam ?? "",
        kvk_nummer: profiel.kvk_nummer ?? "",
      });
    } else if (user) {
      setForm((f) => ({ ...f, email: user.email ?? "" }));
    }
  }, [profiel, user]);

  const save = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Niet ingelogd");

      if (profiel) {
        const { error } = await supabase
          .from("klanten")
          .update(form)
          .eq("auth_user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("klanten")
          .insert({ ...form, auth_user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["klant-profiel"] });
      toast.success("Profiel opgeslagen");
    },
    onError: (e) => toast.error("Fout: " + e.message),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mijn Profiel</h1>
        <p className="text-muted-foreground mt-1">Beheer je persoonlijke gegevens</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4" />
            Persoonsgegevens
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Voornaam *</Label>
              <Input value={form.voornaam} onChange={(e) => setForm({ ...form, voornaam: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Achternaam *</Label>
              <Input value={form.achternaam} onChange={(e) => setForm({ ...form, achternaam: e.target.value })} required />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" />
            </div>
            <div className="space-y-2">
              <Label>Telefoon</Label>
              <Input value={form.telefoon} onChange={(e) => setForm({ ...form, telefoon: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2 sm:col-span-1">
              <Label>Adres</Label>
              <Input value={form.adres} onChange={(e) => setForm({ ...form, adres: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Postcode</Label>
              <Input value={form.postcode} onChange={(e) => setForm({ ...form, postcode: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Plaats</Label>
              <Input value={form.plaats} onChange={(e) => setForm({ ...form, plaats: e.target.value })} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Rijbewijsnummer</Label>
            <Input value={form.rijbewijs_nummer} onChange={(e) => setForm({ ...form, rijbewijs_nummer: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label>Type klant</Label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="particulier">Particulier</SelectItem>
                <SelectItem value="zakelijk">Zakelijk</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.type === "zakelijk" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bedrijfsnaam</Label>
                <Input value={form.bedrijfsnaam} onChange={(e) => setForm({ ...form, bedrijfsnaam: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>KVK-nummer</Label>
                <Input value={form.kvk_nummer} onChange={(e) => setForm({ ...form, kvk_nummer: e.target.value })} />
              </div>
            </div>
          )}

          <Button onClick={() => save.mutate()} disabled={save.isPending} className="gap-2">
            <Save className="w-4 h-4" />
            {save.isPending ? "Opslaan..." : "Profiel opslaan"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
