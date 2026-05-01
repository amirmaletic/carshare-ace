CREATE OR REPLACE FUNCTION public.admin_delete_organisatie(_org_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Alleen platform admins hebben toegang';
  END IF;

  -- Reserveringen via klanten van deze org
  DELETE FROM public.reserveringen
   WHERE klant_id IN (SELECT id FROM public.klanten WHERE organisatie_id = _org_id);

  -- Facturen via contracten van deze org
  DELETE FROM public.invoices
   WHERE contract_id IN (SELECT id FROM public.contracts WHERE organisatie_id = _org_id)
      OR organisatie_id = _org_id;

  -- Kilometerregistraties via contracten van deze org
  DELETE FROM public.kilometer_registraties
   WHERE contract_id IN (SELECT id FROM public.contracts WHERE organisatie_id = _org_id)
      OR organisatie_id = _org_id;

  -- Org-scoped tabellen
  DELETE FROM public.overdrachten WHERE organisatie_id = _org_id;
  DELETE FROM public.terugmeldingen WHERE organisatie_id = _org_id;
  DELETE FROM public.schade_rapporten WHERE organisatie_id = _org_id;
  DELETE FROM public.service_historie WHERE organisatie_id = _org_id;
  DELETE FROM public.eigendom_historie WHERE organisatie_id = _org_id;
  DELETE FROM public.chauffeur_beschikbaarheid WHERE organisatie_id = _org_id;
  DELETE FROM public.ritten WHERE organisatie_id = _org_id;
  DELETE FROM public.chauffeurs WHERE organisatie_id = _org_id;
  DELETE FROM public.contracts WHERE organisatie_id = _org_id;
  DELETE FROM public.voertuigen WHERE organisatie_id = _org_id;
  DELETE FROM public.klanten WHERE organisatie_id = _org_id;
  DELETE FROM public.aanvragen WHERE organisatie_id = _org_id;
  DELETE FROM public.goedkeuringen WHERE organisatie_id = _org_id;
  DELETE FROM public.goedkeuring_regels WHERE organisatie_id = _org_id;
  DELETE FROM public.locaties WHERE organisatie_id = _org_id;
  DELETE FROM public.uitnodigingen WHERE organisatie_id = _org_id;
  DELETE FROM public.activiteiten_log WHERE organisatie_id = _org_id;
  DELETE FROM public.user_roles WHERE organisatie_id = _org_id;

  -- Tot slot de organisatie zelf
  DELETE FROM public.organisaties WHERE id = _org_id;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.admin_delete_organisatie(uuid) FROM anon;