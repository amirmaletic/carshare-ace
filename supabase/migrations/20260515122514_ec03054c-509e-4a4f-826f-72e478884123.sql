
-- 1. Planning blokken tabel
CREATE TABLE public.planning_blokken (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisatie_id uuid NOT NULL,
  user_id uuid NOT NULL,
  voertuig_id uuid NOT NULL,
  start_datum date NOT NULL,
  eind_datum date NOT NULL,
  titel text NOT NULL,
  kleur text NOT NULL DEFAULT '#3B82F6',
  notitie text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.planning_blokken ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view planning_blokken" ON public.planning_blokken
  FOR SELECT TO authenticated
  USING (organisatie_id = get_user_organisatie_id(auth.uid()));

CREATE POLICY "Org members can create planning_blokken" ON public.planning_blokken
  FOR INSERT TO authenticated
  WITH CHECK (organisatie_id = get_user_organisatie_id(auth.uid()));

CREATE POLICY "Org members can update planning_blokken" ON public.planning_blokken
  FOR UPDATE TO authenticated
  USING (organisatie_id = get_user_organisatie_id(auth.uid()));

CREATE POLICY "Org members can delete planning_blokken" ON public.planning_blokken
  FOR DELETE TO authenticated
  USING (organisatie_id = get_user_organisatie_id(auth.uid()));

CREATE TRIGGER trg_planning_blokken_updated_at
  BEFORE UPDATE ON public.planning_blokken
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_planning_blokken_voertuig_periode
  ON public.planning_blokken (voertuig_id, start_datum, eind_datum);

-- 2. RPC: aanvraag omzetten naar concept-contract
CREATE OR REPLACE FUNCTION public.bevestig_aanvraag_naar_contract(
  _aanvraag_id uuid,
  _voertuig_id uuid,
  _type contract_type DEFAULT 'verhuur',
  _prijs numeric DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
  _voertuig_dagprijs numeric;
  _voertuig_kenteken text;
  _prijs_eff numeric;
  _maandprijs numeric;
  _prefix text;
  _jaar text;
  _seq integer;
  _contract_nummer text;
  _contract_id uuid;
BEGIN
  _user_id := auth.uid();
  _org_id := public.get_user_organisatie_id(_user_id);
  IF _org_id IS NULL THEN
    RAISE EXCEPTION 'Geen organisatie gevonden';
  END IF;

  SELECT * INTO _aanvraag FROM public.aanvragen
   WHERE id = _aanvraag_id AND organisatie_id = _org_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Aanvraag niet gevonden';
  END IF;

  SELECT dagprijs, kenteken INTO _voertuig_dagprijs, _voertuig_kenteken
    FROM public.voertuigen
   WHERE id = _voertuig_id AND organisatie_id = _org_id;
  IF _voertuig_kenteken IS NULL THEN
    RAISE EXCEPTION 'Voertuig niet gevonden';
  END IF;

  _start := COALESCE(_aanvraag.gewenste_periode_start, CURRENT_DATE);
  _eind  := COALESCE(_aanvraag.gewenste_periode_eind, _start + 7);
  IF _eind < _start THEN _eind := _start + 1; END IF;
  _dagen := GREATEST((_eind - _start), 1);

  _prijs_eff := COALESCE(_prijs, _voertuig_dagprijs, 0);
  IF _type = 'verhuur'::contract_type THEN
    _maandprijs := _prijs_eff * _dagen;
  ELSE
    _maandprijs := _prijs_eff;
  END IF;

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
    INSERT INTO public.klanten (organisatie_id, voornaam, achternaam, email, telefoon, type)
    VALUES (_org_id, _voornaam, _achternaam, lower(trim(COALESCE(_aanvraag.klant_email, ''))),
            _aanvraag.klant_telefoon, 'particulier')
    RETURNING id INTO _klant_id;
  END IF;

  -- Contractnummer
  _prefix := CASE _type
    WHEN 'verhuur'::contract_type THEN 'VC'
    WHEN 'lease'::contract_type THEN 'LC'
    WHEN 'fietslease'::contract_type THEN 'FL'
    WHEN 'ev-lease'::contract_type THEN 'EV'
    ELSE 'CN' END;
  _jaar := to_char(now(), 'YYYY');
  SELECT COUNT(*) + 1 INTO _seq
    FROM public.contracts
   WHERE organisatie_id = _org_id
     AND contract_nummer LIKE _prefix || '-' || _jaar || '-%';
  _contract_nummer := _prefix || '-' || _jaar || '-' || lpad(_seq::text, 3, '0');

  INSERT INTO public.contracts (
    organisatie_id, user_id, contract_nummer, type, status,
    klant_naam, klant_email, klant_telefoon,
    voertuig_id, start_datum, eind_datum, maandprijs,
    notities, inclusief
  ) VALUES (
    _org_id, _user_id, _contract_nummer, _type, 'concept'::contract_status,
    _aanvraag.klant_naam, lower(trim(COALESCE(_aanvraag.klant_email, ''))), _aanvraag.klant_telefoon,
    _voertuig_kenteken, _start, _eind, _maandprijs,
    _aanvraag.notitie, ARRAY['Onderhoud','Verzekering']::text[]
  )
  RETURNING id INTO _contract_id;

  UPDATE public.aanvragen
     SET status = 'omgezet',
         gekoppeld_voertuig_id = _voertuig_id,
         updated_at = now()
   WHERE id = _aanvraag_id;

  INSERT INTO public.activiteiten_log (
    user_id, organisatie_id, actie, beschrijving, entiteit_type, entiteit_id, metadata
  ) VALUES (
    _user_id, _org_id, 'aanvraag_naar_contract',
    format('Aanvraag van %s omgezet naar concept-contract %s', COALESCE(_aanvraag.klant_naam, 'klant'), _contract_nummer),
    'contract', _contract_id::text,
    jsonb_build_object('aanvraag_id', _aanvraag_id, 'klant_id', _klant_id,
                       'voertuig_id', _voertuig_id, 'type', _type, 'prijs', _prijs_eff, 'dagen', _dagen)
  );

  RETURN _contract_id;
END;
$$;
