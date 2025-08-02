import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Users, Calendar, Heart, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import Navigation from "@/components/Navigation";

const CasesList = () => {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [zakahFilter, setZakahFilter] = useState<string>("all");

  const { data: allCases, isLoading } = useQuery({
    queryKey: ["cases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cases")
        .select("*")
        .eq("is_published", true)
        .not("title_ar", "is", null)
        .not("description_ar", "is", null)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
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
      <div className="relative gradient-hero text-white py-20 overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
        <div className="relative container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-b from-white to-white/90 bg-clip-text text-transparent">
            جميع الحالات المحتاجة
          </h1>
          <p className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto leading-relaxed">
            اختر الأسرة التي تود كفالتها واتبع رحلتها الشهرية بشفافية كاملة
          </p>
          
          {/* Statistics Section */}
          <div className="mt-10 mb-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {/* Number of sponsored families */}
              <div className="text-center">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg hover:bg-white/15 transition-all">
                  <div className="text-3xl mb-2">👨‍👩‍👧‍👦</div>
                  <div className="text-3xl font-bold text-white mb-1">{sponsoredFamilies}</div>
                  <div className="text-sm text-white/80">الأسر المكفولة</div>
                </div>
              </div>
              
              {/* Number of sponsored orphan children - admin configurable */}
              <div className="text-center">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg hover:bg-white/15 transition-all">
                  <div className="text-3xl mb-2">👶</div>
                  <div className="text-3xl font-bold text-white mb-1">{sponsoredOrphans}</div>
                  <div className="text-sm text-white/80">الأيتام المكفولين</div>
                </div>
              </div>
              
              {/* Number of children taught Quran, Sunnah and electronics - admin configurable */}
              <div className="text-center">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg hover:bg-white/15 transition-all">
                  <div className="text-3xl mb-2">📚</div>
                  <div className="text-3xl font-bold text-white mb-1">{childrenEducated}</div>
                  <div className="text-sm text-white/80">الأطفال المتعلمين</div>
                </div>
              </div>
              
              {/* Number of cases we helped - calculated */}
              <div className="text-center">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg hover:bg-white/15 transition-all">
                  <div className="text-3xl mb-2">✅</div>
                  <div className="text-3xl font-bold text-white mb-1">{completedCases}</div>
                  <div className="text-sm text-white/80">مجمل الحالات</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Progress Section */}
          <div className="mt-12 max-w-2xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 shadow-lg">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-3 text-white">إجمالي التقدم في جمع التبرعات</h3>
                <div className="flex justify-between items-center text-sm opacity-90 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">{totalCollected.toLocaleString()}</div>
                    <div className="text-xs text-white/80">المجمع (جنيه)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">{totalNeeded.toLocaleString()}</div>
                    <div className="text-xs text-white/80">المطلوب (جنيه)</div>
                  </div>
                </div>
              </div>
              
              {/* Enhanced Progress Bar */}
              <div className="relative">
                <div className="w-full bg-white/20 rounded-full h-4 overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-white to-white/90 rounded-full transition-all duration-1000 ease-out animate-scale-in relative overflow-hidden"
                    style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                  </div>
                </div>
                <div className="text-center mt-3">
                  <span className="text-2xl font-bold text-white drop-shadow-lg">
                    {Math.round(progressPercentage)}%
                  </span>
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
      <div className="container mx-auto px-4 py-12">
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

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases?.map((caseItem) => (
            <Link key={caseItem.id} to={`/case/${caseItem.id}`} className="block">
              <Card className="overflow-hidden shadow-soft hover:shadow-lg transition-shadow cursor-pointer hover:scale-105 transform transition-transform">
              {caseItem.photo_url && (
                  <div className="relative h-48 bg-gray-100">
                    <img 
                      src={caseItem.photo_url} 
                      alt={caseItem.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 right-4 flex gap-2">
                      <Badge 
                        variant={caseItem.status === 'active' ? 'default' : 'secondary'}
                        className="bg-white/90 text-gray-800"
                      >
                        {caseItem.status === 'active' ? 'نشطة' : 'مكتملة'}
                      </Badge>
                      {caseItem.deserve_zakkah && (
                        <Badge 
                          variant="outline"
                          className="bg-green-500/90 text-white border-green-600"
                        >
                          مستحق للزكاة
                        </Badge>
                      )}
                    </div>
                  </div>
              )}
              
              <CardHeader>
                <CardTitle className="text-xl">{caseItem.title_ar || caseItem.title}</CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-muted-foreground line-clamp-3">
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

                {/* شريط التقدم */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>التقدم</span>
                    <span>
                      {Math.round((caseItem.months_covered / caseItem.months_needed) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-primary to-primary-glow h-2 rounded-full transition-all"
                      style={{ 
                        width: `${Math.min((caseItem.months_covered / caseItem.months_needed) * 100, 100)}%` 
                      }}
                    ></div>
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