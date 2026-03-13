
-- Terugmeldingen table for vehicle returns
CREATE TABLE public.terugmeldingen (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  voertuig_id TEXT NOT NULL,
  voertuig_kenteken TEXT NOT NULL,
  voertuig_naam TEXT NOT NULL,
  kilometerstand INTEGER NOT NULL,
  datum DATE NOT NULL DEFAULT CURRENT_DATE,
  bon_url TEXT,
  notitie TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.terugmeldingen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own terugmeldingen"
  ON public.terugmeldingen FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own terugmeldingen"
  ON public.terugmeldingen FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own terugmeldingen"
  ON public.terugmeldingen FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Storage bucket for receipts
INSERT INTO storage.buckets (id, name, public) 
VALUES ('bonnen', 'bonnen', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Auth users can upload bonnen"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'bonnen');

CREATE POLICY "Anyone can view bonnen"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'bonnen');
