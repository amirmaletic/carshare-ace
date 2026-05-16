
REVOKE EXECUTE ON FUNCTION public.admin_list_promocodes() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_create_promocode(text, text, numeric, date, int, uuid, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_toggle_promocode(uuid, boolean) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_delete_promocode(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_bulk_extend_trial(uuid[], int) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_bulk_set_active(uuid[], boolean) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_signups_per_dag(int) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_trial_warning_kandidaten() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_mark_trial_warning_sent(uuid) FROM anon, public;
