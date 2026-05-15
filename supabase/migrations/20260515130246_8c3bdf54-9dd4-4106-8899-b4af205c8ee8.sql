DROP FUNCTION IF EXISTS public.get_uitnodiging_info(uuid);

CREATE OR REPLACE FUNCTION public.get_uitnodiging_info(_token uuid)
RETURNS TABLE (
  email text,
  role app_role,
  organisatie_naam text,
  status text,
  expires_at timestamptz,
  account_exists boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    u.email,
    u.role,
    o.naam,
    u.status,
    u.expires_at,
    EXISTS (
      SELECT 1
      FROM auth.users au
      WHERE lower(au.email) = lower(u.email)
    ) AS account_exists
  FROM public.uitnodigingen u
  LEFT JOIN public.organisaties o ON o.id = u.organisatie_id
  WHERE u.token = _token
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_uitnodiging_info(uuid) TO anon, authenticated;