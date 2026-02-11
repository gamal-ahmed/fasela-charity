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
  Wallet,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import FollowupActionForm from "@/components/admin/FollowupActionForm";
import FollowupActionsList from "@/components/admin/FollowupActionsList";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useOrganization } from "@/contexts/OrganizationContext";

// Donations Table Component
function DonationsTable({ caseId }: { caseId: string }) {
  const { data: donations, isLoading } = useQuery({
    queryKey: ["case-donations", caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donations")
        .select("*")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return <div className="text-center py-4">جاري التحميل...</div>;
  }

  if (!donations || donations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Wallet className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>لا توجد تبرعات لهذه الحالة</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-right">المبلغ</TableHead>
          <TableHead className="text-right">النوع</TableHead>
          <TableHead className="text-right">الحالة</TableHead>
          <TableHead className="text-right">المسلم</TableHead>
          <TableHead className="text-right">حالة التسليم</TableHead>
          <TableHead className="text-right">اسم المتبرع</TableHead>
          <TableHead className="text-right">التاريخ</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {donations.map((donation) => (
          <TableRow key={donation.id}>
            <TableCell className="font-medium">
              {Number(donation.amount).toLocaleString()} ج.م
            </TableCell>
            <TableCell>
              <Badge variant="outline">
                {donation.donation_type === "monthly" ? "شهري" : "لمرة واحدة"}
              </Badge>
              {donation.donation_type === "monthly" && donation.months_pledged > 1 && (
                <span className="text-xs text-muted-foreground mr-1">
                  ({donation.months_pledged} شهر)
                </span>
              )}
            </TableCell>
            <TableCell>
              <Badge
                variant={
                  donation.status === "confirmed"
                    ? "default"
                    : donation.status === "pending"
                    ? "secondary"
                    : "destructive"
                }
              >
                {donation.status === "confirmed"
                  ? "مؤكد"
                  : donation.status === "pending"
                  ? "معلق"
                  : "ملغي"}
              </Badge>
            </TableCell>
            <TableCell>
              {Number(donation.total_handed_over || 0).toLocaleString()} ج.م
            </TableCell>
            <TableCell>
              <Badge
                variant={
                  donation.handover_status === "full"
                    ? "default"
                    : donation.handover_status === "partial"
                    ? "secondary"
                    : "outline"
                }
                className={
                  donation.handover_status === "full"
                    ? "bg-green-600"
                    : donation.handover_status === "partial"
                    ? "bg-orange-500"
                    : ""
                }
              >
                {donation.handover_status === "full"
                  ? "مسلم بالكامل"
                  : donation.handover_status === "partial"
                  ? "مسلم جزئياً"
                  : "لم يسلم"}
              </Badge>
            </TableCell>
            <TableCell>{donation.donor_name || "غير معروف"}</TableCell>
            <TableCell className="text-muted-foreground">
              {format(new Date(donation.created_at), "dd/MM/yyyy", { locale: ar })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
import CaseSpecificCalendar from "@/components/admin/CaseSpecificCalendar";
import { KidsInfo } from "@/components/KidsInfo";
import AdminHeader from "@/components/admin/AdminHeader";
import { useToast } from "@/hooks/use-toast";

export default function AdminCaseView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentOrg, isSuperAdmin } = useOrganization();
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
      // Fetch the case unscoped first so we can determine its organization
      const { data: caseInfoUnscoped, error: caseInfoError } = await supabase
        .from("cases")
        .select("organization_id, *, admin_profile_picture_url")
        .eq("id", id)
        .maybeSingle();

      if (caseInfoError) throw caseInfoError;
      if (!caseInfoUnscoped) {
        throw new Error("Case not found");
      }

      // Authorization for non-super-admins:
      // - If currentOrg is set it must match the case's organization_id
      // - If currentOrg is not set, verify the user has an admin role on the case's organization
      if (!isSuperAdmin) {
        if (currentOrg?.id) {
          if (caseInfoUnscoped.organization_id !== currentOrg.id) {
            throw new Error("No organization selected or access denied");
          }
        } else {
          // No org selected in the UI: check user_roles for permission on this case's org
          const sessionRes = await supabase.auth.getSession();
          const userId = sessionRes?.data?.session?.user?.id;
          if (!userId) throw new Error("Not authenticated");

          const { data: roleRow, error: roleError } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", userId)
            .eq("organization_id", caseInfoUnscoped.organization_id)
            .eq("role", "admin")
            .maybeSingle();

          if (roleError) throw roleError;
          if (!roleRow) throw new Error("No organization selected");
        }
      }

      // Use the authorized case as the resolvedCase
      const resolvedCase = caseInfoUnscoped;

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
        ...resolvedCase,
        contact_phone: resolvedCase.contact_phone || "", // Ensure it's defined
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
    // Always attempt to load the case; authorization is handled in the queryFn above
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
        {/* Case Profile Picture - Show admin picture if available, otherwise show public photo */}
        {(caseData?.admin_profile_picture_url || caseData?.photo_url) && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20 shadow-lg">
                  <img
                    src={caseData.admin_profile_picture_url || caseData.photo_url}
                    alt={caseData.title_ar || caseData.title || "Case"}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              {caseData.admin_profile_picture_url && caseData.photo_url && caseData.admin_profile_picture_url !== caseData.photo_url && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  صورة الإدارة (يوجد صورة عامة مختلفة)
                </p>
              )}
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">العنوان</p>
                <p className="font-medium">{caseData.title || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">العنوان بالعربية</p>
                <p className="font-medium">{caseData.title_ar || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">نوع الرعاية</p>
                <Badge variant={caseData.case_care_type === 'cancelled' ? 'destructive' : 'outline'}>
                  {caseData.case_care_type === 'sponsorship' ? 'كفالة شهرية' :
                   caseData.case_care_type === 'one_time_donation' ? 'مساعدة لمرة واحدة' :
                   caseData.case_care_type === 'cancelled' ? 'ملغاة' : 'غير محدد'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {caseData.case_care_type === 'one_time_donation' ? 'المبلغ المطلوب' : 'التكلفة الشهرية'}
                </p>
                <p className="font-medium">{(caseData.monthly_cost || 0).toLocaleString()} جنيه</p>
              </div>
              {caseData.case_care_type === 'sponsorship' && (
                <div>
                  <p className="text-sm text-muted-foreground">عدد الأشهر المطلوبة</p>
                  <p className="font-medium">{caseData.months_needed || "—"} شهر</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">رقم جوال الأم</p>
                <p className="font-medium">{caseData.contact_phone || "غير مسجل"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">المحافظة</p>
                <p className="font-medium">{caseData.city || "غير محدد"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">المنطقة</p>
                <p className="font-medium">{caseData.area || "غير محدد"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">حالة النشر</p>
                <Badge variant={caseData.is_published ? "default" : "secondary"}>
                  {caseData.is_published ? "منشور" : "غير منشور"}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">مميز</p>
                <Badge variant={caseData.is_featured ? "default" : "outline"}>
                  {caseData.is_featured ? "نعم" : "لا"}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">مستحق للزكاة</p>
                <Badge variant={caseData.deserve_zakkah ? "default" : "outline"} className={caseData.deserve_zakkah ? "bg-green-600" : ""}>
                  {caseData.deserve_zakkah ? "نعم" : "لا"}
                </Badge>
              </div>
            </div>

            {/* Short Description */}
            {(caseData.short_description_ar || caseData.short_description) && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">الوصف المختصر</p>
                <p className="text-foreground">{caseData.short_description_ar || caseData.short_description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Description Images */}
        {caseData.description_images && Array.isArray(caseData.description_images) && caseData.description_images.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>صور إضافية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {caseData.description_images
                  .filter((img: unknown): img is string => typeof img === 'string')
                  .map((imageUrl: string, index: number) => (
                    <div key={index} className="relative group">
                      <img
                        src={imageUrl}
                        alt={`صورة إضافية ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border shadow-sm"
                      />
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Parent/Guardian Profile */}
        {(caseData.parent_age || caseData.health_state || caseData.education_level ||
          caseData.work_ability || caseData.skills || caseData.rent_amount ||
          caseData.kids_number || caseData.profile_notes) && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-primary" />
                <CardTitle>بيانات ولي الأمر / مقدم الرعاية</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {caseData.parent_age && (
                  <div>
                    <p className="text-sm text-muted-foreground">العمر</p>
                    <p className="font-medium">{caseData.parent_age} سنة</p>
                  </div>
                )}
                {caseData.kids_number !== undefined && caseData.kids_number !== null && (
                  <div>
                    <p className="text-sm text-muted-foreground">عدد الأطفال</p>
                    <p className="font-medium">{caseData.kids_number}</p>
                  </div>
                )}
                {caseData.rent_amount !== undefined && caseData.rent_amount !== null && caseData.rent_amount > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">الإيجار الشهري</p>
                    <p className="font-medium">{caseData.rent_amount.toLocaleString()} جنيه</p>
                  </div>
                )}
                {caseData.education_level && (
                  <div>
                    <p className="text-sm text-muted-foreground">المستوى التعليمي</p>
                    <p className="font-medium">{caseData.education_level}</p>
                  </div>
                )}
                {caseData.work_ability && (
                  <div>
                    <p className="text-sm text-muted-foreground">القدرة على العمل</p>
                    <p className="font-medium">{caseData.work_ability}</p>
                  </div>
                )}
                {caseData.skills && Array.isArray(caseData.skills) && caseData.skills.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">المهارات</p>
                    <p className="font-medium">{caseData.skills.join('، ')}</p>
                  </div>
                )}
              </div>

              {caseData.health_state && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">الحالة الصحية</p>
                  <p className="text-foreground">{caseData.health_state}</p>
                </div>
              )}

              {caseData.profile_notes && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">ملاحظات إضافية</p>
                  <p className="text-foreground whitespace-pre-wrap">{caseData.profile_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue={searchParams.get("tab") || "followups"} className="w-full mt-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="followups" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            المتابعات
          </TabsTrigger>
          <TabsTrigger value="donations" className="flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            التبرعات
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

        {/* Donations Tab */}
        <TabsContent value="donations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>تبرعات الحالة</CardTitle>
            </CardHeader>
            <CardContent>
              <DonationsTable caseId={id!} />
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
              hobbies: kid.hobbies || [],
              health_state: kid.health_state || "",
              current_grade: kid.current_grade || "",
              school_name: kid.school_name || ""
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
