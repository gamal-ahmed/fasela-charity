import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, FileText, Loader2 } from "lucide-react";

export function AdminStatsSummary() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ["admin-header-stats"],
        queryFn: async () => {
            const [activeCasesResponse, totalKidsResponse] = await Promise.all([
                supabase
                    .from("cases")
                    .select("*", { count: "exact", head: true })
                    .eq("status", "active")
                    .eq("is_published", true),
                supabase
                    .from("case_kids")
                    .select("*", { count: "exact", head: true }),
            ]);

            return {
                activeCases: activeCasesResponse.count || 0,
                totalKids: totalKidsResponse.count || 0,
            };
        },
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
