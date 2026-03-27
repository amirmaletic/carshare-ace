
-- Locaties table
CREATE TABLE public.locaties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  naam text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.locaties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own locaties" ON public.locaties FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own locaties" ON public.locaties FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own locaties" ON public.locaties FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own locaties" ON public.locaties FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Add locatie column to voertuigen
ALTER TABLE public.voertuigen ADD COLUMN locatie text DEFAULT NULL;
