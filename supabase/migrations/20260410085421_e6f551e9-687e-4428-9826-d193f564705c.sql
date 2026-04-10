
-- Klanten tabel
CREATE TABLE public.klanten (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id uuid UNIQUE,
  voornaam text NOT NULL,
  achternaam text NOT NULL,
  email text NOT NULL,
  telefoon text,
  adres text,
  postcode text,
  plaats text,
  rijbewijs_nummer text,
  rijbewijs_verloopt date,
  type text NOT NULL DEFAULT 'particulier',
  bedrijfsnaam text,
  kvk_nummer text,
  notities text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.klanten ENABLE ROW LEVEL SECURITY;

-- Klanten kunnen eigen profiel zien
CREATE POLICY "Klanten can view own profile"
ON public.klanten FOR SELECT TO authenticated
USING (auth.uid() = auth_user_id);

-- Klanten kunnen eigen profiel updaten
CREATE POLICY "Klanten can update own profile"
ON public.klanten FOR UPDATE TO authenticated
USING (auth.uid() = auth_user_id);

-- Medewerkers/beheerders kunnen alle klanten zien
CREATE POLICY "Staff can view all klanten"
ON public.klanten FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'beheerder') OR public.has_role(auth.uid(), 'medewerker'));

-- Medewerkers/beheerders kunnen klanten aanmaken
CREATE POLICY "Staff can insert klanten"
ON public.klanten FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'beheerder') OR public.has_role(auth.uid(), 'medewerker') OR auth.uid() = auth_user_id);

-- Beheerders kunnen klanten verwijderen
CREATE POLICY "Admins can delete klanten"
ON public.klanten FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'beheerder'));

-- Staff can update all klanten
CREATE POLICY "Staff can update all klanten"
ON public.klanten FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'beheerder') OR public.has_role(auth.uid(), 'medewerker'));

-- Trigger voor updated_at
CREATE TRIGGER update_klanten_updated_at
BEFORE UPDATE ON public.klanten
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Reserveringen tabel
CREATE TABLE public.reserveringen (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  klant_id uuid NOT NULL REFERENCES public.klanten(id) ON DELETE CASCADE,
  voertuig_id uuid NOT NULL,
  start_datum date NOT NULL,
  eind_datum date NOT NULL,
  dagprijs numeric NOT NULL DEFAULT 0,
  totaalprijs numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'aangevraagd',
  notities text,
  extras text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reserveringen ENABLE ROW LEVEL SECURITY;

-- Klanten kunnen eigen reserveringen zien
CREATE POLICY "Klanten can view own reserveringen"
ON public.reserveringen FOR SELECT TO authenticated
USING (
  klant_id IN (SELECT id FROM public.klanten WHERE auth_user_id = auth.uid())
);

-- Klanten kunnen reserveringen aanmaken
CREATE POLICY "Klanten can create reserveringen"
ON public.reserveringen FOR INSERT TO authenticated
WITH CHECK (
  klant_id IN (SELECT id FROM public.klanten WHERE auth_user_id = auth.uid())
);

-- Klanten kunnen eigen reserveringen updaten (bijv. annuleren)
CREATE POLICY "Klanten can update own reserveringen"
ON public.reserveringen FOR UPDATE TO authenticated
USING (
  klant_id IN (SELECT id FROM public.klanten WHERE auth_user_id = auth.uid())
);

-- Staff kan alles
CREATE POLICY "Staff can manage all reserveringen"
ON public.reserveringen FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'beheerder') OR public.has_role(auth.uid(), 'medewerker'))
WITH CHECK (public.has_role(auth.uid(), 'beheerder') OR public.has_role(auth.uid(), 'medewerker'));

-- Trigger voor updated_at
CREATE TRIGGER update_reserveringen_updated_at
BEFORE UPDATE ON public.reserveringen
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
