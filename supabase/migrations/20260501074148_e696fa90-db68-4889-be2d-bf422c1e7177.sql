CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  invite_record RECORD;
  new_org_id uuid;
  bedrijfsnaam text;
BEGIN
  SELECT * INTO invite_record FROM public.uitnodigingen
  WHERE email = NEW.email AND status = 'pending' AND expires_at > now()
  LIMIT 1;

  IF invite_record IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role, organisatie_id)
    VALUES (NEW.id, invite_record.role, invite_record.organisatie_id)
    ON CONFLICT DO NOTHING;
    UPDATE public.uitnodigingen SET status = 'accepted' WHERE id = invite_record.id;
  ELSE
    bedrijfsnaam := COALESCE(
      NULLIF(trim(NEW.raw_user_meta_data ->> 'bedrijfsnaam'), ''),
      'Mijn Bedrijf'
    );
    INSERT INTO public.organisaties (naam, eigenaar_id, trial_ends_at, is_active)
    VALUES (bedrijfsnaam, NEW.id, now() + interval '30 days', true)
    RETURNING id INTO new_org_id;
    INSERT INTO public.user_roles (user_id, role, organisatie_id)
    VALUES (NEW.id, 'beheerder', new_org_id)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;