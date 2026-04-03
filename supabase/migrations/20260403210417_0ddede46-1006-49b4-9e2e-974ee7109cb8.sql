
CREATE TABLE public.chauffeur_beschikbaarheid (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chauffeur_id UUID NOT NULL REFERENCES public.chauffeurs(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'verlof',
  start_datum DATE NOT NULL,
  eind_datum DATE NOT NULL,
  notitie TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chauffeur_beschikbaarheid ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chauffeur_beschikbaarheid" ON public.chauffeur_beschikbaarheid FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own chauffeur_beschikbaarheid" ON public.chauffeur_beschikbaarheid FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own chauffeur_beschikbaarheid" ON public.chauffeur_beschikbaarheid FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own chauffeur_beschikbaarheid" ON public.chauffeur_beschikbaarheid FOR DELETE TO authenticated USING (auth.uid() = user_id);
