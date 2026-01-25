import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const AdminProfilePage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Password change state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        navigate("/auth");
      } else {
        setSession(session);
        setUser(session.user);
      }
      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    // Validate inputs
    if (!currentPassword.trim()) {
      setPasswordError("يرجى إدخال كلمة المرور الحالية");
      return;
    }

    if (!newPassword.trim()) {
      setPasswordError("يرجى إدخال كلمة المرور الجديدة");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("كلمات المرور الجديدة غير متطابقة");
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError("كلمة المرور الجديدة يجب أن تكون مختلفة عن الحالية");
      return;
    }

    try {
      setIsSubmittingPassword(true);

      // First, verify the current password by trying to sign in
      if (user?.email) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        });

        if (signInError) {
          setPasswordError("كلمة المرور الحالية غير صحيحة");
          return;
        }
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setPasswordError(updateError.message);
        return;
      }

      toast({
        title: "تم التحديث",
        description: "تم تغيير كلمة المرور بنجاح",
      });

      // Reset form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsChangingPassword(false);
    } catch (error: any) {
      setPasswordError(error.message || "حدث خطأ أثناء تغيير كلمة المرور");
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button onClick={() => navigate("/admin")} className="hover:text-foreground">
          لوحة التحكم
        </button>
        <ArrowRight className="h-4 w-4" />
        <span>الملف الشخصي</span>
      </div>

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">الملف الشخصي</h1>
        <p className="text-muted-foreground">إدارة حسابك وإعدادات الأمان</p>
      </div>

      {/* User Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>معلومات الحساب</CardTitle>
          <CardDescription>بيانات حسابك الأساسية</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-base font-semibold">البريد الإلكتروني</Label>
              <Input
                value={user.email || ""}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-base font-semibold">معرف المستخدم</Label>
              <Input
                value={user.id.slice(0, 8) + "..."}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-base font-semibold">اسم المستخدم</Label>
              <Input
                value={user.user_metadata?.name || "غير محدد"}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-base font-semibold">تاريخ التسجيل</Label>
              <Input
                value={new Date(user.created_at).toLocaleDateString("ar-EG")}
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          {user.user_metadata?.phone && (
            <div className="space-y-2">
              <Label className="text-base font-semibold">رقم الهاتف</Label>
              <Input
                value={user.user_metadata.phone}
                disabled
                className="bg-muted"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Change Password Card */}
      <Card>
        <CardHeader>
          <CardTitle>الأمان</CardTitle>
          <CardDescription>إدارة كلمة المرور والأمان</CardDescription>
        </CardHeader>
        <CardContent>
          {!isChangingPassword ? (
            <Button onClick={() => setIsChangingPassword(true)} variant="outline">
              تغيير كلمة المرور
            </Button>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4">
              {passwordError && (
                <Alert variant="destructive">
                  <AlertDescription>{passwordError}</AlertDescription>
                </Alert>
              )}

              {/* Current Password */}
              <div className="space-y-2">
                <Label htmlFor="current-password" className="text-base font-semibold">
                  كلمة المرور الحالية
                </Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور الحالية"
                    disabled={isSubmittingPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-base font-semibold">
                  كلمة المرور الجديدة
                </Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور الجديدة"
                    disabled={isSubmittingPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-base font-semibold">
                  تأكيد كلمة المرور الجديدة
                </Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور الجديدة مرة أخرى"
                    disabled={isSubmittingPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmittingPassword}
                  className="min-w-[100px]"
                >
                  {isSubmittingPassword ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    "حفظ"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsChangingPassword(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setPasswordError("");
                  }}
                  disabled={isSubmittingPassword}
                >
                  إلغاء
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Additional Security Info */}
      <Card className="bg-muted/50 border-muted">
        <CardHeader>
          <CardTitle className="text-base">نصائح الأمان</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3 text-muted-foreground">
          <ul className="list-disc list-inside space-y-2">
            <li>استخدم كلمة مرور قوية تحتوي على أحرف وأرقام ورموز</li>
            <li>لا تشارك كلمة المرور مع أي شخص آخر</li>
            <li>غير كلمة المرور بشكل دوري</li>
            <li>استخدم بريد إلكتروني فريد لحسابك</li>
            <li>تأكد من تسجيل الخروج عند استخدام جهاز مشترك</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminProfilePage;
