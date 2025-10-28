import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, LogOut, FileText, Users, BarChart3, CreditCard, Home, Heart, Calendar, CheckSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import CaseForm from "@/components/admin/CaseForm";
import CasesList from "@/components/admin/CasesList";
import ReportForm from "@/components/admin/ReportForm";
import ReportsList from "@/components/admin/ReportsList";
import { DonationAuditDelivery } from "@/components/admin/DonationAuditDelivery";
import { MonthlyDonationsView } from "@/components/admin/MonthlyDonationsView";
import FollowupActionsDashboard from "@/components/admin/FollowupActionsDashboard";

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-4">
            {/* Top row - Logo and brand */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/lovable-uploads/1377342f-e772-4165-b1d5-8f6cbc909fa4.png" alt="الشعار" className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0" />
                <span className="text-lg sm:text-xl font-bold">فَسِيلَة خير</span>
              </div>
              <Button variant="outline" onClick={handleSignOut} size="sm" className="text-xs sm:text-sm">
                <LogOut className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
                <span className="hidden xs:inline">خروج</span>
                <span className="xs:hidden">خروج</span>
              </Button>
            </div>
            
            {/* Second row - Navigation and user info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <nav className="flex items-center gap-2 sm:gap-4">
                <Button variant="outline" size="sm" asChild className="bg-primary text-primary-foreground border-primary hover:bg-primary/90">
                  <Link to="/" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                    <Home className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">الرئيسية</span>
                    <span className="sm:hidden">الرئيسية</span>
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/admin/calendar" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">تقويم التسليم</span>
                    <span className="sm:hidden">تقويم</span>
                  </Link>
                </Button>
              </nav>
              <div className="text-right">
                <h1 className="text-base sm:text-lg font-semibold">لوحة تحكم المتطوعين</h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate max-w-[200px] sm:max-w-none">{user.email}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8">
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

          <TabsContent value="cases">
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
      </div>
    </div>
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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
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
    </div>
  );
};

export default AdminDashboard;