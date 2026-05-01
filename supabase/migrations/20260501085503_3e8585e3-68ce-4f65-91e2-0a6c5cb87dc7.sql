-- Extra kolommen voor invoices
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS omschrijving text,
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'huur',
  ADD COLUMN IF NOT EXISTS schade_rapport_id uuid REFERENCES public.schade_rapporten(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS borg_verrekend numeric NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_invoices_schade_rapport_id ON public.invoices(schade_rapport_id);

-- Trigger functie: maak factuur + borgverrekening bij hersteld schade-rapport
CREATE OR REPLACE FUNCTION public.sync_schade_naar_factuur()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _contract public.contracts;
  _voertuig_uuid uuid;
  _bestaat boolean;
  _reeds_verrekend numeric;
  _borg_beschikbaar numeric;
  _borg_aftrek numeric;
  _factuur_id uuid;
BEGIN
  -- Alleen reageren als hersteld net true werd en er kosten zijn
  IF NOT (TG_OP = 'UPDATE' AND NEW.hersteld = true AND COALESCE(OLD.hersteld, false) = false) THEN
    RETURN NEW;
  END IF;

  IF COALESCE(NEW.kosten, 0) <= 0 THEN
    RETURN NEW;
  END IF;

  -- Voorkom dubbele factuur voor zelfde schade-rapport
  SELECT EXISTS(
    SELECT 1 FROM public.invoices
    WHERE schade_rapport_id = NEW.id AND type = 'schade'
  ) INTO _bestaat;
  IF _bestaat THEN
    RETURN NEW;
  END IF;

  -- Voertuig uuid afleiden
  BEGIN
    _voertuig_uuid := NEW.voertuig_id::uuid;
  EXCEPTION WHEN OTHERS THEN
    _voertuig_uuid := NULL;
  END;

  -- Zoek meest recente actieve/recent afgeronde contract voor dit voertuig
  SELECT * INTO _contract
  FROM public.contracts
  WHERE organisatie_id = NEW.organisatie_id
    AND voertuig_id = NEW.voertuig_id
    AND status IN ('actief', 'afgerond')
  ORDER BY 
    CASE status WHEN 'actief' THEN 0 ELSE 1 END,
    eind_datum DESC NULLS LAST,
    created_at DESC
  LIMIT 1;

  IF _contract.id IS NULL THEN
    -- Geen contract gevonden, geen automatische factuur mogelijk
    INSERT INTO public.activiteiten_log (user_id, organisatie_id, actie, beschrijving, entiteit_type, entiteit_id, metadata)
    VALUES (NEW.user_id, NEW.organisatie_id, 'auto_factuur_overgeslagen',
      format('Schade-factuur niet aangemaakt: geen contract gevonden voor voertuig %s', NEW.voertuig_id),
      'schade_rapport', NEW.id::text,
      jsonb_build_object('kosten', NEW.kosten));
    RETURN NEW;
  END IF;

  -- Bereken borgverrekening
  SELECT COALESCE(SUM(borg_verrekend), 0) INTO _reeds_verrekend
  FROM public.invoices
  WHERE contract_id = _contract.id;

  _borg_beschikbaar := GREATEST(COALESCE(_contract.borg, 0) - _reeds_verrekend, 0);
  _borg_aftrek := LEAST(_borg_beschikbaar, NEW.kosten);

  -- Maak conceptfactuur aan (status openstaand, bedrag = kosten - borgaftrek)
  INSERT INTO public.invoices (
    contract_id, user_id, organisatie_id, datum, bedrag, status,
    omschrijving, type, schade_rapport_id, borg_verrekend
  ) VALUES (
    _contract.id,
    NEW.user_id,
    NEW.organisatie_id,
    COALESCE(NEW.herstel_datum, CURRENT_DATE),
    GREATEST(NEW.kosten - _borg_aftrek, 0),
    'openstaand',
    format('Reparatiekosten schade %s%s',
      COALESCE(NEW.locatie_schade, NEW.omschrijving),
      CASE WHEN _borg_aftrek > 0 
        THEN format(' (borg verrekend: € %s)', to_char(_borg_aftrek, 'FM999990.00'))
        ELSE '' END),
    'schade',
    NEW.id,
    _borg_aftrek
  )
  RETURNING id INTO _factuur_id;

  -- Audit log
  INSERT INTO public.activiteiten_log (user_id, organisatie_id, actie, beschrijving, entiteit_type, entiteit_id, metadata)
  VALUES (
    NEW.user_id, NEW.organisatie_id, 'auto_schade_factuur',
    format('Conceptfactuur aangemaakt voor schade (€ %s, borg verrekend € %s)',
      to_char(GREATEST(NEW.kosten - _borg_aftrek, 0), 'FM999990.00'),
      to_char(_borg_aftrek, 'FM999990.00')),
    'invoice', _factuur_id::text,
    jsonb_build_object(
      'schade_rapport_id', NEW.id,
      'contract_id', _contract.id,
      'kosten_totaal', NEW.kosten,
      'borg_verrekend', _borg_aftrek,
      'te_factureren', GREATEST(NEW.kosten - _borg_aftrek, 0)
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_schade_naar_factuur ON public.schade_rapporten;
CREATE TRIGGER trg_schade_naar_factuur
  AFTER UPDATE ON public.schade_rapporten
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_schade_naar_factuur();