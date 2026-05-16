
-- 1. trial_warning_sent_at column
ALTER TABLE public.organisaties
  ADD COLUMN IF NOT EXISTS trial_warning_sent_at timestamptz;

-- 2. promocodes table
CREATE TABLE IF NOT EXISTS public.promocodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  kortings_type text NOT NULL CHECK (kortings_type IN ('percent','vast')),
  kortings_waarde numeric NOT NULL CHECK (kortings_waarde >= 0),
  geldig_tot date,
  max_gebruik integer,
  huidig_gebruik integer NOT NULL DEFAULT 0,
  organisatie_id uuid REFERENCES public.organisaties(id) ON DELETE CASCADE,
  notities text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

ALTER TABLE public.promocodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform_admin_select_promocodes" ON public.promocodes
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'::app_role));

CREATE POLICY "platform_admin_insert_promocodes" ON public.promocodes
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'platform_admin'::app_role));

CREATE POLICY "platform_admin_update_promocodes" ON public.promocodes
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'::app_role));

CREATE POLICY "platform_admin_delete_promocodes" ON public.promocodes
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_promocodes_code ON public.promocodes(code);
CREATE INDEX IF NOT EXISTS idx_promocodes_org ON public.promocodes(organisatie_id);

-- 3. RPCs
CREATE OR REPLACE FUNCTION public.admin_list_promocodes()
RETURNS SETOF public.promocodes
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'platform_admin'::app_role) THEN
    RAISE EXCEPTION 'Geen toegang';
  END IF;
  RETURN QUERY SELECT * FROM public.promocodes ORDER BY created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_create_promocode(
  _code text,
  _kortings_type text,
  _kortings_waarde numeric,
  _geldig_tot date DEFAULT NULL,
  _max_gebruik int DEFAULT NULL,
  _organisatie_id uuid DEFAULT NULL,
  _notities text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _new_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'platform_admin'::app_role) THEN
    RAISE EXCEPTION 'Geen toegang';
  END IF;
  INSERT INTO public.promocodes(code, kortings_type, kortings_waarde, geldig_tot, max_gebruik, organisatie_id, notities, created_by)
  VALUES (upper(_code), _kortings_type, _kortings_waarde, _geldig_tot, _max_gebruik, _organisatie_id, _notities, auth.uid())
  RETURNING id INTO _new_id;
  RETURN _new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_toggle_promocode(_id uuid, _is_active boolean)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'platform_admin'::app_role) THEN
    RAISE EXCEPTION 'Geen toegang';
  END IF;
  UPDATE public.promocodes SET is_active = _is_active WHERE id = _id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_promocode(_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'platform_admin'::app_role) THEN
    RAISE EXCEPTION 'Geen toegang';
  END IF;
  DELETE FROM public.promocodes WHERE id = _id;
END;
$$;

-- 4. Bulk acties
CREATE OR REPLACE FUNCTION public.admin_bulk_extend_trial(_org_ids uuid[], _days int)
RETURNS int
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _n int;
BEGIN
  IF NOT public.has_role(auth.uid(), 'platform_admin'::app_role) THEN
    RAISE EXCEPTION 'Geen toegang';
  END IF;
  UPDATE public.organisaties
    SET trial_ends_at = GREATEST(COALESCE(trial_ends_at, now()), now()) + (_days || ' days')::interval,
        trial_warning_sent_at = NULL
    WHERE id = ANY(_org_ids);
  GET DIAGNOSTICS _n = ROW_COUNT;
  RETURN _n;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_bulk_set_active(_org_ids uuid[], _is_active boolean)
RETURNS int
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _n int;
BEGIN
  IF NOT public.has_role(auth.uid(), 'platform_admin'::app_role) THEN
    RAISE EXCEPTION 'Geen toegang';
  END IF;
  UPDATE public.organisaties SET is_active = _is_active WHERE id = ANY(_org_ids);
  GET DIAGNOSTICS _n = ROW_COUNT;
  RETURN _n;
END;
$$;

-- 5. Signups per dag (laatste N dagen)
CREATE OR REPLACE FUNCTION public.admin_signups_per_dag(_days int DEFAULT 30)
RETURNS TABLE(datum date, aantal bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'platform_admin'::app_role) THEN
    RAISE EXCEPTION 'Geen toegang';
  END IF;
  RETURN QUERY
    WITH dagen AS (
      SELECT generate_series((now()::date - (_days - 1)), now()::date, '1 day'::interval)::date AS datum
    )
    SELECT d.datum, COUNT(o.id)::bigint
    FROM dagen d
    LEFT JOIN public.organisaties o
      ON o.created_at::date = d.datum
    GROUP BY d.datum
    ORDER BY d.datum;
END;
$$;

-- 6. Trial-warning lijst (orgs die over 5-7 dagen aflopen en nog geen waarschuwing kregen)
CREATE OR REPLACE FUNCTION public.admin_trial_warning_kandidaten()
RETURNS TABLE(id uuid, naam text, eigenaar_email text, trial_ends_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'platform_admin'::app_role) OR auth.uid() IS NULL) THEN
    RAISE EXCEPTION 'Geen toegang';
  END IF;
  RETURN QUERY
    SELECT o.id, o.naam, u.email::text, o.trial_ends_at
    FROM public.organisaties o
    LEFT JOIN auth.users u ON u.id = o.eigenaar_id
    WHERE o.is_active = true
      AND o.trial_ends_at IS NOT NULL
      AND o.trial_ends_at BETWEEN now() + interval '3 days' AND now() + interval '7 days'
      AND o.trial_warning_sent_at IS NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_mark_trial_warning_sent(_org_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.organisaties
    SET trial_warning_sent_at = now()
    WHERE id = _org_id;
END;
$$;
