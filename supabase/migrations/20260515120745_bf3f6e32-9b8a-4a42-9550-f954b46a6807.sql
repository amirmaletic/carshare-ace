REVOKE ALL ON FUNCTION public.klant_meld_schade(uuid, text, text, text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.klant_meld_schade(uuid, text, text, text[]) TO authenticated;