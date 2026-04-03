
CREATE TABLE public.overdrachten (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  voertuig_id TEXT NOT NULL,
  voertuig_kenteken TEXT NOT NULL,
  voertuig_naam TEXT NOT NULL,
  klant_naam TEXT NOT NULL,
  klant_email TEXT,
  type TEXT NOT NULL DEFAULT 'ophalen',
  datum DATE NOT NULL DEFAULT CURRENT_DATE,
  handtekening TEXT,
  opmerkingen TEXT,
  kilometerstand INTEGER,
  status TEXT NOT NULL DEFAULT 'wacht_op_handtekening',
  ondertekend_op TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.overdrachten ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own overdrachten" ON public.overdrachten FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own overdrachten" ON public.overdrachten FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own overdrachten" ON public.overdrachten FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own overdrachten" ON public.overdrachten FOR DELETE TO authenticated USING (auth.uid() = user_id);
