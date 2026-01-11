import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  settings: Record<string, unknown>;
  is_active: boolean;
}

export interface UserOrganization extends Organization {
  role: "admin" | "volunteer" | "user";
  is_super_admin: boolean;
}

interface OrganizationContextType {
  currentOrg: Organization | null;
  userOrgs: UserOrganization[];
  isLoading: boolean;
  isSuperAdmin: boolean;
  showSelectionModal: boolean;
  setShowSelectionModal: (show: boolean) => void;
  setCurrentOrg: (org: Organization) => void;
  refreshOrganizations: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

const STORAGE_KEY = "selectedOrgId";

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [currentOrg, setCurrentOrgState] = useState<Organization | null>(null);
  const [userOrgs, setUserOrgs] = useState<UserOrganization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [showSelectionModal, setShowSelectionModal] = useState(false);

  const fetchUserOrganizations = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        setUserOrgs([]);
        setCurrentOrgState(null);
        setIsSuperAdmin(false);
        setIsLoading(false);
        return;
      }

      // Use the database function to get user organizations
      const { data, error } = await (supabase.rpc as any)('get_user_organizations', { check_user_id: session.user.id });

      if (error) {
        console.error("Error fetching user organizations:", error);
        setIsLoading(false);
        return;
      }

      const orgs: UserOrganization[] = ((data as any) || []).map((row: {
        organization_id: string;
        organization_name: string;
        organization_slug: string;
        organization_logo_url: string | null;
        user_role: "admin" | "volunteer" | "user";
        is_super_admin: boolean;
      }) => ({
        id: row.organization_id,
        name: row.organization_name,
        slug: row.organization_slug,
        logo_url: row.organization_logo_url,
        settings: {},
        is_active: true,
        role: row.user_role,
        is_super_admin: row.is_super_admin,
      }));

      setUserOrgs(orgs);
      setIsSuperAdmin(orgs.some(org => org.is_super_admin));

      // Try to restore previously selected org from localStorage
      const savedOrgId = localStorage.getItem(STORAGE_KEY);
      const savedOrg = savedOrgId ? orgs.find(o => o.id === savedOrgId) : null;

      if (savedOrg) {
        setCurrentOrgState(savedOrg);
      } else if (orgs.length === 1) {
        // Auto-select for single org
        setCurrentOrgState(orgs[0]);
        localStorage.setItem(STORAGE_KEY, orgs[0].id);
      } else if (orgs.length > 1) {
        // Show selection modal for multi-org
        setShowSelectionModal(true);
      }

      setIsLoading(false);
    } catch (err) {
      console.error("Error in fetchUserOrganizations:", err);
      setIsLoading(false);
    }
  }, []);

  const setCurrentOrg = useCallback((org: Organization) => {
    setCurrentOrgState(org);
    localStorage.setItem(STORAGE_KEY, org.id);
    setShowSelectionModal(false);
  }, []);

  const refreshOrganizations = useCallback(async () => {
    setIsLoading(true);
    await fetchUserOrganizations();
  }, [fetchUserOrganizations]);

  useEffect(() => {
    fetchUserOrganizations();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchUserOrganizations();
      } else {
        setUserOrgs([]);
        setCurrentOrgState(null);
        setIsSuperAdmin(false);
        setShowSelectionModal(false);
        localStorage.removeItem(STORAGE_KEY);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserOrganizations]);

  return (
    <OrganizationContext.Provider
      value={{
        currentOrg,
        userOrgs,
        isLoading,
        isSuperAdmin,
        showSelectionModal,
        setShowSelectionModal,
        setCurrentOrg,
        refreshOrganizations,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error("useOrganization must be used within an OrganizationProvider");
  }
  return context;
}
