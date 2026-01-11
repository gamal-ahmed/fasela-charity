import { useState } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { useOrganization } from "@/contexts/OrganizationContext";
import {
  useOrganizationById,
  useOrganizationMembers,
  useOrganizationInvitations,
  useUpdateMemberRole,
  useRemoveMember,
  useCreateInvitation,
  useCancelInvitation,
} from "@/hooks/useOrganization";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowRight, Mail, Shield, Trash2, UserPlus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const ROLE_LABELS: Record<string, string> = {
  admin: "مسؤول",
  volunteer: "متطوع",
  user: "مستخدم",
};

export default function OrganizationMembersPage() {
  const { id } = useParams<{ id: string }>();
  const { isSuperAdmin, isLoading: contextLoading } = useOrganization();
  const { data: organization, isLoading: orgLoading } = useOrganizationById(id);
  const { data: members, isLoading: membersLoading, refetch: refetchMembers } = useOrganizationMembers(id);
  const { data: invitations, refetch: refetchInvitations } = useOrganizationInvitations(id);

  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();
  const createInvitation = useCreateInvitation();
  const cancelInvitation = useCancelInvitation();

  const { toast } = useToast();

  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "volunteer" | "user">("volunteer");

  if (contextLoading || orgLoading) {
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

  const handleRoleChange = async (roleId: string, newRole: "admin" | "volunteer" | "user") => {
    try {
      await updateRole.mutateAsync({ roleId, newRole });
      toast({
        title: "تم التحديث",
        description: "تم تحديث صلاحيات العضو",
      });
      refetchMembers();
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        title: "خطأ",
        description: err.message || "حدث خطأ",
        variant: "destructive",
      });
    }
  };

  const handleRemoveMember = async (roleId: string) => {
    try {
      await removeMember.mutateAsync({ roleId, orgId: id! });
      toast({
        title: "تم الحذف",
        description: "تم إزالة العضو من المنظمة",
      });
      refetchMembers();
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        title: "خطأ",
        description: err.message || "حدث خطأ",
        variant: "destructive",
      });
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال البريد الإلكتروني",
        variant: "destructive",
      });
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      toast({
        title: "خطأ",
        description: "البريد الإلكتروني غير صالح",
        variant: "destructive",
      });
      return;
    }

    try {
      await createInvitation.mutateAsync({
        organizationId: id!,
        email: inviteEmail,
        role: inviteRole,
      });
      toast({
        title: "تم الإرسال",
        description: "تم إنشاء الدعوة بنجاح",
      });
      setIsInviteDialogOpen(false);
      setInviteEmail("");
      setInviteRole("volunteer");
      refetchInvitations();
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        title: "خطأ",
        description: err.message || "حدث خطأ",
        variant: "destructive",
      });
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      await cancelInvitation.mutateAsync({ invitationId, orgId: id! });
      toast({
        title: "تم الإلغاء",
        description: "تم إلغاء الدعوة",
      });
      refetchInvitations();
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        title: "خطأ",
        description: err.message || "حدث خطأ",
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
        <Link to={`/admin/organizations/${id}/settings`} className="hover:text-foreground">
          {organization.name}
        </Link>
        <ArrowRight className="h-4 w-4" />
        <span>الأعضاء</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">أعضاء المنظمة</h1>
          <p className="text-muted-foreground">إدارة أعضاء {organization.name}</p>
        </div>

        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 ml-2" />
              دعوة عضو جديد
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>دعوة عضو جديد</DialogTitle>
              <DialogDescription>
                أدخل البريد الإلكتروني للشخص الذي تريد دعوته
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="example@email.com"
                  dir="ltr"
                  className="text-left"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">الصلاحية</Label>
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as typeof inviteRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">مسؤول</SelectItem>
                    <SelectItem value="volunteer">متطوع</SelectItem>
                    <SelectItem value="user">مستخدم</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleInvite} disabled={createInvitation.isPending}>
                {createInvitation.isPending ? "جار الإرسال..." : "إرسال الدعوة"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Current Members */}
      <Card>
        <CardHeader>
          <CardTitle>الأعضاء الحاليون</CardTitle>
          <CardDescription>
            {members?.length || 0} عضو في المنظمة
          </CardDescription>
        </CardHeader>
        <CardContent>
          {membersLoading ? (
            <div className="text-center py-8 text-muted-foreground">جار التحميل...</div>
          ) : members?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">لا يوجد أعضاء</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>معرف المستخدم</TableHead>
                  <TableHead>الصلاحية</TableHead>
                  <TableHead>تاريخ الانضمام</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members?.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-mono text-xs">
                      {member.user_id.slice(0, 8)}...
                      {member.is_super_admin && (
                        <Badge variant="secondary" className="mr-2">
                          <Shield className="h-3 w-3 ml-1" />
                          مسؤول عام
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={member.role}
                        onValueChange={(v) => handleRoleChange(member.id, v as "admin" | "volunteer" | "user")}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">مسؤول</SelectItem>
                          <SelectItem value="volunteer">متطوع</SelectItem>
                          <SelectItem value="user">مستخدم</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {format(new Date(member.created_at), "d MMM yyyy", { locale: ar })}
                    </TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>إزالة العضو</AlertDialogTitle>
                            <AlertDialogDescription>
                              هل أنت متأكد من إزالة هذا العضو من المنظمة؟
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRemoveMember(member.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              إزالة
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      <Card>
        <CardHeader>
          <CardTitle>الدعوات المعلقة</CardTitle>
          <CardDescription>
            دعوات بانتظار القبول
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invitations?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">لا توجد دعوات معلقة</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>الصلاحية</TableHead>
                  <TableHead>تاريخ الإرسال</TableHead>
                  <TableHead>تاريخ الانتهاء</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations?.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span dir="ltr">{invitation.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {ROLE_LABELS[invitation.role] || invitation.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(invitation.created_at), "d MMM yyyy", { locale: ar })}
                    </TableCell>
                    <TableCell>
                      {format(new Date(invitation.expires_at), "d MMM yyyy", { locale: ar })}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCancelInvitation(invitation.id)}
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
