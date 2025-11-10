import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Users, Calendar, Heart, Filter, Home, Baby, BookOpen, CheckCircle2, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import Navigation from "@/components/Navigation";

const CasesList = () => {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [zakahFilter, setZakahFilter] = useState<string>("all");

  const { data: allCases, isLoading } = useQuery({
    queryKey: ["cases"],
    queryFn: async () => {
      // First get all cases
      const { data: cases, error: casesError } = await supabase
        .from("cases")
        .select("*")
        .eq("is_published", true)
        .not("title_ar", "is", null)
        .not("description_ar", "is", null)
        .order("created_at", { ascending: false });
      
      if (casesError) throw casesError;
      
      // Then get report counts, confirmed donations, and handovers for each case
      const casesWithReports = await Promise.all(
        cases.map(async (caseItem) => {
          const [
            { count: reportsCount },
            { data: donations },
            { data: handovers }
          ] = await Promise.all([
            supabase
              .from("monthly_reports")
              .select("*", { count: "exact", head: true })
              .eq("case_id", caseItem.id),
            supabase
              .from("donations")
              .select("amount")
              .eq("case_id", caseItem.id)
              .eq("status", "confirmed"),
            supabase
              .from("donation_handovers")
              .select("handover_amount")
              .eq("case_id", caseItem.id)
          ]);
          
          // Calculate total from both direct donations and handovers
          const directDonations = donations?.reduce((sum, d) => sum + Number(d.amount || 0), 0) || 0;
          const handoverAmounts = handovers?.reduce((sum, h) => sum + Number(h.handover_amount || 0), 0) || 0;
          const totalSecured = directDonations + handoverAmounts;
          
          return {
            ...caseItem,
            reports_count: reportsCount || 0,
            total_secured_money: totalSecured
          };
        })
      );
      
      return casesWithReports;
    }
  });

  const { data: programStats } = useQuery({
    queryKey: ["program_stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("program_stats")
        .select("*")
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  // Apply filters
  const cases = allCases?.filter((caseItem) => {
    const statusMatch = statusFilter === "all" || caseItem.status === statusFilter;
    const zakahMatch = zakahFilter === "all" || 
      (zakahFilter === "true" && caseItem.deserve_zakkah) ||
      (zakahFilter === "false" && !caseItem.deserve_zakkah);
    
    return statusMatch && zakahMatch;
  });

  // Calculate total needed and collected money
  const totalNeeded = cases?.reduce((sum, caseItem) => sum + (caseItem.monthly_cost * caseItem.months_needed), 0) || 0;
  const totalCollected = cases?.reduce((sum, caseItem) => sum + (caseItem.total_secured_money || 0), 0) || 0;
  const progressPercentage = totalNeeded > 0 ? (totalCollected / totalNeeded) * 100 : 0;

  // Get statistics from database
  const sponsoredFamilies = programStats?.find(stat => stat.key === 'cared_cases')?.value || (allCases?.length || 0).toString();
  const sponsoredOrphans = programStats?.find(stat => stat.key === 'cohorts')?.value || '0';
  const childrenEducated = programStats?.find(stat => stat.key === 'learners')?.value || '0';
  const completedCases = programStats?.find(stat => stat.key === 'cases')?.value || allCases?.filter(caseItem => caseItem.status === 'complete').length.toString() || '0';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Navigation Header */}
        <header className="gradient-hero text-white py-4">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Heart className="w-8 h-8 text-white" />
                <span className="text-xl font-bold">فَسِيلَة خير</span>
              </div>
              <Navigation />
            </div>
          </div>
        </header>
        
        {/* Hero Section */}
        <div className="gradient-hero text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              جميع الحالات المحتاجة
            </h1>
            <p className="text-xl md:text-2xl opacity-90 max-w-2xl mx-auto">
              اختر الحالة التي تريد مساعدتها
            </p>
          </div>
        </div>
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">جار التحميل...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="gradient-hero text-white py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart className="w-8 h-8 text-white" />
              <span className="text-xl font-bold">فَسِيلَة خير</span>
            </div>
            <Navigation />
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <div className="relative gradient-hero text-white py-12 sm:py-16 lg:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-0 right-0 w-32 h-32 sm:w-64 sm:h-64 bg-white/5 rounded-full -translate-y-16 sm:-translate-y-32 translate-x-16 sm:translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-48 sm:h-48 bg-white/5 rounded-full translate-y-12 sm:translate-y-24 -translate-x-12 sm:-translate-x-24"></div>
        <div className="relative container mx-auto px-4 text-center">
          <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-b from-white to-white/90 bg-clip-text text-transparent">
            جميع الحالات المحتاجة
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl opacity-90 max-w-3xl mx-auto leading-relaxed">
            اختر الأسرة التي تود كفالتها واتبع رحلتها الشهرية بشفافية كاملة
          </p>
          
          {/* Statistics Section */}
          <div className="mt-8 sm:mt-10">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto">
              {/* Number of sponsored families */}
              <div className="text-center">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20 shadow-lg hover:bg-white/15 transition-all hover-scale">
                  <div className="flex justify-center mb-2 sm:mb-3">
                    <Home className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{sponsoredFamilies}</div>
                  <div className="text-xs sm:text-sm text-white/80">الأسر المكفولة</div>
                </div>
              </div>
              
              {/* Number of sponsored orphan children - admin configurable */}
              <div className="text-center">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20 shadow-lg hover:bg-white/15 transition-all hover-scale">
                  <div className="flex justify-center mb-2 sm:mb-3">
                    <Baby className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{sponsoredOrphans}</div>
                  <div className="text-xs sm:text-sm text-white/80">الأيتام المكفولين</div>
                </div>
              </div>
              
              {/* Number of children taught Quran, Sunnah and electronics - admin configurable */}
              <div className="text-center">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20 shadow-lg hover:bg-white/15 transition-all hover-scale">
                  <div className="flex justify-center mb-2 sm:mb-3">
                    <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{childrenEducated}</div>
                  <div className="text-xs sm:text-sm text-white/80">الأطفال المتعلمين</div>
                </div>
              </div>
              
              {/* Number of cases we helped - calculated */}
              <div className="text-center">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20 shadow-lg hover:bg-white/15 transition-all hover-scale">
                  <div className="flex justify-center mb-2 sm:mb-3">
                    <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{completedCases}</div>
                  <div className="text-xs sm:text-sm text-white/80">مجمل الحالات</div>
                </div>
              </div>
            </div>
          </div>
          
          
          <div className="mt-8 flex justify-center">
            <div className="w-24 h-1 bg-white/30 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* قائمة الحالات */}
      <div className="container mx-auto px-4 py-8 sm:py-12">
        {/* الفلاتر البسيطة */}
        <div className="mb-6 flex flex-wrap gap-2 justify-center">
          <Badge 
            variant={statusFilter === "all" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setStatusFilter("all")}
          >
            جميع الحالات
          </Badge>
          <Badge 
            variant={statusFilter === "active" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setStatusFilter("active")}
          >
            نشطة
          </Badge>
          <Badge 
            variant={statusFilter === "complete" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setStatusFilter("complete")}
          >
            مكتملة
          </Badge>
          <Badge 
            variant={zakahFilter === "true" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => {
              setZakahFilter(zakahFilter === "true" ? "all" : "true");
            }}
          >
            مستحق للزكاة
          </Badge>
        </div>

        {/* Featured Case - الدعم العام */}
        {cases?.filter(c => c.title_ar === "الدعم العام").map((caseItem) => (
          <Link key={caseItem.id} to={`/case/${caseItem.id}`} className="block mb-8">
            <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-all cursor-pointer border-2 border-primary/20">
              <div className="grid md:grid-cols-2 gap-0">
                {/* Image Section */}
                {caseItem.photo_url && (
                  <div className="relative h-64 md:h-auto bg-gray-100">
                    <img 
                      src={caseItem.photo_url} 
                      alt={caseItem.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 right-4 flex flex-col gap-2">
                      <Badge 
                        variant="default"
                        className="bg-primary text-primary-foreground text-sm px-3 py-1"
                      >
                        حالة مميزة
                      </Badge>
                      <Badge 
                        variant={caseItem.status === 'active' ? 'default' : 'secondary'}
                        className="bg-white/90 text-gray-800 text-sm"
                      >
                        {caseItem.status === 'active' ? 'نشطة' : 'مكتملة'}
                      </Badge>
                      {caseItem.deserve_zakkah && (
                        <Badge 
                          variant="outline"
                          className="bg-green-500/90 text-white border-green-600 text-sm"
                        >
                          مستحق للزكاة
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Content Section */}
                <div className="p-6 md:p-8 flex flex-col justify-between">
                  <div>
                    <CardTitle className="text-2xl md:text-3xl mb-4">{caseItem.title_ar || caseItem.title}</CardTitle>
                    <p className="text-muted-foreground text-base md:text-lg mb-6 leading-relaxed">
                      {caseItem.short_description_ar || caseItem.short_description}
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="bg-primary/10 p-2 rounded-lg">
                          <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">المبلغ الشهري</div>
                          <div className="font-semibold">{caseItem.monthly_cost} جنيه</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 text-sm">
                        <div className="bg-primary/10 p-2 rounded-lg">
                          <Calendar className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">الشهور المكتملة</div>
                          <div className="font-semibold">{caseItem.months_covered} من {caseItem.months_needed}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 text-sm">
                        <div className="bg-primary/10 p-2 rounded-lg">
                          <Heart className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">المبلغ المجمع</div>
                          <div className="font-semibold">{(caseItem.total_secured_money || 0).toLocaleString()} جنيه</div>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">التقدم المالي</span>
                        <span className="font-bold text-primary">
                          {Math.round(((caseItem.total_secured_money || 0) / (caseItem.monthly_cost * caseItem.months_needed)) * 100)}%
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(((caseItem.total_secured_money || 0) / (caseItem.monthly_cost * caseItem.months_needed)) * 100, 100)}
                        className="h-3"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{(caseItem.total_secured_money || 0).toLocaleString()} جنيه</span>
                        <span>{(caseItem.monthly_cost * caseItem.months_needed).toLocaleString()} جنيه</span>
                      </div>
                    </div>

                    <Button className="w-full" size="lg">
                      عرض التفاصيل والمساهمة
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}

        {/* Other Cases Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {cases?.filter(c => c.title_ar !== "الدعم العام").map((caseItem) => (
            <Link key={caseItem.id} to={`/case/${caseItem.id}`} className="block">
              <Card className="overflow-hidden shadow-soft hover:shadow-lg transition-shadow cursor-pointer hover:scale-105 transform transition-transform">
              {caseItem.photo_url && (
                  <div className="relative h-40 sm:h-48 bg-gray-100">
                    <img 
                      src={caseItem.photo_url} 
                      alt={caseItem.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 sm:top-4 right-2 sm:right-4 flex flex-col sm:flex-row gap-2">
                      <Badge 
                        variant={caseItem.status === 'active' ? 'default' : 'secondary'}
                        className="bg-white/90 text-gray-800 text-xs"
                      >
                        {caseItem.status === 'active' ? 'نشطة' : 'مكتملة'}
                      </Badge>
                      {caseItem.deserve_zakkah && (
                        <Badge 
                          variant="outline"
                          className="bg-green-500/90 text-white border-green-600 text-xs"
                        >
                          مستحق للزكاة
                        </Badge>
                      )}
                      <Badge 
                        variant="outline"
                        className="bg-blue-500/90 text-white border-blue-600 text-xs flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3" />
                        {caseItem.reports_count || 0} تقرير
                      </Badge>
                    </div>
                  </div>
              )}
              
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">{caseItem.title_ar || caseItem.title}</CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
                <p className="text-muted-foreground line-clamp-3 text-sm sm:text-base">
                  {caseItem.short_description_ar || caseItem.short_description}
                </p>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>المبلغ الشهري المطلوب: {caseItem.monthly_cost} جنيه</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {caseItem.months_covered} من {caseItem.months_needed} شهر مكتمل
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Heart className="w-4 h-4" />
                    <span>المبلغ المجمع: {caseItem.total_secured_money || 0} جنيه</span>
                  </div>
                </div>

                {/* شريط التقدم المالي */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>التقدم المالي</span>
                    <span>
                      {Math.round(((caseItem.total_secured_money || 0) / (caseItem.monthly_cost * caseItem.months_needed)) * 100)}%
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(((caseItem.total_secured_money || 0) / (caseItem.monthly_cost * caseItem.months_needed)) * 100, 100)}
                    className="h-3"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{(caseItem.total_secured_money || 0).toLocaleString()} جنيه</span>
                    <span>{(caseItem.monthly_cost * caseItem.months_needed).toLocaleString()} جنيه</span>
                  </div>
                </div>

              </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {cases && cases.length === 0 && (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">لا توجد حالات متاحة حالياً</h3>
            <p className="text-muted-foreground">تابعنا لمعرفة الحالات الجديدة</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CasesList;