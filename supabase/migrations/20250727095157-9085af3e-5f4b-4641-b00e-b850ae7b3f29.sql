-- Add foreign key constraint between monthly_reports and cases
ALTER TABLE public.monthly_reports 
ADD CONSTRAINT fk_monthly_reports_case_id 
FOREIGN KEY (case_id) REFERENCES public.cases(id) ON DELETE CASCADE;