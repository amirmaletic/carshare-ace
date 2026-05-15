
-- 1) Voertuig_id opschonen naar UUID waar match bestaat (kenteken-tekst -> uuid)
UPDATE public.contracts c
SET voertuig_id = v.id::text
FROM public.voertuigen v
WHERE v.organisatie_id = c.organisatie_id
  AND c.voertuig_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND upper(replace(v.kenteken, '-', '')) = upper(replace(c.voertuig_id, '-', ''));

-- 2) Trigger functie: maak automatisch overdrachten aan bij contract insert
CREATE OR REPLACE FUNCTION public.tg_auto_overdrachten_contract()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _voertuig_uuid uuid;
  _kenteken text;
  _merk text;
  _model text;
  _naam text;
BEGIN
  -- alleen voor verhuur-achtige types relevant
  IF NEW.type IS DISTINCT FROM 'verhuur'::contract_type THEN
    RETURN NEW;
  END IF;

  -- voertuig_id mag tekst zijn, probeer als UUID
  BEGIN
    _voertuig_uuid := NEW.voertuig_id::uuid;
  EXCEPTION WHEN OTHERS THEN
    _voertuig_uuid := NULL;
  END;

  IF _voertuig_uuid IS NOT NULL THEN
    SELECT v.kenteken, v.merk, v.model
      INTO _kenteken, _merk, _model
    FROM public.voertuigen v
    WHERE v.id = _voertuig_uuid AND v.organisatie_id = NEW.organisatie_id;
  END IF;

  IF _kenteken IS NULL THEN
    _kenteken := COALESCE(NEW.voertuig_id, 'Onbekend');
    _naam := 'Onbekend';
  ELSE
    _naam := trim(coalesce(_merk,'') || ' ' || coalesce(_model,''));
    IF _naam = '' THEN _naam := 'Onbekend'; END IF;
  END IF;

  -- Ophalen op start_datum
  IF NEW.start_datum IS NOT NULL THEN
    INSERT INTO public.overdrachten (
      user_id, contract_id, voertuig_id, voertuig_kenteken, voertuig_naam,
      klant_naam, klant_email, type, datum, status, organisatie_id
    )
    SELECT
      NEW.user_id, NEW.id, NEW.voertuig_id, _kenteken, _naam,
      COALESCE(NEW.klant_naam, 'Klant'), NEW.klant_email,
      'ophalen', NEW.start_datum, 'wacht_op_handtekening', NEW.organisatie_id
    WHERE NOT EXISTS (
      SELECT 1 FROM public.overdrachten o
      WHERE o.contract_id = NEW.id AND o.type = 'ophalen'
    );
  END IF;

  -- Inleveren op eind_datum
  IF NEW.eind_datum IS NOT NULL THEN
    INSERT INTO public.overdrachten (
      user_id, contract_id, voertuig_id, voertuig_kenteken, voertuig_naam,
      klant_naam, klant_email, type, datum, status, organisatie_id
    )
    SELECT
      NEW.user_id, NEW.id, NEW.voertuig_id, _kenteken, _naam,
      COALESCE(NEW.klant_naam, 'Klant'), NEW.klant_email,
      'inleveren', NEW.eind_datum, 'wacht_op_handtekening', NEW.organisatie_id
    WHERE NOT EXISTS (
      SELECT 1 FROM public.overdrachten o
      WHERE o.contract_id = NEW.id AND o.type IN ('inleveren','terugbrengen')
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_overdrachten_contract ON public.contracts;
CREATE TRIGGER trg_auto_overdrachten_contract
AFTER INSERT ON public.contracts
FOR EACH ROW EXECUTE FUNCTION public.tg_auto_overdrachten_contract();

-- 3) Backfill: maak overdrachten aan voor bestaande contracten zonder overdracht
INSERT INTO public.overdrachten (
  user_id, contract_id, voertuig_id, voertuig_kenteken, voertuig_naam,
  klant_naam, klant_email, type, datum, status, organisatie_id
)
SELECT
  c.user_id, c.id, c.voertuig_id,
  COALESCE(v.kenteken, c.voertuig_id, 'Onbekend'),
  COALESCE(NULLIF(trim(coalesce(v.merk,'') || ' ' || coalesce(v.model,'')), ''), 'Onbekend'),
  COALESCE(c.klant_naam, 'Klant'), c.klant_email,
  'ophalen', c.start_datum, 'wacht_op_handtekening', c.organisatie_id
FROM public.contracts c
LEFT JOIN public.voertuigen v
  ON v.organisatie_id = c.organisatie_id
 AND c.voertuig_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
 AND v.id = c.voertuig_id::uuid
WHERE c.type = 'verhuur'::contract_type
  AND c.start_datum IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.overdrachten o
    WHERE o.contract_id = c.id AND o.type = 'ophalen'
  );

INSERT INTO public.overdrachten (
  user_id, contract_id, voertuig_id, voertuig_kenteken, voertuig_naam,
  klant_naam, klant_email, type, datum, status, organisatie_id
)
SELECT
  c.user_id, c.id, c.voertuig_id,
  COALESCE(v.kenteken, c.voertuig_id, 'Onbekend'),
  COALESCE(NULLIF(trim(coalesce(v.merk,'') || ' ' || coalesce(v.model,'')), ''), 'Onbekend'),
  COALESCE(c.klant_naam, 'Klant'), c.klant_email,
  'inleveren', c.eind_datum, 'wacht_op_handtekening', c.organisatie_id
FROM public.contracts c
LEFT JOIN public.voertuigen v
  ON v.organisatie_id = c.organisatie_id
 AND c.voertuig_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
 AND v.id = c.voertuig_id::uuid
WHERE c.type = 'verhuur'::contract_type
  AND c.eind_datum IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.overdrachten o
    WHERE o.contract_id = c.id AND o.type IN ('inleveren','terugbrengen')
  );
