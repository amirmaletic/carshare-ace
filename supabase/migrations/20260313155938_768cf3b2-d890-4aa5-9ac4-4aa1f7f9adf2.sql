
CREATE TABLE public.voertuigen (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  kenteken TEXT NOT NULL,
  merk TEXT NOT NULL,
  model TEXT NOT NULL,
  bouwjaar INTEGER NOT NULL,
  brandstof TEXT NOT NULL DEFAULT 'Benzine',
  kilometerstand INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'beschikbaar',
  apk_vervaldatum DATE,
  verzekering_vervaldatum DATE,
  dagprijs NUMERIC NOT NULL DEFAULT 0,
  categorie TEXT NOT NULL DEFAULT 'Stadsauto',
  kleur TEXT NOT NULL DEFAULT 'Zwart',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.voertuigen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own voertuigen" ON public.voertuigen
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create own voertuigen" ON public.voertuigen
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own voertuigen" ON public.voertuigen
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own voertuigen" ON public.voertuigen
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_voertuigen_updated_at
  BEFORE UPDATE ON public.voertuigen
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
