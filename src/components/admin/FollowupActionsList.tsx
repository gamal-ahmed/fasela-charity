import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { CheckCircle, Clock, XCircle, Plus, User, Users, Edit, Save } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface FollowupAction {
  id: string;
  title: string;
  description: string | null;
  action_date: string;
  cost: number;
  requires_case_action: boolean;
  requires_volunteer_action: boolean;
  status: "pending" | "completed" | "cancelled";
  completed_at: string | null;
  completed_by: string | null;
  completion_notes: string | null;
  created_at: string;
  created_by: string;
  task_level?: "case_level" | "kid_level";
  kid_ids?: string[];
  kids?: Array<{ id: string; name: string; age: number }>;
  kid_answers?: { [kidId: string]: any };
}

interface FollowupActionsListProps {
  caseId: string;
  onCreateNew: () => void;
}

export default function FollowupActionsList({ caseId, onCreateNew }: FollowupActionsListProps) {
  const [selectedAction, setSelectedAction] = useState<FollowupAction | null>(null);
  const [completionNotes, setCompletionNotes] = useState("");
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    action_date: "",
    requires_case_action: false,
    requires_volunteer_action: false,
  });
  const queryClient = useQueryClient();

  const { data: actions, isLoading } = useQuery({
    queryKey: ["followup-actions", caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("followup_actions" as any)
        .select("*")
        .eq("case_id", caseId)
        .order("action_date", { ascending: false });

      if (error) throw error;

      // Parse JSON fields
      if (data) {
        data.forEach((action: any) => {
          if (action.kid_ids && typeof action.kid_ids === 'string') {
            try {
              action.kid_ids = JSON.parse(action.kid_ids);
            } catch (e) {
              action.kid_ids = [];
            }
          }
        });

        // Fetch kid information for kid-level tasks
        const kidLevelTasks = data.filter((action: any) => action.task_level === "kid_level" && action.kid_ids && action.kid_ids.length > 0);
        if (kidLevelTasks.length > 0) {
          const allKidIds = new Set<string>();
          kidLevelTasks.forEach((task: any) => {
            task.kid_ids.forEach((kidId: string) => allKidIds.add(kidId));
          });

          const { data: kidsData } = await supabase
            .from("case_kids")
            .select("id, name, age")
            .in("id", Array.from(allKidIds))
            .eq("case_id", caseId);

          const kidsMap = new Map((kidsData || []).map(k => [k.id, k]));

          // Attach kids to tasks
          data.forEach((action: any) => {
            if (action.task_level === "kid_level" && action.kid_ids) {
              action.kids = action.kid_ids.map((kidId: string) => kidsMap.get(kidId)).filter(Boolean);
            }
          });

          // Fetch kid-level answers
          const kidLevelTaskIds = kidLevelTasks.map((t: any) => t.id);
          const { data: kidAnswers } = await supabase
            .from("followup_action_kid_answers" as any)
            .select("*")
            .in("followup_action_id", kidLevelTaskIds);

          // Group answers by task and kid
          data.forEach((action: any) => {
            if (action.task_level === "kid_level") {
              const taskAnswers = (kidAnswers || []).filter((ans: any) => ans.followup_action_id === action.id);
              action.kid_answers = taskAnswers.reduce((acc: any, ans: any) => {
                acc[ans.kid_id] = ans;
                return acc;
              }, {});
            }
          });
        }
      }

      return (data || []) as unknown as FollowupAction[];
    },
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const completeActionMutation = useMutation({
    mutationFn: async ({ actionId, notes }: { actionId: string; notes: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("يجب تسجيل الدخول أولاً");

      const { error } = await supabase
        .from("followup_actions" as any)
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
      queryClient.invalidateQueries({ queryKey: ["followup-actions", caseId] });
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
        .from("followup_actions" as any)
        .update({
          status: "cancelled",
          completed_at: new Date().toISOString(),
        })
        .eq("id", actionId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم إلغاء المتابعة");
      queryClient.invalidateQueries({ queryKey: ["followup-actions", caseId] });
      queryClient.invalidateQueries({ queryKey: ["followup-actions-all"] });
    },
    onError: (error: any) => {
      toast.error("فشل إلغاء المتابعة: " + error.message);
    },
  });

  const updateActionMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      const { error } = await supabase
        .from("followup_actions" as any)
        .update(updatedData)
        .eq("id", selectedAction?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم تحديث المتابعة بنجاح");
      queryClient.invalidateQueries({ queryKey: ["followup-actions", caseId] });
      queryClient.invalidateQueries({ queryKey: ["followup-actions-all"] });
      setShowEditDialog(false);
      setSelectedAction(null);
    },
    onError: (error: any) => {
      toast.error("فشل تحديث المتابعة: " + error.message);
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

  const handleEdit = (action: FollowupAction) => {
    setSelectedAction(action);
    setEditForm({
      title: action.title,
      description: action.description || "",
      action_date: action.action_date.split('T')[0], // Convert to YYYY-MM-DD format
      requires_case_action: action.requires_case_action,
      requires_volunteer_action: action.requires_volunteer_action,
    });
    setShowEditDialog(true);
  };

  const handleEditSubmit = () => {
    if (!selectedAction) return;
    updateActionMutation.mutate(editForm);
  };

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

  if (!actions || actions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>لا توجد متابعات مسجلة لهذه الحالة</p>
        <Button onClick={() => {
          console.log("FollowupActionsList: Button clicked, calling onCreateNew");
          onCreateNew();
        }} className="mt-4">
          <Plus className="h-4 w-4 mr-2" />
          إضافة متابعة جديدة
        </Button>
      </div>
    );
  }

  // Calculate progress statistics
  const totalActions = actions.length;
  const completedActions = actions.filter(a => a.status === 'completed').length;
  const pendingActions = actions.filter(a => a.status === 'pending').length;
  const cancelledActions = actions.filter(a => a.status === 'cancelled').length;
  const progressPercentage = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Progress Bar Card */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">تقدم المتابعات</h3>
            <span className="text-2xl font-bold text-blue-600">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-muted-foreground">مكتملة: <span className="font-semibold text-green-600">{completedActions}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <span className="text-muted-foreground">معلقة: <span className="font-semibold text-yellow-600">{pendingActions}</span></span>
            </div>
            {cancelledActions > 0 && (
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-muted-foreground">ملغاة: <span className="font-semibold text-red-600">{cancelledActions}</span></span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">الإجمالي: <span className="font-semibold">{totalActions}</span></span>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">المتابعات ({actions.length})</h3>
        <Button onClick={() => {
          console.log("FollowupActionsList: Add followup button clicked, calling onCreateNew");
          onCreateNew();
        }} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          إضافة متابعة
        </Button>
      </div>

      <div className="space-y-3">
        {actions.map((action) => (
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

            {action.description && (
              <p className="text-sm text-muted-foreground mb-3 whitespace-pre-wrap">
                {action.description}
              </p>
            )}

            {action.cost > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-3">
                <span className="text-sm font-semibold text-blue-900">
                  التكلفة المتوقعة: {action.cost.toLocaleString()} جنيه
                </span>
              </div>
            )}

            <div className="flex items-center gap-4 mb-3 flex-wrap">
              {action.task_level === "kid_level" && action.kids && action.kids.length > 0 && (
                <div className="flex items-center gap-1 text-sm text-orange-600">
                  <Users className="h-3 w-3" />
                  <span>مستوى الطفل: {action.kids.map(k => k.name).join(", ")}</span>
                </div>
              )}
              {action.task_level === "case_level" && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <span>مستوى الحالة</span>
                </div>
              )}
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

            {/* Show Kid-Level Answers */}
            {action.task_level === "kid_level" && action.kids && action.kids.length > 0 && action.kid_answers && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3">
                <h5 className="text-sm font-semibold text-orange-900 mb-2">إجابات الأطفال:</h5>
                <div className="space-y-2">
                  {action.kids.map((kid) => {
                    const kidAnswer = action.kid_answers[kid.id];
                    if (!kidAnswer) {
                      return (
                        <div key={kid.id} className="text-xs text-orange-700">
                          {kid.name}: لم يتم الإجابة بعد
                        </div>
                      );
                    }

                    return (
                      <div key={kid.id} className="bg-white rounded p-2 border border-orange-200">
                        <p className="text-xs font-medium text-orange-900 mb-1">{kid.name}:</p>
                        {kidAnswer.answer_text && (
                          <p className="text-xs text-orange-800 whitespace-pre-wrap">{kidAnswer.answer_text}</p>
                        )}
                        {kidAnswer.answer_multi_choice && (
                          <p className="text-xs text-orange-800">{kidAnswer.answer_multi_choice}</p>
                        )}
                        {kidAnswer.answer_photos && Array.isArray(kidAnswer.answer_photos) && kidAnswer.answer_photos.length > 0 && (
                          <div className="grid grid-cols-3 gap-1 mt-1">
                            {kidAnswer.answer_photos.map((photo: string, idx: number) => (
                              <img
                                key={idx}
                                src={photo}
                                alt={`Answer ${idx + 1}`}
                                className="w-full h-12 object-cover rounded"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleEdit(action)}
                className="flex items-center gap-1"
              >
                <Edit className="h-3 w-3" />
                تعديل
              </Button>
              {action.status === "pending" && (
                <>
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
                </>
              )}
            </div>
          </Card>
        ))}
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

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تعديل المتابعة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">العنوان</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="أدخل عنوان المتابعة"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">الوصف</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="أدخل وصف المتابعة"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-date">تاريخ المتابعة</Label>
              <Input
                id="edit-date"
                type="date"
                value={editForm.action_date}
                onChange={(e) => setEditForm(prev => ({ ...prev, action_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-requires-case"
                  checked={editForm.requires_case_action}
                  onChange={(e) => setEditForm(prev => ({ ...prev, requires_case_action: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="edit-requires-case">يتطلب إجراء من الحالة</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-requires-volunteer"
                  checked={editForm.requires_volunteer_action}
                  onChange={(e) => setEditForm(prev => ({ ...prev, requires_volunteer_action: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="edit-requires-volunteer">يتطلب إجراء من المتطوع</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleEditSubmit} disabled={updateActionMutation.isPending}>
              {updateActionMutation.isPending ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
