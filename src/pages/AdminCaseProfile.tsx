import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  User,
  MapPin,
  Heart,
  DollarSign,
  Calendar,
  Users,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import FollowupActionForm from "@/components/admin/FollowupActionForm";
import FollowupActionsList from "@/components/admin/FollowupActionsList";
import AdminHeader from "@/components/admin/AdminHeader";

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

  // ------ Fixed Financial Summary: match admin case list logic ------
  // We assume the correct numbers are:
  // - إجمالي التبرعات: sum of amount of all "confirmed" donations for this case (that are not deleted/ignored)
  // - المسلم: sum of total_handed_over of all "confirmed" donations for this case (not handover table! just direct field on confirmed donations)
  // - المتبقي: إجمالي التبرعات - المسلم
  // - عدد التبرعات: count of all "confirmed" donations
  // No longer add/consider donation_handovers table in these numbers

  const { data: financialSummary } = useQuery({
    queryKey: ["case-financial-summary-SIMPLE", id],
    queryFn: async () => {
      // Fetch all confirmed donations for this case
      const { data: donations, error } = await supabase
        .from("donations")
        .select("amount, total_handed_over, status")
        .eq("case_id", id)
        .eq("status", "confirmed");

      if (error) throw error;

      const totalDonations = (donations ?? []).reduce(
        (sum, d) => sum + Number(d.amount || 0),
        0
      );
      const totalHandedOver = (donations ?? []).reduce(
        (sum, d) => sum + Number(d.total_handed_over || 0),
        0
      );
      const remaining = totalDonations - totalHandedOver;
      const donationsCount = donations?.length ?? 0;
      return {
        totalDonations,
        totalHandedOver,
        remaining,
        donationsCount,
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
    <AdminHeader 
      title={caseData.title_ar || caseData.title} 
      showBackButton 
      backTo="/admin/cases"
      backLabel="العودة للحالات"
    >
      <div className="mb-6">
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
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
        
        <div className="flex gap-2">
          <Badge variant={caseData.is_published ? "default" : "secondary"}>
            {caseData.is_published ? "منشورة" : "غير منشورة"}
          </Badge>
          <Badge variant={caseData.status === "active" ? "default" : "outline"}>
            {caseData.status === "active" ? "نشطة" : "غير نشطة"}
          </Badge>
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
                {financialSummary?.totalDonations
                  ? financialSummary.totalDonations.toLocaleString()
                  : 0}
                {" "}
                ج.م
              </div>
              <p className="text-xs text-muted-foreground">
                من {financialSummary?.donationsCount ?? 0} تبرع
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
                {financialSummary?.totalHandedOver
                  ? financialSummary.totalHandedOver.toLocaleString()
                  : 0}
                {" "}
                ج.م
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
                {financialSummary?.remaining
                  ? financialSummary.remaining.toLocaleString()
                  : 0}
                {" "}
                ج.م
              </div>
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
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            {/* Case Description Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  وصف الحالة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                    {caseData.description_ar || caseData.description || "لا يوجد وصف"}
                  </p>
                </div>
                {caseData.short_description_ar && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground mb-2">الوصف المختصر:</p>
                    <p className="text-muted-foreground">
                      {caseData.short_description_ar}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Case Details Card */}
            <Card>
              <CardHeader>
                <CardTitle>معلومات الحالة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                  <div>
                    <p className="text-sm text-muted-foreground">عمر الوالد/ة</p>
                    <p className="font-medium">{caseData.parent_age ? `${caseData.parent_age} سنة` : "غير محدد"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">عدد الأبناء</p>
                    <p className="font-medium">{caseData.kids_number || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">قيمة الإيجار</p>
                    <p className="font-medium">{caseData.rent_amount ? `${caseData.rent_amount.toLocaleString()} ج.م` : "غير محدد"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">هاتف التواصل</p>
                    <p className="font-medium" dir="ltr">{caseData.contact_phone || "غير محدد"}</p>
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
              <CardHeader>
                <CardTitle>متابعات الحالة</CardTitle>
              </CardHeader>
              <CardContent>
                <FollowupActionsList 
                  caseId={id!} 
                  onCreateNew={() => {
                    console.log("AdminCaseProfile: onCreateNew called, setting followupFormOpen to true");
                    setFollowupFormOpen(true);
                  }} 
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      <FollowupActionForm
        caseId={id!}
        open={followupFormOpen}
        onOpenChange={setFollowupFormOpen}
      />
    </AdminHeader>
  );
}
