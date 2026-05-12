CREATE OR REPLACE FUNCTION public.bevestig_aanvraag(
  _aanvraag_id uuid,
  _voertuig_id uuid,
  _dagprijs numeric DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _aanvraag public.aanvragen;
  _user_id uuid;
  _org_id uuid;
  _klant_id uuid;
  _voornaam text;
  _achternaam text;
  _name_parts text[];
  _start date;
  _eind date;
  _dagen integer;
  _prijs numeric;
  _voertuig_dagprijs numeric;
  _reservering_id uuid;
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

  -- Periode bepalen, fallback: vandaag + 1 dag
  _start := COALESCE(_aanvraag.gewenste_periode_start, CURRENT_DATE);
  _eind  := COALESCE(_aanvraag.gewenste_periode_eind, _start + 1);
  IF _eind < _start THEN _eind := _start + 1; END IF;
  _dagen := GREATEST((_eind - _start), 1);

  -- Dagprijs bepalen
  SELECT dagprijs INTO _voertuig_dagprijs FROM public.voertuigen
   WHERE id = _voertuig_id AND organisatie_id = _org_id;
  IF _voertuig_dagprijs IS NULL THEN
    RAISE EXCEPTION 'Voertuig niet gevonden of geen toegang';
  END IF;
  _prijs := COALESCE(_dagprijs, _voertuig_dagprijs, 0);

  -- Klant ophalen of aanmaken
  SELECT id INTO _klant_id FROM public.klanten
   WHERE organisatie_id = _org_id
     AND lower(email) = lower(_aanvraag.klant_email)
   LIMIT 1;

  IF _klant_id IS NULL THEN
    _name_parts := string_to_array(trim(COALESCE(_aanvraag.klant_naam, 'Onbekend')), ' ');
    _voornaam := _name_parts[1];
    _achternaam := CASE
      WHEN array_length(_name_parts, 1) > 1
      THEN array_to_string(_name_parts[2:array_length(_name_parts,1)], ' ')
      ELSE '-' END;

    INSERT INTO public.klanten (
      organisatie_id, voornaam, achternaam, email, telefoon, type
    ) VALUES (
      _org_id, _voornaam, _achternaam,
      lower(trim(COALESCE(_aanvraag.klant_email, ''))),
      _aanvraag.klant_telefoon,
      'particulier'
    )
    RETURNING id INTO _klant_id;
  END IF;

  -- Reservering aanmaken
  INSERT INTO public.reserveringen (
    voertuig_id, klant_id, start_datum, eind_datum,
    dagprijs, totaalprijs, status, notities
  ) VALUES (
    _voertuig_id, _klant_id, _start, _eind,
    _prijs, _prijs * _dagen, 'bevestigd',
    COALESCE(_aanvraag.notitie, NULL)
  )
  RETURNING id INTO _reservering_id;

  -- Aanvraag markeren als omgezet
  UPDATE public.aanvragen
  SET status = 'omgezet',
      gekoppeld_voertuig_id = _voertuig_id,
      updated_at = now()
  WHERE id = _aanvraag_id;

  -- Audit
  INSERT INTO public.activiteiten_log (
    user_id, organisatie_id, actie, beschrijving, entiteit_type, entiteit_id, metadata
  ) VALUES (
    _user_id, _org_id, 'aanvraag_bevestigd',
    format('Aanvraag van %s bevestigd, reservering aangemaakt', COALESCE(_aanvraag.klant_naam, 'klant')),
    'reservering', _reservering_id::text,
    jsonb_build_object(
      'aanvraag_id', _aanvraag_id,
      'klant_id', _klant_id,
      'voertuig_id', _voertuig_id,
      'dagprijs', _prijs,
      'dagen', _dagen
    )
  );

  RETURN _reservering_id;
END;
$$;