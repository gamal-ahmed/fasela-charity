import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  case_id: z.string().min(1, "يرجى اختيار الحالة"),
  title: z.string().min(1, "يرجى إدخال عنوان المتابعة"),
  description: z.string().optional(),
  action_date: z.string().min(1, "يرجى اختيار تاريخ المتابعة"),
  requires_case_action: z.boolean().default(false),
  requires_volunteer_action: z.boolean().default(false),
});

interface FollowupActionFormProps {
  caseId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function FollowupActionForm({
  caseId,
  open,
  onOpenChange,
}: FollowupActionFormProps) {
  console.log("FollowupActionForm: Props received:", { caseId, open, onOpenChange });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  // Fetch all cases for the dropdown
  const { data: cases } = useQuery({
    queryKey: ["cases-for-followup"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cases")
        .select("id, title, title_ar")
        .order("title_ar", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !caseId, // Only fetch if no caseId is provided
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      case_id: caseId || "",
      title: "",
      description: "",
      action_date: new Date().toISOString().split('T')[0],
      requires_case_action: false,
      requires_volunteer_action: false,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    console.log("FollowupActionForm: Starting submission with values:", values);
    setIsSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      console.log("FollowupActionForm: User data:", userData);
      
      if (!userData.user) {
        throw new Error("يجب تسجيل الدخول أولاً");
      }

      console.log("FollowupActionForm: Attempting to insert followup action...");
      const { error } = await supabase.from("followup_actions" as any).insert({
        case_id: values.case_id,
        title: values.title,
        description: values.description || null,
        action_date: values.action_date,
        requires_case_action: values.requires_case_action,
        requires_volunteer_action: values.requires_volunteer_action,
        created_by: userData.user.id,
      });

      if (error) {
        console.error("FollowupActionForm: Supabase error:", error);
        throw new Error(error.message || "فشل في حفظ المتابعة");
      }

      console.log("FollowupActionForm: Successfully inserted followup action");
      toast.success("تم إضافة المتابعة بنجاح");
      queryClient.invalidateQueries({ queryKey: ["followup-actions", values.case_id] });
      queryClient.invalidateQueries({ queryKey: ["followup-actions-all"] });
      queryClient.invalidateQueries({ queryKey: ["followup-actions-dashboard"] });
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      console.error("FollowupActionForm: Error creating followup action:", error);
      toast.error("فشل إضافة المتابعة: " + (error.message || "خطأ غير معروف"));
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
            {!caseId && (
              <FormField
                control={form.control}
                name="case_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الحالة</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الحالة" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {cases?.map((caseItem) => (
                          <SelectItem key={caseItem.id} value={caseItem.id}>
                            {caseItem.title_ar || caseItem.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>عنوان المتابعة</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: متابعة الحالة الصحية" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="action_date"
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>وصف المتابعة (اختياري)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="وصف تفصيلي للمتابعة..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <FormField
                control={form.control}
                name="requires_case_action"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>يتطلب إجراء من الحالة</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        هذه المتابعة تحتاج إلى إجراء من جانب الحالة
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requires_volunteer_action"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>يتطلب إجراء من المتطوع</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        هذه المتابعة تحتاج إلى إجراء من جانب المتطوع
                      </p>
                    </div>
                  </FormItem>
                )}
              />
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                إضافة المتابعة
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
