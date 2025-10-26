import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  ListTodo,
} from "lucide-react";
import { format, isPast } from "date-fns";
import { ar } from "date-fns/locale";
import CaseTaskForm from "./CaseTaskForm";
import TaskCompletionDialog from "./TaskCompletionDialog";

interface CaseTasksListProps {
  caseId: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  task_type: string;
  assigned_to: string;
  priority: string;
  status: string;
  due_date: string | null;
  completed_at: string | null;
  completion_notes: string | null;
  created_at: string;
}

const priorityColors = {
  low: "bg-gray-500",
  medium: "bg-blue-500",
  high: "bg-orange-500",
  urgent: "bg-red-500",
};

const priorityLabels = {
  low: "منخفضة",
  medium: "متوسطة",
  high: "عالية",
  urgent: "عاجلة",
};

const statusLabels = {
  pending: "قيد الانتظار",
  in_progress: "قيد التنفيذ",
  completed: "مكتملة",
  cancelled: "ملغاة",
};

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  in_progress: "bg-blue-100 text-blue-800 border-blue-300",
  completed: "bg-green-100 text-green-800 border-green-300",
  cancelled: "bg-gray-100 text-gray-800 border-gray-300",
};

export default function CaseTasksList({ caseId }: CaseTasksListProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["case-tasks", caseId, statusFilter, priorityFilter],
    queryFn: async () => {
      let query = supabase
        .from("case_tasks")
        .select("*")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (priorityFilter !== "all") {
        query = query.eq("priority", priorityFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Task[];
    },
  });

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        جاري تحميل المهام...
      </div>
    );
  }

  const isOverdue = (task: Task) => {
    if (!task.due_date || task.status === "completed" || task.status === "cancelled") {
      return false;
    }
    return isPast(new Date(task.due_date));
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex flex-wrap gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter} dir="rtl">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="تصفية حسب الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            <SelectItem value="pending">قيد الانتظار</SelectItem>
            <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
            <SelectItem value="completed">مكتملة</SelectItem>
            <SelectItem value="cancelled">ملغاة</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter} dir="rtl">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="تصفية حسب الأولوية" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الأولويات</SelectItem>
            <SelectItem value="urgent">عاجلة</SelectItem>
            <SelectItem value="high">عالية</SelectItem>
            <SelectItem value="medium">متوسطة</SelectItem>
            <SelectItem value="low">منخفضة</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={() => setTaskFormOpen(true)} className="mr-auto">
          + إضافة مهمة
        </Button>
      </div>

      {!tasks || tasks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <ListTodo className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>لا توجد مهام مطابقة للفلاتر المحددة</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const overdue = isOverdue(task);
            
            return (
              <Card
                key={task.id}
                className={`p-4 ${overdue ? "border-red-500 border-2" : ""}`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {task.status === "completed" ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : task.status === "in_progress" ? (
                          <Clock className="h-5 w-5 text-blue-600" />
                        ) : (
                          <Circle className="h-5 w-5 text-gray-400" />
                        )}
                        <h4 className="font-semibold text-base">{task.title}</h4>
                      </div>
                      
                      {task.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {task.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant="outline"
                          className={statusColors[task.status as keyof typeof statusColors]}
                        >
                          {statusLabels[task.status as keyof typeof statusLabels]}
                        </Badge>
                        
                        <Badge className={priorityColors[task.priority as keyof typeof priorityColors]}>
                          {priorityLabels[task.priority as keyof typeof priorityLabels]}
                        </Badge>

                        {task.due_date && (
                          <Badge
                            variant="outline"
                            className={overdue ? "bg-red-100 text-red-800 border-red-300" : ""}
                          >
                            <Calendar className="h-3 w-3 ml-1" />
                            {format(new Date(task.due_date), "dd MMM", { locale: ar })}
                            {overdue && <AlertCircle className="h-3 w-3 mr-1" />}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {task.status !== "completed" && task.status !== "cancelled" && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => {
                            setSelectedTask(task);
                            setCompletionDialogOpen(true);
                          }}
                        >
                          إكمال
                        </Button>
                      )}
                    </div>
                  </div>

                  {task.completion_notes && task.status === "completed" && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-xs font-semibold text-green-900 mb-1">
                        ملاحظات الإكمال:
                      </p>
                      <p className="text-sm text-green-800">{task.completion_notes}</p>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <CaseTaskForm
        caseId={caseId}
        open={taskFormOpen}
        onOpenChange={setTaskFormOpen}
      />

      {selectedTask && (
        <TaskCompletionDialog
          taskId={selectedTask.id}
          taskTitle={selectedTask.title}
          open={completionDialogOpen}
          onOpenChange={setCompletionDialogOpen}
        />
      )}
    </div>
  );
}
