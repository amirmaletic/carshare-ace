
CREATE OR REPLACE FUNCTION public.auto_create_rijbewijs_verzoek()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _bestaat boolean;
  _token text;
  _klant_id uuid;
BEGIN
  -- Vind klant op email binnen organisatie
  SELECT id INTO _klant_id
  FROM public.klanten
  WHERE organisatie_id = NEW.organisatie_id
    AND lower(email) = lower(NEW.klant_email)
  LIMIT 1;

  IF _klant_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check of klant al een geldige goedgekeurde scan heeft (niet verlopen)
  SELECT EXISTS(
    SELECT 1 FROM public.rijbewijs_verificaties
    WHERE klant_id = _klant_id
      AND status = 'goedgekeurd'
      AND (ai_vervaldatum IS NULL OR ai_vervaldatum > CURRENT_DATE)
  ) INTO _bestaat;

  IF _bestaat THEN
    RETURN NEW;
  END IF;

  -- Check of er al een open verzoek loopt
  SELECT EXISTS(
    SELECT 1 FROM public.rijbewijs_verificaties
    WHERE klant_id = _klant_id
      AND status IN ('in_afwachting', 'ingediend')
      AND token_expires_at > now()
  ) INTO _bestaat;

  IF _bestaat THEN
    RETURN NEW;
  END IF;

  _token := encode(gen_random_bytes(24), 'hex');

  INSERT INTO public.rijbewijs_verificaties (
    organisatie_id, klant_id, contract_id, upload_token, status
  ) VALUES (
    NEW.organisatie_id, _klant_id, NEW.id, _token, 'in_afwachting'
  );

  RETURN NEW;
END;
$$;
