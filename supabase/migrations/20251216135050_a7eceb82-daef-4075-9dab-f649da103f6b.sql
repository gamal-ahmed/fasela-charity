-- Add donation configuration fields to cases table
ALTER TABLE public.cases
ADD COLUMN IF NOT EXISTS min_custom_donation numeric DEFAULT 1,
ADD COLUMN IF NOT EXISTS show_monthly_donation boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_custom_donation boolean DEFAULT true;

-- Add comments for documentation
COMMENT ON COLUMN public.cases.min_custom_donation IS 'Minimum amount for custom donations';
COMMENT ON COLUMN public.cases.show_monthly_donation IS 'Whether to show monthly donation tab';
COMMENT ON COLUMN public.cases.show_custom_donation IS 'Whether to show custom donation tab';