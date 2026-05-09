DELETE FROM public.voertuigen
WHERE organisatie_id = '5e36879c-8e5a-4c87-ada5-402ebd40f4c2'
  AND created_at > now() - interval '3 hours';