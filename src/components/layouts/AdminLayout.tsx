import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarTrigger } from "@/components/ui/sidebar";
import { Home, Users, Baby, Calendar, CreditCard, CheckSquare, FileText, LogOut } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

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
      title: "إدارة الأطفال",
      url: "/admin/kids",
      icon: Baby,
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
  ];

  return (
    <SidebarProvider direction="rtl">
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar side="right">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>لوحة التحكم</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => (
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
            
            <div className="mt-auto p-4">
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
          <div className="p-4 flex items-center gap-4 border-b">
            <SidebarTrigger />
            <h1 className="font-semibold text-lg">
              {items.find(i => i.url === location.pathname)?.title || "لوحة التحكم"}
            </h1>
          </div>
          <div className="p-4 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
