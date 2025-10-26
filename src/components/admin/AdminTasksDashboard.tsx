import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ListTodo,
  Calendar,
} from "lucide-react";
import { format, isPast } from "date-fns";
import { ar } from "date-fns/locale";
import TaskCompletionDialog from "./TaskCompletionDialog";
import { Link } from "react-router-dom";

interface Task {
  id: string;
  case_id: string;
  title: string;
  description: string | null;
  task_type: string;
  assigned_to: string;
  priority: string;
  status: string;
  due_date: string | null;
  created_at: string;
  cases: {
    title: string;
    title_ar: string;
  } | null;
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

export default function AdminTasksDashboard() {
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["admin-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("case_tasks")
        .select(`
          *,
          cases (
            title,
            title_ar
          )
        `)
        .in("status", ["pending", "in_progress"])
        .order("priority", { ascending: false })
        .order("due_date", { ascending: true });

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

  const overdueTasks = tasks?.filter(
    (task) => task.due_date && isPast(new Date(task.due_date))
  ) || [];

  const urgentTasks = tasks?.filter((task) => task.priority === "urgent") || [];
  
  const myTasks = tasks?.filter(
    (task) => task.assigned_to === "admin" || task.assigned_to === "both"
  ) || [];

  const TaskCard = ({ task }: { task: Task }) => {
    const isOverdue = task.due_date && isPast(new Date(task.due_date));

    return (
      <Card className={isOverdue ? "border-red-500 border-2" : ""}>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Link 
                  to={`/admin/case-profile/${task.case_id}`}
                  className="text-xs text-muted-foreground hover:underline mb-1 block"
                >
                  {task.cases?.title_ar || task.cases?.title}
                </Link>
                
                <h4 className="font-semibold text-base mb-2">{task.title}</h4>
                
                {task.description && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {task.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  <Badge className={priorityColors[task.priority as keyof typeof priorityColors]}>
                    {priorityLabels[task.priority as keyof typeof priorityLabels]}
                  </Badge>

                  {task.due_date && (
                    <Badge
                      variant="outline"
                      className={isOverdue ? "bg-red-100 text-red-800 border-red-300" : ""}
                    >
                      <Calendar className="h-3 w-3 ml-1" />
                      {format(new Date(task.due_date), "dd MMM", { locale: ar })}
                      {isOverdue && <AlertCircle className="h-3 w-3 mr-1" />}
                    </Badge>
                  )}
                </div>
              </div>

              <Button
                size="sm"
                onClick={() => {
                  setSelectedTask(task);
                  setCompletionDialogOpen(true);
                }}
              >
                إكمال
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ListTodo className="h-4 w-4" />
              إجمالي المهام
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks?.length || 0}</div>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              مهام متأخرة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {overdueTasks.length}
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-orange-600">
              <Clock className="h-4 w-4" />
              مهام عاجلة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {urgentTasks.length}
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-600">
              <CheckCircle2 className="h-4 w-4" />
              مهامي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {myTasks.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="all">جميع المهام ({tasks?.length || 0})</TabsTrigger>
          <TabsTrigger value="overdue" className="text-red-600">
            متأخرة ({overdueTasks.length})
          </TabsTrigger>
          <TabsTrigger value="urgent">عاجلة ({urgentTasks.length})</TabsTrigger>
          <TabsTrigger value="my">مهامي ({myTasks.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3 mt-4">
          {tasks && tasks.length > 0 ? (
            tasks.map((task) => <TaskCard key={task.id} task={task} />)
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <ListTodo className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>لا توجد مهام نشطة</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="overdue" className="space-y-3 mt-4">
          {overdueTasks.length > 0 ? (
            overdueTasks.map((task) => <TaskCard key={task.id} task={task} />)
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50 text-green-500" />
              <p>لا توجد مهام متأخرة - عمل رائع!</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="urgent" className="space-y-3 mt-4">
          {urgentTasks.length > 0 ? (
            urgentTasks.map((task) => <TaskCard key={task.id} task={task} />)
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>لا توجد مهام عاجلة حالياً</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="my" className="space-y-3 mt-4">
          {myTasks.length > 0 ? (
            myTasks.map((task) => <TaskCard key={task.id} task={task} />)
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <ListTodo className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>لا توجد مهام مخصصة لك حالياً</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

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
