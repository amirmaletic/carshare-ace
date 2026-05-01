
-- Sta NULL user_id toe in aanvragen voor gast-aanvragen via publieke portaal
ALTER TABLE public.aanvragen ALTER COLUMN user_id DROP NOT NULL;

-- Publieke functie om een aanvraag in te dienen (anoniem)
CREATE OR REPLACE FUNCTION public.create_gast_aanvraag(
  _organisatie_id uuid,
  _klant_naam text,
  _klant_email text,
  _klant_telefoon text DEFAULT NULL,
  _voertuig_id uuid DEFAULT NULL,
  _start_datum date DEFAULT NULL,
  _eind_datum date DEFAULT NULL,
  _notitie text DEFAULT NULL,
  _gewenste_categorie text DEFAULT NULL,
  _gewenste_brandstof text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _new_id uuid;
  _portal_actief boolean;
BEGIN
  -- Verifieer dat het portaal actief is
  SELECT portaal_actief INTO _portal_actief FROM public.organisaties WHERE id = _organisatie_id;
  IF NOT COALESCE(_portal_actief, false) THEN
    RAISE EXCEPTION 'Portaal is niet actief';
  END IF;

  -- Basisvalidatie
  IF _klant_naam IS NULL OR length(trim(_klant_naam)) < 2 THEN
    RAISE EXCEPTION 'Naam is verplicht';
  END IF;
  IF _klant_email IS NULL OR _klant_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'Geldig e-mailadres is verplicht';
  END IF;

  INSERT INTO public.aanvragen (
    organisatie_id, user_id, klant_naam, klant_email, klant_telefoon,
    gekoppeld_voertuig_id, gewenste_periode_start, gewenste_periode_eind,
    gewenste_categorie, gewenste_brandstof, notitie, status
  ) VALUES (
    _organisatie_id, NULL, trim(_klant_naam), lower(trim(_klant_email)), _klant_telefoon,
    _voertuig_id, _start_datum, _eind_datum,
    _gewenste_categorie, _gewenste_brandstof, _notitie, 'nieuw'
  )
  RETURNING id INTO _new_id;

  RETURN _new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_gast_aanvraag(uuid, text, text, text, uuid, date, date, text, text, text) TO anon, authenticated;
