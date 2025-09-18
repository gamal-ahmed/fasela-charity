-- Create handovers table to track partial and full handovers
CREATE TABLE public.donation_handovers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  donation_id UUID NOT NULL REFERENCES public.donations(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES public.cases(id),
  handover_amount NUMERIC NOT NULL CHECK (handover_amount > 0),
  handover_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  handover_notes TEXT,
  handed_over_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for handovers
ALTER TABLE public.donation_handovers ENABLE ROW LEVEL SECURITY;

-- Admins can manage all handovers
CREATE POLICY "Admins can manage handovers" 
ON public.donation_handovers 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_id = auth.uid() AND role = 'admin'::app_role
));

-- Public can view handovers for transparency
CREATE POLICY "Public can view handovers" 
ON public.donation_handovers 
FOR SELECT 
USING (true);

-- Add indexes for better performance
CREATE INDEX idx_donation_handovers_donation_id ON public.donation_handovers(donation_id);
CREATE INDEX idx_donation_handovers_case_id ON public.donation_handovers(case_id);
CREATE INDEX idx_donation_handovers_handover_date ON public.donation_handovers(handover_date);

-- Add trigger for updated_at
CREATE TRIGGER update_donation_handovers_updated_at
  BEFORE UPDATE ON public.donation_handovers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Add computed columns to donations to track handover status
ALTER TABLE public.donations 
ADD COLUMN total_handed_over NUMERIC DEFAULT 0,
ADD COLUMN handover_status TEXT DEFAULT 'none' CHECK (handover_status IN ('none', 'partial', 'full'));

-- Create function to update donation handover status
CREATE OR REPLACE FUNCTION public.update_donation_handover_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate total handed over for the donation
  UPDATE public.donations 
  SET 
    total_handed_over = COALESCE((
      SELECT SUM(handover_amount) 
      FROM public.donation_handovers 
      WHERE donation_id = COALESCE(NEW.donation_id, OLD.donation_id)
    ), 0),
    handover_status = CASE 
      WHEN COALESCE((
        SELECT SUM(handover_amount) 
        FROM public.donation_handovers 
        WHERE donation_id = COALESCE(NEW.donation_id, OLD.donation_id)
      ), 0) = 0 THEN 'none'
      WHEN COALESCE((
        SELECT SUM(handover_amount) 
        FROM public.donation_handovers 
        WHERE donation_id = COALESCE(NEW.donation_id, OLD.donation_id)
      ), 0) >= amount THEN 'full'
      ELSE 'partial'
    END
  WHERE id = COALESCE(NEW.donation_id, OLD.donation_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update handover status
CREATE TRIGGER update_handover_status_after_insert
  AFTER INSERT ON public.donation_handovers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_donation_handover_status();

CREATE TRIGGER update_handover_status_after_update
  AFTER UPDATE ON public.donation_handovers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_donation_handover_status();

CREATE TRIGGER update_handover_status_after_delete
  AFTER DELETE ON public.donation_handovers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_donation_handover_status();