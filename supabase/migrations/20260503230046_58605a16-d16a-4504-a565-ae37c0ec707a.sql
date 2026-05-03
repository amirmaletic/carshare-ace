ALTER TABLE public.terugmeldingen
  ADD COLUMN IF NOT EXISTS bon_bedrag numeric,
  ADD COLUMN IF NOT EXISTS bon_liters numeric,
  ADD COLUMN IF NOT EXISTS bon_brandstof text,
  ADD COLUMN IF NOT EXISTS bon_ai_data jsonb;