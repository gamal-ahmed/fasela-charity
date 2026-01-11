import { useState, useEffect } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useOrganizationById, useUpdateOrganization } from "@/hooks/useOrganization";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowRight, Building2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function OrganizationSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const { isSuperAdmin, isLoading: contextLoading } = useOrganization();
  const { data: organization, isLoading, refetch } = useOrganizationById(id);
  const updateOrg = useUpdateOrganization();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (organization) {
      setName(organization.name);
      setSlug(organization.slug);
      setLogoUrl(organization.logo_url || "");
      setIsActive(organization.is_active);
    }
  }, [organization]);

  if (contextLoading || isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]">جار التحميل...</div>;
  }

  if (!isSuperAdmin) {
    return <Navigate to="/admin" replace />;
  }

  if (!organization) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground mb-4">المنظمة غير موجودة</p>
        <Button asChild>
          <Link to="/admin/organizations">العودة للقائمة</Link>
        </Button>
      </div>
    );
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار صورة",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "خطأ",
        description: "حجم الصورة يجب أن يكون أقل من 2 ميجابايت",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${id}-${Date.now()}.${fileExt}`;
      const filePath = `organization-logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("public")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("public")
        .getPublicUrl(filePath);

      setLogoUrl(publicUrl);

      toast({
        title: "تم الرفع",
        description: "تم رفع الشعار بنجاح",
      });
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        title: "خطأ",
        description: err.message || "حدث خطأ أثناء رفع الشعار",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !slug.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      toast({
        title: "خطأ",
        description: "الرابط يجب أن يحتوي على أحرف إنجليزية صغيرة وأرقام وشرطات فقط",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateOrg.mutateAsync({
        id: id!,
        updates: {
          name,
          slug,
          logo_url: logoUrl || null,
          is_active: isActive,
        },
      });

      toast({
        title: "تم الحفظ",
        description: "تم حفظ التغييرات بنجاح",
      });

      refetch();
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        title: "خطأ",
        description: err.message || "حدث خطأ أثناء حفظ التغييرات",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/admin/organizations" className="hover:text-foreground">
          المنظمات
        </Link>
        <ArrowRight className="h-4 w-4" />
        <span>{organization.name}</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">إعدادات المنظمة</h1>
          <p className="text-muted-foreground">تعديل بيانات المنظمة</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>البيانات الأساسية</CardTitle>
            <CardDescription>المعلومات الأساسية للمنظمة</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">اسم المنظمة</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slug">الرابط المختصر</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                dir="ltr"
                className="text-left"
              />
              <p className="text-xs text-muted-foreground">
                أحرف إنجليزية صغيرة وأرقام وشرطات فقط
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="active">الحالة</Label>
                <p className="text-xs text-muted-foreground">
                  تفعيل أو تعطيل المنظمة
                </p>
              </div>
              <Switch
                id="active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الشعار</CardTitle>
            <CardDescription>شعار المنظمة الذي يظهر في الواجهة</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={name}
                  className="h-20 w-20 rounded-lg object-cover border"
                />
              ) : (
                <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1">
                <Label htmlFor="logo" className="cursor-pointer">
                  <div className="flex items-center gap-2 text-sm text-primary hover:underline">
                    <Upload className="h-4 w-4" />
                    {uploading ? "جار الرفع..." : "رفع شعار جديد"}
                  </div>
                </Label>
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploading}
                  className="hidden"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG حتى 2 ميجابايت
                </p>
              </div>
            </div>
            {logoUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLogoUrl("")}
              >
                إزالة الشعار
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" asChild>
          <Link to="/admin/organizations">إلغاء</Link>
        </Button>
        <Button onClick={handleSave} disabled={updateOrg.isPending}>
          {updateOrg.isPending ? "جار الحفظ..." : "حفظ التغييرات"}
        </Button>
      </div>
    </div>
  );
}
