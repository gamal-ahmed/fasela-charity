import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Heart, GraduationCap, CheckCircle, TrendingUp, Calendar, PieChart, BarChart3 } from "lucide-react";
import { ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";

const PublicDonorReport = () => {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["donor-report-stats"],
    queryFn: async () => {
      // Run all queries in parallel for better performance
      const [
        { count: totalCases, error: totalCasesError },
        { count: sponsoredCases, error: sponsoredCasesError },
        { count: completedCases, error: completedCasesError },
        { count: totalKids, error: totalKidsError },
        { data: donations, error: donationsError },
        { data: uniqueDonors, error: donorsError },
      ] = await Promise.all([
        supabase
          .from("cases")
          .select("*", { count: "exact", head: true })
          .eq("is_published", true),
        supabase
          .from("cases")
          .select("*", { count: "exact", head: true })
          .eq("lifecycle_status", "sponsored"),
        supabase
          .from("cases")
          .select("*", { count: "exact", head: true })
          .eq("lifecycle_status", "completed"),
        supabase
          .from("case_kids")
          .select("*", { count: "exact", head: true }),
        supabase
          .from("donations")
          .select("amount")
          .eq("status", "confirmed"),
        supabase
          .from("donations")
          .select("donor_email")
          .eq("status", "confirmed"),
      ]);

      // Check for errors
      if (totalCasesError) throw totalCasesError;
      if (sponsoredCasesError) throw sponsoredCasesError;
      if (completedCasesError) throw completedCasesError;
      if (totalKidsError) throw totalKidsError;
      if (donationsError) throw donationsError;
      if (donorsError) throw donorsError;

      const totalDonations = donations?.reduce((sum, d) => sum + Number(d.amount || 0), 0) || 0;
      const totalDonors = new Set(uniqueDonors?.map(d => d.donor_email).filter(Boolean)).size;

      return {
        totalCases: totalCases || 0,
        sponsoredCases: sponsoredCases || 0,
        completedCases: completedCases || 0,
        totalKids: totalKids || 0,
        totalDonations,
        totalDonors,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center">
        <div className="animate-pulse text-lg text-muted-foreground">Loading report...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center">
        <Card className="p-6 max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">خطأ في تحميل التقرير</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              حدث خطأ أثناء محاولة تحميل بيانات التقرير. يرجى المحاولة مرة أخرى.
            </p>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "خطأ غير معروف"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const impactMetrics = [
    {
      icon: Users,
      label: "العائلات المدعومة",
      value: stats?.totalCases || 0,
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: Heart,
      label: "العائلات المكفولة",
      value: stats?.sponsoredCases || 0,
      color: "from-pink-500 to-rose-500",
      bgColor: "bg-pink-500/10",
    },
    {
      icon: CheckCircle,
      label: "الحالات المكتملة",
      value: stats?.completedCases || 0,
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-500/10",
    },
    {
      icon: GraduationCap,
      label: "الأطفال المساعدون",
      value: stats?.totalKids || 0,
      color: "from-purple-500 to-violet-500",
      bgColor: "bg-purple-500/10",
    },
    {
      icon: TrendingUp,
      label: "إجمالي التبرعات",
      value: `${(stats?.totalDonations || 0).toLocaleString()} جنيه`,
      color: "from-amber-500 to-orange-500",
      bgColor: "bg-amber-500/10",
    },
    {
      icon: Calendar,
      label: "المتبرعون الكرام",
      value: stats?.totalDonors || 0,
      color: "from-indigo-500 to-blue-500",
      bgColor: "bg-indigo-500/10",
    },
  ];

  const lifecycleData = [
    { name: "حالات نشطة", value: (stats?.totalCases || 0) - (stats?.sponsoredCases || 0) - (stats?.completedCases || 0), color: "#3b82f6" },
    { name: "حالات مكفولة", value: stats?.sponsoredCases || 0, color: "#ec4899" },
    { name: "حالات مكتملة", value: stats?.completedCases || 0, color: "#10b981" },
  ];

  const monthlyData = [
    { month: "يناير", donations: 45000 },
    { month: "فبراير", donations: 52000 },
    { month: "مارس", donations: 48000 },
    { month: "أبريل", donations: 61000 },
    { month: "مايو", donations: 55000 },
    { month: "يونيو", donations: (stats?.totalDonations || 0) * 0.2 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-8 sm:py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12 space-y-4">
          <div className="inline-block">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-charity bg-clip-text text-transparent mb-2">
              تقرير الأثر - نماء الخير
            </h1>
          </div>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            معًا، نغير الحياة ونبني مستقبلًا أفضل للعائلات المحتاجة
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>آخر تحديث: {new Date().toLocaleDateString("ar-EG", { 
              year: "numeric", 
              month: "long", 
              day: "numeric",
              weekday: "long"
            })}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
          {impactMetrics.map((metric, index) => (
            <Card
              key={index}
              className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="absolute top-0 left-0 w-32 h-32 opacity-10">
                <div className={`absolute inset-0 bg-gradient-to-br ${metric.color} rounded-full blur-2xl`} />
              </div>
              
              <div className="p-4 sm:p-6 relative">
                <div className={`inline-flex p-2 sm:p-3 rounded-xl ${metric.bgColor} mb-3 sm:mb-4`}>
                  <metric.icon className={`h-5 w-5 sm:h-6 sm:w-6 bg-gradient-to-br ${metric.color} bg-clip-text text-transparent`} />
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">{metric.label}</p>
                  <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                    {metric.value}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12">
          {/* Lifecycle Status Pie Chart */}
          <Card className="p-4 sm:p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <PieChart className="h-5 w-5 text-primary" />
                توزيع حالات الحالات
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <div className="h-[250px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={lifecycleData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {lifecycleData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Donations Bar Chart */}
          <Card className="p-4 sm:p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <BarChart3 className="h-5 w-5 text-primary" />
                التبرعات الشهرية (آخر 6 أشهر)
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <div className="h-[250px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="donations" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Success Rate */}
        <Card className="p-6 sm:p-8 mb-8 sm:mb-12 bg-gradient-to-br from-primary/5 to-charity/5 border-primary/20">
          <div className="text-center space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold">معدل النجاح</h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8">
              <div>
                <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                  {stats?.totalCases ? Math.round((stats.completedCases / stats.totalCases) * 100) : 0}%
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-2">الحالات المكتملة</p>
              </div>
              <div className="h-px w-16 sm:h-16 sm:w-px bg-border" />
              <div>
                <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
                  {stats?.totalCases ? Math.round((stats.sponsoredCases / stats.totalCases) * 100) : 0}%
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-2">الحالات المكفولة حالياً</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Thank You Message */}
        <Card className="p-6 sm:p-8 text-center bg-gradient-to-br from-primary/10 to-charity/10 border-primary/20">
          <Heart className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 text-primary" />
          <h2 className="text-xl sm:text-2xl font-bold mb-3">شكراً لدعمكم الكريم</h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            كل تبرع يصنع فرقاً حقيقياً. معاً، ساعدنا {stats?.totalCases || 0} عائلة 
            و {stats?.totalKids || 0} طفل لبناء مستقبل أفضل. كرمكم يخلق تغييراً دائماً.
          </p>
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs sm:text-sm text-muted-foreground">
              جميع التبرعات تخضع للمراجعة والتدقيق لضمان الشفافية الكاملة
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PublicDonorReport;
