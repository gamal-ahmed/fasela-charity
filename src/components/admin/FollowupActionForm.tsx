import { useState, useEffect } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  case_id: z.string().optional(),
  title: z.string().min(1, "يرجى إدخال عنوان المتابعة"),
  description: z.string().optional(),
  action_date: z.string().min(1, "يرجى اختيار تاريخ المتابعة"),
  cost: z.number().min(0, "التكلفة يجب أن تكون صفر أو أكبر").default(0),
  requires_case_action: z.boolean().default(false),
  requires_volunteer_action: z.boolean().default(false),
  answer_type: z.enum(["multi_choice", "photo_upload", "text_area"]).optional().nullable(),
  answer_options: z.array(z.string()).optional(),
  create_for_all_cases: z.boolean().default(false),
  task_level: z.enum(["case_level", "kid_level"]).default("case_level"),
  kid_ids: z.array(z.string()).default([]),
  profile_field_mapping: z.enum(["health_state", "current_grade", "school_name", "education_progress", "certificates", "ongoing_courses"]).optional().nullable(),
}).refine((data) => {
  // Either create_for_all_cases is true OR case_id is provided
  return data.create_for_all_cases || (data.case_id && data.case_id.length > 0);
}, {
  message: "يرجى اختيار الحالة أو تفعيل إنشاء المتابعة لجميع الحالات",
  path: ["case_id"],
}).refine((data) => {
  // If kid_level, must have kid_ids (unless creating for all cases)
  if (data.task_level === "kid_level" && !data.create_for_all_cases) {
    return data.kid_ids && data.kid_ids.length > 0;
  }
  return true;
}, {
  message: "يرجى اختيار طفل واحد على الأقل",
  path: ["kid_ids"],
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
  const [selectedKidIds, setSelectedKidIds] = useState<string[]>([]);
  const queryClient = useQueryClient();

  // Initialize form first
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
      create_for_all_cases: false,
      task_level: "case_level",
      kid_ids: [],
      profile_field_mapping: null,
    },
  });

  const createForAllCases = form.watch("create_for_all_cases");
  const selectedCaseId = form.watch("case_id") || caseId;
  const taskLevel = form.watch("task_level");

  // Reset kid selection when task level changes to case_level
  useEffect(() => {
    if (taskLevel === "case_level") {
      setSelectedKidIds([]);
    }
  }, [taskLevel]);

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

  // Fetch kids for selected case
  const { data: kids } = useQuery({
    queryKey: ["kids-for-case", selectedCaseId],
    queryFn: async () => {
      if (!selectedCaseId) return [];
      const { data, error } = await supabase
        .from("case_kids")
        .select("id, name, age")
        .eq("case_id", selectedCaseId)
        .order("name", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCaseId && taskLevel === "kid_level" && !createForAllCases,
  });

  // Handle task level change
  const handleTaskLevelChange = (value: string) => {
    form.setValue("task_level", value as "case_level" | "kid_level");
    if (value === "case_level") {
      setSelectedKidIds([]);
      form.setValue("kid_ids", []);
    }
  };

  // Handle kid selection
  const toggleKidSelection = (kidId: string) => {
    const updated = selectedKidIds.includes(kidId)
      ? selectedKidIds.filter(id => id !== kidId)
      : [...selectedKidIds, kidId];
    setSelectedKidIds(updated);
    form.setValue("kid_ids", updated);
  };

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

      // Validate multi-choice options
      if (values.answer_type === "multi_choice" && (!values.answer_options || values.answer_options.length < 2)) {
        toast.error("يرجى إضافة خيارين على الأقل للاختيار المتعدد");
        setIsSubmitting(false);
        return;
      }

      // Prepare the follow-up action data
      const followupData = {
        title: values.title,
        description: values.description || null,
        action_date: values.action_date,
        cost: values.cost,
        requires_case_action: values.requires_case_action,
        requires_volunteer_action: values.requires_volunteer_action,
        answer_type: values.requires_case_action ? (values.answer_type || null) : null,
        answer_options: values.answer_type === "multi_choice" && values.answer_options ? values.answer_options : [],
        task_level: values.task_level,
        kid_ids: values.task_level === "kid_level" ? values.kid_ids : [],
        profile_field_mapping: values.task_level === "kid_level" ? (values.profile_field_mapping || null) : null,
        created_by: userData.user.id,
      };

      if (values.create_for_all_cases) {
        if (values.task_level === "kid_level") {
          // Create kid-level tasks for all kids in all cases
          console.log("FollowupActionForm: Creating kid-level tasks for all kids in all cases");
          
          // Fetch all cases with their kids
          const { data: allCases, error: casesError } = await supabase
            .from("cases")
            .select("id");
          
          if (casesError) {
            throw new Error("فشل في جلب قائمة الحالات: " + casesError.message);
          }

          if (!allCases || allCases.length === 0) {
            throw new Error("لا توجد حالات متاحة");
          }

          // Fetch all kids grouped by case
          const { data: allKids, error: kidsError } = await supabase
            .from("case_kids")
            .select("id, case_id");
          
          if (kidsError) {
            throw new Error("فشل في جلب قائمة الأطفال: " + kidsError.message);
          }

          // Group kids by case_id
          const kidsByCase = new Map<string, string[]>();
          allKids?.forEach(kid => {
            const existing = kidsByCase.get(kid.case_id) || [];
            existing.push(kid.id);
            kidsByCase.set(kid.case_id, existing);
          });

          // Create follow-up actions for each case with its kids
          const followupActions = Array.from(kidsByCase.entries()).map(([caseId, kidIds]) => ({
            ...followupData,
            case_id: caseId,
            kid_ids: kidIds,
          }));

          // Also create for cases without kids (empty kid_ids array)
          const casesWithKids = new Set(kidsByCase.keys());
          const casesWithoutKids = allCases.filter(c => !casesWithKids.has(c.id));
          casesWithoutKids.forEach(caseItem => {
            followupActions.push({
              ...followupData,
              case_id: caseItem.id,
              kid_ids: [],
            });
          });

          const { error } = await supabase
            .from("followup_actions" as any)
            .insert(followupActions);

          if (error) {
            console.error("FollowupActionForm: Supabase error:", error);
            throw new Error(error.message || "فشل في حفظ المتابعات");
          }

          const totalKids = allKids?.length || 0;
          console.log(`FollowupActionForm: Successfully created ${followupActions.length} follow-up actions for ${totalKids} kids`);
          toast.success(`تم إضافة المتابعة لجميع الأطفال في جميع الحالات بنجاح (${totalKids} طفل)`);
        } else {
          // Create case-level tasks for all cases
          console.log("FollowupActionForm: Creating follow-up for all cases");
          
          // Fetch all cases
          const { data: allCases, error: casesError } = await supabase
            .from("cases")
            .select("id");
          
          if (casesError) {
            throw new Error("فشل في جلب قائمة الحالات: " + casesError.message);
          }

          if (!allCases || allCases.length === 0) {
            throw new Error("لا توجد حالات متاحة");
          }

          // Create follow-up actions for all cases
          const followupActions = allCases.map((caseItem) => ({
            ...followupData,
            case_id: caseItem.id,
          }));

          const { error } = await supabase
            .from("followup_actions" as any)
            .insert(followupActions);

          if (error) {
            console.error("FollowupActionForm: Supabase error:", error);
            throw new Error(error.message || "فشل في حفظ المتابعات");
          }

          console.log(`FollowupActionForm: Successfully created ${allCases.length} follow-up actions`);
          toast.success(`تم إضافة المتابعة لجميع الحالات بنجاح (${allCases.length} حالة)`);
        }
      } else {
        // Create follow-up for single case
        console.log("FollowupActionForm: Creating follow-up for single case");
        const { error } = await supabase.from("followup_actions" as any).insert({
          ...followupData,
          case_id: values.case_id,
        });

        if (error) {
          console.error("FollowupActionForm: Supabase error:", error);
          throw new Error(error.message || "فشل في حفظ المتابعة");
        }

        console.log("FollowupActionForm: Successfully inserted followup action");
        toast.success("تم إضافة المتابعة بنجاح");
      }

      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ["followup-actions"] });
      queryClient.invalidateQueries({ queryKey: ["followup-actions-all"] });
      queryClient.invalidateQueries({ queryKey: ["followup-actions-dashboard"] });
      
      form.reset();
      setAnswerOptions([]);
      setNewOption("");
      setSelectedKidIds([]);
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>إضافة متابعة جديدة</DialogTitle>
          <DialogDescription>
            أضف تفاصيل المتابعة مع الحالة
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {!caseId && (
              <>
                <FormField
                  control={form.control}
                  name="create_for_all_cases"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-lg bg-muted/50">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            if (checked) {
                              form.setValue("case_id", "");
                            }
                          }}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>إنشاء المتابعة لجميع الحالات</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          سيتم إنشاء هذه المتابعة لجميع الحالات المسجلة في النظام
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                {!createForAllCases && (
                  <FormField
                    control={form.control}
                    name="case_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الحالة</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
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

                {createForAllCases && (
                  <div className="p-4 border-2 border-blue-200 rounded-lg bg-blue-50/50">
                    <p className="text-sm font-medium text-blue-900">
                      ⚠️ سيتم إنشاء هذه المتابعة لجميع الحالات في النظام
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      تأكد من أن جميع المعلومات صحيحة قبل المتابعة
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Task Level Selector */}
            <FormField
              control={form.control}
              name="task_level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>مستوى المهمة</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={handleTaskLevelChange}
                      className="flex gap-6"
                    >
                      <div className="flex items-center space-x-2 space-y-0">
                        <RadioGroupItem value="case_level" id="case_level" />
                        <Label htmlFor="case_level" className="font-normal cursor-pointer">
                          مستوى الحالة
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 space-y-0">
                        <RadioGroupItem value="kid_level" id="kid_level" />
                        <Label htmlFor="kid_level" className="font-normal cursor-pointer">
                          مستوى الطفل
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Kid Selection - Only show when kid_level is selected and case is selected */}
            {taskLevel === "kid_level" && !createForAllCases && selectedCaseId && (
              <FormField
                control={form.control}
                name="kid_ids"
                render={({ field }) => {
                  const handleKidToggle = (kidId: string) => {
                    const updated = selectedKidIds.includes(kidId)
                      ? selectedKidIds.filter(id => id !== kidId)
                      : [...selectedKidIds, kidId];
                    setSelectedKidIds(updated);
                    field.onChange(updated);
                  };

                  return (
                    <FormItem>
                      <FormLabel>اختر الأطفال</FormLabel>
                      <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
                        {kids && kids.length > 0 ? (
                          <>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {kids.map((kid) => (
                                <div
                                  key={kid.id}
                                  className="flex items-center space-x-2 space-y-0 p-2 hover:bg-background rounded"
                                >
                                  <Checkbox
                                    checked={selectedKidIds.includes(kid.id)}
                                    onCheckedChange={() => handleKidToggle(kid.id)}
                                  />
                                  <Label 
                                    htmlFor={`kid-${kid.id}`}
                                    className="font-normal cursor-pointer flex-1"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleKidToggle(kid.id);
                                    }}
                                  >
                                    {kid.name} ({kid.age} سنة)
                                  </Label>
                                </div>
                              ))}
                            </div>
                            {selectedKidIds.length > 0 && (
                              <div className="pt-2 border-t">
                                <p className="text-sm text-muted-foreground">
                                  تم اختيار {selectedKidIds.length} طفل
                                </p>
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            لا توجد أطفال مسجلين في هذه الحالة
                          </p>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            )}

            {taskLevel === "kid_level" && createForAllCases && (
              <div className="p-4 border-2 border-blue-200 rounded-lg bg-blue-50/50">
                <p className="text-sm font-medium text-blue-900">
                  ⚠️ سيتم إنشاء هذه المهمة لجميع الأطفال في جميع الحالات
                </p>
              </div>
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

              {/* Profile Field Mapping - Only for kid-level tasks */}
              {taskLevel === "kid_level" && requiresCaseAction && (
                <FormField
                  control={form.control}
                  name="profile_field_mapping"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ربط الإجابة بحقل الملف الشخصي (اختياري)</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value === "none" ? null : value)} 
                        value={field.value || "none"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر حقل الملف الشخصي أو اتركه فارغاً" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">لا يوجد ربط (سيتم حفظها في قسم إجابات المتابعة)</SelectItem>
                          <SelectItem value="health_state">الحالة الصحية</SelectItem>
                          <SelectItem value="current_grade">الصف الحالي</SelectItem>
                          <SelectItem value="school_name">اسم المدرسة</SelectItem>
                          <SelectItem value="education_progress">تقدم التعليمي</SelectItem>
                          <SelectItem value="certificates">الشهادات</SelectItem>
                          <SelectItem value="ongoing_courses">الدورات الجارية</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        إذا اخترت حقل، سيتم ملء حقل الملف الشخصي مباشرة. إذا لم تختر، ستذهب الإجابة إلى قسم إجابات المتابعة.
                      </p>
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
