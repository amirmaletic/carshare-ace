-- Add image_url column to voertuigen
ALTER TABLE public.voertuigen ADD COLUMN image_url text;

-- Populate existing vehicles with Imagin Studio URLs based on merk/model
UPDATE public.voertuigen 
SET image_url = 'https://cdn.imagin.studio/getimage?customer=hrjavascript-masede&make=' || encode(convert_to(lower(merk), 'UTF8'), 'escape') || '&modelFamily=' || encode(convert_to(lower(split_part(model, ' ', 1)), 'UTF8'), 'escape') || '&paintId=pspc0040&angle=01'
WHERE image_url IS NULL;