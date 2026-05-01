-- Trek alle PUBLIC execute privileges in op SECURITY DEFINER functies
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_platform_admin() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_get_organisatie(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_update_organisatie(uuid, timestamptz, boolean, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_grant_platform_admin(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_delete_organisatie(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_list_organisaties() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_organisatie_id(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- Geef terug aan authenticated waar nodig
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_organisatie_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_organisatie(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_organisatie(uuid, timestamptz, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_grant_platform_admin(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_organisatie(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_organisaties() TO authenticated;