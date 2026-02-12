import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Calendar, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useOrgQueryOptions } from "@/hooks/useOrgQuery";

const ReportsList = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();
  const { orgId, enabled: orgReady } = useOrgQueryOptions();

  const { data: reports, refetch } = useQuery({
    queryKey: ["admin-reports", orgId],
    queryFn: async () => {
      // Get org's case IDs for scoping
      const casesQuery = supabase.from("cases").select("id");
      if (orgId) casesQuery.eq("organization_id", orgId);
      const { data: casesForOrg, error: casesError } = await casesQuery;
      if (casesError) throw casesError;
      const caseIds = (casesForOrg || []).map((c: any) => c.id);
      if (caseIds.length === 0) return [];

      const { data, error } = await supabase
        .from("monthly_reports")
        .select(`
          *,
          cases (
            title_ar,
            title
          )
        `)
        .in("case_id", caseIds)
        .order("report_date", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: orgReady,
  });

  const deleteReport = async (reportId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا التقرير؟")) {
      return;
    }

    setLoading(reportId);
    try {
      const { error } = await supabase
        .from("monthly_reports")
        .delete()
        .eq("id", reportId);

      if (error) throw error;

      toast({
        title: "تم الحذف",
        description: "تم حذف التقرير بنجاح",
      });

      refetch();
    } catch (error) {
      console.error("Error deleting report:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف التقرير",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      food: "طعام",
      housing: "سكن",
      general: "عام",
      education: "تعليم",
      health: "صحة"
    };
    return categories[category] || category;
  };

  const getStatusColor = (status: string) => {
    return status === "completed" ? "default" : "secondary";
  };

  if (!reports) {
    return <div className="text-center py-8">جار التحميل...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {reports.map((report) => (
          <Card key={report.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    {report.title}
                  </CardTitle>
                  <p className="text-muted-foreground mt-1">
                    الحالة: {(report.cases as any)?.title_ar || (report.cases as any)?.title}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusColor(report.status)}>
                    {report.status === "completed" ? "مكتمل" : "قيد التنفيذ"}
                  </Badge>
                  <Badge variant="outline">
                    {getCategoryLabel(report.category)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                {report.description && (
                  <p className="text-sm text-muted-foreground">
                    {report.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {new Date(report.report_date).toLocaleDateString('ar-SA', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                  
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => deleteReport(report.id)}
                    disabled={loading === report.id}
                  >
                    <Trash2 className="w-4 h-4 ml-1" />
                    حذف
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {reports.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">لا توجد تقارير بعد</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ReportsList;