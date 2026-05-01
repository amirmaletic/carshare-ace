REVOKE EXECUTE ON FUNCTION public.get_user_organisatie_id(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_organisatie_id(uuid) TO authenticated;