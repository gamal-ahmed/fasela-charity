-- Fix RLS policy for donations to allow admins to update donations
DROP POLICY IF EXISTS "Admins can update all donations" ON public.donations;
CREATE POLICY "Admins can update all donations" 
ON public.donations 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
);

-- Also ensure admins can view donations with the cases information
DROP POLICY IF EXISTS "Admins can view all donations" ON public.donations;
CREATE POLICY "Admins can view all donations" 
ON public.donations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
);