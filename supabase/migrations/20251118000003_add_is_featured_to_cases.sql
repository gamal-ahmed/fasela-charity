-- Add is_featured column to cases table
-- This field allows admins to mark cases to be displayed in the featured section on the home page
ALTER TABLE public.cases 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

-- Create index for better query performance when filtering featured cases
CREATE INDEX IF NOT EXISTS idx_cases_is_featured ON public.cases(is_featured) WHERE is_featured = true;

COMMENT ON COLUMN public.cases.is_featured IS 'Whether this case should be displayed in the featured cases section on the home page';

