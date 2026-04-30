-- Helper to check platform admin
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'platform_admin'::app_role
  )
$$;
REVOKE EXECUTE ON FUNCTION public.is_platform_admin() FROM anon;

-- List all organisaties with stats
CREATE OR REPLACE FUNCTION public.admin_list_organisaties()
RETURNS TABLE (
  id uuid,
  naam text,
  eigenaar_id uuid,
  eigenaar_email text,
  is_active boolean,
  trial_ends_at timestamptz,
  created_at timestamptz,
  user_count bigint,
  voertuig_count bigint,
  contract_count bigint,
  klant_count bigint,
  laatste_activiteit timestamptz
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
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
    (SELECT MAX(al.created_at) FROM public.activiteiten_log al WHERE al.organisatie_id = o.id)
  FROM public.organisaties o
  ORDER BY o.created_at DESC;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_list_organisaties() FROM anon;

-- Get full detail
CREATE OR REPLACE FUNCTION public.admin_get_organisatie(_org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
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
    'gebruikers', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'user_id', ur.user_id,
        'role', ur.role,
        'email', u.email,
        'created_at', ur.created_at
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
$$;
REVOKE EXECUTE ON FUNCTION public.admin_get_organisatie(uuid) FROM anon;

-- Update organisation
CREATE OR REPLACE FUNCTION public.admin_update_organisatie(
  _org_id uuid,
  _trial_ends_at timestamptz DEFAULT NULL,
  _is_active boolean DEFAULT NULL,
  _naam text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Alleen platform admins hebben toegang';
  END IF;

  UPDATE public.organisaties
  SET
    trial_ends_at = COALESCE(_trial_ends_at, trial_ends_at),
    is_active = COALESCE(_is_active, is_active),
    naam = COALESCE(_naam, naam)
  WHERE id = _org_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_update_organisatie(uuid, timestamptz, boolean, text) FROM anon;

-- Bootstrap-friendly grant function
CREATE OR REPLACE FUNCTION public.admin_grant_platform_admin(_user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _has_admin boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE role = 'platform_admin'::app_role) INTO _has_admin;

  IF _has_admin AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Alleen bestaande platform admins kunnen nieuwe toevoegen';
  END IF;

  SELECT id INTO _user_id FROM auth.users WHERE email = _user_email LIMIT 1;
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Gebruiker met e-mail % niet gevonden', _user_email;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'platform_admin'::app_role)
  ON CONFLICT DO NOTHING;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_grant_platform_admin(text) FROM anon;