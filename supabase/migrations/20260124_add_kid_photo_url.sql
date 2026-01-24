-- Add photo_url field to case_kids table
ALTER TABLE public.case_kids ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Add comment to the column
COMMENT ON COLUMN public.case_kids.photo_url IS 'URL to the kid profile photo stored in Supabase storage';
