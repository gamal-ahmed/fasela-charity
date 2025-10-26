import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  followup_date: z.string(),
  followup_type: z.enum(["visit", "call", "meeting", "other"]),
  notes: z.string().min(1, "يرجى إدخال ملاحظات المتابعة"),
  next_action: z.string().optional(),
});

interface CaseFollowupFormProps {
  caseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CaseFollowupForm({
  caseId,
  open,
  onOpenChange,
}: CaseFollowupFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      followup_date: new Date().toISOString().split('T')[0],
      followup_type: "meeting",
      notes: "",
      next_action: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error("يجب تسجيل الدخول أولاً");
      }

      const { error } = await supabase.from("case_followups").insert({
        case_id: caseId,
        created_by: userData.user.id,
        followup_date: new Date(values.followup_date).toISOString(),
        followup_type: values.followup_type,
        notes: values.notes,
        next_action: values.next_action || null,
      });

      if (error) throw error;

      toast.success("تم إضافة المتابعة بنجاح");
      queryClient.invalidateQueries({ queryKey: ["case-followups", caseId] });
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error creating followup:", error);
      toast.error("فشل إضافة المتابعة: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>إضافة متابعة جديدة</DialogTitle>
          <DialogDescription>
            أضف تفاصيل المتابعة مع الحالة
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="followup_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>تاريخ المتابعة</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="followup_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نوع المتابعة</FormLabel>
                  <Select
                    dir="rtl"
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع المتابعة" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="visit">🏠 زيارة</SelectItem>
                      <SelectItem value="call">📞 اتصال</SelectItem>
                      <SelectItem value="meeting">🤝 اجتماع</SelectItem>
                      <SelectItem value="other">📝 أخرى</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ملاحظات المتابعة</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="اكتب تفاصيل المتابعة..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="next_action"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الإجراء التالي (اختياري)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="ما الذي يجب القيام به بعد ذلك؟"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                حفظ المتابعة
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
