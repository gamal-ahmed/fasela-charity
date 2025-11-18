import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Settings, Users, Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

const Navigation = () => {
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            checkUserRole(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkUserRole(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single();

      if (!error && data?.role === "admin") {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      setIsAdmin(false);
    }
  };
  
  return (
    <nav className="flex items-center gap-3 sm:gap-6">
      <Link 
        to="/" 
        className={`flex items-center gap-2 text-white/80 hover:text-white transition-colors ${
          isActive('/') ? 'text-white font-medium' : ''
        }`}
      >
        <img src="/lovable-uploads/1377342f-e772-4165-b1d5-8f6cbc909fa4.png" alt="الشعار" className="w-6 h-6" />
        <span className="hidden sm:inline">الرئيسية</span>
      </Link>
      
      <Link 
        to="/monthly-report" 
        className={`flex items-center gap-2 text-white/80 hover:text-white transition-colors ${
          isActive('/monthly-report') ? 'text-white font-medium' : ''
        }`}
      >
        <Heart className="w-4 h-4" />
        <span className="hidden sm:inline">التقرير الشهري</span>
      </Link>
      
      {!user && (
        <Link 
          to="/auth" 
          className={`flex items-center gap-2 text-white/80 hover:text-white transition-colors ${
            isActive('/auth') ? 'text-white font-medium' : ''
          }`}
        >
          <Heart className="w-4 h-4" />
          <span className="hidden sm:inline">تسجيل الدخول</span>
        </Link>
      )}
      
      {user && isAdmin && (
        <Link 
          to="/admin" 
          className={`flex items-center gap-2 text-white/80 hover:text-white transition-colors ${
            isActive('/admin') ? 'text-white font-medium' : ''
          }`}
        >
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">لوحة التحكم</span>
        </Link>
      )}
    </nav>
  );
};

export default Navigation;