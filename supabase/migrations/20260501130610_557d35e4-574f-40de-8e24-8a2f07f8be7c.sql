-- 1) Kolom toevoegen
ALTER TABLE public.organisaties
ADD COLUMN IF NOT EXISTS module_modus text NOT NULL DEFAULT 'autoverhuur'
CHECK (module_modus IN ('autoverhuur','wagenpark'));

-- 2) Platform admin kan modus instellen
CREATE OR REPLACE FUNCTION public.admin_set_module_modus(_org_id uuid, _modus text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Alleen platform admins hebben toegang';
  END IF;

  IF _modus NOT IN ('autoverhuur','wagenpark') THEN
    RAISE EXCEPTION 'Ongeldige modus: %, gebruik autoverhuur of wagenpark', _modus;
  END IF;

  UPDATE public.organisaties
  SET module_modus = _modus
  WHERE id = _org_id;

  INSERT INTO public.activiteiten_log (user_id, organisatie_id, actie, beschrijving, entiteit_type, entiteit_id, metadata)
  VALUES (
    auth.uid(), _org_id, 'module_modus_gewijzigd',
    format('Platform admin heeft module-modus gewijzigd naar %s', _modus),
    'organisatie', _org_id::text,
    jsonb_build_object('modus', _modus)
  );
END;
$$;

-- 3) Iedere ingelogde gebruiker kan modus van eigen org ophalen
CREATE OR REPLACE FUNCTION public.get_module_modus()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT module_modus FROM public.organisaties
  WHERE id = public.get_user_organisatie_id(auth.uid())
  LIMIT 1;
$$;