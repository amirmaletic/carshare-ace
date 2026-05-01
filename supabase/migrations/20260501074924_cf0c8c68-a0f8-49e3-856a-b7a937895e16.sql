ALTER TABLE public.voertuigen
  ADD COLUMN IF NOT EXISTS catalogusprijs numeric,
  ADD COLUMN IF NOT EXISTS cilinderinhoud integer,
  ADD COLUMN IF NOT EXISTS co2_uitstoot integer,
  ADD COLUMN IF NOT EXISTS massa_ledig integer,
  ADD COLUMN IF NOT EXISTS eerste_toelating date,
  ADD COLUMN IF NOT EXISTS voertuigsoort text;