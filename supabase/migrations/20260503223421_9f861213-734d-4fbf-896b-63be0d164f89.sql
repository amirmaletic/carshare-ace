-- 1. schade_punten kolom op overdrachten en terugmeldingen
ALTER TABLE public.overdrachten ADD COLUMN IF NOT EXISTS schade_punten jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.terugmeldingen ADD COLUMN IF NOT EXISTS schade_punten jsonb NOT NULL DEFAULT '[]'::jsonb;

-- 2. Nieuwe tabel voor AI-schade-vergelijking
CREATE TABLE IF NOT EXISTS public.schade_vergelijkingen (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organisatie_id uuid NOT NULL,
  user_id uuid NOT NULL,
  terugmelding_id uuid NOT NULL,
  ophaal_overdracht_id uuid,
  voertuig_id text NOT NULL,
  status text NOT NULL DEFAULT 'in_review',
  ai_resultaat jsonb NOT NULL DEFAULT '{}'::jsonb,
  ai_model text,
  beoordeeld_door uuid,
  beoordeeld_op timestamp with time zone,
  notitie text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_schade_vergelijkingen_org ON public.schade_vergelijkingen(organisatie_id);
CREATE INDEX IF NOT EXISTS idx_schade_vergelijkingen_voertuig ON public.schade_vergelijkingen(voertuig_id);
CREATE INDEX IF NOT EXISTS idx_schade_vergelijkingen_terugmelding ON public.schade_vergelijkingen(terugmelding_id);

ALTER TABLE public.schade_vergelijkingen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view schade_vergelijkingen"
  ON public.schade_vergelijkingen FOR SELECT TO authenticated
  USING (organisatie_id = public.get_user_organisatie_id(auth.uid()));

CREATE POLICY "Org members create schade_vergelijkingen"
  ON public.schade_vergelijkingen FOR INSERT TO authenticated
  WITH CHECK (organisatie_id = public.get_user_organisatie_id(auth.uid()));

CREATE POLICY "Org members update schade_vergelijkingen"
  ON public.schade_vergelijkingen FOR UPDATE TO authenticated
  USING (organisatie_id = public.get_user_organisatie_id(auth.uid()));

CREATE POLICY "Org members delete schade_vergelijkingen"
  ON public.schade_vergelijkingen FOR DELETE TO authenticated
  USING (organisatie_id = public.get_user_organisatie_id(auth.uid()));

CREATE TRIGGER update_schade_vergelijkingen_updated_at
  BEFORE UPDATE ON public.schade_vergelijkingen
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();