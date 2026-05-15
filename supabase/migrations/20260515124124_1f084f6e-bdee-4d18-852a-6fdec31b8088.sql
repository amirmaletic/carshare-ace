-- Status enum
DO $$ BEGIN
  CREATE TYPE public.aanvul_verzoek_status AS ENUM ('open','ingevuld','verlopen');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.contract_aanvul_verzoeken (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  organisatie_id uuid NOT NULL REFERENCES public.organisaties(id) ON DELETE CASCADE,
  klant_email text NOT NULL,
  token text NOT NULL UNIQUE,
  status public.aanvul_verzoek_status NOT NULL DEFAULT 'open',
  verzonden_op timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  ingevuld_op timestamptz,
  ingevuld_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aanvul_verzoeken_contract ON public.contract_aanvul_verzoeken(contract_id);
CREATE INDEX IF NOT EXISTS idx_aanvul_verzoeken_org ON public.contract_aanvul_verzoeken(organisatie_id);

ALTER TABLE public.contract_aanvul_verzoeken ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members read own aanvul verzoeken"
  ON public.contract_aanvul_verzoeken FOR SELECT
  TO authenticated
  USING (organisatie_id = public.get_user_organisatie_id(auth.uid()));

CREATE POLICY "Org members create aanvul verzoeken"
  ON public.contract_aanvul_verzoeken FOR INSERT
  TO authenticated
  WITH CHECK (organisatie_id = public.get_user_organisatie_id(auth.uid()));

CREATE POLICY "Org members update aanvul verzoeken"
  ON public.contract_aanvul_verzoeken FOR UPDATE
  TO authenticated
  USING (organisatie_id = public.get_user_organisatie_id(auth.uid()));

CREATE TRIGGER trg_aanvul_verzoeken_updated
  BEFORE UPDATE ON public.contract_aanvul_verzoeken
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Token generator (org-scoped, called server-side)
CREATE OR REPLACE FUNCTION public.maak_aanvul_verzoek(_contract_id uuid)
RETURNS TABLE(id uuid, token text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  _user_id uuid;
  _org_id uuid;
  _contract public.contracts;
  _token text;
  _id uuid;
BEGIN
  _user_id := auth.uid();
  _org_id := public.get_user_organisatie_id(_user_id);
  IF _org_id IS NULL THEN
    RAISE EXCEPTION 'Geen organisatie gevonden';
  END IF;

  SELECT * INTO _contract FROM public.contracts
   WHERE id = _contract_id AND organisatie_id = _org_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contract niet gevonden';
  END IF;
  IF _contract.klant_email IS NULL OR _contract.klant_email = '' THEN
    RAISE EXCEPTION 'Contract heeft geen e-mailadres voor de klant';
  END IF;

  -- Markeer eerdere open verzoeken als verlopen
  UPDATE public.contract_aanvul_verzoeken
     SET status = 'verlopen', updated_at = now()
   WHERE contract_id = _contract_id
     AND status = 'open';

  _token := encode(extensions.gen_random_bytes(24), 'hex');

  INSERT INTO public.contract_aanvul_verzoeken
    (contract_id, organisatie_id, klant_email, token)
  VALUES
    (_contract_id, _org_id, lower(_contract.klant_email), _token)
  RETURNING contract_aanvul_verzoeken.id INTO _id;

  RETURN QUERY SELECT _id, _token;
END;
$$;

-- Public: ophalen van verzoek + ontbrekende velden
CREATE OR REPLACE FUNCTION public.get_aanvul_verzoek(_token text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _v public.contract_aanvul_verzoeken;
  _c public.contracts;
  _k public.klanten;
  _org public.organisaties;
BEGIN
  SELECT * INTO _v FROM public.contract_aanvul_verzoeken WHERE token = _token LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('found', false);
  END IF;

  SELECT * INTO _c FROM public.contracts WHERE id = _v.contract_id;
  SELECT * INTO _org FROM public.organisaties WHERE id = _v.organisatie_id;
  SELECT * INTO _k FROM public.klanten
   WHERE organisatie_id = _v.organisatie_id
     AND lower(email) = lower(_c.klant_email)
   LIMIT 1;

  RETURN jsonb_build_object(
    'found', true,
    'status', _v.status,
    'expired', (_v.expires_at < now()),
    'expires_at', _v.expires_at,
    'contract_nummer', _c.contract_nummer,
    'organisatie_naam', _org.naam,
    'organisatie_logo', _org.portaal_logo_url,
    'organisatie_kleur', _org.portaal_kleur,
    'klant', jsonb_build_object(
      'naam', _c.klant_naam,
      'email', _c.klant_email,
      'telefoon', _c.klant_telefoon,
      'adres', _c.klant_adres,
      'rijbewijs_nummer', _k.rijbewijs_nummer,
      'rijbewijs_verloopt', _k.rijbewijs_verloopt
    )
  );
END;
$$;

-- Public: payload terugschrijven
CREATE OR REPLACE FUNCTION public.submit_aanvul_verzoek(_token text, _payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _v public.contract_aanvul_verzoeken;
  _c public.contracts;
  _klant_id uuid;
  _voornaam text;
  _achternaam text;
  _name_parts text[];
  _naam text;
  _telefoon text;
  _adres text;
  _rb_nummer text;
  _rb_verloopt date;
BEGIN
  SELECT * INTO _v FROM public.contract_aanvul_verzoeken WHERE token = _token LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'Onbekend token'; END IF;
  IF _v.status <> 'open' THEN RAISE EXCEPTION 'Verzoek al afgerond of verlopen'; END IF;
  IF _v.expires_at < now() THEN
    UPDATE public.contract_aanvul_verzoeken SET status = 'verlopen' WHERE id = _v.id;
    RAISE EXCEPTION 'Verzoek is verlopen';
  END IF;

  SELECT * INTO _c FROM public.contracts WHERE id = _v.contract_id;

  _naam     := NULLIF(trim(_payload->>'klant_naam'), '');
  _telefoon := NULLIF(trim(_payload->>'klant_telefoon'), '');
  _adres    := NULLIF(trim(_payload->>'klant_adres'), '');
  _rb_nummer := NULLIF(trim(_payload->>'rijbewijs_nummer'), '');
  BEGIN
    _rb_verloopt := NULLIF(_payload->>'rijbewijs_verloopt', '')::date;
  EXCEPTION WHEN OTHERS THEN _rb_verloopt := NULL; END;

  -- Update contract (alleen gevulde velden)
  UPDATE public.contracts
     SET klant_naam     = COALESCE(_naam, klant_naam),
         klant_telefoon = COALESCE(_telefoon, klant_telefoon),
         klant_adres    = COALESCE(_adres, klant_adres),
         updated_at = now()
   WHERE id = _v.contract_id;

  -- Klantkaart ophalen of maken
  SELECT id INTO _klant_id FROM public.klanten
   WHERE organisatie_id = _v.organisatie_id
     AND lower(email) = lower(_c.klant_email)
   LIMIT 1;

  IF _klant_id IS NULL AND _naam IS NOT NULL THEN
    _name_parts := string_to_array(_naam, ' ');
    _voornaam := _name_parts[1];
    _achternaam := CASE WHEN array_length(_name_parts,1) > 1
      THEN array_to_string(_name_parts[2:array_length(_name_parts,1)], ' ')
      ELSE '-' END;
    INSERT INTO public.klanten (organisatie_id, voornaam, achternaam, email, telefoon, adres, rijbewijs_nummer, rijbewijs_verloopt, type)
    VALUES (_v.organisatie_id, _voornaam, _achternaam, lower(_c.klant_email), _telefoon, _adres, _rb_nummer, _rb_verloopt, 'particulier')
    RETURNING id INTO _klant_id;
  ELSIF _klant_id IS NOT NULL THEN
    UPDATE public.klanten
       SET telefoon          = COALESCE(_telefoon, telefoon),
           adres             = COALESCE(_adres, adres),
           rijbewijs_nummer  = COALESCE(_rb_nummer, rijbewijs_nummer),
           rijbewijs_verloopt= COALESCE(_rb_verloopt, rijbewijs_verloopt),
           updated_at = now()
     WHERE id = _klant_id;
  END IF;

  UPDATE public.contract_aanvul_verzoeken
     SET status = 'ingevuld',
         ingevuld_op = now(),
         ingevuld_payload = _payload,
         updated_at = now()
   WHERE id = _v.id;

  INSERT INTO public.activiteiten_log (organisatie_id, actie, beschrijving, entiteit_type, entiteit_id, metadata)
  VALUES (_v.organisatie_id, 'aanvulverzoek_ingevuld',
    format('Klant heeft gegevens aangevuld voor contract %s', _c.contract_nummer),
    'contract', _v.contract_id::text,
    jsonb_build_object('verzoek_id', _v.id));

  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_aanvul_verzoek(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_aanvul_verzoek(text, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.maak_aanvul_verzoek(uuid) TO authenticated;