import { useQuery } from "@tanstack/react-query";
import { Users, FileText, Loader2 } from "lucide-react";
import { useOrgQueryOptions } from "@/hooks/useOrgQuery";
import { supabase } from "@/integrations/supabase/client";

export function AdminStatsSummary() {
    const { orgId, enabled } = useOrgQueryOptions();
    const { data: stats, isLoading } = useQuery({
        queryKey: ["admin-header-stats", orgId],
        queryFn: async () => {
            const casesQuery = supabase
                .from("cases")
                .select("*", { count: "exact", head: true })
                .eq("status", "active")
                .eq("is_published", true);
            if (orgId) casesQuery.eq("organization_id", orgId);

            const kidsQuery = supabase
                .from("case_kids")
                .select("*", { count: "exact", head: true });
            if (orgId) kidsQuery.eq("organization_id", orgId);

            const [activeCasesResponse, totalKidsResponse] = await Promise.all([
                casesQuery as any,
                kidsQuery as any,
            ]);

            return {
                activeCases: activeCasesResponse.count || 0,
                totalKids: totalKidsResponse.count || 0,
            };
        },
        enabled,
    });

    if (isLoading) return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;

    return (
        <div className="flex items-center gap-4 text-sm text-muted-foreground mr-auto">
            <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>الأطفال: {stats?.totalKids}</span>
            </div>
            <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span>الحالات النشطة: {stats?.activeCases}</span>
            </div>
        </div>
    );
}
