
-- Add company fields to organisaties
ALTER TABLE public.organisaties
  ADD COLUMN IF NOT EXISTS kvk_nummer text,
  ADD COLUMN IF NOT EXISTS btw_nummer text,
  ADD COLUMN IF NOT EXISTS adres text,
  ADD COLUMN IF NOT EXISTS postcode text,
  ADD COLUMN IF NOT EXISTS plaats text,
  ADD COLUMN IF NOT EXISTS telefoon text,
  ADD COLUMN IF NOT EXISTS email text;

-- Allow beheerders (not just eigenaar) to update org company info
DROP POLICY IF EXISTS "Beheerders can update own org" ON public.organisaties;
CREATE POLICY "Beheerders can update own org"
ON public.organisaties
FOR UPDATE
TO authenticated
USING (
  id = get_user_organisatie_id(auth.uid())
  AND has_role(auth.uid(), 'beheerder'::app_role)
);

-- Preferences table
CREATE TABLE IF NOT EXISTS public.organisatie_voorkeuren (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisatie_id uuid NOT NULL UNIQUE,
  -- notificaties
  apk_herinnering boolean NOT NULL DEFAULT true,
  apk_dagen_vooraf integer NOT NULL DEFAULT 30,
  verzekering_herinnering boolean NOT NULL DEFAULT true,
  onderhoud_herinnering boolean NOT NULL DEFAULT true,
  contract_verloop boolean NOT NULL DEFAULT true,
  contract_dagen_vooraf integer NOT NULL DEFAULT 60,
  factuur_herinnering boolean NOT NULL DEFAULT true,
  km_overschrijding boolean NOT NULL DEFAULT true,
  -- algemeen
  standaard_btw text NOT NULL DEFAULT '21',
  valuta text NOT NULL DEFAULT 'EUR',
  datum_formaat text NOT NULL DEFAULT 'dd-mm-yyyy',
  km_registratie_interval text NOT NULL DEFAULT 'maandelijks',
  standaard_contract_duur text NOT NULL DEFAULT '12',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.organisatie_voorkeuren ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view voorkeuren"
ON public.organisatie_voorkeuren FOR SELECT TO authenticated
USING (organisatie_id = get_user_organisatie_id(auth.uid()));

CREATE POLICY "Beheerders can insert voorkeuren"
ON public.organisatie_voorkeuren FOR INSERT TO authenticated
WITH CHECK (
  organisatie_id = get_user_organisatie_id(auth.uid())
  AND has_role(auth.uid(), 'beheerder'::app_role)
);

CREATE POLICY "Beheerders can update voorkeuren"
ON public.organisatie_voorkeuren FOR UPDATE TO authenticated
USING (
  organisatie_id = get_user_organisatie_id(auth.uid())
  AND has_role(auth.uid(), 'beheerder'::app_role)
);

CREATE TRIGGER update_voorkeuren_updated_at
BEFORE UPDATE ON public.organisatie_voorkeuren
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
