import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FamilyProfile } from "@/components/FamilyProfile";
import { MonthlyNeeds } from "@/components/MonthlyNeeds";
import { DonationSection } from "@/components/DonationSection";
import { MonthlyUpdates } from "@/components/MonthlyUpdates";
import { Heart, Shield, Eye, Users, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const CaseDetails = () => {
  const { id } = useParams();
  
  const { data: caseData, isLoading } = useQuery({
    queryKey: ["case", id],
    queryFn: async () => {
      if (!id) throw new Error("Case ID is required");
      
      const { data, error } = await supabase
        .from("cases")
        .select("*")
        .eq("id", id)
        .eq("is_published", true)
        .maybeSingle();
      
      if (error) throw error;
      return data;
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

  // بيانات العائلة من قاعدة البيانات
  const familyData = {
    familyName: caseData?.title_ar || caseData?.title || "عائلة محتاجة",
    location: "المملكة العربية السعودية", // يمكن إضافة حقل location في قاعدة البيانات
    familySize: 5, // يمكن إضافة حقل family_size في قاعدة البيانات
    members: [
      // يمكن إنشاء جدول منفصل لأعضاء العائلة
      { name: "أم العائلة", age: 45, relation: "أم العائلة" },
      { name: "الطفل الأول", age: 16, relation: "الابن الأكبر" },
      { name: "الطفلة الثانية", age: 14, relation: "ابنة" },
      { name: "الطفل الثالث", age: 12, relation: "ابن" },
      { name: "الطفلة الصغرى", age: 8, relation: "الابنة الصغرى" }
    ],
    story: caseData?.description_ar || caseData?.description || "قصة العائلة...",
    image: caseData?.photo_url || "https://images.unsplash.com/photo-1609220136736-443140cffec6?w=400&h=300&fit=crop"
  };

  // الاحتياجات الشهرية من قاعدة البيانات أو البيانات الافتراضية
  const monthlyNeeds = monthlyNeedsData?.length ? 
    monthlyNeedsData.map((need) => ({
      category: need.category,
      amount: Number(need.amount),
      description: need.description || "",
      icon: <Heart className="w-5 h-5 text-white" />, // يمكن تحسين هذا لاستخدام الأيقونة من قاعدة البيانات
      color: need.color || "bg-blue-500"
    })) :
    [
      {
        category: "الطعام والمواد الغذائية",
        amount: Math.round((caseData?.monthly_cost || 2700) * 0.44),
        description: "مواد غذائية أساسية شهرية للعائلة",
        icon: <Heart className="w-5 h-5 text-white" />,
        color: "bg-orange-500"
      },
      {
        category: "الإيجار والمرافق",
        amount: Math.round((caseData?.monthly_cost || 2700) * 0.30),
        description: "إيجار المنزل وفواتير الكهرباء والماء",
        icon: <Shield className="w-5 h-5 text-white" />,
        color: "bg-blue-500"
      },
      {
        category: "التعليم والمدرسة",
        amount: Math.round((caseData?.monthly_cost || 2700) * 0.15),
        description: "مصاريف دراسية ومستلزمات تعليمية",
        icon: <Eye className="w-5 h-5 text-white" />,
        color: "bg-green-500"
      },
      {
        category: "الصحة والعلاج",
        amount: Math.round((caseData?.monthly_cost || 2700) * 0.08),
        description: "أدوية ومراجعات طبية ضرورية",
        icon: <Users className="w-5 h-5 text-white" />,
        color: "bg-red-500"
      },
      {
        category: "الملابس والاحتياجات",
        amount: Math.round((caseData?.monthly_cost || 2700) * 0.03),
        description: "ملابس وحاجيات شخصية أساسية",
        icon: <Heart className="w-5 h-5 text-white" />,
        color: "bg-purple-500"
      }
    ];

  const totalMonthlyNeed = caseData?.monthly_cost || monthlyNeeds.reduce((sum, need) => sum + need.amount, 0);

  // التحديثات الشهرية من قاعدة البيانات أو البيانات الافتراضية
  const monthlyUpdates = monthlyReportsData?.length ?
    monthlyReportsData.map((report) => ({
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
    })) :
    [
      {
        id: "1",
        date: new Date().toLocaleDateString('ar-SA', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        title: "زيارة ميدانية وتوزيع المساعدات",
        description: "تم توزيع المساعدات الشهرية والاطمئنان على أحوال العائلة. الأطفال بصحة جيدة والعائلة ممتنة للدعم المستمر.",
        status: "completed" as const,
        category: "food" as const,
        images: ["https://images.unsplash.com/photo-1593113598332-cd288d649433?w=200&h=200&fit=crop"]
      },
      {
        id: "2", 
        date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toLocaleDateString('ar-SA', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        title: "دفع المصاريف الأساسية",
        description: "تم دفع الإيجار وفواتير المرافق في الوقت المناسب، مما وفر الاستقرار للعائلة.",
        status: "completed" as const,
        category: "housing" as const
      }
    ];

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
      <div className="gradient-hero text-white py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" size="sm" asChild className="text-white border-white hover:bg-white hover:text-primary">
              <Link to="/cases">
                <ArrowLeft className="w-4 h-4 ml-2" />
                العودة إلى القائمة
              </Link>
            </Button>
          </div>
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              {caseData.title_ar || caseData.title}
            </h1>
            <p className="text-xl md:text-2xl opacity-90 max-w-2xl mx-auto">
              {caseData.short_description_ar || caseData.short_description}
            </p>
          </div>
        </div>
      </div>

      {/* المحتوى الرئيسي */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* العمود الأيسر - معلومات العائلة */}
          <div className="lg:col-span-2 space-y-8">
            <FamilyProfile {...familyData} />
            <MonthlyNeeds totalMonthlyNeed={totalMonthlyNeed} needs={monthlyNeeds} />
            <MonthlyUpdates updates={monthlyUpdates} />
          </div>

          {/* العمود الأيمن - قسم التبرع */}
          <div className="space-y-6">
            <DonationSection 
              monthlyNeed={totalMonthlyNeed} 
              caseStatus={caseData.status}
              monthsCovered={caseData.months_covered}
              monthsNeeded={caseData.months_needed}
            />
            
            {/* معلومات إضافية */}
            <Card className="p-6 shadow-soft">
              <h4 className="font-semibold mb-4">لماذا تختار كفالة الأسر؟</h4>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 mt-0.5 text-primary" />
                  <span>شفافية كاملة في استخدام التبرعات</span>
                </div>
                <div className="flex items-start gap-2">
                  <Eye className="w-4 h-4 mt-0.5 text-primary" />
                  <span>تقارير شهرية مفصلة بالصور</span>
                </div>
                <div className="flex items-start gap-2">
                  <Heart className="w-4 h-4 mt-0.5 text-primary" />
                  <span>أثر مباشر وملموس على حياة الأسرة</span>
                </div>
                <div className="flex items-start gap-2">
                  <Users className="w-4 h-4 mt-0.5 text-primary" />
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