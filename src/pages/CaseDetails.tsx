import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FamilyProfile } from "@/components/FamilyProfile";
import { MonthlyNeeds } from "@/components/MonthlyNeeds";
import { DonationSection } from "@/components/DonationSection";
import { MonthlyUpdates } from "@/components/MonthlyUpdates";
import { KidsInfo } from "@/components/KidsInfo";
import { Heart, Shield, Eye, Users, ArrowLeft, Clock, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const CaseDetails = () => {
  const { id } = useParams();

  const { data: caseData, isLoading } = useQuery({
    queryKey: ["case", id],
    queryFn: async () => {
      if (!id) throw new Error("Case ID is required");

      const [
        { data: caseRecord, error: caseError },
        { data: donations },
        { data: handovers }
      ] = await Promise.all([
        supabase
          .from("cases")
          .select("*")
          .eq("id", id)
          .eq("is_published", true)
          .maybeSingle(),
        supabase
          .from("donations")
          .select("amount")
          .eq("case_id", id)
          .eq("status", "confirmed"),
        supabase
          .from("donation_handovers")
          .select("handover_amount")
          .eq("case_id", id)
      ]);

      if (caseError) throw caseError;
      if (!caseRecord) return null;

      // Calculate total from both direct donations and handovers
      const directDonations = donations?.reduce((sum, d) => sum + Number(d.amount || 0), 0) || 0;
      const handoverAmounts = handovers?.reduce((sum, h) => sum + Number(h.handover_amount || 0), 0) || 0;
      const totalSecured = directDonations + handoverAmounts;

      return {
        ...caseRecord,
        total_secured_money: totalSecured
      };
    },
    enabled: !!id
  });

  // استعلام للحصول على الاحتياجات الشهرية
  const { data: monthlyNeedsData } = useQuery({
    queryKey: ["monthly-needs", id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("monthly_needs")
        .select("*")
        .eq("case_id", id)
        .order("amount", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  // استعلام للحصول على بيانات الأطفال
  const { data: kidsData } = useQuery({
    queryKey: ["case-kids", id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("case_kids")
        .select("*")
        .eq("case_id", id)
        .order("age", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  // استعلام للحصول على التقارير الشهرية
  const { data: monthlyReportsData } = useQuery({
    queryKey: ["monthly-reports", id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("monthly_reports")
        .select("*")
        .eq("case_id", id)
        .order("report_date", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  // استعلام للحصول على المتابعات
  const { data: followupActions } = useQuery({
    queryKey: ["followup-actions", id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("followup_actions" as any)
        .select("*")
        .eq("case_id", id)
        .order("action_date", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data as any[];
    },
    enabled: !!id
  });

  // بيانات العائلة من قاعدة البيانات فقط
  const familyData = {
    familyName: caseData?.title_ar || caseData?.title || "",
    location: caseData?.city || "",
    familySize: 0, // سيتم إخفاء هذا إذا لم تكن هناك بيانات
    members: [], // لا توجد أعضاء مُحددين - يجب إضافة جدول منفصل لأعضاء العائلة
    story: caseData?.description_ar || caseData?.description || "",
    image: caseData?.photo_url || "/images/default-case-image.jpg"
  };

  // الاحتياجات الشهرية من قاعدة البيانات فقط
  const monthlyNeeds = monthlyNeedsData?.map((need) => ({
    category: need.category,
    amount: Number(need.amount),
    description: need.description || "",
    icon: <Heart className="w-5 h-5 text-white" />,
    color: need.color || "bg-blue-500"
  })) || [];

  const totalMonthlyNeed = caseData?.monthly_cost || 0;

  // التحديثات الشهرية من قاعدة البيانات فقط
  const monthlyUpdates = monthlyReportsData?.map((report) => ({
    id: report.id,
    date: new Date(report.report_date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    title: report.title,
    description: report.description || "",
    status: report.status as "completed" | "pending",
    category: report.category as "food" | "housing" | "general",
    images: Array.isArray(report.images) ? report.images.map(img => String(img)) : []
  })) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl">جار التحميل...</div>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">الحالة غير موجودة</h2>
          <Button asChild>
            <Link to="/cases">العودة إلى قائمة الحالات</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* الرأس */}
      <div className="gradient-hero text-white py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" size="sm" asChild className="bg-primary text-primary-foreground border-primary hover:bg-primary/90">
              <Link to="/cases">
                <ArrowLeft className="w-4 h-4 ml-2" />
                <span className="hidden sm:inline">العودة إلى القائمة</span>
                <span className="sm:hidden">عودة</span>
              </Link>
            </Button>
          </div>
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold mb-4">
              {caseData.title_ar || caseData.title}
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl opacity-90 max-w-2xl mx-auto">
              {caseData.short_description_ar || caseData.short_description}
            </p>
          </div>
        </div>
      </div>

      {/* المحتوى الرئيسي */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">

          {/* العمود الأيسر - معلومات العائلة */}
          <div className="lg:col-span-2 space-y-6 lg:space-y-8">
            <FamilyProfile {...familyData} />

            {/* Display description images if available */}
            {caseData?.description_images && Array.isArray(caseData.description_images) && caseData.description_images.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">صور إضافية</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {caseData.description_images
                      .filter((img): img is string => typeof img === 'string')
                      .map((imageUrl: string, index: number) => (
                        <div key={index} className="relative group">
                          <img
                            src={imageUrl}
                            alt={`صورة إضافية ${index + 1}`}
                            className="w-full h-48 object-cover rounded-lg border shadow-sm hover:shadow-md transition-shadow"
                          />
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {kidsData && kidsData.length > 0 && (
              <KidsInfo kids={kidsData.map(kid => ({
                id: kid.id,
                name: kid.name,
                age: kid.age,
                gender: kid.gender as 'male' | 'female',
                description: kid.description || "",
                hobbies: kid.hobbies || []
              }))} />
            )}

            <MonthlyNeeds totalMonthlyNeed={totalMonthlyNeed} needs={monthlyNeeds} />

            {/* Follow-up Actions Section */}
            {followupActions && followupActions.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">آخر المتابعات</h3>
                  <div className="space-y-3">
                    {followupActions.map((action: any) => (
                      <div key={action.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {action.status === "completed" ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <Clock className="h-4 w-4 text-yellow-500" />
                            )}
                            <h4 className="font-semibold">{action.title}</h4>
                            {action.status === "completed" ? (
                              <Badge variant="default" className="bg-green-500">مكتملة</Badge>
                            ) : (
                              <Badge variant="secondary">معلقة</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(action.action_date), "dd MMM yyyy", { locale: ar })}
                          </div>
                        </div>
                        {action.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {action.description}
                          </p>
                        )}
                        {action.cost > 0 && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mt-2">
                            <span className="text-sm font-semibold text-blue-900">
                              التكلفة: {action.cost.toLocaleString()} جنيه
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <MonthlyUpdates updates={monthlyUpdates} />
          </div>

          {/* العمود الأيمن - قسم التبرع */}
          <div className="space-y-6">
            {/* شريط التقدم المالي */}
            <Card className="p-4 sm:p-6 shadow-soft bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <div className="text-center mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-bold mb-2">التقدم المالي للحالة</h3>
                <p className="text-muted-foreground text-sm">
                  {caseData.case_care_type === 'one_time_donation'
                    ? 'المبلغ المجمع من المبلغ المطلوب'
                    : 'المبلغ المجمع من إجمالي المطلوب'
                  }
                </p>
              </div>

              <div className="space-y-4">
                {(() => {
                  const isOneTime = caseData.case_care_type === 'one_time_donation';
                  const totalNeeded = isOneTime
                    ? caseData.monthly_cost
                    : (caseData.monthly_cost * (caseData.months_needed || 1));
                  const progressValue = totalNeeded > 0
                    ? Math.min(((caseData.total_secured_money || 0) / totalNeeded) * 100, 100)
                    : 0;

                  return (
                    <>
                      <div className="relative">
                        <Progress
                          value={progressValue}
                          className="h-6 bg-white/50"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-bold text-primary-foreground">
                            {Math.round(progressValue)}%
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-sm">
                        <div className="text-center">
                          <div className="font-bold text-primary text-base sm:text-lg">
                            {(caseData.total_secured_money || 0).toLocaleString()}
                          </div>
                          <div className="text-muted-foreground text-xs sm:text-sm">المجمع</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-muted-foreground text-base sm:text-lg">
                            {totalNeeded.toLocaleString()}
                          </div>
                          <div className="text-muted-foreground text-xs sm:text-sm">المطلوب</div>
                        </div>
                      </div>

                      <div className="bg-white/30 p-3 rounded-lg">
                        <div className="flex justify-between text-sm">
                          <span>المتبقي:</span>
                          <span className="font-bold">
                            {Math.max(0, totalNeeded - (caseData.total_secured_money || 0)).toLocaleString()} جنيه
                          </span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </Card>

            <DonationSection
              monthlyNeed={totalMonthlyNeed}
              caseStatus={caseData.status}
              monthsCovered={caseData.months_covered}
              monthsNeeded={caseData.months_needed}
              paymentCode={caseData.payment_code}
              caseTitle={caseData.title_ar || caseData.title}
              caseId={caseData.id}
              caseCareType={caseData.case_care_type as 'cancelled' | 'sponsorship' | 'one_time_donation' | undefined}
              totalSecured={caseData.total_secured_money || 0}
              minCustomDonation={(caseData as any).min_custom_donation ?? 1}
              showMonthlyDonation={(caseData as any).show_monthly_donation ?? true}
              showCustomDonation={(caseData as any).show_custom_donation ?? true}
            />

            {/* معلومات إضافية */}
            <Card className="p-4 sm:p-6 shadow-soft">
              <h4 className="font-semibold mb-4 text-base sm:text-lg">لماذا تختار كفالة الأسر؟</h4>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                  <span>شفافية كاملة في استخدام التبرعات</span>
                </div>
                <div className="flex items-start gap-2">
                  <Eye className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                  <span>تقارير شهرية مفصلة بالصور</span>
                </div>
                <div className="flex items-start gap-2">
                  <Heart className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                  <span>أثر مباشر وملموس على حياة الأسرة</span>
                </div>
                <div className="flex items-start gap-2">
                  <Users className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                  <span>متابعة مستمرة من قبل فريقنا</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseDetails;