import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Plus, LogOut, FileText, Users, BarChart3, CreditCard, Home, Heart, Calendar, CheckSquare, ExternalLink, Copy, ArrowRight, Baby } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CaseForm from "@/components/admin/CaseForm";
import CasesList from "@/components/admin/CasesList";
import ReportForm from "@/components/admin/ReportForm";
import ReportsList from "@/components/admin/ReportsList";
import KidsListAdmin from "@/components/admin/KidsListAdmin";
import { DonationAuditDelivery } from "@/components/admin/DonationAuditDelivery";
import { MonthlyDonationsView } from "@/components/admin/MonthlyDonationsView";
import FollowupActionsDashboard from "@/components/admin/FollowupActionsDashboard";
import AdminHeader from "@/components/admin/AdminHeader";

const AdminDashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session?.user) {
          navigate("/auth");
        } else {
          checkUserRole(session.user.id);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (!session?.user) {
        navigate("/auth");
      } else {
        checkUserRole(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (error) {
        console.error("Error checking user role:", error);
        return;
      }

      const hasAdminRole = data?.some(role => role.role === "admin") || false;
      setIsAdmin(hasAdminRole || false);
      
      if (!hasAdminRole) {
        toast({
          title: "غير مخول",
          description: "ليس لديك صلاحية للوصول إلى لوحة التحكم",
          variant: "destructive",
        });
        navigate("/");
      }
    } catch (error) {
      console.error("Error checking user role:", error);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تسجيل الخروج",
        variant: "destructive",
      });
    } else {
      toast({
        title: "تم تسجيل الخروج",
        description: "تم تسجيل الخروج بنجاح",
      });
      navigate("/auth");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl">جار التحميل...</div>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <AdminHeader title="لوحة التحكم">
        <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
          {/* Mobile-optimized TabsList */}
          <div className="w-full overflow-x-auto">
            <TabsList className="grid w-full min-w-[960px] sm:min-w-0 grid-cols-8 gap-1 h-auto p-1">
              <TabsTrigger value="overview" className="flex flex-col sm:flex-row items-center gap-1 text-xs sm:text-sm py-2 sm:py-3 px-2 sm:px-4">
                <BarChart3 className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">نظرة عامة</span>
                <span className="sm:hidden text-[10px] leading-tight">عامة</span>
              </TabsTrigger>
              <TabsTrigger value="cases" className="flex flex-col sm:flex-row items-center gap-1 text-xs sm:text-sm py-2 sm:py-3 px-2 sm:px-4">
                <Users className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">إدارة الحالات</span>
                <span className="sm:hidden text-[10px] leading-tight">الحالات</span>
              </TabsTrigger>
              <TabsTrigger value="kids" className="flex flex-col sm:flex-row items-center gap-1 text-xs sm:text-sm py-2 sm:py-3 px-2 sm:px-4">
                <Baby className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">الأطفال</span>
                <span className="sm:hidden text-[10px] leading-tight">أطفال</span>
              </TabsTrigger>
              <TabsTrigger value="donation-audit" className="flex flex-col sm:flex-row items-center gap-1 text-xs sm:text-sm py-2 sm:py-3 px-2 sm:px-4">
                <CreditCard className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">مراجعة وتسليم التبرعات</span>
                <span className="sm:hidden text-[10px] leading-tight">التبرعات</span>
              </TabsTrigger>
              <TabsTrigger value="monthly-donations" className="flex flex-col sm:flex-row items-center gap-1 text-xs sm:text-sm py-2 sm:py-3 px-2 sm:px-4">
                <Heart className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">التبرعات الشهرية</span>
                <span className="sm:hidden text-[10px] leading-tight">شهري</span>
              </TabsTrigger>
              <TabsTrigger value="tasks" className="flex flex-col sm:flex-row items-center gap-1 text-xs sm:text-sm py-2 sm:py-3 px-2 sm:px-4">
                <CheckSquare className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">المهام والمتابعة</span>
                <span className="sm:hidden text-[10px] leading-tight">مهام</span>
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex flex-col sm:flex-row items-center gap-1 text-xs sm:text-sm py-2 sm:py-3 px-2 sm:px-4">
                <FileText className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">التقارير</span>
                <span className="sm:hidden text-[10px] leading-tight">تقارير</span>
              </TabsTrigger>
              <TabsTrigger value="add-case" className="flex flex-col sm:flex-row items-center gap-1 text-xs sm:text-sm py-2 sm:py-3 px-2 sm:px-4">
                <Plus className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">إضافة حالة</span>
                <span className="sm:hidden text-[10px] leading-tight">إضافة</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            <StatsOverview />
          </TabsContent>

          <TabsContent value="cases" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">إدارة الحالات</h2>
              <Button asChild>
                <Link to="/admin/cases">
                  <Users className="w-4 h-4 ml-2" />
                  عرض جميع الحالات
                </Link>
              </Button>
            </div>
            <CasesList />
          </TabsContent>

          <TabsContent value="kids" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">إدارة الأطفال</h2>
              <Button asChild>
                <Link to="/kids">
                  <Baby className="w-4 h-4 ml-2" />
                  عرض جميع الأطفال
                </Link>
              </Button>
            </div>
            <KidsListAdmin />
          </TabsContent>

          <TabsContent value="donation-audit">
            <DonationAuditDelivery />
          </TabsContent>

          <TabsContent value="monthly-donations">
            <MonthlyDonationsView />
          </TabsContent>

          <TabsContent value="tasks">
            <FollowupActionsDashboard />
          </TabsContent>

          <TabsContent value="reports">
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h2 className="text-xl sm:text-2xl font-bold">التقارير الشهرية</h2>
                <ReportForm />
              </div>
              <ReportsList />
            </div>
          </TabsContent>

          <TabsContent value="add-case">
            <div className="max-w-full lg:max-w-2xl mx-auto">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">إضافة حالة جديدة</h2>
              <CaseForm />
            </div>
          </TabsContent>
        </Tabs>
    </AdminHeader>
  );
};

const StatsOverview = () => {
  const { toast } = useToast();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [casesData, donationsData, reportsData, kidsData, followupsData, handoversData] = await Promise.all([
        supabase.from("cases").select("*"),
        supabase.from("donations").select("*"),
        supabase.from("monthly_reports").select("*"),
        supabase.from("case_kids").select("*"),
        supabase.from("followup_actions").select("*"),
        supabase.from("donation_handovers").select("*"),
      ]);

      const confirmedDonations = donationsData.data?.filter(d => d.status === "confirmed") || [];
      const pendingDonations = donationsData.data?.filter(d => d.status === "pending") || [];
      const pendingFollowups = followupsData.data?.filter(f => f.status === "pending") || [];
      const completedFollowups = followupsData.data?.filter(f => f.status === "completed") || [];

      return {
        totalCases: casesData.data?.length || 0,
        activeCases: casesData.data?.filter(c => c.status === "active" && c.is_published).length || 0,
        completedCases: casesData.data?.filter(c => c.lifecycle_status === "completed").length || 0,
        totalKids: kidsData.data?.length || 0,
        totalDonations: confirmedDonations.reduce((sum, d) => sum + Number(d.amount), 0),
        pendingDonationsAmount: pendingDonations.reduce((sum, d) => sum + Number(d.amount), 0),
        pendingDonationsCount: pendingDonations.length,
        monthlyReports: reportsData.data?.length || 0,
        totalFollowups: followupsData.data?.length || 0,
        pendingFollowups: pendingFollowups.length,
        completedFollowups: completedFollowups.length,
        totalHandovers: handoversData.data?.reduce((sum, h) => sum + Number(h.handover_amount), 0) || 0,
      };
    },
  });

  if (isLoading) {
    return <div>جار التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">لوحة المراقبة الشاملة</h2>
        <p className="text-muted-foreground">نظرة عامة على الأداء والإحصائيات الرئيسية</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الحالات</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCases || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              نشطة: {stats?.activeCases || 0} | مكتملة: {stats?.completedCases || 0}
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">التبرعات المؤكدة</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalDonations.toLocaleString()} ريال</div>
            <p className="text-xs text-muted-foreground mt-1">
              تم التسليم: {stats?.totalHandovers.toLocaleString()} ريال
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">التبرعات المعلقة</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingDonationsCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              المبلغ: {stats?.pendingDonationsAmount.toLocaleString()} ريال
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المتابعات</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalFollowups || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              معلقة: {stats?.pendingFollowups || 0} | مكتملة: {stats?.completedFollowups || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الأطفال</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalKids || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">التقارير الشهرية</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.monthlyReports || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              ملخص الحالات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">الحالات النشطة المنشورة</span>
                <span className="font-bold text-primary">{stats?.activeCases || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">إجمالي الحالات</span>
                <span className="font-bold">{stats?.totalCases || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">الحالات المكتملة</span>
                <span className="font-bold text-green-600">{stats?.completedCases || 0}</span>
              </div>
              <Button className="w-full mt-4" asChild>
                <Link to="/admin/cases">
                  عرض جميع الحالات
                  <ArrowRight className="h-4 w-4 mr-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-blue-500" />
              ملخص المتابعات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">المتابعات المعلقة</span>
                <span className="font-bold text-orange-600">{stats?.pendingFollowups || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">المتابعات المكتملة</span>
                <span className="font-bold text-green-600">{stats?.completedFollowups || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">إجمالي المتابعات</span>
                <span className="font-bold">{stats?.totalFollowups || 0}</span>
              </div>
              <Button className="w-full mt-4" asChild>
                <Link to="/admin/followups">
                  عرض جميع المتابعات
                  <ArrowRight className="h-4 w-4 mr-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            رابط تقرير المتبرعين
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input 
              value={`${window.location.origin}/donor-report`} 
              readOnly 
              className="flex-1"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/donor-report`);
                toast({
                  title: "تم النسخ",
                  description: "تم نسخ الرابط إلى الحافظة",
                });
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open(`${window.location.origin}/donor-report`, '_blank')}
            >
              فتح الرابط
              <ExternalLink className="h-4 w-4 mr-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;