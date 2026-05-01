REVOKE EXECUTE ON FUNCTION public.verify_api_key(text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.touch_api_key(uuid, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.create_api_key(text, text[], timestamptz) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.revoke_api_key(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.enqueue_webhook_event(uuid, text, jsonb) FROM anon, public;

GRANT EXECUTE ON FUNCTION public.create_api_key(text, text[], timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_api_key(uuid) TO authenticated;
-- verify_api_key + touch_api_key worden alleen door edge functions met service role aangeroepen