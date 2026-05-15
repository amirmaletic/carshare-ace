-- 1. Klanten kunnen hun eigen rijbewijs verificaties zien
CREATE POLICY "Klanten can view own rijbewijs verificaties"
ON public.rijbewijs_verificaties
FOR SELECT
TO authenticated
USING (
  klant_id IN (SELECT id FROM public.klanten WHERE auth_user_id = auth.uid())
);

-- 2. Klanten kunnen hun eigen overdrachten zien (gekoppeld via email)
CREATE POLICY "Klanten can view own overdrachten"
ON public.overdrachten
FOR SELECT
TO authenticated
USING (
  klant_email IN (SELECT email FROM public.klanten WHERE auth_user_id = auth.uid())
);

-- 3. Klanten kunnen schade zien op voertuigen die ze huren / hebben gehuurd
CREATE POLICY "Klanten can view own schade rapporten"
ON public.schade_rapporten
FOR SELECT
TO authenticated
USING (
  voertuig_id IN (
    SELECT r.voertuig_id::text FROM public.reserveringen r
    JOIN public.klanten k ON k.id = r.klant_id
    WHERE k.auth_user_id = auth.uid()
  )
);

-- 4. Klanten kunnen hun eigen facturen zien (via contract op klant_email)
CREATE POLICY "Klanten can view own invoices"
ON public.invoices
FOR SELECT
TO authenticated
USING (
  contract_id IN (
    SELECT c.id FROM public.contracts c
    JOIN public.klanten k ON lower(k.email) = lower(c.klant_email)
    WHERE k.auth_user_id = auth.uid()
  )
);

-- 5. RPC: klant meldt zelf schade
CREATE OR REPLACE FUNCTION public.klant_meld_schade(
  _reservering_id uuid,
  _omschrijving text,
  _locatie_schade text,
  _fotos text[] DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _klant_id uuid;
  _voertuig_id uuid;
  _org_id uuid;
  _eigenaar_id uuid;
  _schade_id uuid;
BEGIN
  -- Vind klant koppeling van ingelogde gebruiker
  SELECT id INTO _klant_id
  FROM public.klanten
  WHERE auth_user_id = auth.uid()
  LIMIT 1;

  IF _klant_id IS NULL THEN
    RAISE EXCEPTION 'Geen klant profiel gevonden';
  END IF;

  -- Verifieer reservering hoort bij deze klant en haal voertuig op
  SELECT r.voertuig_id INTO _voertuig_id
  FROM public.reserveringen r
  WHERE r.id = _reservering_id AND r.klant_id = _klant_id
  LIMIT 1;

  IF _voertuig_id IS NULL THEN
    RAISE EXCEPTION 'Reservering niet gevonden of geen toegang';
  END IF;

  -- Haal organisatie op via voertuig
  SELECT v.organisatie_id INTO _org_id
  FROM public.voertuigen v
  WHERE v.id = _voertuig_id
  LIMIT 1;

  IF _org_id IS NULL THEN
    RAISE EXCEPTION 'Organisatie niet gevonden';
  END IF;

  -- user_id voor het rapport: eigenaar van de organisatie als fallback
  SELECT eigenaar_id INTO _eigenaar_id
  FROM public.organisaties
  WHERE id = _org_id
  LIMIT 1;

  IF length(trim(coalesce(_omschrijving, ''))) < 5 THEN
    RAISE EXCEPTION 'Omschrijving is te kort';
  END IF;

  INSERT INTO public.schade_rapporten (
    organisatie_id, user_id, voertuig_id, datum, omschrijving,
    locatie_schade, ernst, fotos, hersteld
  ) VALUES (
    _org_id,
    COALESCE(_eigenaar_id, auth.uid()),
    _voertuig_id::text,
    CURRENT_DATE,
    _omschrijving,
    _locatie_schade,
    'licht',
    _fotos,
    false
  )
  RETURNING id INTO _schade_id;

  -- Log
  INSERT INTO public.activiteiten_log (
    user_id, organisatie_id, actie, beschrijving, entiteit_type, entiteit_id, metadata
  ) VALUES (
    auth.uid(), _org_id, 'klant_meldt_schade',
    format('Klant heeft schade gemeld voor reservering %s', _reservering_id),
    'schade_rapport', _schade_id::text,
    jsonb_build_object('reservering_id', _reservering_id, 'klant_id', _klant_id, 'aantal_fotos', COALESCE(array_length(_fotos, 1), 0))
  );

  RETURN _schade_id;
END;
$$;