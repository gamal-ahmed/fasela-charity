-- Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone for now (so login/signup works)
-- We'll restrict this later if needed
CREATE POLICY "Organizations are viewable by everyone" ON public.organizations
    FOR SELECT USING (true);

-- Seed default organization
INSERT INTO public.organizations (name, slug)
VALUES ('Yateem Care Connect', 'yateem-care')
ON CONFLICT (slug) DO NOTHING;

-- Grant permissions
GRANT SELECT ON public.organizations TO authenticated;
GRANT SELECT ON public.organizations TO anon; -- Needed for login page maybe?
