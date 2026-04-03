ALTER TABLE public.chauffeurs
ADD COLUMN heeft_trailer boolean NOT NULL DEFAULT false,
ADD COLUMN trailer_plekken integer NULL DEFAULT NULL;