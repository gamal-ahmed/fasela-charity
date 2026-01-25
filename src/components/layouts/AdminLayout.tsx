import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarTrigger } from "@/components/ui/sidebar";
import { Home, Users, Calendar, CreditCard, CheckSquare, FileText, LogOut, Settings, Building2, User } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { KidsSidebarItem } from "@/components/admin/KidsSidebarItem";
import { AdminStatsSummary } from "@/components/admin/AdminStatsSummary";
import { OrganizationProvider, useOrganization } from "@/contexts/OrganizationContext";
import { OrgSelector } from "@/components/admin/OrgSelector";
import { OrgSelectionModal } from "@/components/admin/OrgSelectionModal";

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentOrg, isSuperAdmin } = useOrganization();

  const queryClient = useQueryClient();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate("/auth");
        return;
      }

      // Use the database function to get user organizations
      const { data, error } = await (supabase.rpc as any)('get_user_organizations', { check_user_id: session.user.id });

      // Check for admin role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      const isAdmin = roles?.some(r => r.role === "admin");

      if (!isAdmin) {
        toast({
          title: "غير مصرح",
          description: "ليس لديك صلاحيات المسؤول",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setIsLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تسجيل الخروج",
        variant: "destructive",
      });
    } else {
      try {
        queryClient.clear();
      } catch (e) {
        // ignore
      }

      toast({
        title: "تم تسجيل الخروج",
        description: "تم تسجيل الخروج بنجاح",
      });

      navigate("/auth");
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">جار التحميل...</div>;
  }

  const items = [
    {
      title: "نظرة عامة",
      url: "/admin",
      icon: Home,
    },
    {
      title: "إدارة الحالات",
      url: "/admin/cases",
      icon: Users,
    },
    {
      title: "التقويم",
      url: "/admin/calendar",
      icon: Calendar,
    },
    {
      title: "التبرعات",
      url: "/admin/donations",
      icon: CreditCard,
    },
    {
      title: "المهام والمتابعة",
      url: "/admin/tasks",
      icon: CheckSquare,
    },
    {
      title: "التقارير",
      url: "/admin/reports",
      icon: FileText,
    },
    {
      title: "الصفحات الثابتة",
      url: "/admin/static-pages",
      icon: Settings,
    },
  ];

  // Add Organizations link for super admins
  const superAdminItems = isSuperAdmin
    ? [
      {
        title: "المنظمات",
        url: "/admin/organizations",
        icon: Building2,
      },
    ]
    : [];

  return (
    <SidebarProvider>
      <OrgSelectionModal />
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar side="right">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>لوحة التحكم</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.slice(0, 2).map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                        <Link to={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}

                  <KidsSidebarItem />

                  {items.slice(2).map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                        <Link to={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}

                  {/* Super admin only items */}
                  {superAdminItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                        <Link to={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <div className="mt-auto p-4 space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <Link to="/admin/profile">
                  <User className="mr-2 h-4 w-4" />
                  الملف الشخصي
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <Link to="/">
                  <Home className="mr-2 h-4 w-4" />
                  الصفحة الرئيسية
                </Link>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                تسجيل الخروج
              </Button>
            </div>
          </SidebarContent>
        </Sidebar>
        <main className="flex-1 overflow-auto">
          <div className="p-4 flex items-center justify-between border-b">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="font-semibold text-lg">
                {items.find(i => i.url === location.pathname)?.title ||
                  superAdminItems.find(i => i.url === location.pathname)?.title ||
                  "لوحة التحكم"}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <OrgSelector />
              <AdminStatsSummary />
            </div>
          </div>
          <div className="p-4 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <OrganizationProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </OrganizationProvider>
  );
}
