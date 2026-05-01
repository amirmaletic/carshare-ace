DROP FUNCTION IF EXISTS public.admin_list_organisaties();

CREATE FUNCTION public.admin_list_organisaties()
 RETURNS TABLE(id uuid, naam text, eigenaar_id uuid, eigenaar_email text, is_active boolean, trial_ends_at timestamp with time zone, created_at timestamp with time zone, user_count bigint, voertuig_count bigint, contract_count bigint, klant_count bigint, laatste_activiteit timestamp with time zone, eigenaar_last_sign_in_at timestamp with time zone, laatste_inlog_org timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Alleen platform admins hebben toegang';
  END IF;

  RETURN QUERY
  SELECT
    o.id,
    o.naam,
    o.eigenaar_id,
    (SELECT u.email::text FROM auth.users u WHERE u.id = o.eigenaar_id),
    o.is_active,
    o.trial_ends_at,
    o.created_at,
    (SELECT COUNT(*) FROM public.user_roles ur WHERE ur.organisatie_id = o.id),
    (SELECT COUNT(*) FROM public.voertuigen v WHERE v.organisatie_id = o.id),
    (SELECT COUNT(*) FROM public.contracts c WHERE c.organisatie_id = o.id),
    (SELECT COUNT(*) FROM public.klanten k WHERE k.organisatie_id = o.id),
    (SELECT MAX(al.created_at) FROM public.activiteiten_log al WHERE al.organisatie_id = o.id),
    (SELECT u.last_sign_in_at FROM auth.users u WHERE u.id = o.eigenaar_id),
    (SELECT MAX(u.last_sign_in_at)
       FROM public.user_roles ur
       JOIN auth.users u ON u.id = ur.user_id
      WHERE ur.organisatie_id = o.id)
  FROM public.organisaties o
  ORDER BY o.created_at DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_get_organisatie(_org_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Alleen platform admins hebben toegang';
  END IF;

  SELECT jsonb_build_object(
    'organisatie', (SELECT row_to_json(o) FROM public.organisaties o WHERE o.id = _org_id),
    'eigenaar_email', (
      SELECT u.email::text FROM auth.users u
      JOIN public.organisaties o ON o.eigenaar_id = u.id
      WHERE o.id = _org_id
    ),
    'eigenaar_last_sign_in_at', (
      SELECT u.last_sign_in_at FROM auth.users u
      JOIN public.organisaties o ON o.eigenaar_id = u.id
      WHERE o.id = _org_id
    ),
    'gebruikers', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'user_id', ur.user_id,
        'role', ur.role,
        'email', u.email,
        'created_at', ur.created_at,
        'last_sign_in_at', u.last_sign_in_at
      )), '[]'::jsonb)
      FROM public.user_roles ur
      LEFT JOIN auth.users u ON u.id = ur.user_id
      WHERE ur.organisatie_id = _org_id
    ),
    'stats', jsonb_build_object(
      'voertuigen', (SELECT COUNT(*) FROM public.voertuigen WHERE organisatie_id = _org_id),
      'contracten', (SELECT COUNT(*) FROM public.contracts WHERE organisatie_id = _org_id),
      'klanten', (SELECT COUNT(*) FROM public.klanten WHERE organisatie_id = _org_id),
      'reserveringen', (
        SELECT COUNT(*) FROM public.reserveringen r
        WHERE r.klant_id IN (SELECT id FROM public.klanten WHERE organisatie_id = _org_id)
      ),
      'ritten', (SELECT COUNT(*) FROM public.ritten WHERE organisatie_id = _org_id),
      'chauffeurs', (SELECT COUNT(*) FROM public.chauffeurs WHERE organisatie_id = _org_id)
    ),
    'recente_activiteit', (
      SELECT COALESCE(jsonb_agg(row_to_json(a)), '[]'::jsonb)
      FROM (
        SELECT created_at, actie, beschrijving, entiteit_type
        FROM public.activiteiten_log
        WHERE organisatie_id = _org_id
        ORDER BY created_at DESC
        LIMIT 25
      ) a
    )
  ) INTO result;

  RETURN result;
END;
$function$;