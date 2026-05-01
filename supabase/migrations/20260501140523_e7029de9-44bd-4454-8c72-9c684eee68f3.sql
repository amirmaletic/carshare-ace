CREATE OR REPLACE FUNCTION public.get_user_organisatie_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ur.organisatie_id
  FROM public.user_roles ur
  WHERE ur.user_id = _user_id
    AND ur.organisatie_id IS NOT NULL
    AND ur.role <> 'platform_admin'::public.app_role
  ORDER BY ur.created_at ASC
  LIMIT 1
$$;