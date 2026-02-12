import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgQueryOptions } from "@/hooks/useOrgQuery";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Clock, CheckCircle, XCircle, ArrowRight, Plus } from "lucide-react";
import FollowupActionForm from "./FollowupActionForm";
import { Progress } from "@/components/ui/progress";

export default function FollowupActionsDashboard() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { orgId, enabled: orgReady } = useOrgQueryOptions();

  const { data: actions, isLoading } = useQuery({
    queryKey: ["followup-actions-dashboard", orgId],
    queryFn: async () => {
      // Get org's case IDs for scoping
      const casesQuery = supabase.from("cases").select("id");
      if (orgId) casesQuery.eq("organization_id", orgId);
      const { data: casesData, error: casesError } = await casesQuery;
      if (casesError) throw casesError;
      const caseIds = (casesData || []).map((c: any) => c.id);
      if (caseIds.length === 0) return [];

      const { data, error } = await supabase
        .from("followup_actions" as any)
        .select(`
          *,
          cases (
            title,
            title_ar
          )
        `)
        .in("case_id", caseIds)
        .order("action_date", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as any[];
    },
    enabled: orgReady,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        جاري تحميل المتابعات...
      </div>
    );
  }

  const pendingActions = actions?.filter(action => action.status === 'pending') || [];
  const completedActions = actions?.filter(action => action.status === 'completed') || [];
  const cancelledActions = actions?.filter(action => action.status === 'cancelled') || [];
  const totalActions = actions?.length || 0;
  const progressPercentage = totalActions > 0 ? Math.round((completedActions.length / totalActions) * 100) : 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-green-500">مكتملة</Badge>;
      case "cancelled":
        return <Badge variant="destructive">ملغاة</Badge>;
      default:
        return <Badge variant="secondary">معلقة</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">المتابعات والإجراءات</h2>
          <p className="text-sm text-muted-foreground">إدارة متابعات الحالات والإجراءات المطلوبة</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            إضافة متابعة
          </Button>
          <Button variant="outline" asChild>
            <Link to="/admin/followups">
              <ArrowRight className="h-4 w-4 mr-2" />
              عرض الكل
            </Link>
          </Button>
        </div>
      </div>

      {/* Overall Progress Card */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">التقدم الإجمالي للمتابعات</h3>
            <span className="text-3xl font-bold text-blue-600">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-4" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div className="flex flex-col items-center p-3 bg-white rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500 mb-1" />
              <span className="text-2xl font-bold text-green-600">{completedActions.length}</span>
              <span className="text-muted-foreground text-xs">مكتملة</span>
            </div>
            <div className="flex flex-col items-center p-3 bg-white rounded-lg">
              <Clock className="h-5 w-5 text-yellow-500 mb-1" />
              <span className="text-2xl font-bold text-yellow-600">{pendingActions.length}</span>
              <span className="text-muted-foreground text-xs">معلقة</span>
            </div>
            <div className="flex flex-col items-center p-3 bg-white rounded-lg">
              <XCircle className="h-5 w-5 text-red-500 mb-1" />
              <span className="text-2xl font-bold text-red-600">{cancelledActions.length}</span>
              <span className="text-muted-foreground text-xs">ملغاة</span>
            </div>
            <div className="flex flex-col items-center p-3 bg-white rounded-lg">
              <Plus className="h-5 w-5 text-blue-500 mb-1" />
              <span className="text-2xl font-bold text-blue-600">{totalActions}</span>
              <span className="text-muted-foreground text-xs">الإجمالي</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              المتابعات المعلقة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {pendingActions.length}
            </div>
            <p className="text-xs text-muted-foreground">تحتاج إلى متابعة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              المتابعات المكتملة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {completedActions.length}
            </div>
            <p className="text-xs text-muted-foreground">تم إكمالها</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              المتابعات الملغاة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {cancelledActions.length}
            </div>
            <p className="text-xs text-muted-foreground">تم إلغاؤها</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Plus className="h-4 w-4 text-blue-500" />
              إجمالي المتابعات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {actions?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">جميع المتابعات</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Actions */}
      <Card>
        <CardHeader>
          <CardTitle>آخر المتابعات</CardTitle>
        </CardHeader>
        <CardContent>
          {actions && actions.length > 0 ? (
            <div className="space-y-3">
              {actions.slice(0, 5).map((action) => (
                <div key={action.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(action.status)}
                    <div>
                      <h4 className="font-medium">{action.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {action.cases?.title_ar || action.cases?.title}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(action.status)}
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/admin/case-profile/${action.case_id}`}>
                        عرض الحالة
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>لا توجد متابعات مسجلة</p>
              <Button onClick={() => setIsFormOpen(true)} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                إضافة متابعة جديدة
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>إجراءات سريعة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button asChild className="h-auto p-4 flex flex-col items-start">
              <Link to="/admin/followups">
                <ArrowRight className="h-5 w-5 mb-2" />
                <span className="font-medium">عرض جميع المتابعات</span>
                <span className="text-sm text-muted-foreground">إدارة جميع متابعات الحالات</span>
              </Link>
            </Button>
            <Button onClick={() => setIsFormOpen(true)} variant="outline" className="h-auto p-4 flex flex-col items-start">
              <Plus className="h-5 w-5 mb-2" />
              <span className="font-medium">إضافة متابعة جديدة</span>
              <span className="text-sm text-muted-foreground">إنشاء متابعة لحالة معينة</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <FollowupActionForm 
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
      />
    </div>
  );
}
