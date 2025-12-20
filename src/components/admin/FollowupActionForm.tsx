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
import { Loader2, Plus, X, Upload } from "lucide-react";
import { Label } from "@/components/ui/label";
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
  cost: z.number().min(0, "التكلفة يجب أن تكون صفر أو أكبر").default(0),
  requires_case_action: z.boolean().default(false),
  requires_volunteer_action: z.boolean().default(false),
  answer_type: z.enum(["multi_choice", "photo_upload", "text_area"]).optional().nullable(),
  answer_options: z.array(z.string()).optional(),
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
  const [answerOptions, setAnswerOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState("");
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
      cost: 0,
      requires_case_action: false,
      requires_volunteer_action: false,
      answer_type: null,
      answer_options: [],
    },
  });

  const answerType = form.watch("answer_type");
  const requiresCaseAction = form.watch("requires_case_action");

  // Reset answer options when answer type changes
  const handleAnswerTypeChange = (value: string) => {
    form.setValue("answer_type", value as any);
    if (value === "multi_choice") {
      setAnswerOptions([]);
      form.setValue("answer_options", []);
    } else {
      setAnswerOptions([]);
      form.setValue("answer_options", []);
    }
  };

  const addAnswerOption = () => {
    if (newOption.trim()) {
      const updated = [...answerOptions, newOption.trim()];
      setAnswerOptions(updated);
      form.setValue("answer_options", updated);
      setNewOption("");
    }
  };

  const removeAnswerOption = (index: number) => {
    const updated = answerOptions.filter((_, i) => i !== index);
    setAnswerOptions(updated);
    form.setValue("answer_options", updated);
  };

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
      // Validate multi-choice options
      if (values.answer_type === "multi_choice" && (!values.answer_options || values.answer_options.length < 2)) {
        toast.error("يرجى إضافة خيارين على الأقل للاختيار المتعدد");
        return;
      }

      const { error } = await supabase.from("followup_actions" as any).insert({
        case_id: values.case_id,
        title: values.title,
        description: values.description || null,
        action_date: values.action_date,
        cost: values.cost,
        requires_case_action: values.requires_case_action,
        requires_volunteer_action: values.requires_volunteer_action,
        answer_type: values.requires_case_action ? (values.answer_type || null) : null,
        answer_options: values.answer_type === "multi_choice" && values.answer_options ? values.answer_options : [],
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
      setAnswerOptions([]);
      setNewOption("");
      onOpenChange(false);
    } catch (error: any) {
      console.error("FollowupActionForm: Error creating followup action:", error);
      toast.error("فشل إضافة المتابعة: " + (error.message || "خطأ غير معروف"));
    } finally {
      setIsSubmitting(false);
    }
  };

  console.log("FollowupActionForm render - open:", open, "caseId:", caseId);
  
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
              name="cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>التكلفة المتوقعة (جنيه)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="0" 
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
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
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          if (!checked) {
                            form.setValue("answer_type", null);
                            setAnswerOptions([]);
                          }
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>يتطلب إجراء من الحالة (مهمة)</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        هذه المتابعة تحتاج إلى إجراء من جانب الحالة
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              {requiresCaseAction && (
                <FormField
                  control={form.control}
                  name="answer_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نوع الإجابة المطلوبة</FormLabel>
                      <Select onValueChange={handleAnswerTypeChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر نوع الإجابة" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="text_area">نص (Text Area)</SelectItem>
                          <SelectItem value="multi_choice">اختيار متعدد (Multi Choice)</SelectItem>
                          <SelectItem value="photo_upload">رفع صورة (Photo Upload)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {answerType === "multi_choice" && (
                <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                  <Label>خيارات الاختيار المتعدد</Label>
                  <div className="space-y-2">
                    {answerOptions.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input value={option} readOnly className="flex-1" />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeAnswerOption(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="أضف خيار جديد"
                        value={newOption}
                        onChange={(e) => setNewOption(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addAnswerOption();
                          }
                        }}
                      />
                      <Button type="button" onClick={addAnswerOption} variant="outline">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {answerOptions.length < 2 && (
                      <p className="text-sm text-muted-foreground">
                        يرجى إضافة خيارين على الأقل
                      </p>
                    )}
                  </div>
                </div>
              )}

              {answerType === "photo_upload" && (
                <div className="p-4 border rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">
                    سيتمكن المستخدم من رفع صورة واحدة أو أكثر عند الإجابة على هذه المهمة
                  </p>
                </div>
              )}

              {answerType === "text_area" && (
                <div className="p-4 border rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">
                    سيتمكن المستخدم من إدخال نص طويل عند الإجابة على هذه المهمة
                  </p>
                </div>
              )}

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
