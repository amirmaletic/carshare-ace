
-- Add KVK fields to contracts table
ALTER TABLE public.contracts ADD COLUMN kvk_nummer text;
ALTER TABLE public.contracts ADD COLUMN bedrijf_adres text;

-- Create kilometer_registraties table
CREATE TABLE public.kilometer_registraties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  datum date NOT NULL,
  kilometerstand integer NOT NULL,
  notitie text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.kilometer_registraties ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own km registraties"
ON public.kilometer_registraties FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own km registraties"
ON public.kilometer_registraties FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own km registraties"
ON public.kilometer_registraties FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own km registraties"
ON public.kilometer_registraties FOR DELETE
USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_km_registraties_contract ON public.kilometer_registraties(contract_id);
CREATE INDEX idx_km_registraties_datum ON public.kilometer_registraties(contract_id, datum);
