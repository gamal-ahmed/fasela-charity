import { useState } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  ArrowLeft,
  Users,
  Calendar,
  FileText,
  Heart,
  Edit,
  Save,
  X,
  Info,
  Building2,
} from "lucide-react";
import FollowupActionForm from "@/components/admin/FollowupActionForm";
import FollowupActionsList from "@/components/admin/FollowupActionsList";
import CaseSpecificCalendar from "@/components/admin/CaseSpecificCalendar";
import { KidsInfo } from "@/components/KidsInfo";
import AdminHeader from "@/components/admin/AdminHeader";
import { useToast } from "@/hooks/use-toast";

export default function AdminCaseView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [followupFormOpen, setFollowupFormOpen] = useState(false);
  const [editCaseOpen, setEditCaseOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    title_ar: "",
    description: "",
    monthly_cost: 0,
    is_published: false,
    contact_phone: "",
  });

  const { data: caseData, isLoading } = useQuery({
    queryKey: ["admin-case-view", id],
    queryFn: async () => {
      // Fetch case data
      const { data: caseInfo, error: caseError } = await supabase
        .from("cases")
        .select("*, admin_profile_picture_url")
        .eq("id", id)
        .single();

      if (caseError) throw caseError;

      // Fetch all related data
      const [kidsData, donationsData, reportsData, followupsData, handoversData, charitiesData] = await Promise.all([
        supabase.from("case_kids").select("*").eq("case_id", id),
        supabase.from("donations").select("*").eq("case_id", id),
        supabase.from("monthly_reports").select("*").eq("case_id", id),
        supabase.from("followup_actions").select("*").eq("case_id", id),
        supabase.from("donation_handovers").select("*").eq("case_id", id),
        supabase
          .from("case_charities")
          .select(`
            *,
            charities (
              id,
              name,
              name_ar
            )
          `)
          .eq("case_id", id),
      ]);

      const confirmedDonations = donationsData.data?.filter(d => d.status === "confirmed") || [];
      const pendingDonations = donationsData.data?.filter(d => d.status === "pending") || [];
      const pendingFollowups = followupsData.data?.filter(f => f.status === "pending") || [];
      const completedFollowups = followupsData.data?.filter(f => f.status === "completed") || [];

      const caseCharities = (charitiesData.data || []).map((cc: any) => ({
        id: cc.id,
        charity_id: cc.charity_id,
        charity_name: cc.charities?.name || "",
        charity_name_ar: cc.charities?.name_ar || "",
        monthly_amount: Number(cc.monthly_amount) || 0,
      }));

      return {
        ...caseInfo,
        contact_phone: caseInfo.contact_phone || "", // Ensure it's defined
        case_kids: kidsData.data || [],
        case_charities: caseCharities,
        stats: {
          totalDonations: confirmedDonations.reduce((sum, d) => sum + Number(d.amount), 0),
          pendingDonations: pendingDonations.length,
          pendingDonationsAmount: pendingDonations.reduce((sum, d) => sum + Number(d.amount), 0),
          totalHandovers: handoversData.data?.reduce((sum, h) => sum + Number(h.handover_amount), 0) || 0,
          totalReports: reportsData.data?.length || 0,
          totalFollowups: followupsData.data?.length || 0,
          pendingFollowups: pendingFollowups.length,
          completedFollowups: completedFollowups.length,
          totalCharityMonthlyAmount: caseCharities.reduce((sum, cc) => sum + cc.monthly_amount, 0),
        }
      };
    },
    enabled: !!id,
  });

  const updateCaseMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      const { error } = await supabase
        .from("cases")
        .update(updatedData)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-case-view", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-cases-list"] });
      setEditCaseOpen(false);
      toast({
        title: "تم التحديث",
        description: "تم تحديث بيانات الحالة بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث بيانات الحالة",
        variant: "destructive",
      });
    },
  });

  const handleEditCase = () => {
    if (caseData) {
      setEditForm({
        title: caseData.title || "",
        title_ar: caseData.title_ar || "",
        description: caseData.description || "",
        monthly_cost: caseData.monthly_cost || 0,
        is_published: caseData.is_published || false,
        contact_phone: caseData.contact_phone || "",
      });
      setEditCaseOpen(true);
    }
  };

  const handleSaveCase = () => {
    updateCaseMutation.mutate(editForm);
  };

  if (isLoading) {
    return (
      <AdminHeader title="عرض الحالة" showBackButton backTo="/admin/cases" backLabel="العودة لقائمة الحالات">
        <div className="text-center py-8">جار التحميل...</div>
      </AdminHeader>
    );
  }

  if (!caseData) {
    return (
      <AdminHeader title="عرض الحالة" showBackButton backTo="/admin/cases" backLabel="العودة لقائمة الحالات">
        <div className="text-center py-8">
          <p className="text-muted-foreground">الحالة غير موجودة</p>
          <Button asChild className="mt-4">
            <Link to="/admin/cases">العودة لقائمة الحالات</Link>
          </Button>
        </div>
      </AdminHeader>
    );
  }

  // Check for pending followups for page highlighting
  const hasPendingFollowups = caseData?.stats?.pendingFollowups > 0;

  return (
    <AdminHeader title={`الحالة: ${caseData?.title_ar || caseData?.title}`} showBackButton backTo="/admin/cases" backLabel="العودة لقائمة الحالات">

      {hasPendingFollowups && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6" role="alert">
          <p className="font-bold">تنبيه</p>
          <p>توجد متابعات معلقة لهذه الحالة تتطلب اتخاذ إجراء.</p>
        </div>
      )}

      <div className={`space-y-6 ${hasPendingFollowups ? 'border-2 border-yellow-400 p-4 rounded-xl bg-yellow-50/30' : ''}`}>
        {/* Admin Profile Picture */}
        {caseData?.admin_profile_picture_url && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20 shadow-lg">
                  <img
                    src={caseData.admin_profile_picture_url}
                    alt={caseData.title_ar || caseData.title || "Case"}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">التبرعات المؤكدة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{caseData.stats.totalDonations.toLocaleString()} جنيه</div>
              <p className="text-xs text-muted-foreground mt-1">
                تم التسليم: {caseData.stats.totalHandovers.toLocaleString()} جنيه
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">التبرعات المعلقة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{caseData.stats.pendingDonations}</div>
              <p className="text-xs text-muted-foreground mt-1">
                المبلغ: {caseData.stats.pendingDonationsAmount.toLocaleString()} جنيه
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">المتابعات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{caseData.stats.totalFollowups}</div>
              <p className="text-xs text-muted-foreground mt-1">
                معلقة: {caseData.stats.pendingFollowups} | مكتملة: {caseData.stats.completedFollowups}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">التقارير</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{caseData.stats.totalReports}</div>
              <p className="text-xs text-muted-foreground mt-1">التقارير الشهرية</p>
            </CardContent>
          </Card>
        </div>

        {/* Charities Section */}
        {caseData.case_charities && caseData.case_charities.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Building2 className="h-6 w-6 text-primary" />
                <CardTitle>الجمعيات الخيرية الأخرى المسجلة فيها الحالة</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {caseData.case_charities.map((charity: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-lg">{charity.charity_name_ar}</p>
                          {charity.charity_name && charity.charity_name !== charity.charity_name_ar && (
                            <p className="text-sm text-muted-foreground">{charity.charity_name}</p>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">المبلغ الشهري:</span>
                          <span className="font-semibold text-primary">
                            {charity.monthly_amount.toLocaleString()} جنيه
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">إجمالي المبلغ الشهري من الجمعيات الخيرية:</span>
                    <span className="font-bold text-lg text-primary">
                      {caseData.stats.totalCharityMonthlyAmount.toLocaleString()} جنيه
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Case Description */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-primary" />
              <CardTitle>وصف الحالة</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                {caseData.description_ar || caseData.description || "لا يوجد وصف"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Case Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Info className="h-6 w-6 text-primary" />
                <CardTitle>معلومات الحالة</CardTitle>
              </div>
              <Button size="sm" onClick={handleEditCase}>
                <Edit className="h-4 w-4 ml-2" />
                تعديل
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">العنوان</p>
                <p className="font-medium">{caseData.title}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">العنوان بالعربية</p>
                <p className="font-medium">{caseData.title_ar}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">التكلفة الشهرية</p>
                <p className="font-medium">{caseData.monthly_cost} جنيه</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">رقم جوال الأم</p>
                <p className="font-medium">{caseData.contact_phone || "غير مسجل"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الحالة</p>
                <Badge variant={caseData.is_published ? "default" : "secondary"}>
                  {caseData.is_published ? "منشور" : "غير منشور"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue={searchParams.get("tab") || "followups"} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="followups" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            المتابعات
          </TabsTrigger>
          <TabsTrigger value="handovers" className="flex items-center gap-2">
            <Calendar className="w-4 w-4" />
            التقويم الشهري
          </TabsTrigger>
          <TabsTrigger value="kids" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            الأطفال
          </TabsTrigger>
        </TabsList>

        {/* Followups Tab */}
        {/* Followups Tab */}
        <TabsContent value="followups" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>متابعات الحالة</CardTitle>
            </CardHeader>
            <CardContent>
              <FollowupActionsList
                caseId={id!}
                onCreateNew={() => setFollowupFormOpen(true)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monthly Handovers Tab */}
        <TabsContent value="handovers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>التقويم الشهري للتسليمات</CardTitle>
            </CardHeader>
            <CardContent>
              <CaseSpecificCalendar
                caseId={id!}
                caseTitle={caseData.title || ""}
                caseTitleAr={caseData.title_ar || caseData.title || ""}
                monthlyCost={caseData.monthly_cost || 0}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Kids Tab */}
        <TabsContent value="kids" className="space-y-4">
          {caseData.case_kids && Array.isArray(caseData.case_kids) && caseData.case_kids.length > 0 ? (
            <KidsInfo kids={caseData.case_kids.map((kid: any) => ({
              id: kid.id,
              name: kid.name,
              age: kid.age,
              gender: kid.gender as 'male' | 'female',
              description: kid.description || "",
              hobbies: kid.hobbies || []
            }))} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>لا توجد بيانات عن الأبناء</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Follow-up Form Dialog */}
      < FollowupActionForm
        caseId={id!}
        open={followupFormOpen}
        onOpenChange={setFollowupFormOpen}
      />

      {/* Edit Case Dialog */}
      < Dialog open={editCaseOpen} onOpenChange={setEditCaseOpen} >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تعديل بيانات الحالة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title_ar">العنوان (عربي)</Label>
              <Input
                id="title_ar"
                value={editForm.title_ar}
                onChange={(e) => setEditForm(prev => ({ ...prev, title_ar: e.target.value }))}
                placeholder="أدخل العنوان بالعربية"
              />
            </div>
            <div>
              <Label htmlFor="title">العنوان (إنجليزي)</Label>
              <Input
                id="title"
                value={editForm.title}
                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="أدخل العنوان بالإنجليزية"
              />
            </div>
            <div>
              <Label htmlFor="contact_phone">رقم جوال الأم (للدخول)</Label>
              <Input
                id="contact_phone"
                value={editForm.contact_phone}
                onChange={(e) => setEditForm(prev => ({ ...prev, contact_phone: e.target.value }))}
                placeholder="05XXXXXXXX"
              />
            </div>
            <div>
              <Label htmlFor="description">الوصف</Label>
              <Textarea
                id="description"
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="أدخل وصف الحالة"
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="monthly_cost">التكلفة الشهرية</Label>
              <Input
                id="monthly_cost"
                type="number"
                value={editForm.monthly_cost}
                onChange={(e) => setEditForm(prev => ({ ...prev, monthly_cost: Number(e.target.value) }))}
                placeholder="أدخل التكلفة الشهرية"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_published"
                checked={editForm.is_published}
                onChange={(e) => setEditForm(prev => ({ ...prev, is_published: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="is_published">منشورة</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCaseOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSaveCase} disabled={updateCaseMutation.isPending}>
              {updateCaseMutation.isPending ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminHeader>
  );
}
