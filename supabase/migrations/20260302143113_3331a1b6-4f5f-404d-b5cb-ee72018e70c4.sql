
-- Enums
CREATE TYPE public.contract_type AS ENUM ('lease', 'verhuur', 'fietslease', 'ev-lease');
CREATE TYPE public.contract_status AS ENUM ('actief', 'verlopen', 'opgezegd', 'concept');
CREATE TYPE public.invoice_status AS ENUM ('betaald', 'openstaand', 'te_laat', 'herinnering_verstuurd');

-- Contracts table
CREATE TABLE public.contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contract_nummer TEXT NOT NULL UNIQUE,
  type contract_type NOT NULL,
  voertuig_id TEXT,
  klant_naam TEXT NOT NULL,
  klant_email TEXT NOT NULL,
  bedrijf TEXT,
  start_datum DATE NOT NULL,
  eind_datum DATE NOT NULL,
  maandprijs NUMERIC NOT NULL DEFAULT 0,
  status contract_status NOT NULL DEFAULT 'concept',
  km_per_jaar INTEGER,
  inclusief TEXT[] NOT NULL DEFAULT '{}',
  notities TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Invoices table
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  datum DATE NOT NULL,
  bedrag NUMERIC NOT NULL DEFAULT 0,
  status invoice_status NOT NULL DEFAULT 'openstaand',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Contracts RLS policies
CREATE POLICY "Users can view own contracts" ON public.contracts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own contracts" ON public.contracts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own contracts" ON public.contracts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own contracts" ON public.contracts FOR DELETE USING (auth.uid() = user_id);

-- Invoices RLS policies
CREATE POLICY "Users can view own invoices" ON public.invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own invoices" ON public.invoices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own invoices" ON public.invoices FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own invoices" ON public.invoices FOR DELETE USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_contracts_updated_at
BEFORE UPDATE ON public.contracts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
