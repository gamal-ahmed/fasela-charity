-- Fix accept_invitation function with proper search_path
CREATE OR REPLACE FUNCTION public.accept_invitation(token text)
RETURNS TABLE(invitation_id uuid, organization_id uuid, role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation_id uuid;
  v_organization_id uuid;
  v_role app_role;
  v_expires_at timestamp with time zone;
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Select invitation data into individual variables to avoid ambiguity
  SELECT 
    oi.id,
    oi.organization_id,
    oi.role,
    oi.expires_at
  INTO 
    v_invitation_id,
    v_organization_id,
    v_role,
    v_expires_at
  FROM public.org_invitations oi
  WHERE oi.token = accept_invitation.token::uuid
    AND oi.status = 'pending' 
  LIMIT 1;
  
  IF v_invitation_id IS NULL THEN
    RAISE EXCEPTION 'Invitation not found or already used';
  END IF;

  IF v_expires_at IS NOT NULL AND v_expires_at < now() THEN
    RAISE EXCEPTION 'Invitation expired';
  END IF;

  -- Insert into user_roles idempotently
  INSERT INTO public.user_roles (user_id, organization_id, role, created_at)
  VALUES (uid, v_organization_id, v_role, now())
  ON CONFLICT (user_id, organization_id, role) DO NOTHING;

  -- Mark invitation accepted
  UPDATE public.org_invitations SET status = 'accepted' WHERE id = v_invitation_id;

  -- Return the result (cast app_role to text for return type compatibility)
  RETURN QUERY SELECT v_invitation_id, v_organization_id, v_role::text;
END;
$$;