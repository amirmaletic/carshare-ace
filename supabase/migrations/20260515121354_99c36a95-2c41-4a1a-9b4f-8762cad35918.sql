CREATE OR REPLACE FUNCTION public.get_uitnodiging_info(_token uuid)
RETURNS TABLE (
  email text,
  role app_role,
  organisatie_naam text,
  status text,
  expires_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.email, u.role, o.naam, u.status, u.expires_at
  FROM public.uitnodigingen u
  LEFT JOIN public.organisaties o ON o.id = u.organisatie_id
  WHERE u.token = _token
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_uitnodiging_info(uuid) TO anon, authenticated;