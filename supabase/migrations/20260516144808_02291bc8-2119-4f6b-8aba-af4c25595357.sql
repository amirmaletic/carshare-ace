
ALTER TABLE public.organisaties
  ADD COLUMN IF NOT EXISTS trial_urgent_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS trial_expired_sent_at timestamptz;

-- Update bulk extend om ook nieuwe markers te resetten
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
        trial_warning_sent_at = NULL,
        trial_urgent_sent_at = NULL,
        trial_expired_sent_at = NULL
    WHERE id = ANY(_org_ids);
  GET DIAGNOSTICS _n = ROW_COUNT;
  RETURN _n;
END;
$$;

-- Urgent: trial loopt af binnen 2 dagen, nog geen urgent-mail gehad
CREATE OR REPLACE FUNCTION public.admin_trial_urgent_kandidaten()
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
      AND o.trial_ends_at > now()
      AND o.trial_ends_at <= now() + interval '2 days'
      AND o.trial_urgent_sent_at IS NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_mark_trial_urgent_sent(_org_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.organisaties SET trial_urgent_sent_at = now() WHERE id = _org_id;
END;
$$;

-- Expired: trial is voorbij (max 30 dagen geleden), nog geen expired-mail
CREATE OR REPLACE FUNCTION public.admin_trial_expired_kandidaten()
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
      AND o.trial_ends_at <= now()
      AND o.trial_ends_at >= now() - interval '30 days'
      AND o.trial_expired_sent_at IS NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_mark_trial_expired_sent(_org_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.organisaties SET trial_expired_sent_at = now() WHERE id = _org_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_trial_urgent_kandidaten() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_mark_trial_urgent_sent(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_trial_expired_kandidaten() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_mark_trial_expired_sent(uuid) FROM anon, public;
