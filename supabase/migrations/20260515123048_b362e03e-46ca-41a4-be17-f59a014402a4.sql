CREATE OR REPLACE FUNCTION public.auto_create_rijbewijs_verzoek()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  _klant_id uuid;
  _token text;
  _bestaand uuid;
BEGIN
  IF NEW.klant_email IS NULL OR NEW.klant_email = '' THEN
    RETURN NEW;
  END IF;

  SELECT id INTO _klant_id FROM public.klanten
   WHERE organisatie_id = NEW.organisatie_id
     AND lower(email) = lower(NEW.klant_email)
   LIMIT 1;

  IF _klant_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT id INTO _bestaand FROM public.rijbewijs_verzoeken
   WHERE klant_id = _klant_id
     AND status IN ('in_afwachting','ontvangen')
     AND token_expires_at > now()
   LIMIT 1;

  IF _bestaand IS NOT NULL THEN
    RETURN NEW;
  END IF;

  _token := encode(extensions.gen_random_bytes(24), 'hex');

  INSERT INTO public.rijbewijs_verzoeken (
    organisatie_id, klant_id, contract_id, upload_token, status
  ) VALUES (
    NEW.organisatie_id, _klant_id, NEW.id, _token, 'in_afwachting'
  );

  RETURN NEW;
END;
$function$;