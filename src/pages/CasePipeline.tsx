import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import { 
  Search, 
  Users, 
  Heart, 
  CheckCircle, 
  Home, 
  FileSearch,
  Calendar,
  DollarSign,
  Palette,
  Laptop,
  ShoppingBag,
  ClipboardCheck,
  GraduationCap,
  Wrench,
  Sparkles,
  MapPin,
  HandHeart
} from "lucide-react";

const pipelineSteps = [
  {
    id: 1,
    title: "ترشيح الحالات",
    description: "عن طريق الدليل في المنطقة بيرشح حالات محتاجة للدعم",
    icon: Search,
    gradient: "from-blue-500 to-blue-600",
    phase: "الاكتشاف"
  },
  {
    id: 2,
    title: "المقابلة الأولية",
    description: "مقابلة الحالة في مركز الدليل والاستماع لتفاصيل حياتها ورؤية الأطفال",
    icon: Users,
    gradient: "from-indigo-500 to-indigo-600",
    phase: "الاكتشاف"
  },
  {
    id: 3,
    title: "إخراج الزكاة",
    description: "إخراج زكاة المال للحالات المستحقة لغرض الزكاة ثم تأليف قلوبهم تجاه فسيلة",
    icon: Heart,
    gradient: "from-pink-500 to-rose-500",
    phase: "التقييم"
  },
  {
    id: 4,
    title: "اصطفاء الحالات",
    description: "اختيار الحالات المطابقة لمواصفات الاختيار المحددة",
    icon: CheckCircle,
    gradient: "from-emerald-500 to-green-600",
    phase: "التقييم"
  },
  {
    id: 5,
    title: "الزيارة الميدانية",
    description: "زيارة ميدانية مع الموظفة أو بشكل منفرد لجمع باقي التفاصيل",
    icon: Home,
    gradient: "from-teal-500 to-teal-600",
    phase: "التحقق"
  },
  {
    id: 6,
    title: "البحث الميداني",
    description: "بعض الحالات تحتاج بحث ميداني إضافي لمطابقة التفاصيل",
    icon: FileSearch,
    gradient: "from-cyan-500 to-cyan-600",
    phase: "التحقق"
  },
  {
    id: 7,
    title: "الدخول في الشهريات",
    description: "إدخال الحالة في نظام الكفالة الشهرية",
    icon: Calendar,
    gradient: "from-primary to-primary/80",
    phase: "الكفالة"
  },
  {
    id: 8,
    title: "الكفالة الشهرية",
    description: "التكفل بحوالي ١٥٠٠-٢٠٠٠ جنيه شهرياً لكل أسرة",
    icon: DollarSign,
    gradient: "from-amber-500 to-orange-500",
    phase: "الكفالة"
  },
  {
    id: 9,
    title: "جمع هوايات الأطفال",
    description: "اكتشاف ودعم هوايات الأطفال من رسم وشعر وغيرها",
    icon: Palette,
    gradient: "from-purple-500 to-violet-600",
    phase: "التنمية"
  },
  {
    id: 10,
    title: "دعم تقني",
    description: "دعم الأطفال بأجهزة لاب توب للتعليم والتطوير",
    icon: Laptop,
    gradient: "from-slate-600 to-slate-700",
    phase: "التنمية"
  },
  {
    id: 11,
    title: "أدوات الهوايات",
    description: "شراء الأدوات اللازمة لهوايات الأطفال",
    icon: ShoppingBag,
    gradient: "from-rose-500 to-pink-600",
    phase: "التنمية"
  },
  {
    id: 12,
    title: "المتابعة الدورية",
    description: "متابعة كل شهرين إلى ٣ شهور لتحديد بقاء الأسرة في الكفالة",
    icon: ClipboardCheck,
    gradient: "from-orange-500 to-amber-600",
    phase: "المتابعة"
  },
  {
    id: 13,
    title: "الدورات التعليمية",
    description: "بدء الدورات التعليمية للأطفال مع المنظمات المتضامنة أونلاين",
    icon: GraduationCap,
    gradient: "from-blue-600 to-indigo-600",
    phase: "التنمية"
  },
  {
    id: 14,
    title: "تفاصيل المنزل",
    description: "التكفل بتفاصيل المنزل من علاج أو أثاث أو غيره",
    icon: Wrench,
    gradient: "from-stone-500 to-stone-600",
    phase: "الدعم"
  }
];

const phases = [
  { name: "الاكتشاف", color: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
  { name: "التقييم", color: "bg-pink-500/10 text-pink-600 border-pink-500/30" },
  { name: "التحقق", color: "bg-teal-500/10 text-teal-600 border-teal-500/30" },
  { name: "الكفالة", color: "bg-green-500/10 text-green-600 border-green-500/30" },
  { name: "التنمية", color: "bg-purple-500/10 text-purple-600 border-purple-500/30" },
  { name: "المتابعة", color: "bg-orange-500/10 text-orange-600 border-orange-500/30" },
  { name: "الدعم", color: "bg-stone-500/10 text-stone-600 border-stone-500/30" },
];

const CasePipeline = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
      <Navigation />
      
      {/* Hero Section */}
      <div className="gradient-hero text-white py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 right-[10%] w-72 h-72 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-[10%] w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-5 py-2.5 mb-8">
            <Sparkles className="w-5 h-5" />
            <span className="font-medium">١٤ خطوة نحو التغيير</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            رحلة الكفالة
          </h1>
          <p className="text-xl md:text-2xl opacity-90 max-w-2xl mx-auto leading-relaxed">
            من الاكتشاف إلى الدعم المستدام
          </p>
        </div>
      </div>

      {/* Phase Legend */}
      <div className="container mx-auto px-4 -mt-8 relative z-20 mb-16">
        <div className="bg-card/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-border/50 p-6">
          <div className="flex flex-wrap justify-center gap-2">
            {phases.map((phase) => (
              <Badge
                key={phase.name}
                variant="outline"
                className={`${phase.color} px-4 py-2 text-sm font-medium`}
              >
                {phase.name}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Snake Pipeline */}
      <div className="container mx-auto px-4 pb-20">
        <div className="max-w-6xl mx-auto relative">
          {pipelineSteps.map((step, index) => {
            const phaseInfo = phases.find(p => p.name === step.phase);
            const isEven = index % 2 === 0;
            const isLast = index === pipelineSteps.length - 1;
            
            return (
              <div key={step.id} className="relative">
                {/* Snake connector */}
                {!isLast && (
                  <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 w-full h-32 pointer-events-none">
                    <svg
                      className="w-full h-full"
                      viewBox="0 0 800 128"
                      fill="none"
                      preserveAspectRatio="none"
                    >
                      <path
                        d={isEven 
                          ? "M 400 0 C 400 64, 100 64, 100 128"
                          : "M 400 0 C 400 64, 700 64, 700 128"
                        }
                        stroke="url(#gradient)"
                        strokeWidth="3"
                        strokeDasharray="8 8"
                        className="opacity-40"
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="hsl(var(--primary))" />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                )}

                {/* Mobile connector */}
                {!isLast && (
                  <div className="md:hidden flex justify-center py-4">
                    <div className="w-0.5 h-12 bg-gradient-to-b from-primary/50 to-primary/10" />
                  </div>
                )}
                
                {/* Step Card */}
                <div className={`flex items-center gap-4 md:gap-8 mb-8 md:mb-0 ${
                  isEven ? 'md:flex-row' : 'md:flex-row-reverse'
                }`}>
                  {/* Empty space for snake effect */}
                  <div className="hidden md:block flex-1" />
                  
                  {/* Card */}
                  <div className={`flex-1 md:max-w-md group ${
                    isEven ? 'md:text-right' : 'md:text-left'
                  }`}>
                    <div className="relative bg-card rounded-3xl p-6 shadow-lg border border-border/50 hover:shadow-2xl hover:border-primary/30 transition-all duration-500 hover:-translate-y-1">
                      {/* Glow effect */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${step.gradient} opacity-0 group-hover:opacity-5 rounded-3xl transition-opacity duration-500`} />
                      
                      {/* Step number badge */}
                      <div className={`absolute -top-4 ${isEven ? 'md:-left-4 -left-2' : 'md:-right-4 -right-2'}`}>
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${step.gradient} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                          {step.id}
                        </div>
                      </div>
                      
                      {/* Icon */}
                      <div className={`inline-flex mb-4 ${isEven ? 'md:float-left md:ml-4' : 'md:float-right md:mr-4'}`}>
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                          <step.icon className="w-8 h-8 text-white" />
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="relative z-10">
                        <div className={`flex flex-wrap items-center gap-2 mb-3 ${isEven ? 'md:justify-end' : 'md:justify-start'}`}>
                          <h3 className="text-xl font-bold text-foreground">
                            {step.title}
                          </h3>
                          {phaseInfo && (
                            <Badge variant="outline" className={`${phaseInfo.color} text-xs`}>
                              {step.phase}
                            </Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground leading-relaxed clear-both pt-2">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Center Line Node */}
                  <div className="hidden md:flex flex-col items-center">
                    <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${step.gradient} shadow-lg ring-4 ring-background`} />
                  </div>
                  
                  {/* Empty space for snake effect */}
                  <div className="hidden md:block flex-1" />
                </div>
              </div>
            );
          })}
          
          {/* Center vertical line (desktop) */}
          <div className="hidden md:block absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1 bg-gradient-to-b from-primary/50 via-primary/30 to-primary/10 rounded-full" />
        </div>
      </div>

      {/* Summary Section */}
      <div className="bg-muted/30 py-20 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            ملخص الرحلة
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-card rounded-3xl p-8 text-center shadow-xl border border-border/50 hover:border-blue-500/30 transition-colors group">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform">
                <MapPin className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-3xl font-bold mb-2 text-foreground">٦ خطوات</h3>
              <p className="text-muted-foreground text-lg">للاكتشاف والتحقق</p>
            </div>
            
            <div className="bg-card rounded-3xl p-8 text-center shadow-xl border border-border/50 hover:border-primary/30 transition-colors group">
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform">
                <HandHeart className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-3xl font-bold mb-2 text-foreground">١٥٠٠-٢٠٠٠</h3>
              <p className="text-muted-foreground text-lg">جنيه كفالة شهرية</p>
            </div>
            
            <div className="bg-card rounded-3xl p-8 text-center shadow-xl border border-border/50 hover:border-purple-500/30 transition-colors group">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform">
                <GraduationCap className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-3xl font-bold mb-2 text-foreground">تنمية شاملة</h3>
              <p className="text-muted-foreground text-lg">تعليم وهوايات ودعم</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="container mx-auto px-4 py-20">
        <div className="gradient-hero rounded-3xl text-white overflow-hidden relative">
          <div className="absolute inset-0">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          </div>
          <div className="p-12 md:p-16 text-center relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              كن جزءاً من هذه الرحلة
            </h2>
            <p className="text-xl opacity-90 max-w-2xl mx-auto mb-10">
              ساهم معنا في دعم الأسر المحتاجة وتغيير حياتهم للأفضل
            </p>
            <a
              href="/cases"
              className="inline-flex items-center gap-3 bg-white text-primary px-10 py-5 rounded-2xl font-bold text-lg hover:bg-white/90 transition-all hover:scale-105 shadow-2xl"
            >
              <Heart className="w-6 h-6" />
              تصفح الحالات وابدأ الكفالة
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CasePipeline;
