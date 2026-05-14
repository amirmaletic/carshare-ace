CREATE OR REPLACE FUNCTION public.sync_overdracht_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _voertuig_uuid uuid;
BEGIN
  IF NEW.status <> 'ondertekend' OR (TG_OP = 'UPDATE' AND OLD.status = 'ondertekend') THEN
    RETURN NEW;
  END IF;

  BEGIN
    _voertuig_uuid := NEW.voertuig_id::uuid;
  EXCEPTION WHEN OTHERS THEN
    _voertuig_uuid := NULL;
  END;

  IF NEW.type = 'ophalen' THEN
    IF NEW.contract_id IS NOT NULL THEN
      UPDATE public.contracts
      SET status = 'actief', updated_at = now()
      WHERE id = NEW.contract_id
        AND organisatie_id = NEW.organisatie_id
        AND status::text IN ('concept', 'actief');
    END IF;

    IF _voertuig_uuid IS NOT NULL THEN
      UPDATE public.voertuigen
      SET status = 'verhuurd',
          kilometerstand = COALESCE(NEW.kilometerstand, kilometerstand),
          updated_at = now()
      WHERE id = _voertuig_uuid
        AND organisatie_id = NEW.organisatie_id;
    END IF;

  ELSIF NEW.type IN ('inleveren', 'terugbrengen') THEN
    IF NEW.contract_id IS NOT NULL THEN
      UPDATE public.contracts
      SET status = 'verlopen', updated_at = now()
      WHERE id = NEW.contract_id
        AND organisatie_id = NEW.organisatie_id;
    END IF;

    IF _voertuig_uuid IS NOT NULL THEN
      UPDATE public.voertuigen
      SET status = 'beschikbaar',
          kilometerstand = COALESCE(NEW.kilometerstand, kilometerstand),
          updated_at = now()
      WHERE id = _voertuig_uuid
        AND organisatie_id = NEW.organisatie_id;
    END IF;
  END IF;

  INSERT INTO public.activiteiten_log (user_id, organisatie_id, actie, beschrijving, entiteit_type, entiteit_id, metadata)
  VALUES (
    NEW.user_id,
    NEW.organisatie_id,
    'overdracht_sync',
    format('Overdracht %s ondertekend voor %s, contract en voertuig automatisch bijgewerkt', NEW.type, NEW.voertuig_kenteken),
    'overdracht',
    NEW.id::text,
    jsonb_build_object('type', NEW.type, 'voertuig_id', NEW.voertuig_id, 'contract_id', NEW.contract_id)
  );

  RETURN NEW;
END;
$$;