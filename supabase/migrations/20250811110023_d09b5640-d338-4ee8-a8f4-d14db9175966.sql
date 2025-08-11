-- Create kids table to store children details for each case
CREATE TABLE public.case_kids (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.case_kids ENABLE ROW LEVEL SECURITY;

-- Create policies for kids data
CREATE POLICY "Allow public to view kids data" 
ON public.case_kids 
FOR SELECT 
USING (true);

CREATE POLICY "Allow authenticated users to manage kids data" 
ON public.case_kids 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_case_kids_updated_at
BEFORE UPDATE ON public.case_kids
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();