
-- Sprint 2: Rit-registratie privé/zakelijk + bijtelling

-- 1) Voertuigen: bijtelling-velden
ALTER TABLE public.voertuigen
  ADD COLUMN IF NOT EXISTS bijtelling_percentage numeric NOT NULL DEFAULT 22,
  ADD COLUMN IF NOT EXISTS datum_eerste_toelating date;

COMMENT ON COLUMN public.voertuigen.bijtelling_percentage IS 'Bijtellingspercentage (NL): 22 standaard, 16 voor EV tot 2025, etc.';
COMMENT ON COLUMN public.voertuigen.datum_eerste_toelating IS 'Datum eerste toelating, bepaalt bijtelling-regime';

-- 2) Ritten: privé/zakelijk classificatie + km-tellers
ALTER TABLE public.ritten
  ADD COLUMN IF NOT EXISTS rit_categorie text NOT NULL DEFAULT 'zakelijk',
  ADD COLUMN IF NOT EXISTS begin_km numeric,
  ADD COLUMN IF NOT EXISTS eind_km numeric,
  ADD COLUMN IF NOT EXISTS doel text;

-- Validatie via trigger (geen CHECK constraint vanwege flex)
CREATE OR REPLACE FUNCTION public.valideer_rit_categorie()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.rit_categorie NOT IN ('zakelijk','prive','woon_werk') THEN
    RAISE EXCEPTION 'rit_categorie moet zakelijk, prive of woon_werk zijn';
  END IF;
  -- Auto afstand uit km-tellers
  IF NEW.begin_km IS NOT NULL AND NEW.eind_km IS NOT NULL AND NEW.eind_km >= NEW.begin_km THEN
    NEW.afstand_km := NEW.eind_km - NEW.begin_km;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_valideer_rit_categorie ON public.ritten;
CREATE TRIGGER trg_valideer_rit_categorie
BEFORE INSERT OR UPDATE ON public.ritten
FOR EACH ROW EXECUTE FUNCTION public.valideer_rit_categorie();

CREATE INDEX IF NOT EXISTS idx_ritten_categorie ON public.ritten(rit_categorie);
CREATE INDEX IF NOT EXISTS idx_ritten_voertuig_datum ON public.ritten(voertuig_id, datum);

-- 3) Bijtelling overzicht functie: per voertuig per jaar
CREATE OR REPLACE FUNCTION public.bijtelling_overzicht(_jaar int)
RETURNS TABLE (
  voertuig_id uuid,
  kenteken text,
  merk text,
  model text,
  cataloguswaarde numeric,
  bijtelling_percentage numeric,
  jaarlijkse_bijtelling numeric,
  maandelijkse_bijtelling numeric,
  prive_km numeric,
  zakelijk_km numeric,
  woon_werk_km numeric,
  totaal_km numeric,
  bijtelling_verplicht boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    v.id,
    v.kenteken,
    v.merk,
    v.model,
    COALESCE(v.catalogusprijs, 0) AS cataloguswaarde,
    v.bijtelling_percentage,
    ROUND(COALESCE(v.catalogusprijs,0) * v.bijtelling_percentage / 100, 2) AS jaarlijkse_bijtelling,
    ROUND(COALESCE(v.catalogusprijs,0) * v.bijtelling_percentage / 100 / 12, 2) AS maandelijkse_bijtelling,
    COALESCE(SUM(r.afstand_km) FILTER (WHERE r.rit_categorie = 'prive'), 0) AS prive_km,
    COALESCE(SUM(r.afstand_km) FILTER (WHERE r.rit_categorie = 'zakelijk'), 0) AS zakelijk_km,
    COALESCE(SUM(r.afstand_km) FILTER (WHERE r.rit_categorie = 'woon_werk'), 0) AS woon_werk_km,
    COALESCE(SUM(r.afstand_km), 0) AS totaal_km,
    COALESCE(SUM(r.afstand_km) FILTER (WHERE r.rit_categorie = 'prive'), 0) > 500 AS bijtelling_verplicht
  FROM public.voertuigen v
  LEFT JOIN public.ritten r
    ON r.voertuig_id = v.id
    AND EXTRACT(YEAR FROM r.datum) = _jaar
    AND r.organisatie_id = v.organisatie_id
  WHERE v.organisatie_id = get_user_organisatie_id(auth.uid())
  GROUP BY v.id, v.kenteken, v.merk, v.model, v.catalogusprijs, v.bijtelling_percentage
  ORDER BY v.kenteken;
$$;
