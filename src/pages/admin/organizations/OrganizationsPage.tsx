import { useState } from "react";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useAllOrganizations, useCreateOrganization, useDeleteOrganization } from "@/hooks/useOrganization";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Building2, Plus, Settings, Users, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link, Navigate } from "react-router-dom";

export default function OrganizationsPage() {
  const { isSuperAdmin, isLoading: contextLoading } = useOrganization();
  const { data: organizations, isLoading, refetch } = useAllOrganizations();
  const createOrg = useCreateOrganization();
  const deleteOrg = useDeleteOrganization();
  const { toast } = useToast();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgSlug, setNewOrgSlug] = useState("");

  // Wait for context to load before checking permissions
  if (contextLoading) {
    return <div className="flex items-center justify-center min-h-[400px]">جار التحميل...</div>;
  }

  // Redirect non-super admins
  if (!isSuperAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const handleCreateOrg = async () => {
    if (!newOrgName.trim() || !newOrgSlug.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول",
        variant: "destructive",
      });
      return;
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(newOrgSlug)) {
      toast({
        title: "خطأ",
        description: "الرابط يجب أن يحتوي على أحرف إنجليزية صغيرة وأرقام وشرطات فقط",
        variant: "destructive",
      });
      return;
    }

    try {
      await createOrg.mutateAsync({
        name: newOrgName,
        slug: newOrgSlug,
      });

      toast({
        title: "تم الإنشاء",
        description: "تم إنشاء المنظمة بنجاح",
      });

      setIsCreateDialogOpen(false);
      setNewOrgName("");
      setNewOrgSlug("");
      refetch();
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        title: "خطأ",
        description: err.message || "حدث خطأ أثناء إنشاء المنظمة",
        variant: "destructive",
      });
    }
  };

  const handleDeleteOrg = async (orgId: string) => {
    try {
      await deleteOrg.mutateAsync(orgId);
      toast({
        title: "تم الحذف",
        description: "تم حذف المنظمة بنجاح",
      });
      refetch();
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        title: "خطأ",
        description: err.message || "حدث خطأ أثناء حذف المنظمة",
        variant: "destructive",
      });
    }
  };

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setNewOrgName(name);
    // Generate slug: lowercase, replace spaces with hyphens, remove special chars
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    setNewOrgSlug(slug);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]">جار التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">إدارة المنظمات</h1>
          <p className="text-muted-foreground">إدارة المنظمات المسجلة في المنصة</p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 ml-2" />
              إنشاء منظمة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إنشاء منظمة جديدة</DialogTitle>
              <DialogDescription>
                أدخل بيانات المنظمة الجديدة
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">اسم المنظمة</Label>
                <Input
                  id="name"
                  value={newOrgName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="مثال: جمعية الخير"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="slug">الرابط المختصر</Label>
                <Input
                  id="slug"
                  value={newOrgSlug}
                  onChange={(e) => setNewOrgSlug(e.target.value.toLowerCase())}
                  placeholder="مثال: al-kheir"
                  dir="ltr"
                  className="text-left"
                />
                <p className="text-xs text-muted-foreground">
                  أحرف إنجليزية صغيرة وأرقام وشرطات فقط
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleCreateOrg} disabled={createOrg.isPending}>
                {createOrg.isPending ? "جار الإنشاء..." : "إنشاء"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {organizations?.map((org) => (
          <Card key={org.id} className={!org.is_active ? "opacity-60" : ""}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div className="flex items-center gap-3">
                {org.logo_url ? (
                  <img
                    src={org.logo_url}
                    alt={org.name}
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                )}
                <div>
                  <CardTitle className="text-lg">{org.name}</CardTitle>
                  <CardDescription dir="ltr" className="text-left">
                    /{org.slug}
                  </CardDescription>
                </div>
              </div>
              <Badge variant={org.is_active ? "default" : "secondary"}>
                {org.is_active ? "نشطة" : "معطلة"}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" asChild>
                  <Link to={`/admin/organizations/${org.id}/settings`}>
                    <Settings className="h-4 w-4 ml-1" />
                    الإعدادات
                  </Link>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link to={`/admin/organizations/${org.id}/members`}>
                    <Users className="h-4 w-4 ml-1" />
                    الأعضاء
                  </Link>
                </Button>

                {org.slug !== "yateem-care" && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>حذف المنظمة</AlertDialogTitle>
                        <AlertDialogDescription>
                          هل أنت متأكد من حذف هذه المنظمة؟ سيتم تعطيلها ولن تظهر في القوائم.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteOrg(org.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          حذف
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {organizations?.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">لا توجد منظمات بعد</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
