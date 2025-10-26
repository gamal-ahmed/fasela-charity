import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface TaskCompletionDialogProps {
  taskId: string;
  taskTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TaskCompletionDialog({
  taskId,
  taskTitle,
  open,
  onOpenChange,
}: TaskCompletionDialogProps) {
  const [completionNotes, setCompletionNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error("يجب تسجيل الدخول أولاً");
      }

      const { error } = await supabase
        .from("case_tasks")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          completed_by: userData.user.id,
          completion_notes: completionNotes || null,
        })
        .eq("id", taskId);

      if (error) throw error;

      toast.success("تم تحديد المهمة كمنجزة");
      queryClient.invalidateQueries({ queryKey: ["case-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["admin-tasks"] });
      setCompletionNotes("");
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error completing task:", error);
      toast.error("فشل إكمال المهمة: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>إكمال المهمة</DialogTitle>
          <DialogDescription>
            هل أنت متأكد من إكمال هذه المهمة؟
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm font-medium">{taskTitle}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="completion-notes">ملاحظات الإكمال (اختياري)</Label>
            <Textarea
              id="completion-notes"
              placeholder="أضف أي ملاحظات حول إكمال المهمة..."
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            إلغاء
          </Button>
          <Button onClick={handleComplete} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            تأكيد الإكمال
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
