
-- Add trial and activation fields to organisaties
ALTER TABLE public.organisaties
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamp with time zone DEFAULT (now() + interval '30 days'),
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Update handle_new_user to set trial_ends_at explicitly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  invite_record RECORD;
  new_org_id uuid;
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
    INSERT INTO public.organisaties (naam, eigenaar_id, trial_ends_at, is_active)
    VALUES ('Mijn Bedrijf', NEW.id, now() + interval '30 days', true)
    RETURNING id INTO new_org_id;
    INSERT INTO public.user_roles (user_id, role, organisatie_id)
    VALUES (NEW.id, 'beheerder', new_org_id)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;
