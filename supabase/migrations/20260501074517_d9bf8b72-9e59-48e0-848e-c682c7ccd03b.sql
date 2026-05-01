-- Sprint 2: Hardenen van SECURITY DEFINER functies door anon execute permissies in te trekken
-- Functies blijven aanroepbaar voor authenticated users en service_role waar nodig

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_platform_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_get_organisatie(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_update_organisatie(uuid, timestamptz, boolean, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_grant_platform_admin(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_delete_organisatie(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_list_organisaties() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_organisatie_id(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;