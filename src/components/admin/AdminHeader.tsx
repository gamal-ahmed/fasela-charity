import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  ArrowRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AdminHeaderProps {
  title?: string;
  showBackButton?: boolean;
  backTo?: string;
  backLabel?: string;
  children?: React.ReactNode;
}

export default function AdminHeader({
  title = "لوحة التحكم",
  showBackButton = false,
  backTo = "/admin",
  backLabel = "العودة للوحة التحكم",
  children
}: AdminHeaderProps) {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/auth");
      toast({
        title: "تم تسجيل الخروج",
        description: "تم تسجيل الخروج بنجاح",
      });
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {showBackButton && (
                <Button variant="outline" size="sm" asChild>
                  <Link to={backTo}>
                    <ArrowRight className="h-4 w-4 ml-2" />
                    {backLabel}
                  </Link>
                </Button>
              )}
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">{title}</h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 ml-2" />
                <span className="hidden sm:inline">تسجيل الخروج</span>
                <span className="sm:hidden">خروج</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-4 sm:py-6">
        {children}
      </div>
    </div>
  );
}
