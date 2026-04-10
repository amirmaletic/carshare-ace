
-- 1. Create organisaties table
CREATE TABLE public.organisaties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  naam text NOT NULL DEFAULT 'Mijn Bedrijf',
  eigenaar_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.organisaties ENABLE ROW LEVEL SECURITY;

-- 2. Create uitnodigingen table
CREATE TABLE public.uitnodigingen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisatie_id uuid NOT NULL REFERENCES public.organisaties(id) ON DELETE CASCADE,
  email text NOT NULL,
  role app_role NOT NULL DEFAULT 'medewerker',
  token uuid NOT NULL DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'pending',
  uitgenodigd_door uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days')
);
ALTER TABLE public.uitnodigingen ENABLE ROW LEVEL SECURITY;

-- 3. Add organisatie_id to user_roles
ALTER TABLE public.user_roles ADD COLUMN organisatie_id uuid REFERENCES public.organisaties(id);

-- 4. Backfill: create org for each existing user and link
DO $$
DECLARE
  r RECORD;
  new_org_id uuid;
BEGIN
  FOR r IN SELECT DISTINCT user_id FROM public.user_roles WHERE organisatie_id IS NULL
  LOOP
    INSERT INTO public.organisaties (naam, eigenaar_id) VALUES ('Mijn Bedrijf', r.user_id) RETURNING id INTO new_org_id;
    UPDATE public.user_roles SET organisatie_id = new_org_id WHERE user_id = r.user_id AND organisatie_id IS NULL;
  END LOOP;
END $$;

-- 5. Add organisatie_id to all data tables
ALTER TABLE public.voertuigen ADD COLUMN organisatie_id uuid REFERENCES public.organisaties(id);
ALTER TABLE public.contracts ADD COLUMN organisatie_id uuid REFERENCES public.organisaties(id);
ALTER TABLE public.chauffeurs ADD COLUMN organisatie_id uuid REFERENCES public.organisaties(id);
ALTER TABLE public.chauffeur_beschikbaarheid ADD COLUMN organisatie_id uuid REFERENCES public.organisaties(id);
ALTER TABLE public.ritten ADD COLUMN organisatie_id uuid REFERENCES public.organisaties(id);
ALTER TABLE public.overdrachten ADD COLUMN organisatie_id uuid REFERENCES public.organisaties(id);
ALTER TABLE public.terugmeldingen ADD COLUMN organisatie_id uuid REFERENCES public.organisaties(id);
ALTER TABLE public.schade_rapporten ADD COLUMN organisatie_id uuid REFERENCES public.organisaties(id);
ALTER TABLE public.service_historie ADD COLUMN organisatie_id uuid REFERENCES public.organisaties(id);
ALTER TABLE public.eigendom_historie ADD COLUMN organisatie_id uuid REFERENCES public.organisaties(id);
ALTER TABLE public.invoices ADD COLUMN organisatie_id uuid REFERENCES public.organisaties(id);
ALTER TABLE public.kilometer_registraties ADD COLUMN organisatie_id uuid REFERENCES public.organisaties(id);
ALTER TABLE public.aanvragen ADD COLUMN organisatie_id uuid REFERENCES public.organisaties(id);
ALTER TABLE public.activiteiten_log ADD COLUMN organisatie_id uuid REFERENCES public.organisaties(id);
ALTER TABLE public.locaties ADD COLUMN organisatie_id uuid REFERENCES public.organisaties(id);

-- 6. Backfill organisatie_id on data tables from user's org
UPDATE public.voertuigen SET organisatie_id = (SELECT organisatie_id FROM public.user_roles WHERE user_roles.user_id = voertuigen.user_id LIMIT 1) WHERE organisatie_id IS NULL;
UPDATE public.contracts SET organisatie_id = (SELECT organisatie_id FROM public.user_roles WHERE user_roles.user_id = contracts.user_id LIMIT 1) WHERE organisatie_id IS NULL;
UPDATE public.chauffeurs SET organisatie_id = (SELECT organisatie_id FROM public.user_roles WHERE user_roles.user_id = chauffeurs.user_id LIMIT 1) WHERE organisatie_id IS NULL;
UPDATE public.chauffeur_beschikbaarheid SET organisatie_id = (SELECT organisatie_id FROM public.user_roles WHERE user_roles.user_id = chauffeur_beschikbaarheid.user_id LIMIT 1) WHERE organisatie_id IS NULL;
UPDATE public.ritten SET organisatie_id = (SELECT organisatie_id FROM public.user_roles WHERE user_roles.user_id = ritten.user_id LIMIT 1) WHERE organisatie_id IS NULL;
UPDATE public.overdrachten SET organisatie_id = (SELECT organisatie_id FROM public.user_roles WHERE user_roles.user_id = overdrachten.user_id LIMIT 1) WHERE organisatie_id IS NULL;
UPDATE public.terugmeldingen SET organisatie_id = (SELECT organisatie_id FROM public.user_roles WHERE user_roles.user_id = terugmeldingen.user_id LIMIT 1) WHERE organisatie_id IS NULL;
UPDATE public.schade_rapporten SET organisatie_id = (SELECT organisatie_id FROM public.user_roles WHERE user_roles.user_id = schade_rapporten.user_id LIMIT 1) WHERE organisatie_id IS NULL;
UPDATE public.service_historie SET organisatie_id = (SELECT organisatie_id FROM public.user_roles WHERE user_roles.user_id = service_historie.user_id LIMIT 1) WHERE organisatie_id IS NULL;
UPDATE public.eigendom_historie SET organisatie_id = (SELECT organisatie_id FROM public.user_roles WHERE user_roles.user_id = eigendom_historie.user_id LIMIT 1) WHERE organisatie_id IS NULL;
UPDATE public.invoices SET organisatie_id = (SELECT organisatie_id FROM public.user_roles WHERE user_roles.user_id = invoices.user_id LIMIT 1) WHERE organisatie_id IS NULL;
UPDATE public.kilometer_registraties SET organisatie_id = (SELECT organisatie_id FROM public.user_roles WHERE user_roles.user_id = kilometer_registraties.user_id LIMIT 1) WHERE organisatie_id IS NULL;
UPDATE public.aanvragen SET organisatie_id = (SELECT organisatie_id FROM public.user_roles WHERE user_roles.user_id = aanvragen.user_id LIMIT 1) WHERE organisatie_id IS NULL;
UPDATE public.activiteiten_log SET organisatie_id = (SELECT organisatie_id FROM public.user_roles WHERE user_roles.user_id = activiteiten_log.user_id LIMIT 1) WHERE organisatie_id IS NULL;
UPDATE public.locaties SET organisatie_id = (SELECT organisatie_id FROM public.user_roles WHERE user_roles.user_id = locaties.user_id LIMIT 1) WHERE organisatie_id IS NULL;

-- 7. Helper function: get org id for a user
CREATE OR REPLACE FUNCTION public.get_user_organisatie_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organisatie_id FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- 8. Update handle_new_user to create org or join via invite
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite_record RECORD;
  new_org_id uuid;
BEGIN
  SELECT * INTO invite_record FROM public.uitnodigingen
  WHERE email = NEW.email AND status = 'pending' AND expires_at > now()
  LIMIT 1;

  IF invite_record IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role, organisatie_id)
    VALUES (NEW.id, invite_record.role, invite_record.organisatie_id)
    ON CONFLICT DO NOTHING;
    UPDATE public.uitnodigingen SET status = 'accepted' WHERE id = invite_record.id;
  ELSE
    INSERT INTO public.organisaties (naam, eigenaar_id) VALUES ('Mijn Bedrijf', NEW.id) RETURNING id INTO new_org_id;
    INSERT INTO public.user_roles (user_id, role, organisatie_id) VALUES (NEW.id, 'beheerder', new_org_id) ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- 9. Create trigger (recreate to ensure it exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. RLS policies for organisaties
CREATE POLICY "Members can view own org" ON public.organisaties
  FOR SELECT USING (id = get_user_organisatie_id(auth.uid()));
CREATE POLICY "Owner can update own org" ON public.organisaties
  FOR UPDATE USING (eigenaar_id = auth.uid());

-- 11. RLS policies for uitnodigingen
CREATE POLICY "Admins can manage invites" ON public.uitnodigingen
  FOR ALL USING (has_role(auth.uid(), 'beheerder') AND organisatie_id = get_user_organisatie_id(auth.uid()))
  WITH CHECK (has_role(auth.uid(), 'beheerder') AND organisatie_id = get_user_organisatie_id(auth.uid()));
CREATE POLICY "Staff can view invites" ON public.uitnodigingen
  FOR SELECT USING (organisatie_id = get_user_organisatie_id(auth.uid()));

-- 12. Drop old RLS policies and create org-based ones for all data tables

-- voertuigen
DROP POLICY IF EXISTS "Users can create own voertuigen" ON public.voertuigen;
DROP POLICY IF EXISTS "Users can delete own voertuigen" ON public.voertuigen;
DROP POLICY IF EXISTS "Users can update own voertuigen" ON public.voertuigen;
DROP POLICY IF EXISTS "Users can view own voertuigen" ON public.voertuigen;
CREATE POLICY "Org members can view voertuigen" ON public.voertuigen FOR SELECT TO authenticated USING (organisatie_id = get_user_organisatie_id(auth.uid()));
CREATE POLICY "Org members can create voertuigen" ON public.voertuigen FOR INSERT TO authenticated WITH CHECK (organisatie_id = get_user_organisatie_id(auth.uid()));
CREATE POLICY "Org members can update voertuigen" ON public.voertuigen FOR UPDATE TO authenticated USING (organisatie_id = get_user_organisatie_id(auth.uid()));
CREATE POLICY "Org members can delete voertuigen" ON public.voertuigen FOR DELETE TO authenticated USING (organisatie_id = get_user_organisatie_id(auth.uid()));

-- contracts
DROP POLICY IF EXISTS "Users can create own contracts" ON public.contracts;
DROP POLICY IF EXISTS "Users can delete own contracts" ON public.contracts;
DROP POLICY IF EXISTS "Users can update own contracts" ON public.contracts;
DROP POLICY IF EXISTS "Users can view own contracts" ON public.contracts;
CREATE POLICY "Org members can view contracts" ON public.contracts FOR SELECT TO authenticated USING (organisatie_id = get_user_organisatie_id(auth.uid()));
CREATE POLICY "Org members can create contracts" ON public.contracts FOR INSERT TO authenticated WITH CHECK (organisatie_id = get_user_organisatie_id(auth.uid()));
CREATE POLICY "Org members can update contracts" ON public.contracts FOR UPDATE TO authenticated USING (organisatie_id = get_user_organisatie_id(auth.uid()));
CREATE POLICY "Org members can delete contracts" ON public.contracts FOR DELETE TO authenticated USING (organisatie_id = get_user_organisatie_id(auth.uid()));

-- chauffeurs
DROP POLICY IF EXISTS "Users can create own chauffeurs" ON public.chauffeurs;
DROP POLICY IF EXISTS "Users can delete own chauffeurs" ON public.chauffeurs;
DROP POLICY IF EXISTS "Users can update own chauffeurs" ON public.chauffeurs;
DROP POLICY IF EXISTS "Users can view own chauffeurs" ON public.chauffeurs;
CREATE POLICY "Org members can view chauffeurs" ON public.chauffeurs FOR SELECT TO authenticated USING (organisatie_id = get_user_organisatie_id(auth.uid()));
CREATE POLICY "Org members can create chauffeurs" ON public.chauffeurs FOR INSERT TO authenticated WITH CHECK (organisatie_id = get_user_organisatie_id(auth.uid()));
CREATE POLICY "Org members can update chauffeurs" ON public.chauffeurs FOR UPDATE TO authenticated USING (organisatie_id = get_user_organisatie_id(auth.uid()));
CREATE POLICY "Org members can delete chauffeurs" ON public.chauffeurs FOR DELETE TO authenticated USING (organisatie_id = get_user_organisatie_id(auth.uid()));

-- chauffeur_beschikbaarheid
DROP POLICY IF EXISTS "Users can create own chauffeur_beschikbaarheid" ON public.chauffeur_beschikbaarheid;
DROP POLICY IF EXISTS "Users can delete own chauffeur_beschikbaarheid" ON public.chauffeur_beschikbaarheid;
DROP POLICY IF EXISTS "Users can update own chauffeur_beschikbaarheid" ON public.chauffeur_beschikbaarheid;
DROP POLICY IF EXISTS "Users can view own chauffeur_beschikbaarheid" ON public.chauffeur_beschikbaarheid;
CREATE POLICY "Org members can view chauffeur_beschikbaarheid" ON public.chauffeur_beschikbaarheid FOR SELECT TO authenticated USING (organisatie_id = get_user_organisatie_id(auth.uid()));
CREATE POLICY "Org members can create chauffeur_beschikbaarheid" ON public.chauffeur_beschikbaarheid FOR INSERT TO authenticated WITH CHECK (organisatie_id = get_user_organisatie_id(auth.uid()));
CREATE POLICY "Org members can update chauffeur_beschikbaarheid" ON public.chauffeur_beschikbaarheid FOR UPDATE TO authenticated USING (organisatie_id = get_user_organisatie_id(auth.uid()));
CREATE POLICY "Org members can delete chauffeur_beschikbaarheid" ON public.chauffeur_beschikbaarheid FOR DELETE TO authenticated USING (organisatie_id = get_user_organisatie_id(auth.uid()));

-- ritten
DROP POLICY IF EXISTS "Users can create own ritten" ON public.ritten;
DROP POLICY IF EXISTS "Users can delete own ritten" ON public.ritten;
DROP POLICY IF EXISTS "Users can update own ritten" ON public.ritten;
DROP POLICY IF EXISTS "Users can view own ritten" ON public.ritten;
CREATE POLICY "Org members can view ritten" ON public.ritten FOR SELECT TO authenticated USING (organisatie_id = get_user_organisatie_id(auth.uid()));
CREATE POLICY "Org members can create ritten" ON public.ritten FOR INSERT TO authenticated WITH CHECK (organisatie_id = get_user_organisatie_id(auth.uid()));
CREATE POLICY "Org members can update ritten" ON public.ritten FOR UPDATE TO authenticated USING (organisatie_id = get_user_organisatie_id(auth.uid()));
CREATE POLICY "Org members can delete ritten" ON public.ritten FOR DELETE TO authenticated USING (organisatie_id = get_user_organisatie_id(auth.uid()));

-- overdrachten
DROP POLICY IF EXISTS "Users can create own overdrachten" ON public.overdrachten;
DROP POLICY IF EXISTS "Users can delete own overdrachten" ON public.overdrachten;
DROP POLICY IF EXISTS "Users can update own overdrachten" ON public.overdrachten;
DROP POLICY IF EXISTS "Users can view own overdrachten" ON public.overdrachten;
CREATE POLICY "Org members can view overdrachten" ON public.overdrachten FOR SELECT TO authenticated USING (organisatie_id = get_user_organisatie_id(auth.uid()));
CREATE POLICY "Org members can create overdrachten" ON public.overdrachten FOR INSERT TO authenticated WITH CHECK (organisatie_id = get_user_organisatie_id(auth.uid()));
CREATE POLICY "Org members can update overdrachten" ON public.overdrachten FOR UPDATE TO authenticated USING (organisatie_id = get_user_organisatie_id(auth.uid()));
CREATE POLICY "Org members can delete overdrachten" ON public.overdrachten FOR DELETE TO authenticated USING (organisatie_id = get_user_organisatie_id(auth.uid()));

-- terugmeldingen
DROP POLICY IF EXISTS "Users can insert own terugmeldingen" ON public.terugmeldingen;
DROP POLICY IF EXISTS "Users can delete own terugmeldingen" ON public.terugmeldingen;
DROP POLICY IF EXISTS "Users can view own terugmeldingen" ON public.terugmeldingen;
CREATE POLICY "Org members can view terugmeldingen" ON public.terugmeldingen FOR SELECT TO authenticated USING (organisatie_id = get_user_organisatie_id(auth.uid()));
CREATE POLICY "Org members can create terugmeldingen" ON public.terugmeldingen FOR INSERT TO authenticated WITH CHECK (organisatie_id = get_user_organisatie_id(auth.uid()));
CREATE POLICY "Org members can update terugmeldingen" ON public.terugmeldingen FOR UPDATE TO authenticated USING (organisatie_id = get_user_organisatie_id(auth.uid()));
CREATE POLICY "Org members can delete terugmeldingen" ON public.terugmeldingen FOR DELETE TO authenticated USING (organisatie_id = get_user_organisatie_id(auth.uid()));

-- schade_rapporten
DROP POLICY IF EXISTS "Users can create own schade_rapporten" ON public.schade_rapporten;
DROP POLICY IF EXISTS "Users can delete own schade_rapporten" ON public.schade_rapporten;
DROP POLICY IF EXISTS "Users can update own schade_rapporten" ON public.schade_rapporten;
DROP POLICY IF EXISTS "Users can view own schade_rapporten" ON public.schade_rapporten;
CREATE POLICY "Org members can view schade_rapporten" ON public.schade_rapporten FOR SELECT TO authenticated USING (organisatie_id = get_user_organisatie_id(auth.uid()));
CREATE POLICY "Org members can create schade_rapporten" ON public.schade_rapporten FOR INSERT TO authenticated WITH CHECK (organisatie_id = get_user_organisatie_id(auth.uid()));
CREATE POLICY "Org members can update schade_rapporten" ON public.schade_rapporten FOR UPDATE TO authenticated USING (organisatie_id = get_user_organisatie_id(auth.uid()));
CREATE POLICY "Org members can delete schade_rapporten" ON public.schade_rapporten FOR DELETE TO authenticated USING (organisatie_id = get_user_organisatie_id(auth.uid()));

-- service_historie
DROP POLICY IF EXISTS "Users can create own service_historie" ON public.service_historie;
DROP POLICY IF EXISTS "Users can delete own service_historie" ON public.service_historie;
DROP POLICY IF EXISTS "Users can update own service_historie" ON public.service_historie;
DROP POLICY IF EXISTS "Users can view own service_historie" ON public.service_historie;
CREATE POLICY "Org members can view service_historie" ON public.service_historie FOR SELECT TO authenticated USING (organisatie_id = get_user_organisatie_id(auth.uid()));
CREATE POLICY "Org members can create service_historie" ON public.service_historie FOR INSERT TO authenticated WITH CHECK (organisatie_id = get_user_organisatie_id(auth.uid()));
CREATE POLICY "Org members can update service_historie" ON public.service_historie FOR UPDATE TO authenticated USING (organisatie_id = get_user_organisatie_id(auth.uid()));
CREATE POLICY "Org members can delete service_historie" ON public.service_historie FOR DELETE TO authenticated USING (organisatie_id = get_user_organisatie_id(auth.uid()));

-- eigendom_historie
DROP POLICY IF EXISTS "Users can create own eigendom_historie" ON public.eigendom_historie;
DROP POLICY IF EXISTS "Users can delete own eigendom_historie" ON public.eigendom_historie;
DROP POLICY IF EXISTS "Users can update own eigendom_historie" ON public.eigendom_historie;
DROP POLICY IF EXISTS "Users can view own eigendom_historie" ON public.eigendom_historie;
CREATE POLICY "Org members can view eigendom_historie" ON public.eigendom_historie FOR SELECT TO authenticated USING (organisatie_id = get_user_organisatie_id(auth.uid()));
CREATE POLICY "Org members can create eigendom_historie" ON public.eigendom_historie FOR INSERT TO authenticated WITH CHECK (organisatie_id = get_user_organisatie_id(auth.uid()));
CREATE POLICY "Org members can update eigendom_historie" ON public.eigendom_historie FOR UPDATE TO authenticated USING (organisatie_id = get_user_organisatie_id(auth.uid()));
CREATE POLICY "Org members can delete eigendom_historie" ON public.eigendom_historie FOR DELETE TO authenticated USING (organisatie_id = get_user_organisatie_id(auth.uid()));

-- invoices
DROP POLICY IF EXISTS "Users can create own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can delete own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can update own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can view own invoices" ON public.invoices;
CREATE POLICY "Org members can view invoices" ON public.invoices FOR SELECT TO authenticated USING (organisatie_id = get_user_organisatie_id(auth.uid()));
CREATE POLICY "Org members can create invoices" ON public.invoices FOR INSERT TO authenticated WITH CHECK (organisatie_id = get_user_organisatie_id(auth.uid()));
CREATE POLICY "Org members can update invoices" ON public.invoices FOR UPDATE TO authenticated USING (organisatie_id = get_user_organisatie_id(auth.uid()));
CREATE POLICY "Org members can delete invoices" ON public.invoices FOR DELETE TO authenticated USING (organisatie_id = get_user_organisatie_id(auth.uid()));

-- kilometer_registraties
DROP POLICY IF EXISTS "Users can create own km registraties" ON public.kilometer_registraties;
DROP POLICY IF EXISTS "Users can delete own km registraties" ON public.kilometer_registraties;
DROP POLICY IF EXISTS "Users can update own km registraties" ON public.kilometer_registraties;
DROP POLICY IF EXISTS "Users can view own km registraties" ON public.kilometer_registraties;
CREATE POLICY "Org members can view km registraties" ON public.kilometer_registraties FOR SELECT TO authenticated USING (organisatie_id = get_user_organisatie_id(auth.uid()));
CREATE POLICY "Org members can create km registraties" ON public.kilometer_registraties FOR INSERT TO authenticated WITH CHECK (organisatie_id = get_user_organisatie_id(auth.uid()));
CREATE POLICY "Org members can update km registraties" ON public.kilometer_registraties FOR UPDATE TO authenticated USING (organisatie_id = get_user_organisatie_id(auth.uid()));
CREATE POLICY "Org members can delete km registraties" ON public.kilometer_registraties FOR DELETE TO authenticated USING (organisatie_id = get_user_organisatie_id(auth.uid()));

-- aanvragen
DROP POLICY IF EXISTS "Users can create own aanvragen" ON public.aanvragen;
DROP POLICY IF EXISTS "Users can delete own aanvragen" ON public.aanvragen;
DROP POLICY IF EXISTS "Users can update own aanvragen" ON public.aanvragen;
DROP POLICY IF EXISTS "Users can view own aanvragen" ON public.aanvragen;
CREATE POLICY "Org members can view aanvragen" ON public.aanvragen FOR SELECT TO authenticated USING (organisatie_id = get_user_organisatie_id(auth.uid()));
CREATE POLICY "Org members can create aanvragen" ON public.aanvragen FOR INSERT TO authenticated WITH CHECK (organisatie_id = get_user_organisatie_id(auth.uid()));
CREATE POLICY "Org members can update aanvragen" ON public.aanvragen FOR UPDATE TO authenticated USING (organisatie_id = get_user_organisatie_id(auth.uid()));
CREATE POLICY "Org members can delete aanvragen" ON public.aanvragen FOR DELETE TO authenticated USING (organisatie_id = get_user_organisatie_id(auth.uid()));

-- activiteiten_log
DROP POLICY IF EXISTS "Staff can view all activities" ON public.activiteiten_log;
DROP POLICY IF EXISTS "Users can insert own activities" ON public.activiteiten_log;
DROP POLICY IF EXISTS "Users can view own activities" ON public.activiteiten_log;
CREATE POLICY "Org members can view activiteiten" ON public.activiteiten_log FOR SELECT TO authenticated USING (organisatie_id = get_user_organisatie_id(auth.uid()));
CREATE POLICY "Org members can create activiteiten" ON public.activiteiten_log FOR INSERT TO authenticated WITH CHECK (organisatie_id = get_user_organisatie_id(auth.uid()));

-- locaties
DROP POLICY IF EXISTS "Users can create own locaties" ON public.locaties;
DROP POLICY IF EXISTS "Users can delete own locaties" ON public.locaties;
DROP POLICY IF EXISTS "Users can update own locaties" ON public.locaties;
DROP POLICY IF EXISTS "Users can view own locaties" ON public.locaties;
CREATE POLICY "Org members can view locaties" ON public.locaties FOR SELECT TO authenticated USING (organisatie_id = get_user_organisatie_id(auth.uid()));
CREATE POLICY "Org members can create locaties" ON public.locaties FOR INSERT TO authenticated WITH CHECK (organisatie_id = get_user_organisatie_id(auth.uid()));
CREATE POLICY "Org members can update locaties" ON public.locaties FOR UPDATE TO authenticated USING (organisatie_id = get_user_organisatie_id(auth.uid()));
CREATE POLICY "Org members can delete locaties" ON public.locaties FOR DELETE TO authenticated USING (organisatie_id = get_user_organisatie_id(auth.uid()));
