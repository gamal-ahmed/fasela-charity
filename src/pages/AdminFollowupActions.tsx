import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { CheckCircle, Clock, XCircle, Plus, User, Users, Search, Filter, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface FollowupAction {
  id: string;
  title: string;
  description: string | null;
  action_date: string;
  requires_case_action: boolean;
  requires_volunteer_action: boolean;
  status: "pending" | "completed" | "cancelled";
  completed_at: string | null;
  completed_by: string | null;
  completion_notes: string | null;
  created_at: string;
  created_by: string;
  case_id: string;
  cases: {
    title: string;
    title_ar: string;
  };
}

export default function FollowupActionsView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedAction, setSelectedAction] = useState<FollowupAction | null>(null);
  const [completionNotes, setCompletionNotes] = useState("");
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: actions, isLoading } = useQuery({
    queryKey: ["followup-actions-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("followup_actions")
        .select(`
          *,
          cases (
            title,
            title_ar
          )
        `)
        .order("action_date", { ascending: false });

      if (error) throw error;
      return data as FollowupAction[];
    },
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const completeActionMutation = useMutation({
    mutationFn: async ({ actionId, notes }: { actionId: string; notes: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("يجب تسجيل الدخول أولاً");

      const { error } = await supabase
        .from("followup_actions")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          completed_by: userData.user.id,
          completion_notes: notes || null,
        })
        .eq("id", actionId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم إكمال المتابعة بنجاح");
      queryClient.invalidateQueries({ queryKey: ["followup-actions-all"] });
      setShowCompletionDialog(false);
      setSelectedAction(null);
      setCompletionNotes("");
    },
    onError: (error: any) => {
      toast.error("فشل إكمال المتابعة: " + error.message);
    },
  });

  const cancelActionMutation = useMutation({
    mutationFn: async (actionId: string) => {
      const { error } = await supabase
        .from("followup_actions")
        .update({
          status: "cancelled",
          completed_at: new Date().toISOString(),
        })
        .eq("id", actionId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم إلغاء المتابعة");
      queryClient.invalidateQueries({ queryKey: ["followup-actions-all"] });
    },
    onError: (error: any) => {
      toast.error("فشل إلغاء المتابعة: " + error.message);
    },
  });

  const handleComplete = (action: FollowupAction) => {
    setSelectedAction(action);
    setShowCompletionDialog(true);
  };

  const handleCompleteSubmit = () => {
    if (!selectedAction) return;
    completeActionMutation.mutate({
      actionId: selectedAction.id,
      notes: completionNotes,
    });
  };

  const filteredActions = actions?.filter((action) => {
    const matchesSearch = 
      action.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      action.cases.title_ar.toLowerCase().includes(searchTerm.toLowerCase()) ||
      action.cases.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || action.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-green-500">مكتملة</Badge>;
      case "cancelled":
        return <Badge variant="destructive">ملغاة</Badge>;
      default:
        return <Badge variant="secondary">معلقة</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        جاري تحميل المتابعات...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link to="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              العودة للوحة التحكم
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">جميع المتابعات</h1>
        </div>
        <div className="text-sm text-muted-foreground">
          إجمالي المتابعات: {actions?.length || 0}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث في المتابعات أو الحالات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="pending">معلقة</SelectItem>
                  <SelectItem value="completed">مكتملة</SelectItem>
                  <SelectItem value="cancelled">ملغاة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions List */}
      <div className="space-y-3">
        {filteredActions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>لا توجد متابعات تطابق البحث</p>
            </CardContent>
          </Card>
        ) : (
          filteredActions.map((action) => (
            <Card key={action.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getStatusIcon(action.status)}
                  <h4 className="font-semibold">{action.title}</h4>
                  {getStatusBadge(action.status)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(action.action_date), "dd MMM yyyy", { locale: ar })}
                </div>
              </div>

              <div className="mb-3">
                <Link
                  to={`/admin/case-profile/${action.case_id}`}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  {action.cases.title_ar} - {action.cases.title}
                </Link>
              </div>

              {action.description && (
                <p className="text-sm text-muted-foreground mb-3 whitespace-pre-wrap">
                  {action.description}
                </p>
              )}

              <div className="flex items-center gap-4 mb-3">
                {action.requires_case_action && (
                  <div className="flex items-center gap-1 text-sm text-blue-600">
                    <User className="h-3 w-3" />
                    <span>يتطلب إجراء من الحالة</span>
                  </div>
                )}
                {action.requires_volunteer_action && (
                  <div className="flex items-center gap-1 text-sm text-purple-600">
                    <Users className="h-3 w-3" />
                    <span>يتطلب إجراء من المتطوع</span>
                  </div>
                )}
              </div>

              {action.status === "completed" && action.completion_notes && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                  <h5 className="text-sm font-semibold text-green-900 mb-1">ملاحظات الإكمال:</h5>
                  <p className="text-sm text-green-800 whitespace-pre-wrap">
                    {action.completion_notes}
                  </p>
                  <p className="text-xs text-green-700 mt-2">
                    تم الإكمال: {format(new Date(action.completed_at!), "dd MMM yyyy - HH:mm", { locale: ar })}
                  </p>
                </div>
              )}

              {action.status === "pending" && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleComplete(action)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    إكمال
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => cancelActionMutation.mutate(action.id)}
                    disabled={cancelActionMutation.isPending}
                  >
                    <XCircle className="h-3 w-3 mr-1" />
                    إلغاء
                  </Button>
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Completion Dialog */}
      <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إكمال المتابعة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">{selectedAction?.title}</h4>
              <p className="text-sm text-muted-foreground">
                أضف ملاحظات حول إكمال هذه المتابعة
              </p>
            </div>
            <Textarea
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              placeholder="ملاحظات الإكمال..."
              rows={3}
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowCompletionDialog(false)}
              >
                إلغاء
              </Button>
              <Button
                onClick={handleCompleteSubmit}
                disabled={completeActionMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                إكمال المتابعة
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
