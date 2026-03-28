
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS borg numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS boeteclausule text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS verlengbaar boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS verlengings_termijn text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ondertekend boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS ondertekend_op timestamp with time zone DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS klant_telefoon text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS klant_adres text DEFAULT NULL;
