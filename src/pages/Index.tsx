import { FamilyProfile } from "@/components/FamilyProfile";
import { MonthlyNeeds } from "@/components/MonthlyNeeds";
import { DonationSection } from "@/components/DonationSection";
import { MonthlyUpdates } from "@/components/MonthlyUpdates";
import { FeaturedCasesCarousel } from "@/components/FeaturedCasesCarousel";
import { Heart, Shield, Eye, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  // بيانات العائلة النموذجية
  const familyData = {
    familyName: "أبو محمد",
    location: "الرياض، المملكة العربية السعودية",
    familySize: 5,
    members: [
      { name: "فاطمة أحمد", age: 45, relation: "أم العائلة" },
      { name: "محمد أحمد", age: 16, relation: "الابن الأكبر" },
      { name: "عائشة أحمد", age: 14, relation: "ابنة" },
      { name: "علي أحمد", age: 12, relation: "ابن" },
      { name: "زينب أحمد", age: 8, relation: "الابنة الصغرى" }
    ],
    story: "عائلة كريمة فقدت عائلها الوحيد في حادث مؤسف، تعيش الأم مع أربعة أطفال في ظروف صعبة. الأم تحاول جاهدة توفير لقمة العيش الكريمة لأطفالها، لكن دخلها المحدود لا يكفي لتغطية جميع الاحتياجات الأساسية. الأطفال مجتهدون في دراستهم ويحتاجون للدعم لمواصلة تعليمهم وبناء مستقبل أفضل.",
    image: "https://images.unsplash.com/photo-1609220136736-443140cffec6?w=400&h=300&fit=crop"
  };

  const monthlyNeeds = [
    {
      category: "الطعام والمواد الغذائية",
      amount: 1200,
      description: "مواد غذائية أساسية شهرية للعائلة",
      icon: <Heart className="w-5 h-5 text-white" />,
      color: "bg-orange-500"
    },
    {
      category: "الإيجار والمرافق",
      amount: 800,
      description: "إيجار المنزل وفواتير الكهرباء والماء",
      icon: <Shield className="w-5 h-5 text-white" />,
      color: "bg-blue-500"
    },
    {
      category: "التعليم والمدرسة",
      amount: 400,
      description: "مصاريف دراسية ومستلزمات تعليمية",
      icon: <Eye className="w-5 h-5 text-white" />,
      color: "bg-green-500"
    },
    {
      category: "الصحة والعلاج",
      amount: 300,
      description: "أدوية ومراجعات طبية ضرورية",
      icon: <Users className="w-5 h-5 text-white" />,
      color: "bg-red-500"
    },
    {
      category: "الملابس والاحتياجات",
      amount: 300,
      description: "ملابس وحاجيات شخصية أساسية",
      icon: <Heart className="w-5 h-5 text-white" />,
      color: "bg-purple-500"
    }
  ];

  const totalMonthlyNeed = monthlyNeeds.reduce((sum, need) => sum + need.amount, 0);

  const monthlyUpdates = [
    {
      id: "1",
      date: "15 ديسمبر 2024",
      title: "زيارة ميدانية وتوزيع المواد الغذائية",
      description: "تم توزيع المواد الغذائية الشهرية وزيارة العائلة للاطمئنان على أحوالهم. الأطفال بصحة جيدة والأم ممتنة للدعم المستمر.",
      status: "completed" as const,
      category: "food" as const,
      images: ["https://images.unsplash.com/photo-1593113598332-cd288d649433?w=200&h=200&fit=crop"]
    },
    {
      id: "2",
      date: "1 ديسمبر 2024",
      title: "دفع إيجار الشهر وفواتير المرافق",
      description: "تم دفع إيجار شهر ديسمبر وجميع فواتير المرافق في الوقت المناسب، مما وفر الاستقرار للعائلة.",
      status: "completed" as const,
      category: "housing" as const
    },
    {
      id: "3",
      date: "20 نوفمبر 2024",
      title: "شراء الملابس الشتوية للأطفال",
      description: "تم شراء ملابس شتوية مناسبة لجميع الأطفال استعداداً لفصل الشتاء.",
      status: "completed" as const,
      category: "general" as const
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* الرأس */}
      <div className="gradient-hero text-white py-12 md:py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4">
            كفالة الأسر المحتاجة
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl opacity-90 max-w-2xl mx-auto mb-8">
            ساهم في تغيير حياة عائلة محتاجة من خلال نظام شفاف للكفالة والمتابعة الشهرية
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-2xl mx-auto flex-wrap">
            <Button asChild size="lg" className="text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto">
              <Link to="/cases">
                تصفح جميع الحالات
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 text-white border-white hover:bg-white hover:text-primary w-full sm:w-auto">
              <Link to="/selection-criteria">
                كيف نختار الحالات؟
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 text-white border-white hover:bg-white hover:text-primary w-full sm:w-auto">
              <Link to="/funding-channels">
                قنوات التبرع
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 text-white/80 hover:bg-white/10 hover:text-white w-full sm:w-auto">
              <Link to="/auth">
                لوحة التحكم
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* المحتوى الرئيسي */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">

          {/* العمود الأيسر - معلومات العائلة */}
          <div className="lg:col-span-2 space-y-6 lg:space-y-8">
            <FamilyProfile {...familyData} />
            <MonthlyNeeds totalMonthlyNeed={totalMonthlyNeed} needs={monthlyNeeds} />
            <MonthlyUpdates updates={monthlyUpdates} />
          </div>

          {/* العمود الأيمن - قسم التبرع */}
          <div className="space-y-6">
            <DonationSection monthlyNeed={totalMonthlyNeed} />
          </div>
        </div>

        {/* Featured Cases Section */}
        <div className="mt-12 lg:mt-16">
          <FeaturedCasesCarousel />
        </div>
      </div>
    </div>
  );
};

export default Index;
