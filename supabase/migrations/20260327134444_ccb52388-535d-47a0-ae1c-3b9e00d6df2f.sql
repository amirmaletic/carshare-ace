
CREATE TABLE public.chauffeurs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  voornaam text NOT NULL,
  achternaam text NOT NULL,
  email text,
  telefoon text,
  rijbewijs_categorie text NOT NULL DEFAULT 'B',
  rijbewijs_nummer text,
  rijbewijs_verloopt date,
  geboortedatum date,
  adres text,
  postcode text,
  plaats text,
  notities text,
  status text NOT NULL DEFAULT 'actief',
  voertuig_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chauffeurs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chauffeurs" ON public.chauffeurs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own chauffeurs" ON public.chauffeurs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own chauffeurs" ON public.chauffeurs FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own chauffeurs" ON public.chauffeurs FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_chauffeurs_updated_at BEFORE UPDATE ON public.chauffeurs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
