-- Phase 0: Schema Finalization & Data Migration
-- This migration finalizes the multi-tenancy schema

-- ============================================
-- 0.1 & 0.2: Verify backfill and add NOT NULL constraints
-- ============================================

-- First, ensure all records have organization_id set (backfill any stragglers)
DO $$
DECLARE
    default_org_id UUID;
BEGIN
    SELECT id INTO default_org_id FROM public.organizations WHERE slug = 'yateem-care' LIMIT 1;

    IF default_org_id IS NULL THEN
        RAISE EXCEPTION 'Default organization not found. Please ensure organizations table has yateem-care org.';
    END IF;

    -- Backfill any remaining NULL organization_ids
    UPDATE public.cases SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.case_kids SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.donations SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.monthly_reports SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.followup_actions SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.donation_handovers SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.case_charities SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.case_private_spending SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.case_confidential_info SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.charities SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.user_roles SET organization_id = default_org_id WHERE organization_id IS NULL;
END $$;

-- Add NOT NULL constraints (only if column exists and all values are non-null)
DO $$
BEGIN
    -- cases
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'organization_id' AND table_schema = 'public') THEN
        ALTER TABLE public.cases ALTER COLUMN organization_id SET NOT NULL;
    END IF;

    -- case_kids
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'case_kids' AND column_name = 'organization_id' AND table_schema = 'public') THEN
        ALTER TABLE public.case_kids ALTER COLUMN organization_id SET NOT NULL;
    END IF;

    -- donations
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'donations' AND column_name = 'organization_id' AND table_schema = 'public') THEN
        ALTER TABLE public.donations ALTER COLUMN organization_id SET NOT NULL;
    END IF;

    -- monthly_reports
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'monthly_reports' AND column_name = 'organization_id' AND table_schema = 'public') THEN
        ALTER TABLE public.monthly_reports ALTER COLUMN organization_id SET NOT NULL;
    END IF;

    -- followup_actions
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'followup_actions' AND column_name = 'organization_id' AND table_schema = 'public') THEN
        ALTER TABLE public.followup_actions ALTER COLUMN organization_id SET NOT NULL;
    END IF;

    -- donation_handovers
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'donation_handovers' AND column_name = 'organization_id' AND table_schema = 'public') THEN
        ALTER TABLE public.donation_handovers ALTER COLUMN organization_id SET NOT NULL;
    END IF;

    -- case_charities
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'case_charities' AND column_name = 'organization_id' AND table_schema = 'public') THEN
        ALTER TABLE public.case_charities ALTER COLUMN organization_id SET NOT NULL;
    END IF;

    -- case_private_spending
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'case_private_spending' AND column_name = 'organization_id' AND table_schema = 'public') THEN
        ALTER TABLE public.case_private_spending ALTER COLUMN organization_id SET NOT NULL;
    END IF;

    -- case_confidential_info
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'case_confidential_info' AND column_name = 'organization_id' AND table_schema = 'public') THEN
        ALTER TABLE public.case_confidential_info ALTER COLUMN organization_id SET NOT NULL;
    END IF;

    -- charities
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'charities' AND column_name = 'organization_id' AND table_schema = 'public') THEN
        ALTER TABLE public.charities ALTER COLUMN organization_id SET NOT NULL;
    END IF;

    -- user_roles
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_roles' AND column_name = 'organization_id' AND table_schema = 'public') THEN
        ALTER TABLE public.user_roles ALTER COLUMN organization_id SET NOT NULL;
    END IF;
END $$;

-- ============================================
-- 0.3: Update user_roles unique constraint
-- ============================================

-- Drop old unique constraint if it exists (user_id, role)
DO $$
BEGIN
    -- Try to drop the old constraint - may have different names
    ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;
    ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_key;
EXCEPTION WHEN OTHERS THEN
    -- Ignore if constraint doesn't exist
    NULL;
END $$;

-- Create new unique constraint (user_id, organization_id, role)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'user_roles_user_org_role_unique'
        AND conrelid = 'public.user_roles'::regclass
    ) THEN
        ALTER TABLE public.user_roles
        ADD CONSTRAINT user_roles_user_org_role_unique
        UNIQUE (user_id, organization_id, role);
    END IF;
END $$;

-- Create index for organization_id lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_organization_id ON public.user_roles(organization_id);

-- ============================================
-- 0.4: Add is_super_admin boolean to user_roles
-- ============================================

ALTER TABLE public.user_roles
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE NOT NULL;

-- ============================================
-- 0.5: Designate initial super admin(s)
-- This marks existing admins as super admins for backward compatibility
-- ============================================

UPDATE public.user_roles
SET is_super_admin = TRUE
WHERE role = 'admin' AND is_super_admin = FALSE;

-- ============================================
-- 0.6: Create org_invitations table
-- ============================================

CREATE TABLE IF NOT EXISTS public.org_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role public.app_role DEFAULT 'volunteer' NOT NULL,
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')),
    token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days') NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_org_invitations_email ON public.org_invitations(email);
CREATE INDEX IF NOT EXISTS idx_org_invitations_token ON public.org_invitations(token);
CREATE INDEX IF NOT EXISTS idx_org_invitations_organization_id ON public.org_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_invitations_status ON public.org_invitations(status);

-- Enable RLS
ALTER TABLE public.org_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for org_invitations
-- Org admins can view invitations for their organization
CREATE POLICY "Org admins can view their org invitations" ON public.org_invitations
    FOR SELECT
    USING (
        organization_id IN (
            SELECT ur.organization_id FROM public.user_roles ur
            WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
        )
        OR EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid() AND ur.is_super_admin = TRUE
        )
    );

-- Org admins can create invitations for their organization
CREATE POLICY "Org admins can create invitations" ON public.org_invitations
    FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT ur.organization_id FROM public.user_roles ur
            WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
        )
        OR EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid() AND ur.is_super_admin = TRUE
        )
    );

-- Org admins can update invitations for their organization (cancel, etc.)
CREATE POLICY "Org admins can update their org invitations" ON public.org_invitations
    FOR UPDATE
    USING (
        organization_id IN (
            SELECT ur.organization_id FROM public.user_roles ur
            WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
        )
        OR EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid() AND ur.is_super_admin = TRUE
        )
    );

-- Allow anyone to read invitation by token (for acceptance flow)
CREATE POLICY "Anyone can read invitation by token" ON public.org_invitations
    FOR SELECT
    USING (TRUE);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.org_invitations TO authenticated;
GRANT SELECT ON public.org_invitations TO anon;

-- ============================================
-- 0.7: Add settings JSONB to organizations
-- ============================================

ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}' NOT NULL;

-- ============================================
-- 0.8: Add is_active boolean for soft delete
-- ============================================

ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE NOT NULL;

-- Create index for active organizations
CREATE INDEX IF NOT EXISTS idx_organizations_is_active ON public.organizations(is_active);

-- ============================================
-- Helper function: Check if user is super admin
-- ============================================

CREATE OR REPLACE FUNCTION public.is_super_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = check_user_id AND is_super_admin = TRUE
    );
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.is_super_admin(UUID) TO authenticated;

-- ============================================
-- Helper function: Get user's organizations
-- ============================================

CREATE OR REPLACE FUNCTION public.get_user_organizations(check_user_id UUID DEFAULT auth.uid())
RETURNS TABLE (
    organization_id UUID,
    organization_name TEXT,
    organization_slug TEXT,
    organization_logo_url TEXT,
    user_role public.app_role,
    is_super_admin BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT
        o.id AS organization_id,
        o.name AS organization_name,
        o.slug AS organization_slug,
        o.logo_url AS organization_logo_url,
        ur.role AS user_role,
        ur.is_super_admin
    FROM public.user_roles ur
    JOIN public.organizations o ON o.id = ur.organization_id
    WHERE ur.user_id = check_user_id AND o.is_active = TRUE
    ORDER BY o.name;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_organizations(UUID) TO authenticated;

-- ============================================
-- Update trigger for org_invitations
-- ============================================

CREATE OR REPLACE FUNCTION public.update_org_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_org_invitations_updated_at
    BEFORE UPDATE ON public.org_invitations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_org_invitations_updated_at();
