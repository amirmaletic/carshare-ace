
CREATE OR REPLACE FUNCTION public.tg_reservering_naar_overdrachten()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _org uuid;
  _user uuid;
  _kenteken text;
  _naam text;
  _klant record;
BEGIN
  IF NEW.status NOT IN ('bevestigd','actief','lopend') THEN
    RETURN NEW;
  END IF;

  SELECT k.organisatie_id, k.auth_user_id, k.voornaam, k.achternaam, k.email
    INTO _klant
    FROM public.klanten k WHERE k.id = NEW.klant_id;

  IF _klant.organisatie_id IS NULL THEN
    RETURN NEW;
  END IF;

  _org := _klant.organisatie_id;
  _user := COALESCE(_klant.auth_user_id, (SELECT eigenaar_id FROM public.organisaties WHERE id = _org));

  SELECT v.kenteken, (v.merk || ' ' || v.model)
    INTO _kenteken, _naam
    FROM public.voertuigen v WHERE v.id = NEW.voertuig_id;

  -- Ophaal-overdracht
  INSERT INTO public.overdrachten (
    user_id, organisatie_id, contract_id, voertuig_id, voertuig_kenteken, voertuig_naam,
    klant_naam, klant_email, type, datum, status
  )
  SELECT _user, _org, NULL, NEW.voertuig_id::text,
         COALESCE(_kenteken, 'Onbekend'),
         COALESCE(_naam, 'Voertuig'),
         trim(COALESCE(_klant.voornaam,'') || ' ' || COALESCE(_klant.achternaam,'')),
         _klant.email, 'ophalen', NEW.start_datum, 'wacht_op_handtekening'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.overdrachten o
    WHERE o.organisatie_id = _org
      AND o.voertuig_id = NEW.voertuig_id::text
      AND o.type = 'ophalen'
      AND o.datum = NEW.start_datum
      AND o.klant_naam = trim(COALESCE(_klant.voornaam,'') || ' ' || COALESCE(_klant.achternaam,''))
  );

  -- Terugbreng-overdracht
  INSERT INTO public.overdrachten (
    user_id, organisatie_id, contract_id, voertuig_id, voertuig_kenteken, voertuig_naam,
    klant_naam, klant_email, type, datum, status
  )
  SELECT _user, _org, NULL, NEW.voertuig_id::text,
         COALESCE(_kenteken, 'Onbekend'),
         COALESCE(_naam, 'Voertuig'),
         trim(COALESCE(_klant.voornaam,'') || ' ' || COALESCE(_klant.achternaam,'')),
         _klant.email, 'terugbrengen', NEW.eind_datum, 'wacht_op_handtekening'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.overdrachten o
    WHERE o.organisatie_id = _org
      AND o.voertuig_id = NEW.voertuig_id::text
      AND o.type = 'terugbrengen'
      AND o.datum = NEW.eind_datum
      AND o.klant_naam = trim(COALESCE(_klant.voornaam,'') || ' ' || COALESCE(_klant.achternaam,''))
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reservering_naar_overdrachten ON public.reserveringen;
CREATE TRIGGER reservering_naar_overdrachten
AFTER INSERT OR UPDATE OF status, start_datum, eind_datum, voertuig_id ON public.reserveringen
FOR EACH ROW EXECUTE FUNCTION public.tg_reservering_naar_overdrachten();

-- Backfill bestaande bevestigde reserveringen die vandaag/morgen actief zijn
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT * FROM public.reserveringen
            WHERE status IN ('bevestigd','actief','lopend')
              AND eind_datum >= CURRENT_DATE - 1
  LOOP
    UPDATE public.reserveringen SET status = status WHERE id = r.id;
  END LOOP;
END $$;
