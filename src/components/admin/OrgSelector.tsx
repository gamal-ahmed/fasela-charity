import { useOrganization, UserOrganization } from "@/contexts/OrganizationContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Building2, Check, ChevronDown } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export function OrgSelector() {
  const { currentOrg, userOrgs, setCurrentOrg, isLoading } = useOrganization();
  const queryClient = useQueryClient();

  const handleOrgChange = (org: UserOrganization) => {
    if (org.id !== currentOrg?.id) {
      setCurrentOrg(org);
      // Invalidate all queries to refresh data for new org
      queryClient.invalidateQueries();
    }
  };

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Building2 className="h-4 w-4 ml-2" />
        جار التحميل...
      </Button>
    );
  }

  // Single org - just display name without dropdown
  if (userOrgs.length <= 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 text-sm">
        {currentOrg?.logo_url ? (
          <img
            src={currentOrg.logo_url}
            alt={currentOrg.name}
            className="h-5 w-5 rounded object-cover"
          />
        ) : (
          <Building2 className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="font-medium">{currentOrg?.name || "لا توجد منظمة"}</span>
      </div>
    );
  }

  // Multiple orgs - show dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {currentOrg?.logo_url ? (
            <img
              src={currentOrg.logo_url}
              alt={currentOrg.name}
              className="h-4 w-4 rounded object-cover"
            />
          ) : (
            <Building2 className="h-4 w-4" />
          )}
          <span className="max-w-[150px] truncate">{currentOrg?.name}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[220px]">
        <DropdownMenuLabel>اختر المنظمة</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {userOrgs.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => handleOrgChange(org)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              {org.logo_url ? (
                <img
                  src={org.logo_url}
                  alt={org.name}
                  className="h-4 w-4 rounded object-cover"
                />
              ) : (
                <Building2 className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="truncate">{org.name}</span>
            </div>
            {org.id === currentOrg?.id && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
