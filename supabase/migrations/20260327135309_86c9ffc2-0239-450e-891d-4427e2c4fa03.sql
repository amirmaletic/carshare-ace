
CREATE TABLE public.aanvragen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  klant_naam text NOT NULL,
  klant_email text,
  klant_telefoon text,
  gewenst_type text,
  gewenste_categorie text,
  gewenste_brandstof text,
  gewenste_periode_start date,
  gewenste_periode_eind date,
  budget_max numeric,
  notitie text,
  status text NOT NULL DEFAULT 'nieuw',
  gekoppeld_voertuig_id uuid REFERENCES public.voertuigen(id) ON DELETE SET NULL,
  ai_motivatie text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.aanvragen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own aanvragen" ON public.aanvragen FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own aanvragen" ON public.aanvragen FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own aanvragen" ON public.aanvragen FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own aanvragen" ON public.aanvragen FOR DELETE TO authenticated USING (auth.uid() = user_id);
