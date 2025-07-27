-- Add updated_at column to cases table
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create trigger to update updated_at column automatically
CREATE OR REPLACE FUNCTION public.update_cases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path TO 'public', 'pg_temp';

-- Add trigger to cases table
DROP TRIGGER IF EXISTS update_cases_updated_at_trigger ON public.cases;
CREATE TRIGGER update_cases_updated_at_trigger
  BEFORE UPDATE ON public.cases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_cases_updated_at();