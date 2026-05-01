-- ============ API KEYS ============
CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisatie_id uuid NOT NULL REFERENCES public.organisaties(id) ON DELETE CASCADE,
  naam text NOT NULL,
  key_prefix text NOT NULL,
  key_hash text NOT NULL UNIQUE,
  scopes text[] NOT NULL DEFAULT ARRAY['read:all']::text[],
  laatst_gebruikt_op timestamptz,
  laatst_gebruikt_ip text,
  expires_at timestamptz,
  revoked_at timestamptz,
  aangemaakt_door uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_api_keys_org ON public.api_keys(organisatie_id);
CREATE INDEX idx_api_keys_hash ON public.api_keys(key_hash) WHERE revoked_at IS NULL;

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Beheerders zien eigen API keys" ON public.api_keys
FOR SELECT USING (
  (organisatie_id = public.get_user_organisatie_id(auth.uid())
   AND public.has_role(auth.uid(), 'beheerder'::app_role))
  OR public.is_platform_admin()
);

CREATE POLICY "Beheerders maken eigen API keys" ON public.api_keys
FOR INSERT WITH CHECK (
  organisatie_id = public.get_user_organisatie_id(auth.uid())
  AND public.has_role(auth.uid(), 'beheerder'::app_role)
);

CREATE POLICY "Beheerders updaten eigen API keys" ON public.api_keys
FOR UPDATE USING (
  organisatie_id = public.get_user_organisatie_id(auth.uid())
  AND public.has_role(auth.uid(), 'beheerder'::app_role)
);

CREATE POLICY "Beheerders verwijderen eigen API keys" ON public.api_keys
FOR DELETE USING (
  organisatie_id = public.get_user_organisatie_id(auth.uid())
  AND public.has_role(auth.uid(), 'beheerder'::app_role)
);

CREATE TRIGGER trg_api_keys_updated BEFORE UPDATE ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ WEBHOOKS ============
CREATE TABLE public.webhook_endpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisatie_id uuid NOT NULL REFERENCES public.organisaties(id) ON DELETE CASCADE,
  url text NOT NULL,
  beschrijving text,
  events text[] NOT NULL DEFAULT ARRAY[]::text[],
  secret text NOT NULL,
  actief boolean NOT NULL DEFAULT true,
  aangemaakt_door uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_webhook_endpoints_org ON public.webhook_endpoints(organisatie_id);

ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Beheerders zien eigen webhooks" ON public.webhook_endpoints
FOR SELECT USING (
  (organisatie_id = public.get_user_organisatie_id(auth.uid())
   AND public.has_role(auth.uid(), 'beheerder'::app_role))
  OR public.is_platform_admin()
);

CREATE POLICY "Beheerders beheren eigen webhooks" ON public.webhook_endpoints
FOR ALL USING (
  organisatie_id = public.get_user_organisatie_id(auth.uid())
  AND public.has_role(auth.uid(), 'beheerder'::app_role)
) WITH CHECK (
  organisatie_id = public.get_user_organisatie_id(auth.uid())
  AND public.has_role(auth.uid(), 'beheerder'::app_role)
);

CREATE TRIGGER trg_webhook_endpoints_updated BEFORE UPDATE ON public.webhook_endpoints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id uuid NOT NULL REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE,
  organisatie_id uuid NOT NULL,
  event text NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  http_status integer,
  response_body text,
  attempts integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz DEFAULT now(),
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_deliveries_endpoint ON public.webhook_deliveries(endpoint_id);
CREATE INDEX idx_deliveries_pending ON public.webhook_deliveries(status, next_attempt_at) WHERE status = 'pending';
CREATE INDEX idx_deliveries_org ON public.webhook_deliveries(organisatie_id);

ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Beheerders zien eigen deliveries" ON public.webhook_deliveries
FOR SELECT USING (
  (organisatie_id = public.get_user_organisatie_id(auth.uid())
   AND public.has_role(auth.uid(), 'beheerder'::app_role))
  OR public.is_platform_admin()
);

-- ============ API REQUEST LOG ============
CREATE TABLE public.api_request_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisatie_id uuid,
  api_key_id uuid REFERENCES public.api_keys(id) ON DELETE SET NULL,
  method text NOT NULL,
  path text NOT NULL,
  status_code integer,
  duration_ms integer,
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_api_log_org_time ON public.api_request_log(organisatie_id, created_at DESC);

ALTER TABLE public.api_request_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Beheerders zien eigen API logs" ON public.api_request_log
FOR SELECT USING (
  (organisatie_id = public.get_user_organisatie_id(auth.uid())
   AND public.has_role(auth.uid(), 'beheerder'::app_role))
  OR public.is_platform_admin()
);

-- ============ FUNCTIES ============
CREATE OR REPLACE FUNCTION public.verify_api_key(_key text)
RETURNS TABLE(api_key_id uuid, organisatie_id uuid, scopes text[])
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE _hash text;
BEGIN
  IF _key IS NULL OR length(_key) < 20 THEN RETURN; END IF;
  _hash := encode(extensions.digest(_key, 'sha256'), 'hex');
  RETURN QUERY
  SELECT k.id, k.organisatie_id, k.scopes
  FROM public.api_keys k
  WHERE k.key_hash = _hash
    AND k.revoked_at IS NULL
    AND (k.expires_at IS NULL OR k.expires_at > now())
  LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.touch_api_key(_id uuid, _ip text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.api_keys SET laatst_gebruikt_op = now(), laatst_gebruikt_ip = _ip WHERE id = _id;
$$;

CREATE OR REPLACE FUNCTION public.create_api_key(_naam text, _scopes text[] DEFAULT ARRAY['read:all']::text[], _expires_at timestamptz DEFAULT NULL)
RETURNS TABLE(id uuid, plain_key text, prefix text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE _org uuid; _user uuid; _key text; _prefix text; _hash text; _id uuid;
BEGIN
  _user := auth.uid();
  _org := public.get_user_organisatie_id(_user);
  IF _org IS NULL THEN RAISE EXCEPTION 'Geen organisatie gevonden'; END IF;
  IF NOT public.has_role(_user, 'beheerder'::app_role) THEN
    RAISE EXCEPTION 'Alleen beheerders kunnen API keys aanmaken';
  END IF;

  _key := 'ff_live_' || encode(extensions.gen_random_bytes(32), 'hex');
  _prefix := substring(_key from 1 for 16);
  _hash := encode(extensions.digest(_key, 'sha256'), 'hex');

  INSERT INTO public.api_keys (organisatie_id, naam, key_prefix, key_hash, scopes, expires_at, aangemaakt_door)
  VALUES (_org, _naam, _prefix, _hash, _scopes, _expires_at, _user)
  RETURNING api_keys.id INTO _id;

  INSERT INTO public.activiteiten_log (user_id, organisatie_id, actie, beschrijving, entiteit_type, entiteit_id, metadata)
  VALUES (_user, _org, 'api_key_created', format('API key "%s" aangemaakt', _naam), 'api_key', _id::text,
          jsonb_build_object('scopes', _scopes));

  RETURN QUERY SELECT _id, _key, _prefix;
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_api_key(_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _org uuid; _user uuid;
BEGIN
  _user := auth.uid();
  _org := public.get_user_organisatie_id(_user);
  IF NOT public.has_role(_user, 'beheerder'::app_role) THEN
    RAISE EXCEPTION 'Onvoldoende rechten';
  END IF;
  UPDATE public.api_keys SET revoked_at = now()
  WHERE id = _id AND organisatie_id = _org;
  INSERT INTO public.activiteiten_log (user_id, organisatie_id, actie, beschrijving, entiteit_type, entiteit_id, metadata)
  VALUES (_user, _org, 'api_key_revoked', 'API key ingetrokken', 'api_key', _id::text, '{}'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.enqueue_webhook_event(_org_id uuid, _event text, _payload jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _count integer := 0;
BEGIN
  INSERT INTO public.webhook_deliveries (endpoint_id, organisatie_id, event, payload)
  SELECT e.id, _org_id, _event,
         jsonb_build_object('event', _event, 'data', _payload, 'timestamp', extract(epoch from now()))
  FROM public.webhook_endpoints e
  WHERE e.organisatie_id = _org_id AND e.actief = true
    AND (_event = ANY(e.events) OR '*' = ANY(e.events));
  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$$;

CREATE OR REPLACE FUNCTION public.tg_webhook_dispatch()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _event text; _org uuid; _payload jsonb; _resource text := TG_ARGV[0];
BEGIN
  IF TG_OP = 'INSERT' THEN
    _event := _resource || '.created'; _org := NEW.organisatie_id; _payload := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    _event := _resource || '.updated'; _org := NEW.organisatie_id;
    _payload := jsonb_build_object('new', to_jsonb(NEW), 'old', to_jsonb(OLD));
  ELSIF TG_OP = 'DELETE' THEN
    _event := _resource || '.deleted'; _org := OLD.organisatie_id; _payload := to_jsonb(OLD);
  END IF;
  IF _org IS NOT NULL THEN PERFORM public.enqueue_webhook_event(_org, _event, _payload); END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_webhook_voertuigen AFTER INSERT OR UPDATE OR DELETE ON public.voertuigen
  FOR EACH ROW EXECUTE FUNCTION public.tg_webhook_dispatch('voertuig');
CREATE TRIGGER trg_webhook_contracts AFTER INSERT OR UPDATE OR DELETE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.tg_webhook_dispatch('contract');
CREATE TRIGGER trg_webhook_klanten AFTER INSERT OR UPDATE OR DELETE ON public.klanten
  FOR EACH ROW EXECUTE FUNCTION public.tg_webhook_dispatch('klant');
CREATE TRIGGER trg_webhook_schade AFTER INSERT OR UPDATE OR DELETE ON public.schade_rapporten
  FOR EACH ROW EXECUTE FUNCTION public.tg_webhook_dispatch('schade');
CREATE TRIGGER trg_webhook_invoices AFTER INSERT OR UPDATE OR DELETE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.tg_webhook_dispatch('factuur');
CREATE TRIGGER trg_webhook_ritten AFTER INSERT OR UPDATE OR DELETE ON public.ritten
  FOR EACH ROW EXECUTE FUNCTION public.tg_webhook_dispatch('rit');