CREATE OR REPLACE FUNCTION public.tg_reservering_naar_contract()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_klant RECORD;
  v_voertuig RECORD;
  v_org_eigenaar uuid;
  v_user_id uuid;
  v_contract_id uuid;
  v_nummer text;
  v_status contract_status;
BEGIN
  IF NEW.status NOT IN ('bevestigd','actief','lopend') THEN
    RETURN NEW;
  END IF;

  SELECT id, voornaam, achternaam, email, telefoon, adres, organisatie_id, auth_user_id
    INTO v_klant FROM public.klanten WHERE id = NEW.klant_id;
  IF v_klant.id IS NULL THEN RETURN NEW; END IF;

  SELECT eigenaar_id INTO v_org_eigenaar FROM public.organisaties WHERE id = v_klant.organisatie_id;
  v_user_id := COALESCE(v_klant.auth_user_id, v_org_eigenaar);
  IF v_user_id IS NULL THEN RETURN NEW; END IF;

  SELECT id, kenteken, merk, model INTO v_voertuig
    FROM public.voertuigen WHERE id = NEW.voertuig_id;

  SELECT id INTO v_contract_id FROM public.contracts
    WHERE notities LIKE '%reservering:' || NEW.id::text || '%' LIMIT 1;
  IF v_contract_id IS NOT NULL THEN RETURN NEW; END IF;

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
    v_user_id, v_klant.organisatie_id, v_nummer, 'verhuur',
    NEW.voertuig_id::text,
    trim(coalesce(v_klant.voornaam,'') || ' ' || coalesce(v_klant.achternaam,'')),
    coalesce(v_klant.email,''), v_klant.telefoon, v_klant.adres,
    NEW.start_datum, NEW.eind_datum,
    coalesce(NEW.totaalprijs, NEW.dagprijs * GREATEST(1, (NEW.eind_datum - NEW.start_datum))),
    v_status,
    coalesce(NEW.extras, '{}'::text[]),
    'Automatisch aangemaakt vanuit reservering:' || NEW.id::text ||
      coalesce(E'\nVoertuig: ' || v_voertuig.merk || ' ' || v_voertuig.model || ' (' || v_voertuig.kenteken || ')', '') ||
      coalesce(E'\nNotitie: ' || NEW.notities, '')
  );

  RETURN NEW;
END;
$$;