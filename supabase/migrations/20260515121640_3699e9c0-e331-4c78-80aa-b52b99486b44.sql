
CREATE OR REPLACE FUNCTION public.auto_create_overdrachten_for_contract()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _voertuig record;
  _voertuig_naam text;
  _bestaat_ophalen boolean;
  _bestaat_terug boolean;
BEGIN
  IF NEW.voertuig_id IS NULL OR NEW.organisatie_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Bij UPDATE: alleen acteren als voertuig_id net is ingevuld of veranderd
  IF TG_OP = 'UPDATE' AND COALESCE(OLD.voertuig_id, '') = COALESCE(NEW.voertuig_id, '') THEN
    RETURN NEW;
  END IF;

  BEGIN
    SELECT kenteken, merk, model INTO _voertuig
    FROM public.voertuigen
    WHERE id = NEW.voertuig_id::uuid
      AND organisatie_id = NEW.organisatie_id;
  EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
  END;

  IF _voertuig.kenteken IS NULL THEN
    RETURN NEW;
  END IF;

  _voertuig_naam := trim(concat_ws(' ', _voertuig.merk, _voertuig.model));
  IF _voertuig_naam = '' THEN _voertuig_naam := _voertuig.kenteken; END IF;

  -- Ophalen-overdracht
  SELECT EXISTS(
    SELECT 1 FROM public.overdrachten
    WHERE contract_id = NEW.id AND type = 'ophalen'
  ) INTO _bestaat_ophalen;

  IF NOT _bestaat_ophalen THEN
    INSERT INTO public.overdrachten (
      user_id, contract_id, voertuig_id, voertuig_kenteken, voertuig_naam,
      klant_naam, klant_email, type, datum, status, organisatie_id
    ) VALUES (
      NEW.user_id, NEW.id, NEW.voertuig_id, _voertuig.kenteken, _voertuig_naam,
      NEW.klant_naam, NEW.klant_email, 'ophalen', NEW.start_datum,
      'wacht_op_handtekening', NEW.organisatie_id
    );
  END IF;

  -- Terugbreng-overdracht
  SELECT EXISTS(
    SELECT 1 FROM public.overdrachten
    WHERE contract_id = NEW.id AND type = 'terugbrengen'
  ) INTO _bestaat_terug;

  IF NOT _bestaat_terug AND NEW.eind_datum IS NOT NULL THEN
    INSERT INTO public.overdrachten (
      user_id, contract_id, voertuig_id, voertuig_kenteken, voertuig_naam,
      klant_naam, klant_email, type, datum, status, organisatie_id
    ) VALUES (
      NEW.user_id, NEW.id, NEW.voertuig_id, _voertuig.kenteken, _voertuig_naam,
      NEW.klant_naam, NEW.klant_email, 'terugbrengen', NEW.eind_datum,
      'wacht_op_handtekening', NEW.organisatie_id
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_create_overdrachten ON public.contracts;
CREATE TRIGGER trg_auto_create_overdrachten
AFTER INSERT OR UPDATE OF voertuig_id ON public.contracts
FOR EACH ROW
EXECUTE FUNCTION public.auto_create_overdrachten_for_contract();

-- Backfill voor bestaande contracten zonder overdrachten
DO $$
DECLARE _c record;
BEGIN
  FOR _c IN
    SELECT c.* FROM public.contracts c
    WHERE c.voertuig_id IS NOT NULL
      AND c.organisatie_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.overdrachten o WHERE o.contract_id = c.id)
  LOOP
    BEGIN
      PERFORM 1 FROM public.voertuigen WHERE id = _c.voertuig_id::uuid AND organisatie_id = _c.organisatie_id;
      IF FOUND THEN
        UPDATE public.contracts SET updated_at = now() WHERE id = _c.id;
        -- forceer trigger via dummy update op voertuig_id zelfde waarde werkt niet (gelijk), gebruik directe insert
        INSERT INTO public.overdrachten (user_id, contract_id, voertuig_id, voertuig_kenteken, voertuig_naam, klant_naam, klant_email, type, datum, status, organisatie_id)
        SELECT _c.user_id, _c.id, _c.voertuig_id, v.kenteken,
               COALESCE(NULLIF(trim(concat_ws(' ', v.merk, v.model)), ''), v.kenteken),
               _c.klant_naam, _c.klant_email, 'ophalen', _c.start_datum,
               'wacht_op_handtekening', _c.organisatie_id
        FROM public.voertuigen v WHERE v.id = _c.voertuig_id::uuid AND v.organisatie_id = _c.organisatie_id;

        IF _c.eind_datum IS NOT NULL THEN
          INSERT INTO public.overdrachten (user_id, contract_id, voertuig_id, voertuig_kenteken, voertuig_naam, klant_naam, klant_email, type, datum, status, organisatie_id)
          SELECT _c.user_id, _c.id, _c.voertuig_id, v.kenteken,
                 COALESCE(NULLIF(trim(concat_ws(' ', v.merk, v.model)), ''), v.kenteken),
                 _c.klant_naam, _c.klant_email, 'terugbrengen', _c.eind_datum,
                 'wacht_op_handtekening', _c.organisatie_id
          FROM public.voertuigen v WHERE v.id = _c.voertuig_id::uuid AND v.organisatie_id = _c.organisatie_id;
        END IF;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END LOOP;
END $$;
