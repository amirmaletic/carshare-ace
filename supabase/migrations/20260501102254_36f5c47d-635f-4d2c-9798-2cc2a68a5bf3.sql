
-- 1. Set / change a user's role in an organisation
CREATE OR REPLACE FUNCTION public.admin_set_user_role(
  _org_id uuid,
  _user_id uuid,
  _new_role app_role
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

  IF _new_role = 'platform_admin'::app_role THEN
    RAISE EXCEPTION 'Platform admin rol kan niet via deze functie worden toegekend';
  END IF;

  -- Verwijder bestaande org-rollen voor deze user binnen deze org
  DELETE FROM public.user_roles
   WHERE user_id = _user_id
     AND organisatie_id = _org_id;

  -- Nieuwe rol toevoegen
  INSERT INTO public.user_roles (user_id, role, organisatie_id)
  VALUES (_user_id, _new_role, _org_id);

  INSERT INTO public.activiteiten_log (user_id, organisatie_id, actie, beschrijving, entiteit_type, entiteit_id, metadata)
  VALUES (
    auth.uid(), _org_id, 'admin_role_change',
    format('Platform admin heeft rol van gebruiker gewijzigd naar %s', _new_role),
    'user_role', _user_id::text,
    jsonb_build_object('user_id', _user_id, 'new_role', _new_role)
  );
END;
$$;

-- 2. Remove a user from an organisation (delete all their org roles)
CREATE OR REPLACE FUNCTION public.admin_remove_user_from_org(
  _org_id uuid,
  _user_id uuid
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

  DELETE FROM public.user_roles
   WHERE user_id = _user_id
     AND organisatie_id = _org_id;

  INSERT INTO public.activiteiten_log (user_id, organisatie_id, actie, beschrijving, entiteit_type, entiteit_id, metadata)
  VALUES (
    auth.uid(), _org_id, 'admin_user_removed',
    'Platform admin heeft gebruiker verwijderd uit organisatie',
    'user_role', _user_id::text,
    jsonb_build_object('user_id', _user_id)
  );
END;
$$;

-- 3. Create an invitation for a user (re-uses existing uitnodigingen flow)
CREATE OR REPLACE FUNCTION public.admin_invite_user_to_org(
  _org_id uuid,
  _email text,
  _role app_role
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _new_id uuid;
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Alleen platform admins hebben toegang';
  END IF;

  IF _email IS NULL OR _email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'Geldig e-mailadres is verplicht';
  END IF;

  IF _role = 'platform_admin'::app_role THEN
    RAISE EXCEPTION 'Platform admin rol kan niet via uitnodiging worden toegekend';
  END IF;

  INSERT INTO public.uitnodigingen (organisatie_id, email, role, uitgenodigd_door, status)
  VALUES (_org_id, lower(trim(_email)), _role, auth.uid(), 'pending')
  RETURNING id INTO _new_id;

  INSERT INTO public.activiteiten_log (user_id, organisatie_id, actie, beschrijving, entiteit_type, entiteit_id, metadata)
  VALUES (
    auth.uid(), _org_id, 'admin_user_invited',
    format('Platform admin heeft %s uitgenodigd als %s', _email, _role),
    'uitnodiging', _new_id::text,
    jsonb_build_object('email', _email, 'role', _role)
  );

  RETURN _new_id;
END;
$$;

-- 4. List platform admins
CREATE OR REPLACE FUNCTION public.admin_list_platform_admins()
RETURNS TABLE(user_id uuid, email text, created_at timestamptz, last_sign_in_at timestamptz)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Alleen platform admins hebben toegang';
  END IF;

  RETURN QUERY
  SELECT ur.user_id,
         u.email::text,
         ur.created_at,
         u.last_sign_in_at
    FROM public.user_roles ur
    LEFT JOIN auth.users u ON u.id = ur.user_id
   WHERE ur.role = 'platform_admin'::app_role
   ORDER BY ur.created_at ASC;
END;
$$;

-- 5. Revoke platform admin (cannot revoke yourself if last admin)
CREATE OR REPLACE FUNCTION public.admin_revoke_platform_admin(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _admin_count integer;
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Alleen platform admins hebben toegang';
  END IF;

  SELECT COUNT(*) INTO _admin_count
    FROM public.user_roles
   WHERE role = 'platform_admin'::app_role;

  IF _admin_count <= 1 THEN
    RAISE EXCEPTION 'Kan laatste platform admin niet verwijderen';
  END IF;

  DELETE FROM public.user_roles
   WHERE user_id = _user_id
     AND role = 'platform_admin'::app_role;
END;
$$;
