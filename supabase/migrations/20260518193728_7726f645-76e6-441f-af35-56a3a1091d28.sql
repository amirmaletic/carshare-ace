ALTER TABLE public.organisaties
ADD COLUMN IF NOT EXISTS onboarding_steps_completed jsonb NOT NULL DEFAULT '{}'::jsonb;