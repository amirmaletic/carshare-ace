import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

import { useVoertuigen } from "@/hooks/useVoertuigen";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";
import TerugmeldStats from "@/components/terugmelden/TerugmeldStats";
import RecentReturns from "@/components/terugmelden/RecentReturns";
import ReturnForm from "@/components/terugmelden/ReturnForm";
import ReturnHistory from "@/components/terugmelden/ReturnHistory";

interface Terugmelding {
  id: string;
  voertuig_id: string;
  voertuig_kenteken: string;
  voertuig_naam: string;
  kilometerstand: number;
  datum: string;
  bon_url: string | null;
  notitie: string | null;
  created_at: string;
  medewerker_email?: string | null;
  fotos?: string[] | null;
}

function formatKentekenInput(input: string): string {
  return input.replace(/[\s]/g, "").toUpperCase();
}

export default function Terugmelden() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { voertuigen: dbVoertuigen } = useVoertuigen();

  const [kentekenQuery, setKentekenQuery] = useState("");
  const [matchedVehicle, setMatchedVehicle] = useState<{
    id: string; label: string; kenteken: string; laatsteKm: number;
  } | null>(null);
  const [kilometerstand, setKilometerstand] = useState("");
  const [kmError, setKmError] = useState("");
  const [notitie, setNotitie] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fotos, setFotos] = useState<File[]>([]);
  const [schadePunten, setSchadePunten] = useState<import("@/components/VehicleDamageSketch").DamagePoint[]>([]);
  const [schadevrij, setSchadevrij] = useState(false);
  const [uploading, setUploading] = useState(false);

  const allVehicles = [
    ...dbVoertuigen.map(v => ({ id: v.id, label: `${v.merk} ${v.model}`, kenteken: v.kenteken, km: v.kilometerstand })),
  ];

  const { data: terugmeldingen = [], isLoading } = useQuery({
    queryKey: ["terugmeldingen"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("terugmeldingen")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Terugmelding[];
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("terugmeldingen").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["terugmeldingen"] });
      toast.success("Terugmelding verwijderd");
    },
  });

  const getMinKm = (vehicleId: string, baseKm: number): number => {
    const previous = terugmeldingen
      .filter(t => t.voertuig_id === vehicleId)
      .map(t => t.kilometerstand);
    return Math.max(baseKm, ...previous, 0);
  };

  const handleKentekenSearch = () => {
    const formatted = formatKentekenInput(kentekenQuery);
    const found = allVehicles.find(v =>
      v.kenteken.replace(/[\s-]/g, "").toUpperCase() === formatted
    );
    if (found) {
      const minKm = getMinKm(found.id, found.km);
      setMatchedVehicle({ id: found.id, label: found.label, kenteken: found.kenteken, laatsteKm: minKm });
      setKilometerstand("");
      setKmError("");
    } else {
      setMatchedVehicle(null);
      toast.error("Geen voertuig gevonden met dit kenteken");
    }
  };

  const handleSelectVehicle = (vehicle: { id: string; label: string; kenteken: string; km: number }) => {
    setKentekenQuery(vehicle.kenteken);
    const minKm = getMinKm(vehicle.id, vehicle.km);
    setMatchedVehicle({ id: vehicle.id, label: vehicle.label, kenteken: vehicle.kenteken, laatsteKm: minKm });
    setKilometerstand("");
    setKmError("");
  };

  const handleKmChange = (value: string) => {
    setKilometerstand(value);
    if (matchedVehicle && value) {
      const num = parseInt(value);
      if (!isNaN(num) && num < matchedVehicle.laatsteKm) {
        setKmError(`Kilometerstand mag niet lager zijn dan ${matchedVehicle.laatsteKm.toLocaleString("nl-NL")} km`);
      } else {
        setKmError("");
      }
    } else {
      setKmError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !matchedVehicle || !kilometerstand) {
      toast.error("Vul alle verplichte velden in");
      return;
    }

    const kmNum = parseInt(kilometerstand);
    if (kmNum < matchedVehicle.laatsteKm) {
      setKmError(`Kilometerstand mag niet lager zijn dan ${matchedVehicle.laatsteKm.toLocaleString("nl-NL")} km`);
      return;
    }

    setUploading(true);
    let bonUrl: string | null = null;
    const fotoUrls: string[] = [];

    try {
      if (file) {
        const ext = file.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("bonnen").upload(path, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("bonnen").getPublicUrl(path);
        bonUrl = urlData.publicUrl;
      }

      // Upload schadefoto's
      for (const foto of fotos) {
        const ext = foto.name.split(".").pop();
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("schade-fotos").upload(path, foto);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("schade-fotos").getPublicUrl(path);
        fotoUrls.push(urlData.publicUrl);
      }

      const { error } = await supabase.from("terugmeldingen").insert({
        user_id: user.id,
        voertuig_id: matchedVehicle.id,
        voertuig_kenteken: matchedVehicle.kenteken,
        voertuig_naam: matchedVehicle.label,
        kilometerstand: kmNum,
        bon_url: bonUrl,
        notitie: notitie.trim() || null,
        medewerker_email: user.email || null,
        fotos: fotoUrls.length > 0 ? fotoUrls : [],
      });
      if (error) throw error;

      await supabase
        .from("voertuigen")
        .update({ kilometerstand: kmNum, status: "beschikbaar" })
        .eq("id", matchedVehicle.id);

      queryClient.invalidateQueries({ queryKey: ["terugmeldingen"] });
      queryClient.invalidateQueries({ queryKey: ["voertuigen"] });
      toast.success("Voertuig succesvol teruggemeld");
      setMatchedVehicle(null);
      setKentekenQuery("");
      setKilometerstand("");
      setNotitie("");
      setFile(null);
      setFotos([]);
      setSchadevrij(false);
      setKmError("");
    } catch (err: any) {
      toast.error("Fout bij terugmelden: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <RotateCcw className="w-6 h-6 text-primary" />
          Terugmelden
        </h1>
        <p className="text-muted-foreground mt-1">Meld een voertuig terug met kilometerstand en bon</p>
      </div>

      <TerugmeldStats terugmeldingen={terugmeldingen} />

      <ReturnForm
        kentekenQuery={kentekenQuery}
        setKentekenQuery={setKentekenQuery}
        matchedVehicle={matchedVehicle}
        onSearch={handleKentekenSearch}
        kilometerstand={kilometerstand}
        onKmChange={handleKmChange}
        kmError={kmError}
        notitie={notitie}
        setNotitie={setNotitie}
        file={file}
        setFile={setFile}
        fotos={fotos}
        setFotos={setFotos}
        schadePunten={schadePunten}
        setSchadePunten={setSchadePunten}
        schadevrij={schadevrij}
        setSchadevrij={setSchadevrij}
        uploading={uploading}
        onSubmit={handleSubmit}
      />

      <RecentReturns
        terugmeldingen={terugmeldingen}
        allVehicles={allVehicles}
        onSelectVehicle={handleSelectVehicle}
        getMinKm={getMinKm}
      />

      <ReturnHistory
        terugmeldingen={terugmeldingen}
        isLoading={isLoading}
        onDelete={(id) => deleteMutation.mutate(id)}
      />
    </div>
  );
}
