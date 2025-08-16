-- Add images field to cases table for storing multiple description images
ALTER TABLE public.cases 
ADD COLUMN description_images jsonb DEFAULT '[]'::jsonb;