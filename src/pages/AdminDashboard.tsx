import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, LogOut, FileText, Users, BarChart3, CreditCard, Home, Heart, Calendar, CheckSquare, ExternalLink, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CaseForm from "@/components/admin/CaseForm";
import CasesList from "@/components/admin/CasesList";
import ReportForm from "@/components/admin/ReportForm";
import ReportsList from "@/components/admin/ReportsList";
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
            <TabsList className="grid w-full min-w-[840px] sm:min-w-0 grid-cols-7 gap-1 h-auto p-1">
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
  const { data: cases } = useQuery({
    queryKey: ["admin-cases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cases")
        .select("*");
      if (error) throw error;
      return data;
    }
  });

  const { data: donations } = useQuery({
    queryKey: ["admin-donations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donations")
        .select("*");
      if (error) throw error;
      return data;
    }
  });

  const { data: reports } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("monthly_reports")
        .select("*")
        .gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());
      if (error) throw error;
      return data;
    }
  });

  const totalCases = cases?.length || 0;
  const activeCases = cases?.filter(c => c.status === 'active').length || 0;
  const totalDonations = donations?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0;
  const monthlyReports = reports?.length || 0;
  const { toast } = useToast();

  const handleCopyReportUrl = () => {
    const reportUrl = `${window.location.origin}/donor-report`;
    navigator.clipboard.writeText(reportUrl);
    toast({
      title: "تم النسخ",
      description: "تم نسخ رابط تقرير المتبرعين",
    });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">إجمالي الحالات</CardTitle>
          <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold">{totalCases}</div>
          <p className="text-xs text-muted-foreground">جميع الحالات المسجلة</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">الحالات النشطة</CardTitle>
          <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold">{activeCases}</div>
          <p className="text-xs text-muted-foreground">{totalCases > 0 ? Math.round((activeCases / totalCases) * 100) : 0}% من إجمالي الحالات</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">إجمالي التبرعات</CardTitle>
          <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold">{totalDonations.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">جنيه مصري</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">التقارير هذا الشهر</CardTitle>
          <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold">{monthlyReports}</div>
          <p className="text-xs text-muted-foreground">تقرير شهري</p>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">تقرير المتبرعين</CardTitle>
          <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => window.open('/donor-report', '_blank')}
            >
              <ExternalLink className="h-3 w-3 ml-2" />
              عرض التقرير
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={handleCopyReportUrl}
            >
              <Copy className="h-3 w-3 ml-2" />
              نسخ الرابط
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;