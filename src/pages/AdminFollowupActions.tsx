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
import { CheckCircle, Clock, XCircle, Plus, User, Users, Search, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import AdminHeader from "@/components/admin/AdminHeader";
import FollowupActionForm from "@/components/admin/FollowupActionForm";

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
  answer_type: "multi_choice" | "photo_upload" | "text_area" | null;
  answer_options: string[];
  answer_text: string | null;
  answer_photos: string[] | null;
  answer_multi_choice: string | null;
  answered_at: string | null;
  task_level: "case_level" | "kid_level";
  kid_ids: string[];
  kids?: Array<{ id: string; name: string; age: number }>;
  kid_answers?: { [kidId: string]: any };
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
  const [showTaskForm, setShowTaskForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: actions, isLoading } = useQuery({
    queryKey: ["followup-actions-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("followup_actions" as any)
        .select(`
          *,
          cases (
            title,
            title_ar
          )
        `)
        .order("action_date", { ascending: false });
      
      if (error) throw error;

      // Parse JSON fields if they're strings
      if (data) {
        data.forEach((action: any) => {
          if (action.answer_options && typeof action.answer_options === 'string') {
            try {
              action.answer_options = JSON.parse(action.answer_options);
            } catch (e) {
              action.answer_options = [];
            }
          }
          if (action.answer_photos && typeof action.answer_photos === 'string') {
            try {
              action.answer_photos = JSON.parse(action.answer_photos);
            } catch (e) {
              action.answer_photos = [];
            }
          }
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
            .in("id", Array.from(allKidIds));

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
    <AdminHeader title="جميع المتابعات">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            إجمالي المتابعات: {actions?.length || 0}
          </div>
          <Button 
            onClick={() => {
              console.log("Button clicked, opening form");
              setShowTaskForm(true);
            }}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 ml-2" />
            إضافة مهمة جديدة
          </Button>
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

              {/* Show Task Answer if Available - Case Level */}
              {action.task_level === "case_level" && action.requires_case_action && action.answer_type && action.answered_at && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                  <h5 className="text-sm font-semibold text-blue-900 mb-2">إجابة المهمة:</h5>
                  {action.answer_type === "text_area" && action.answer_text && (
                    <div>
                      <p className="text-xs text-blue-700 mb-1">نوع الإجابة: نص</p>
                      <p className="text-sm text-blue-800 whitespace-pre-wrap bg-white p-2 rounded">
                        {action.answer_text}
                      </p>
                    </div>
                  )}
                  {action.answer_type === "multi_choice" && action.answer_multi_choice && (
                    <div>
                      <p className="text-xs text-blue-700 mb-1">نوع الإجابة: اختيار متعدد</p>
                      <p className="text-sm text-blue-800 bg-white p-2 rounded">
                        {action.answer_multi_choice}
                      </p>
                    </div>
                  )}
                  {action.answer_type === "photo_upload" && action.answer_photos && action.answer_photos.length > 0 && (
                    <div>
                      <p className="text-xs text-blue-700 mb-2">نوع الإجابة: رفع صور ({action.answer_photos.length} صورة)</p>
                      <div className="grid grid-cols-3 gap-2">
                        {action.answer_photos.map((photo, index) => (
                          <img
                            key={index}
                            src={photo}
                            alt={`Answer ${index + 1}`}
                            className="w-full h-20 object-cover rounded"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-blue-700 mt-2">
                    تم الإجابة: {format(new Date(action.answered_at), "dd MMM yyyy - HH:mm", { locale: ar })}
                  </p>
                </div>
              )}

              {/* Show Kid-Level Answers */}
              {action.task_level === "kid_level" && action.kids && action.kids.length > 0 && action.kid_answers && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3">
                  <h5 className="text-sm font-semibold text-orange-900 mb-2">إجابات الأطفال:</h5>
                  <div className="space-y-3">
                    {action.kids.map((kid) => {
                      const kidAnswer = action.kid_answers[kid.id];
                      if (!kidAnswer) return null;

                      return (
                        <div key={kid.id} className="bg-white rounded p-2 border border-orange-200">
                          <p className="text-xs font-medium text-orange-900 mb-1">{kid.name} ({kid.age} سنة):</p>
                          {kidAnswer.answer_text && (
                            <p className="text-sm text-orange-800 whitespace-pre-wrap">{kidAnswer.answer_text}</p>
                          )}
                          {kidAnswer.answer_multi_choice && (
                            <p className="text-sm text-orange-800">{kidAnswer.answer_multi_choice}</p>
                          )}
                          {kidAnswer.answer_photos && Array.isArray(kidAnswer.answer_photos) && kidAnswer.answer_photos.length > 0 && (
                            <div className="grid grid-cols-3 gap-2 mt-2">
                              {kidAnswer.answer_photos.map((photo: string, idx: number) => (
                                <img
                                  key={idx}
                                  src={photo}
                                  alt={`Answer ${idx + 1}`}
                                  className="w-full h-16 object-cover rounded"
                                />
                              ))}
                            </div>
                          )}
                          <p className="text-xs text-orange-700 mt-1">
                            تم الإجابة: {format(new Date(kidAnswer.answered_at), "dd MMM yyyy - HH:mm", { locale: ar })}
                          </p>
                        </div>
                      );
                    })}
                    {action.kids.every(k => !action.kid_answers[k.id]) && (
                      <p className="text-xs text-orange-700">لا توجد إجابات بعد</p>
                    )}
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

      {/* Task Form Dialog */}
      <FollowupActionForm
        open={showTaskForm}
        onOpenChange={setShowTaskForm}
      />
      </div>
    </AdminHeader>
  );
}
