-- Create case_followups table
CREATE TABLE public.case_followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  followup_date TIMESTAMP WITH TIME ZONE NOT NULL,
  followup_type TEXT NOT NULL CHECK (followup_type IN ('visit', 'call', 'meeting', 'other')),
  notes TEXT NOT NULL,
  next_action TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create case_tasks table
CREATE TABLE public.case_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  followup_id UUID REFERENCES public.case_followups(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL CHECK (task_type IN ('admin_action', 'case_action', 'both')),
  assigned_to TEXT NOT NULL CHECK (assigned_to IN ('admin', 'case', 'both')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  completion_notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_case_followups_case_id ON public.case_followups(case_id);
CREATE INDEX idx_case_followups_followup_date ON public.case_followups(followup_date DESC);
CREATE INDEX idx_case_tasks_case_id ON public.case_tasks(case_id);
CREATE INDEX idx_case_tasks_status ON public.case_tasks(status);
CREATE INDEX idx_case_tasks_priority ON public.case_tasks(priority);
CREATE INDEX idx_case_tasks_assigned_to ON public.case_tasks(assigned_to);
CREATE INDEX idx_case_tasks_due_date ON public.case_tasks(due_date);

-- Enable RLS
ALTER TABLE public.case_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for case_followups
CREATE POLICY "Admins can view all followups"
  ON public.case_followups
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert followups"
  ON public.case_followups
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update followups"
  ON public.case_followups
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete followups"
  ON public.case_followups
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for case_tasks
CREATE POLICY "Admins can view all tasks"
  ON public.case_tasks
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert tasks"
  ON public.case_tasks
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update tasks"
  ON public.case_tasks
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete tasks"
  ON public.case_tasks
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_case_followups_updated_at
  BEFORE UPDATE ON public.case_followups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_case_tasks_updated_at
  BEFORE UPDATE ON public.case_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();