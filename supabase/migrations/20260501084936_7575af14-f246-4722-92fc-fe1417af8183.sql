
-- ============================================================
-- 1. OVERDRACHT → CONTRACT & VOERTUIG STATUS SYNC
-- ============================================================
CREATE OR REPLACE FUNCTION public.sync_overdracht_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _voertuig_uuid uuid;
BEGIN
  -- Alleen reageren als ondertekend net gezet is
  IF NEW.status <> 'ondertekend' OR (TG_OP = 'UPDATE' AND OLD.status = 'ondertekend') THEN
    RETURN NEW;
  END IF;

  -- voertuig_id is text in overdrachten tabel, casten naar uuid
  BEGIN
    _voertuig_uuid := NEW.voertuig_id::uuid;
  EXCEPTION WHEN OTHERS THEN
    _voertuig_uuid := NULL;
  END;

  IF NEW.type = 'ophalen' THEN
    -- Contract op actief
    IF NEW.contract_id IS NOT NULL THEN
      UPDATE public.contracts
      SET status = 'actief', updated_at = now()
      WHERE id = NEW.contract_id
        AND organisatie_id = NEW.organisatie_id
        AND status IN ('concept', 'gepland');
    END IF;

    -- Voertuig op verhuurd + km
    IF _voertuig_uuid IS NOT NULL THEN
      UPDATE public.voertuigen
      SET status = 'verhuurd',
          kilometerstand = COALESCE(NEW.kilometerstand, kilometerstand),
          updated_at = now()
      WHERE id = _voertuig_uuid
        AND organisatie_id = NEW.organisatie_id;
    END IF;

  ELSIF NEW.type = 'inleveren' THEN
    -- Contract afgerond
    IF NEW.contract_id IS NOT NULL THEN
      UPDATE public.contracts
      SET status = 'afgerond', updated_at = now()
      WHERE id = NEW.contract_id
        AND organisatie_id = NEW.organisatie_id;
    END IF;

    -- Voertuig op beschikbaar + km
    IF _voertuig_uuid IS NOT NULL THEN
      UPDATE public.voertuigen
      SET status = 'beschikbaar',
          kilometerstand = COALESCE(NEW.kilometerstand, kilometerstand),
          updated_at = now()
      WHERE id = _voertuig_uuid
        AND organisatie_id = NEW.organisatie_id;
    END IF;
  END IF;

  -- Audit log
  INSERT INTO public.activiteiten_log (user_id, organisatie_id, actie, beschrijving, entiteit_type, entiteit_id, metadata)
  VALUES (
    NEW.user_id,
    NEW.organisatie_id,
    'overdracht_sync',
    format('Overdracht %s ondertekend voor %s, contract en voertuig automatisch bijgewerkt', NEW.type, NEW.voertuig_kenteken),
    'overdracht',
    NEW.id::text,
    jsonb_build_object('type', NEW.type, 'voertuig_id', NEW.voertuig_id, 'contract_id', NEW.contract_id)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_overdracht_sync ON public.overdrachten;
CREATE TRIGGER trg_overdracht_sync
AFTER INSERT OR UPDATE OF status ON public.overdrachten
FOR EACH ROW
EXECUTE FUNCTION public.sync_overdracht_status();


-- ============================================================
-- 2. TERUGMELDING → VOERTUIG KM + AUTO SCHADE-RAPPORT
-- ============================================================
CREATE OR REPLACE FUNCTION public.sync_terugmelding()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _voertuig_uuid uuid;
  _schade_id uuid;
BEGIN
  BEGIN
    _voertuig_uuid := NEW.voertuig_id::uuid;
  EXCEPTION WHEN OTHERS THEN
    _voertuig_uuid := NULL;
  END;

  -- Voertuig km bijwerken en op beschikbaar zetten
  IF _voertuig_uuid IS NOT NULL THEN
    UPDATE public.voertuigen
    SET kilometerstand = GREATEST(kilometerstand, NEW.kilometerstand),
        status = CASE WHEN status = 'verhuurd' THEN 'beschikbaar' ELSE status END,
        updated_at = now()
    WHERE id = _voertuig_uuid
      AND organisatie_id = NEW.organisatie_id;
  END IF;

  -- Bij foto's: maak automatisch schade-rapport
  IF NEW.fotos IS NOT NULL AND array_length(NEW.fotos, 1) > 0 THEN
    INSERT INTO public.schade_rapporten (
      organisatie_id, user_id, voertuig_id, datum, omschrijving,
      ernst, fotos, notitie, hersteld
    ) VALUES (
      NEW.organisatie_id,
      NEW.user_id,
      NEW.voertuig_id,
      NEW.datum,
      'Automatisch aangemaakt vanuit terugmelding ' || NEW.voertuig_kenteken,
      'licht',
      NEW.fotos,
      NEW.notitie,
      false
    )
    RETURNING id INTO _schade_id;

    -- Voertuig op onderhoud
    IF _voertuig_uuid IS NOT NULL THEN
      UPDATE public.voertuigen
      SET status = 'onderhoud', updated_at = now()
      WHERE id = _voertuig_uuid
        AND organisatie_id = NEW.organisatie_id;
    END IF;

    INSERT INTO public.activiteiten_log (user_id, organisatie_id, actie, beschrijving, entiteit_type, entiteit_id, metadata)
    VALUES (
      NEW.user_id, NEW.organisatie_id, 'auto_schade_rapport',
      format('Schade-rapport automatisch aangemaakt voor %s op basis van terugmelding', NEW.voertuig_kenteken),
      'schade_rapport', _schade_id::text,
      jsonb_build_object('terugmelding_id', NEW.id, 'aantal_fotos', array_length(NEW.fotos, 1))
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_terugmelding_sync ON public.terugmeldingen;
CREATE TRIGGER trg_terugmelding_sync
AFTER INSERT ON public.terugmeldingen
FOR EACH ROW
EXECUTE FUNCTION public.sync_terugmelding();


-- ============================================================
-- 3. SCHADE-RAPPORT → VOERTUIG STATUS SYNC
-- ============================================================
CREATE OR REPLACE FUNCTION public.sync_schade_voertuig()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _voertuig_uuid uuid;
BEGIN
  BEGIN
    _voertuig_uuid := NEW.voertuig_id::uuid;
  EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
  END;

  -- Bij hersteld=true: weer beschikbaar (alleen als nu in onderhoud)
  IF TG_OP = 'UPDATE' AND NEW.hersteld = true AND OLD.hersteld = false THEN
    UPDATE public.voertuigen
    SET status = CASE WHEN status = 'onderhoud' THEN 'beschikbaar' ELSE status END,
        updated_at = now()
    WHERE id = _voertuig_uuid
      AND organisatie_id = NEW.organisatie_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_schade_voertuig ON public.schade_rapporten;
CREATE TRIGGER trg_schade_voertuig
AFTER UPDATE OF hersteld ON public.schade_rapporten
FOR EACH ROW
EXECUTE FUNCTION public.sync_schade_voertuig();


-- ============================================================
-- 4. AANVRAAG → KLANT CONVERSIE RPC
-- ============================================================
CREATE OR REPLACE FUNCTION public.convert_aanvraag_naar_klant(_aanvraag_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _aanvraag public.aanvragen;
  _org_id uuid;
  _user_id uuid;
  _klant_id uuid;
  _voornaam text;
  _achternaam text;
  _name_parts text[];
BEGIN
  _user_id := auth.uid();
  _org_id := public.get_user_organisatie_id(_user_id);

  IF _org_id IS NULL THEN
    RAISE EXCEPTION 'Geen organisatie gevonden voor gebruiker';
  END IF;

  SELECT * INTO _aanvraag FROM public.aanvragen
   WHERE id = _aanvraag_id AND organisatie_id = _org_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Aanvraag niet gevonden of geen toegang';
  END IF;

  -- Bestaande klant op email zoeken binnen organisatie
  SELECT id INTO _klant_id FROM public.klanten
   WHERE organisatie_id = _org_id AND lower(email) = lower(_aanvraag.klant_email)
   LIMIT 1;

  IF _klant_id IS NULL THEN
    -- Naam splitsen
    _name_parts := string_to_array(trim(_aanvraag.klant_naam), ' ');
    _voornaam := _name_parts[1];
    _achternaam := CASE
      WHEN array_length(_name_parts, 1) > 1
      THEN array_to_string(_name_parts[2:array_length(_name_parts,1)], ' ')
      ELSE '-'
    END;

    INSERT INTO public.klanten (
      organisatie_id, voornaam, achternaam, email, telefoon, type
    ) VALUES (
      _org_id, _voornaam, _achternaam,
      lower(trim(_aanvraag.klant_email)),
      _aanvraag.klant_telefoon,
      'particulier'
    )
    RETURNING id INTO _klant_id;
  END IF;

  -- Markeer aanvraag als omgezet
  UPDATE public.aanvragen
  SET status = 'omgezet', updated_at = now()
  WHERE id = _aanvraag_id;

  -- Audit
  INSERT INTO public.activiteiten_log (user_id, organisatie_id, actie, beschrijving, entiteit_type, entiteit_id, metadata)
  VALUES (
    _user_id, _org_id, 'aanvraag_omgezet',
    format('Aanvraag van %s omgezet naar klant', _aanvraag.klant_naam),
    'aanvraag', _aanvraag_id::text,
    jsonb_build_object('klant_id', _klant_id, 'gekoppeld_voertuig_id', _aanvraag.gekoppeld_voertuig_id)
  );

  RETURN _klant_id;
END;
$$;
