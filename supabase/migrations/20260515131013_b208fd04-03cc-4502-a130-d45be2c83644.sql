CREATE OR REPLACE FUNCTION public.maak_aanvul_verzoek(_contract_id uuid)
RETURNS TABLE(id uuid, token text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
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

  SELECT * INTO _contract FROM public.contracts c
   WHERE c.id = _contract_id AND c.organisatie_id = _org_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contract niet gevonden';
  END IF;
  IF _contract.klant_email IS NULL OR _contract.klant_email = '' THEN
    RAISE EXCEPTION 'Contract heeft geen e-mailadres voor de klant';
  END IF;

  UPDATE public.contract_aanvul_verzoeken v
     SET status = 'verlopen', updated_at = now()
   WHERE v.contract_id = _contract_id
     AND v.status = 'open';

  _token := encode(extensions.gen_random_bytes(24), 'hex');

  INSERT INTO public.contract_aanvul_verzoeken
    (contract_id, organisatie_id, klant_email, token)
  VALUES
    (_contract_id, _org_id, lower(_contract.klant_email), _token)
  RETURNING contract_aanvul_verzoeken.id INTO _id;

  RETURN QUERY SELECT _id, _token;
END;
$function$;