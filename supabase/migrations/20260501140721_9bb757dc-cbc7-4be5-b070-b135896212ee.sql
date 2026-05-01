CREATE OR REPLACE FUNCTION public.get_module_modus()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.module_modus
  FROM public.organisaties o
  JOIN public.user_roles ur ON ur.organisatie_id = o.id
  WHERE ur.user_id = auth.uid()
    AND ur.organisatie_id IS NOT NULL
    AND ur.role <> 'platform_admin'::public.app_role
  ORDER BY ur.created_at ASC
  LIMIT 1
$$;

REVOKE EXECUTE ON FUNCTION public.get_module_modus() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_module_modus() TO authenticated;