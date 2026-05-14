CREATE OR REPLACE FUNCTION public.tg_reservering_naar_contract()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_klant RECORD;
  v_voertuig RECORD;
  v_contract_id uuid;
  v_nummer text;
  v_status contract_status;
BEGIN
  IF NEW.status NOT IN ('bevestigd', 'actief', 'lopend') THEN
    RETURN NEW;
  END IF;

  SELECT id, voornaam, achternaam, email, telefoon, adres, organisatie_id, auth_user_id
    INTO v_klant FROM public.klanten WHERE id = NEW.klant_id;
  IF v_klant.id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT id, kenteken, merk, model INTO v_voertuig
    FROM public.voertuigen WHERE id = NEW.voertuig_id;

  -- Bestaat al een contract voor deze reservering?
  SELECT id INTO v_contract_id FROM public.contracts
    WHERE notities LIKE '%reservering:' || NEW.id::text || '%'
    LIMIT 1;
  IF v_contract_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  v_nummer := 'RES-' || upper(substring(NEW.id::text, 1, 8));
  v_status := CASE
    WHEN CURRENT_DATE BETWEEN NEW.start_datum AND NEW.eind_datum THEN 'actief'::contract_status
    WHEN CURRENT_DATE > NEW.eind_datum THEN 'verlopen'::contract_status
    ELSE 'concept'::contract_status
  END;

  INSERT INTO public.contracts (
    user_id, organisatie_id, contract_nummer, type,
    voertuig_id, klant_naam, klant_email, klant_telefoon, klant_adres,
    start_datum, eind_datum, maandprijs, status, inclusief, notities
  ) VALUES (
    COALESCE(v_klant.auth_user_id, v_klant.organisatie_id),
    v_klant.organisatie_id,
    v_nummer,
    'verhuur',
    NEW.voertuig_id::text,
    trim(coalesce(v_klant.voornaam,'') || ' ' || coalesce(v_klant.achternaam,'')),
    coalesce(v_klant.email, ''),
    v_klant.telefoon,
    v_klant.adres,
    NEW.start_datum,
    NEW.eind_datum,
    coalesce(NEW.totaalprijs, NEW.dagprijs * GREATEST(1, (NEW.eind_datum - NEW.start_datum))),
    v_status,
    coalesce(NEW.extras, '{}'::text[]),
    'Automatisch aangemaakt vanuit reservering:' || NEW.id::text ||
      CASE WHEN v_voertuig.kenteken IS NOT NULL
        THEN E'\nVoertuig: ' || v_voertuig.merk || ' ' || v_voertuig.model || ' (' || v_voertuig.kenteken || ')'
        ELSE '' END ||
      CASE WHEN NEW.notities IS NOT NULL THEN E'\nNotitie: ' || NEW.notities ELSE '' END
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reservering_naar_contract ON public.reserveringen;
CREATE TRIGGER reservering_naar_contract
  AFTER INSERT OR UPDATE OF status, start_datum, eind_datum, voertuig_id, klant_id
  ON public.reserveringen
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_reservering_naar_contract();

-- Backfill bestaande bevestigde reserveringen
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT * FROM public.reserveringen
    WHERE status IN ('bevestigd','actief','lopend')
      AND eind_datum >= CURRENT_DATE - 60
  LOOP
    PERFORM 1 FROM public.contracts WHERE notities LIKE '%reservering:' || r.id::text || '%';
    IF NOT FOUND THEN
      UPDATE public.reserveringen SET updated_at = now() WHERE id = r.id;
    END IF;
  END LOOP;
END $$;