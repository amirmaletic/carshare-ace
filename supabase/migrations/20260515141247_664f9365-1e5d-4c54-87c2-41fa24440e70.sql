CREATE OR REPLACE FUNCTION public.tg_check_voertuig_dubbele_boeking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_voertuig_uuid uuid;
  v_start date;
  v_eind date;
  v_conflict_count int := 0;
  v_conflict_text text;
BEGIN
  IF TG_TABLE_NAME = 'contracts' THEN
    BEGIN
      v_voertuig_uuid := NEW.voertuig_id::uuid;
    EXCEPTION WHEN others THEN
      SELECT id INTO v_voertuig_uuid
      FROM public.voertuigen
      WHERE organisatie_id = NEW.organisatie_id
        AND upper(replace(kenteken, '-', '')) = upper(replace(NEW.voertuig_id, '-', ''))
      LIMIT 1;
    END;
  ELSE
    v_voertuig_uuid := NEW.voertuig_id::uuid;
  END IF;

  IF v_voertuig_uuid IS NULL THEN
    RETURN NEW;
  END IF;

  v_start := NEW.start_datum;
  v_eind  := COALESCE(NEW.eind_datum, NEW.start_datum);

  -- Skip checks voor afgesloten records (cast naar text om enum-mismatch te vermijden)
  IF TG_TABLE_NAME = 'reserveringen' AND NEW.status::text IN ('geannuleerd', 'afgewezen', 'verlopen', 'voltooid') THEN
    RETURN NEW;
  END IF;
  IF TG_TABLE_NAME = 'contracts' AND NEW.status::text IN ('opgezegd', 'verlopen', 'geannuleerd') THEN
    RETURN NEW;
  END IF;

  -- Overlap met bestaande reserveringen
  SELECT count(*) INTO v_conflict_count
  FROM public.reserveringen r
  WHERE r.voertuig_id = v_voertuig_uuid
    AND r.status IN ('bevestigd', 'aangevraagd')
    AND NOT (TG_TABLE_NAME = 'reserveringen' AND r.id = NEW.id)
    AND daterange(r.start_datum, r.eind_datum, '[]') && daterange(v_start, v_eind, '[]');

  IF v_conflict_count > 0 THEN
    SELECT 'reservering ' || to_char(r.start_datum, 'DD-MM-YYYY') || ' t/m ' || to_char(r.eind_datum, 'DD-MM-YYYY')
      INTO v_conflict_text
    FROM public.reserveringen r
    WHERE r.voertuig_id = v_voertuig_uuid
      AND r.status IN ('bevestigd', 'aangevraagd')
      AND NOT (TG_TABLE_NAME = 'reserveringen' AND r.id = NEW.id)
      AND daterange(r.start_datum, r.eind_datum, '[]') && daterange(v_start, v_eind, '[]')
    LIMIT 1;
    RAISE EXCEPTION 'Voertuig is in deze periode al gereserveerd (%).', v_conflict_text
      USING ERRCODE = '23P01';
  END IF;

  -- Overlap met bestaande contracten
  SELECT count(*) INTO v_conflict_count
  FROM public.contracts c
  WHERE c.status::text IN ('actief', 'concept')
    AND NOT (TG_TABLE_NAME = 'contracts' AND c.id = NEW.id)
    AND (
      CASE
        WHEN c.voertuig_id ~ '^[0-9a-fA-F-]{36}$' THEN c.voertuig_id::uuid = v_voertuig_uuid
        ELSE EXISTS (
          SELECT 1 FROM public.voertuigen v
          WHERE v.organisatie_id = c.organisatie_id
            AND v.id = v_voertuig_uuid
            AND upper(replace(v.kenteken, '-', '')) = upper(replace(c.voertuig_id, '-', ''))
        )
      END
    )
    AND daterange(c.start_datum, COALESCE(c.eind_datum, c.start_datum), '[]') && daterange(v_start, v_eind, '[]');

  IF v_conflict_count > 0 THEN
    RAISE EXCEPTION 'Voertuig is in deze periode al verhuurd via een actief contract.'
      USING ERRCODE = '23P01';
  END IF;

  -- Overlap met planning blokken (onderhoud/blokkade)
  SELECT count(*) INTO v_conflict_count
  FROM public.planning_blokken pb
  WHERE pb.voertuig_id = v_voertuig_uuid
    AND daterange(pb.start_datum, COALESCE(pb.eind_datum, pb.start_datum), '[]') && daterange(v_start, v_eind, '[]');

  IF v_conflict_count > 0 THEN
    RAISE EXCEPTION 'Voertuig is in deze periode geblokkeerd of in onderhoud.'
      USING ERRCODE = '23P01';
  END IF;

  RETURN NEW;
END;
$$;