
-- ============ 3. FACTUUR REMINDERS ============
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS vervaldatum DATE,
  ADD COLUMN IF NOT EXISTS laatste_reminder_op TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS aantal_reminders INTEGER NOT NULL DEFAULT 0;

UPDATE public.invoices SET vervaldatum = datum + INTERVAL '14 days' WHERE vervaldatum IS NULL;

-- ============ 4. BOEKHOUD KOPPELING ============
CREATE TABLE IF NOT EXISTS public.boekhoud_koppelingen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisatie_id UUID NOT NULL UNIQUE,
  provider TEXT NOT NULL CHECK (provider IN ('moneybird','exact','afas','yuki','eboekhouden')),
  access_token TEXT NOT NULL,
  administration_id TEXT,
  administration_naam TEXT,
  actief BOOLEAN NOT NULL DEFAULT true,
  laatst_getest_op TIMESTAMPTZ,
  laatst_getest_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.boekhoud_koppelingen ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Beheerders zien eigen boekhoud koppeling" ON public.boekhoud_koppelingen FOR SELECT TO authenticated
  USING (organisatie_id = get_user_organisatie_id(auth.uid()) AND has_role(auth.uid(), 'beheerder'::app_role));
CREATE POLICY "Beheerders beheren eigen boekhoud koppeling" ON public.boekhoud_koppelingen FOR ALL TO authenticated
  USING (organisatie_id = get_user_organisatie_id(auth.uid()) AND has_role(auth.uid(), 'beheerder'::app_role))
  WITH CHECK (organisatie_id = get_user_organisatie_id(auth.uid()) AND has_role(auth.uid(), 'beheerder'::app_role));
CREATE TRIGGER trg_boekhoud_koppelingen_updated_at BEFORE UPDATE ON public.boekhoud_koppelingen
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Veld op invoices voor sync status
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS extern_id TEXT,
  ADD COLUMN IF NOT EXISTS extern_provider TEXT,
  ADD COLUMN IF NOT EXISTS extern_synced_op TIMESTAMPTZ;

-- ============ 5. BRANDSTOFPAS / TANKBEURTEN ============
CREATE TABLE IF NOT EXISTS public.tankbeurten (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisatie_id UUID NOT NULL,
  user_id UUID NOT NULL,
  voertuig_id UUID,
  chauffeur_id UUID,
  kenteken_input TEXT NOT NULL,
  datum DATE NOT NULL,
  liters NUMERIC(10,2),
  bedrag NUMERIC(10,2) NOT NULL,
  prijs_per_liter NUMERIC(10,4),
  brandstoftype TEXT,
  station TEXT,
  pas_nummer TEXT,
  bron TEXT NOT NULL DEFAULT 'handmatig' CHECK (bron IN ('handmatig','shell','bp','mtc','other')),
  kilometerstand INTEGER,
  ruwe_data JSONB DEFAULT '{}'::jsonb,
  notitie TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tankbeurten_org_datum ON public.tankbeurten(organisatie_id, datum DESC);
CREATE INDEX IF NOT EXISTS idx_tankbeurten_voertuig ON public.tankbeurten(voertuig_id);
ALTER TABLE public.tankbeurten ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org leden zien tankbeurten" ON public.tankbeurten FOR SELECT TO authenticated
  USING (organisatie_id = get_user_organisatie_id(auth.uid()));
CREATE POLICY "Org leden maken tankbeurten" ON public.tankbeurten FOR INSERT TO authenticated
  WITH CHECK (organisatie_id = get_user_organisatie_id(auth.uid()));
CREATE POLICY "Org leden updaten tankbeurten" ON public.tankbeurten FOR UPDATE TO authenticated
  USING (organisatie_id = get_user_organisatie_id(auth.uid()));
CREATE POLICY "Org leden verwijderen tankbeurten" ON public.tankbeurten FOR DELETE TO authenticated
  USING (organisatie_id = get_user_organisatie_id(auth.uid()));
CREATE TRIGGER trg_tankbeurten_updated_at BEFORE UPDATE ON public.tankbeurten
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ 6. NOTIFICATIES IN-APP ============
CREATE TABLE IF NOT EXISTS public.notificaties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisatie_id UUID NOT NULL,
  user_id UUID,
  titel TEXT NOT NULL,
  bericht TEXT,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info','succes','waarschuwing','fout')),
  categorie TEXT,
  entiteit_type TEXT,
  entiteit_id TEXT,
  link_url TEXT,
  gelezen BOOLEAN NOT NULL DEFAULT false,
  gelezen_op TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notificaties_org_user ON public.notificaties(organisatie_id, user_id, gelezen, created_at DESC);
ALTER TABLE public.notificaties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org leden zien eigen of org notificaties" ON public.notificaties FOR SELECT TO authenticated
  USING (organisatie_id = get_user_organisatie_id(auth.uid()) AND (user_id IS NULL OR user_id = auth.uid()));
CREATE POLICY "Org leden updaten eigen notificaties" ON public.notificaties FOR UPDATE TO authenticated
  USING (organisatie_id = get_user_organisatie_id(auth.uid()) AND (user_id IS NULL OR user_id = auth.uid()));
CREATE POLICY "Org leden verwijderen eigen notificaties" ON public.notificaties FOR DELETE TO authenticated
  USING (organisatie_id = get_user_organisatie_id(auth.uid()) AND (user_id IS NULL OR user_id = auth.uid()));

-- Helper trigger function: maakt notificatie aan
CREATE OR REPLACE FUNCTION public.maak_notificatie(_org uuid, _titel text, _bericht text, _type text, _categorie text, _entiteit_type text, _entiteit_id text, _link text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE _id uuid;
BEGIN
  INSERT INTO public.notificaties (organisatie_id, titel, bericht, type, categorie, entiteit_type, entiteit_id, link_url)
  VALUES (_org, _titel, _bericht, _type, _categorie, _entiteit_type, _entiteit_id, _link)
  RETURNING id INTO _id;
  RETURN _id;
END;
$fn$;

-- Trigger: nieuwe schade
CREATE OR REPLACE FUNCTION public.tg_notif_schade()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN
  PERFORM public.maak_notificatie(
    NEW.organisatie_id,
    'Nieuwe schade gemeld',
    COALESCE(NEW.omschrijving, 'Schade gemeld voor voertuig'),
    'waarschuwing', 'schade', 'schade_rapport', NEW.id::text, '/schade'
  );
  RETURN NEW;
END;
$fn$;
DROP TRIGGER IF EXISTS trg_notif_schade ON public.schade_rapporten;
CREATE TRIGGER trg_notif_schade AFTER INSERT ON public.schade_rapporten
  FOR EACH ROW EXECUTE FUNCTION public.tg_notif_schade();

-- Trigger: nieuwe openstaande factuur
CREATE OR REPLACE FUNCTION public.tg_notif_factuur()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN
  IF NEW.status = 'openstaand' THEN
    PERFORM public.maak_notificatie(
      NEW.organisatie_id,
      'Nieuwe factuur',
      format('Factuur van € %s aangemaakt', to_char(NEW.bedrag, 'FM999990.00')),
      'info', 'factuur', 'invoice', NEW.id::text, '/contracts'
    );
  END IF;
  RETURN NEW;
END;
$fn$;
DROP TRIGGER IF EXISTS trg_notif_factuur ON public.invoices;
CREATE TRIGGER trg_notif_factuur AFTER INSERT ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.tg_notif_factuur();

-- Trigger: rijbewijs goedgekeurd
CREATE OR REPLACE FUNCTION public.tg_notif_rijbewijs()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status = 'goedgekeurd' AND OLD.status <> 'goedgekeurd' THEN
    PERFORM public.maak_notificatie(
      NEW.organisatie_id,
      'Rijbewijs goedgekeurd',
      format('Rijbewijs van %s is goedgekeurd', COALESCE(NEW.ai_naam, 'klant')),
      'succes', 'rijbewijs', 'rijbewijs_verificatie', NEW.id::text, '/rijbewijzen'
    );
  END IF;
  RETURN NEW;
END;
$fn$;
DROP TRIGGER IF EXISTS trg_notif_rijbewijs ON public.rijbewijs_verificaties;
CREATE TRIGGER trg_notif_rijbewijs AFTER UPDATE ON public.rijbewijs_verificaties
  FOR EACH ROW EXECUTE FUNCTION public.tg_notif_rijbewijs();

-- ============ 7. MULTI-LOCATIE VERPLAATSING ============
ALTER TABLE public.voertuigen ADD COLUMN IF NOT EXISTS locatie_id UUID;

CREATE TABLE IF NOT EXISTS public.voertuig_verplaatsingen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisatie_id UUID NOT NULL,
  user_id UUID NOT NULL,
  voertuig_id UUID NOT NULL,
  van_locatie_id UUID,
  naar_locatie_id UUID NOT NULL,
  datum DATE NOT NULL DEFAULT CURRENT_DATE,
  chauffeur_id UUID,
  kilometerstand INTEGER,
  notitie TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_verplaatsing_org_datum ON public.voertuig_verplaatsingen(organisatie_id, datum DESC);
ALTER TABLE public.voertuig_verplaatsingen ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org leden zien verplaatsingen" ON public.voertuig_verplaatsingen FOR SELECT TO authenticated
  USING (organisatie_id = get_user_organisatie_id(auth.uid()));
CREATE POLICY "Org leden maken verplaatsingen" ON public.voertuig_verplaatsingen FOR INSERT TO authenticated
  WITH CHECK (organisatie_id = get_user_organisatie_id(auth.uid()));
CREATE POLICY "Org leden verwijderen verplaatsingen" ON public.voertuig_verplaatsingen FOR DELETE TO authenticated
  USING (organisatie_id = get_user_organisatie_id(auth.uid()));

-- Trigger: bij verplaatsing locatie_id op voertuig bijwerken
CREATE OR REPLACE FUNCTION public.tg_sync_voertuig_locatie()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN
  UPDATE public.voertuigen
  SET locatie_id = NEW.naar_locatie_id,
      kilometerstand = COALESCE(NEW.kilometerstand, kilometerstand),
      updated_at = now()
  WHERE id = NEW.voertuig_id AND organisatie_id = NEW.organisatie_id;
  RETURN NEW;
END;
$fn$;
DROP TRIGGER IF EXISTS trg_sync_voertuig_locatie ON public.voertuig_verplaatsingen;
CREATE TRIGGER trg_sync_voertuig_locatie AFTER INSERT ON public.voertuig_verplaatsingen
  FOR EACH ROW EXECUTE FUNCTION public.tg_sync_voertuig_locatie();

-- Realtime aanzetten op notificaties
ALTER PUBLICATION supabase_realtime ADD TABLE public.notificaties;
