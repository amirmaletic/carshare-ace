CREATE OR REPLACE FUNCTION public.accept_uitnodiging(_token uuid)
RETURNS TABLE (
  organisatie_id uuid,
  role app_role,
  organisatie_naam text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite_record RECORD;
  current_email text;
BEGIN
  SELECT email INTO current_email
  FROM auth.users
  WHERE id = auth.uid();

  IF current_email IS NULL THEN
    RAISE EXCEPTION 'Niet ingelogd';
  END IF;

  SELECT u.*, o.naam AS org_naam
  INTO invite_record
  FROM public.uitnodigingen u
  LEFT JOIN public.organisaties o ON o.id = u.organisatie_id
  WHERE u.token = _token
  LIMIT 1;

  IF invite_record IS NULL THEN
    RAISE EXCEPTION 'Uitnodiging niet gevonden';
  END IF;

  IF lower(invite_record.email) <> lower(current_email) THEN
    RAISE EXCEPTION 'Deze uitnodiging hoort bij een ander e-mailadres';
  END IF;

  IF invite_record.status = 'accepted' THEN
    RETURN QUERY
    SELECT invite_record.organisatie_id, invite_record.role, invite_record.org_naam;
    RETURN;
  END IF;

  IF invite_record.status <> 'pending' OR invite_record.expires_at <= now() THEN
    RAISE EXCEPTION 'Deze uitnodiging is verlopen';
  END IF;

  INSERT INTO public.user_roles (user_id, role, organisatie_id)
  VALUES (auth.uid(), invite_record.role, invite_record.organisatie_id)
  ON CONFLICT DO NOTHING;

  UPDATE public.uitnodigingen
  SET status = 'accepted'
  WHERE id = invite_record.id;

  RETURN QUERY
  SELECT invite_record.organisatie_id, invite_record.role, invite_record.org_naam;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_uitnodiging(uuid) TO authenticated;