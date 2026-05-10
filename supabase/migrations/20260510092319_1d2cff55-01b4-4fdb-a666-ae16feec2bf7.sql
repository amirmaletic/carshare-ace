
CREATE TABLE public.mollie_instellingen (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organisatie_id UUID NOT NULL UNIQUE,
  api_key TEXT NOT NULL,
  modus TEXT NOT NULL DEFAULT 'test' CHECK (modus IN ('test','live')),
  profile_id TEXT,
  profile_naam TEXT,
  actief BOOLEAN NOT NULL DEFAULT true,
  laatst_getest_op TIMESTAMPTZ,
  laatst_getest_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mollie_instellingen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Beheerders zien eigen mollie key"
ON public.mollie_instellingen FOR SELECT
TO authenticated
USING (organisatie_id = get_user_organisatie_id(auth.uid()) AND has_role(auth.uid(), 'beheerder'::app_role));

CREATE POLICY "Beheerders maken eigen mollie key"
ON public.mollie_instellingen FOR INSERT
TO authenticated
WITH CHECK (organisatie_id = get_user_organisatie_id(auth.uid()) AND has_role(auth.uid(), 'beheerder'::app_role));

CREATE POLICY "Beheerders updaten eigen mollie key"
ON public.mollie_instellingen FOR UPDATE
TO authenticated
USING (organisatie_id = get_user_organisatie_id(auth.uid()) AND has_role(auth.uid(), 'beheerder'::app_role));

CREATE POLICY "Beheerders verwijderen eigen mollie key"
ON public.mollie_instellingen FOR DELETE
TO authenticated
USING (organisatie_id = get_user_organisatie_id(auth.uid()) AND has_role(auth.uid(), 'beheerder'::app_role));

CREATE TRIGGER update_mollie_instellingen_updated_at
BEFORE UPDATE ON public.mollie_instellingen
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
