import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  User,
  MapPin,
  Heart,
  DollarSign,
  Calendar,
  Users,
  FileText,
  ClipboardList,
  Plus,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import CaseFollowupForm from "@/components/admin/CaseFollowupForm";
import CaseFollowupsTimeline from "@/components/admin/CaseFollowupsTimeline";
import CaseTasksList from "@/components/admin/CaseTasksList";

export default function AdminCaseProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [followupFormOpen, setFollowupFormOpen] = useState(false);

  const { data: caseData, isLoading } = useQuery({
    queryKey: ["admin-case-profile", id],
    queryFn: async () => {
      // Fetch case data
      const { data: caseInfo, error: caseError } = await supabase
        .from("cases")
        .select("*")
        .eq("id", id)
        .single();

      if (caseError) throw caseError;

      // Fetch related data separately
      const [kidsData, needsData, donationsData] = await Promise.all([
        supabase.from("case_kids").select("*").eq("case_id", id),
        supabase.from("monthly_needs").select("*").eq("case_id", id),
        supabase
          .from("donations")
          .select(`
            id,
            amount,
            status,
            donation_type,
            months_pledged,
            created_at,
            total_handed_over,
            handover_status
          `)
          .eq("case_id", id),
      ]);

      return {
        ...caseInfo,
        case_kids: kidsData.data || [],
        monthly_needs: needsData.data || [],
        donations: donationsData.data || [],
      };
    },
    enabled: !!id,
  });

  const { data: financialSummary } = useQuery({
    queryKey: ["case-financial-summary", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donations")
        .select("amount, total_handed_over, status")
        .eq("case_id", id)
        .eq("status", "confirmed");

      if (error) throw error;

      const total = data.reduce((sum, d) => sum + Number(d.amount), 0);
      const handedOver = data.reduce((sum, d) => sum + Number(d.total_handed_over), 0);
      const remaining = total - handedOver;

      return {
        totalDonations: total,
        totalHandedOver: handedOver,
        remaining: remaining,
        donationsCount: data.length,
      };
    },
    enabled: !!id,
  });

  const { data: tasksSummary } = useQuery({
    queryKey: ["case-tasks-summary", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("case_tasks")
        .select("status, priority")
        .eq("case_id", id);

      if (error) throw error;

      return {
        total: data.length,
        pending: data.filter(t => t.status === "pending").length,
        inProgress: data.filter(t => t.status === "in_progress").length,
        completed: data.filter(t => t.status === "completed").length,
        urgent: data.filter(t => t.priority === "urgent" && t.status !== "completed").length,
      };
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل بيانات الحالة...</p>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">لم يتم العثور على الحالة</p>
          <Button onClick={() => navigate("/admin")}>العودة للوحة الإدارة</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/admin")}
            className="mb-4"
          >
            <ArrowLeft className="ml-2 h-4 w-4" />
            العودة للوحة الإدارة
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {caseData.title_ar || caseData.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  رقم الحالة: {caseData.payment_code}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {caseData.city} - {caseData.area}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  تاريخ الإضافة: {format(new Date(caseData.created_at), "dd MMM yyyy", { locale: ar })}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Badge variant={caseData.is_published ? "default" : "secondary"}>
                {caseData.is_published ? "منشورة" : "غير منشورة"}
              </Badge>
              <Badge variant={caseData.status === "active" ? "default" : "outline"}>
                {caseData.status === "active" ? "نشطة" : "غير نشطة"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                إجمالي التبرعات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {financialSummary?.totalDonations.toLocaleString()} ج.م
              </div>
              <p className="text-xs text-muted-foreground">
                من {financialSummary?.donationsCount} تبرع
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-green-600">
                <Heart className="h-4 w-4" />
                المسلم
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {financialSummary?.totalHandedOver.toLocaleString()} ج.م
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-orange-600">
                <DollarSign className="h-4 w-4" />
                المتبقي
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {financialSummary?.remaining.toLocaleString()} ج.م
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                المهام النشطة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(tasksSummary?.pending || 0) + (tasksSummary?.inProgress || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {tasksSummary?.urgent ? `${tasksSummary.urgent} عاجلة` : ""}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="profile">
              <User className="h-4 w-4 ml-2" />
              الملف الشخصي
            </TabsTrigger>
            <TabsTrigger value="kids">
              <Users className="h-4 w-4 ml-2" />
              الأبناء ({caseData.case_kids?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="followups">
              <FileText className="h-4 w-4 ml-2" />
              المتابعات
            </TabsTrigger>
            <TabsTrigger value="tasks">
              <ClipboardList className="h-4 w-4 ml-2" />
              المهام ({tasksSummary?.total || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>معلومات الحالة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="prose max-w-none">
                  <h3 className="text-xl font-semibold mb-4">الوصف</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {caseData.description_ar || caseData.description}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div>
                      <p className="text-sm text-muted-foreground">المستوى التعليمي</p>
                      <p className="font-medium">{caseData.education_level || "غير محدد"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">القدرة على العمل</p>
                      <p className="font-medium">{caseData.work_ability || "غير محدد"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">الحالة الصحية</p>
                      <p className="font-medium">{caseData.health_state || "غير محدد"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">التكلفة الشهرية</p>
                      <p className="font-medium text-lg">{caseData.monthly_cost.toLocaleString()} ج.م</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="kids" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>معلومات الأبناء</CardTitle>
              </CardHeader>
              <CardContent>
                {caseData.case_kids && Array.isArray(caseData.case_kids) && caseData.case_kids.length > 0 ? (
                  <div className="space-y-4">
                    {caseData.case_kids.map((kid: any) => (
                      <div key={kid.id} className="p-4 border rounded-lg">
                        <h4 className="font-semibold">{kid.name}</h4>
                        <p className="text-sm text-muted-foreground">العمر: {kid.age} سنة</p>
                        {kid.description && <p className="text-sm mt-2">{kid.description}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">لا توجد بيانات عن الأبناء</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="followups" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>سجل المتابعات</CardTitle>
                <Button onClick={() => setFollowupFormOpen(true)} size="sm">
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة متابعة
                </Button>
              </CardHeader>
              <CardContent>
                <CaseFollowupsTimeline caseId={id!} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>إدارة المهام</CardTitle>
              </CardHeader>
              <CardContent>
                <CaseTasksList caseId={id!} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <CaseFollowupForm
          caseId={id!}
          open={followupFormOpen}
          onOpenChange={setFollowupFormOpen}
        />
      </div>
    </div>
  );
}
