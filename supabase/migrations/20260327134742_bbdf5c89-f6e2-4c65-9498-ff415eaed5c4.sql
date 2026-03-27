
CREATE TABLE public.ritten (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  voertuig_id uuid REFERENCES public.voertuigen(id) ON DELETE SET NULL,
  chauffeur_id uuid REFERENCES public.chauffeurs(id) ON DELETE SET NULL,
  van_locatie text NOT NULL,
  naar_locatie text NOT NULL,
  datum date NOT NULL DEFAULT CURRENT_DATE,
  vertrek_tijd time,
  aankomst_tijd time,
  afstand_km numeric DEFAULT 0,
  kosten numeric DEFAULT 0,
  km_tarief numeric DEFAULT 0.35,
  status text NOT NULL DEFAULT 'gepland',
  type text NOT NULL DEFAULT 'transport',
  notitie text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ritten ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ritten" ON public.ritten FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own ritten" ON public.ritten FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ritten" ON public.ritten FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ritten" ON public.ritten FOR DELETE TO authenticated USING (auth.uid() = user_id);
