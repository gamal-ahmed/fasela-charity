import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Phone, AlertCircle, CheckCircle2,
  ArrowRight, Clock, FileText, User, Upload, X, Check
} from "lucide-react";

interface FollowupAction {
  id: string;
  title: string;
  description: string | null;
  action_date: string;
  status: string;
  requires_case_action: boolean;
  requires_volunteer_action: boolean;
  answer_type: "multi_choice" | "photo_upload" | "text_area" | null;
  answer_options: string[];
  answer_text: string | null;
  answer_photos: string[] | null;
  answer_multi_choice: string | null;
  answered_at: string | null;
  task_level: "case_level" | "kid_level";
  kid_ids: string[];
  kids?: Array<{ id: string; name: string; age: number }>;
}

export default function CaseFollowups() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"phone" | "followups">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [caseId, setCaseId] = useState<string | null>(null);
  const [caseName, setCaseName] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [taskAnswers, setTaskAnswers] = useState<{ [key: string]: any }>({});
  const [uploadedPhotos, setUploadedPhotos] = useState<{ [key: string]: string[] }>({});
  const [kidTaskAnswers, setKidTaskAnswers] = useState<{ [key: string]: { [kidId: string]: any } }>({});
  const [kidUploadedPhotos, setKidUploadedPhotos] = useState<{ [key: string]: { [kidId: string]: string[] } }>({});

  // Check phone number and get case
  const handleVerifyPhone = async () => {
    if (phoneNumber.length < 8) return;
    
    setIsVerifying(true);
    try {
      const { data, error } = await supabase
        .from("cases")
        .select("id, title_ar")
        .eq("contact_phone", phoneNumber)
        .single();

      if (error || !data) {
        toast({
          title: "رقم غير صحيح",
          description: "لم نجد هذا الرقم في سجلاتنا. يرجى التأكد والمحاولة مرة أخرى.",
          variant: "destructive",
        });
        return;
      }

      setCaseId(data.id);
      setCaseName(data.title_ar || "");
      setStep("followups");
    } catch (err) {
      toast({
        title: "حدث خطأ",
        description: "يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Fetch pending followups that require case action
  const { data: followups, isLoading: isLoadingFollowups } = useQuery({
    queryKey: ["case_followups", caseId],
    queryFn: async () => {
      if (!caseId) return [];
      const { data, error } = await supabase
        .from("followup_actions")
        .select("id, title, description, action_date, status, requires_case_action, requires_volunteer_action, answer_type, answer_options, answer_text, answer_photos, answer_multi_choice, answered_at, task_level, kid_ids")
        .eq("case_id", caseId)
        .eq("status", "pending")
        .eq("requires_case_action", true)
        .order("action_date", { ascending: true });
      
      if (error) throw error;
      
      // Parse JSON fields if they're strings
      const parsedData = (data || []).map((item: any) => {
        if (item.answer_options && typeof item.answer_options === 'string') {
          try {
            item.answer_options = JSON.parse(item.answer_options);
          } catch (e) {
            item.answer_options = [];
          }
        }
        if (item.answer_photos && typeof item.answer_photos === 'string') {
          try {
            item.answer_photos = JSON.parse(item.answer_photos);
          } catch (e) {
            item.answer_photos = [];
          }
        }
        if (item.kid_ids && typeof item.kid_ids === 'string') {
          try {
            item.kid_ids = JSON.parse(item.kid_ids);
          } catch (e) {
            item.kid_ids = [];
          }
        }
        return item;
      });

      // Fetch kid information for kid-level tasks
      const kidLevelTasks = parsedData.filter((item: any) => item.task_level === "kid_level" && item.kid_ids && item.kid_ids.length > 0);
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
        parsedData.forEach((item: any) => {
          if (item.task_level === "kid_level" && item.kid_ids) {
            item.kids = item.kid_ids.map((kidId: string) => kidsMap.get(kidId)).filter(Boolean);
          }
        });
      }

      // Fetch kid-level answers
      const kidLevelTaskIds = parsedData.filter((item: any) => item.task_level === "kid_level").map((item: any) => item.id);
      if (kidLevelTaskIds.length > 0) {
          const { data: kidAnswers } = await supabase
            .from("followup_action_kid_answers" as any)
            .select("followup_action_id, kid_id, answer_text, answer_photos, answer_multi_choice, answered_at")
            .in("followup_action_id", kidLevelTaskIds);

        // Attach answers to tasks
        parsedData.forEach((item: any) => {
          if (item.task_level === "kid_level") {
            const taskAnswers = (kidAnswers || []).filter((ans: any) => ans.followup_action_id === item.id);
            item.kid_answers = taskAnswers.reduce((acc: any, ans: any) => {
              acc[ans.kid_id] = ans;
              return acc;
            }, {});
          }
        });
      }
      
      return parsedData as FollowupAction[];
    },
    enabled: !!caseId,
  });

  const submitAnswerMutation = useMutation({
    mutationFn: async ({ taskId, answer, kidId, taskLevel }: { taskId: string; answer: any; kidId?: string; taskLevel?: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      // answered_by is optional - allow null for phone-verified users

      if (taskLevel === "kid_level" && kidId) {
        // Insert into followup_action_kid_answers
        const answerData: any = {
          followup_action_id: taskId,
          kid_id: kidId,
          answered_by: userData.user?.id || null,
        };

        if (answer.type === "text_area") {
          answerData.answer_text = answer.text;
        } else if (answer.type === "multi_choice") {
          answerData.answer_multi_choice = answer.choice;
        } else if (answer.type === "photo_upload") {
          answerData.answer_photos = answer.photos;
        }

        const { error } = await supabase
          .from("followup_action_kid_answers" as any)
          .upsert(answerData, { onConflict: "followup_action_id,kid_id" });

        if (error) throw error;
      } else {
        // Update followup_actions for case-level tasks
        const updateData: any = {
          answered_at: new Date().toISOString(),
          answered_by: userData.user?.id || null,
        };

        if (answer.type === "text_area") {
          updateData.answer_text = answer.text;
        } else if (answer.type === "multi_choice") {
          updateData.answer_multi_choice = answer.choice;
        } else if (answer.type === "photo_upload") {
          updateData.answer_photos = answer.photos;
        }

        const { error } = await supabase
          .from("followup_actions")
          .update(updateData)
          .eq("id", taskId);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "تم إرسال الإجابة",
        description: "شكراً لك، تم حفظ إجابتك بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["case_followups", caseId] });
      setTaskAnswers({});
      setUploadedPhotos({});
      setKidTaskAnswers({});
      setKidUploadedPhotos({});
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: "فشل إرسال الإجابة: " + error.message,
        variant: "destructive",
      });
    },
  });

  const handlePhotoUpload = async (taskId: string, file: File, kidId?: string) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `task_${taskId}_${kidId ? `kid_${kidId}_` : ''}${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('case-images')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('case-images')
        .getPublicUrl(fileName);

      if (kidId) {
        // Kid-level task
        const currentPhotos = kidUploadedPhotos[taskId]?.[kidId] || [];
        setKidUploadedPhotos({
          ...kidUploadedPhotos,
          [taskId]: {
            ...(kidUploadedPhotos[taskId] || {}),
            [kidId]: [...currentPhotos, publicUrl]
          }
        });
      } else {
        // Case-level task
        const currentPhotos = uploadedPhotos[taskId] || [];
        setUploadedPhotos({
          ...uploadedPhotos,
          [taskId]: [...currentPhotos, publicUrl]
        });
      }

      toast({
        title: "تم رفع الصورة",
        description: "تم رفع الصورة بنجاح",
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "فشل رفع الصورة: " + error.message,
        variant: "destructive",
      });
    }
  };

  const removePhoto = (taskId: string, index: number, kidId?: string) => {
    if (kidId) {
      // Kid-level task
      const currentPhotos = kidUploadedPhotos[taskId]?.[kidId] || [];
      setKidUploadedPhotos({
        ...kidUploadedPhotos,
        [taskId]: {
          ...(kidUploadedPhotos[taskId] || {}),
          [kidId]: currentPhotos.filter((_, i) => i !== index)
        }
      });
    } else {
      // Case-level task
      const currentPhotos = uploadedPhotos[taskId] || [];
      setUploadedPhotos({
        ...uploadedPhotos,
        [taskId]: currentPhotos.filter((_, i) => i !== index)
      });
    }
  };

  const handleSubmitAnswer = (task: FollowupAction, kidId?: string) => {
    if (task.task_level === "kid_level" && kidId) {
      // Kid-level task
      const answer = kidTaskAnswers[task.id]?.[kidId];
      const kidPhotos = kidUploadedPhotos[task.id]?.[kidId] || [];

      // Validate based on answer type
      if (task.answer_type === "photo_upload") {
        if (kidPhotos.length === 0) {
          toast({
            title: "خطأ",
            description: "يرجى رفع صورة واحدة على الأقل",
            variant: "destructive",
          });
          return;
        }
      } else if (task.answer_type === "multi_choice") {
        if (!answer || !answer.choice) {
          toast({
            title: "خطأ",
            description: "يرجى اختيار خيار",
            variant: "destructive",
          });
          return;
        }
      } else if (task.answer_type === "text_area") {
        if (!answer || !answer.text || answer.text.trim() === "") {
          toast({
            title: "خطأ",
            description: "يرجى إدخال الإجابة",
            variant: "destructive",
          });
          return;
        }
      }

      submitAnswerMutation.mutate({
        taskId: task.id,
        kidId: kidId,
        taskLevel: "kid_level",
        answer: {
          type: task.answer_type,
          text: answer?.text || "",
          choice: answer?.choice || "",
          photos: kidPhotos,
        }
      });
    } else {
      // Case-level task
      const answer = taskAnswers[task.id];
      const photos = uploadedPhotos[task.id] || [];

      // Validate based on answer type
      if (task.answer_type === "photo_upload") {
        if (photos.length === 0) {
          toast({
            title: "خطأ",
            description: "يرجى رفع صورة واحدة على الأقل",
            variant: "destructive",
          });
          return;
        }
      } else if (task.answer_type === "multi_choice") {
        if (!answer || !answer.choice) {
          toast({
            title: "خطأ",
            description: "يرجى اختيار خيار",
            variant: "destructive",
          });
          return;
        }
      } else if (task.answer_type === "text_area") {
        if (!answer || !answer.text || answer.text.trim() === "") {
          toast({
            title: "خطأ",
            description: "يرجى إدخال الإجابة",
            variant: "destructive",
          });
          return;
        }
      }

      submitAnswerMutation.mutate({
        taskId: task.id,
        answer: {
          type: task.answer_type,
          text: answer?.text || "",
          choice: answer?.choice || "",
          photos: photos,
        }
      });
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const pendingCount = followups?.length || 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans text-right" dir="rtl">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden min-h-[600px] relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-500 to-orange-500" />

        <AnimatePresence mode="wait">
          {/* STEP 1: PHONE VERIFICATION */}
          {step === "phone" && (
            <motion.div
              key="phone"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="p-8 flex flex-col h-full justify-center space-y-8"
            >
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Phone className="w-10 h-10 text-amber-600" />
                </div>
                <h1 className="text-3xl font-bold text-slate-800">أهلاً بك</h1>
                <p className="text-slate-500 text-lg">
                  أدخلي رقم الجوال المسجل لمعرفة المتطلبات المطلوبة منك
                </p>
              </div>

              <Input
                placeholder="05XXXXXXXX"
                className="text-center text-3xl p-8 rounded-2xl border-2 border-slate-200 focus:border-amber-500 focus:ring-0 tracking-widest"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                type="tel"
              />

              <Button
                size="lg"
                className="w-full h-16 text-xl rounded-2xl bg-amber-600 hover:bg-amber-700"
                onClick={handleVerifyPhone}
                disabled={isVerifying || phoneNumber.length < 8}
              >
                {isVerifying ? <Loader2 className="animate-spin" /> : "التــالي"}
              </Button>
            </motion.div>
          )}

          {/* STEP 2: SHOW FOLLOWUPS */}
          {step === "followups" && (
            <motion.div
              key="followups"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="p-6 h-full flex flex-col"
            >
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-amber-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">أهلاً {caseName}</h2>
                <p className="text-slate-500 mt-2">
                  {pendingCount > 0 
                    ? `عندك ${pendingCount} مهمة مطلوبة منك`
                    : "ما عندك أي مهام حالياً"
                  }
                </p>
              </div>

              {/* Loading State */}
              {isLoadingFollowups && (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="animate-spin w-10 h-10 text-amber-500" />
                </div>
              )}

              {/* No Followups */}
              {!isLoadingFollowups && pendingCount === 0 && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex-1 flex flex-col items-center justify-center text-center p-6"
                >
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-12 h-12 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">ممتاز!</h3>
                  <p className="text-slate-500 text-lg">
                    ما عندك أي متطلبات حالياً
                  </p>
                  <p className="text-slate-400 mt-2">
                    كل شيء تمام، راح نتواصل معك لو احتجنا أي شيء
                  </p>
                </motion.div>
              )}

              {/* Followups List */}
              {!isLoadingFollowups && pendingCount > 0 && (
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  {/* Info Banner */}
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
                      <div>
                        <p className="text-amber-800 font-medium text-lg">مهم جداً</p>
                        <p className="text-amber-700 mt-1">
                          هذه المهام مطلوبة منك حتى نقدر نكمل خدمتك. يرجى إكمالها في أقرب وقت.
                        </p>
                      </div>
                    </div>
                  </div>

                  {followups?.map((followup, index) => {
                    const isKidLevel = followup.task_level === "kid_level";
                    const isCaseLevelAnswered = !isKidLevel && !!followup.answered_at;
                    const kidAnswers = (followup as any).kid_answers || {};
                    
                    return (
                      <motion.div
                        key={followup.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`bg-white border-2 rounded-2xl p-5 transition-all ${
                          (isCaseLevelAnswered || (isKidLevel && followup.kids?.every(k => kidAnswers[k.id]))) 
                            ? "border-green-200 bg-green-50/30" 
                            : "border-slate-100 hover:border-amber-200"
                        }`}
                      >
                        {/* Task Number */}
                        <div className="flex items-center gap-3 mb-3">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg ${
                            (isCaseLevelAnswered || (isKidLevel && followup.kids?.every(k => kidAnswers[k.id]))) ? "bg-green-500 text-white" : "bg-amber-500 text-white"
                          }`}>
                            {(isCaseLevelAnswered || (isKidLevel && followup.kids?.every(k => kidAnswers[k.id]))) ? <Check className="w-5 h-5" /> : index + 1}
                          </span>
                          <div className="flex-1">
                            <h3 className="font-bold text-xl text-slate-800">{followup.title}</h3>
                            {isKidLevel && followup.kids && followup.kids.length > 0 && (
                              <p className="text-sm text-slate-500 mt-1">
                                للأطفال: {followup.kids.map(k => k.name).join(", ")}
                              </p>
                            )}
                          </div>
                          {(isCaseLevelAnswered || (isKidLevel && followup.kids?.every(k => kidAnswers[k.id]))) && (
                            <span className="text-sm text-green-600 font-medium">✓ تم الإجابة</span>
                          )}
                        </div>

                        {/* Description */}
                        {followup.description && (
                          <div className="bg-slate-50 rounded-xl p-4 mb-3">
                            <div className="flex items-start gap-2">
                              <FileText className="w-5 h-5 text-slate-400 flex-shrink-0 mt-1" />
                              <p className="text-slate-600 text-lg leading-relaxed">
                                {followup.description}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Date */}
                        <div className="flex items-center gap-2 text-slate-500 mb-4">
                          <Clock className="w-5 h-5" />
                          <span className="text-base">التاريخ: {formatDate(followup.action_date)}</span>
                        </div>

                        {/* Answer Form - Case Level */}
                        {!isKidLevel && !isCaseLevelAnswered && followup.answer_type && (
                          <div className="space-y-4 mt-4 pt-4 border-t border-slate-200">
                            {followup.answer_type === "text_area" && (
                              <div className="space-y-2">
                                <Label>الإجابة</Label>
                                <Textarea
                                  placeholder="اكتب إجابتك هنا..."
                                  rows={4}
                                  value={taskAnswers[followup.id]?.text || ""}
                                  onChange={(e) => {
                                    setTaskAnswers({
                                      ...taskAnswers,
                                      [followup.id]: { ...taskAnswers[followup.id], text: e.target.value }
                                    });
                                  }}
                                  className="resize-none"
                                />
                              </div>
                            )}

                            {followup.answer_type === "multi_choice" && followup.answer_options && (
                              <div className="space-y-2">
                                <Label>اختر الإجابة</Label>
                                <RadioGroup
                                  value={taskAnswers[followup.id]?.choice || ""}
                                  onValueChange={(value) => {
                                    setTaskAnswers({
                                      ...taskAnswers,
                                      [followup.id]: { ...taskAnswers[followup.id], choice: value }
                                    });
                                  }}
                                >
                                  {followup.answer_options.map((option, optIndex) => (
                                    <div key={optIndex} className="flex items-center space-x-2 space-y-0">
                                      <RadioGroupItem value={option} id={`option-${followup.id}-${optIndex}`} />
                                      <Label htmlFor={`option-${followup.id}-${optIndex}`} className="font-normal cursor-pointer">
                                        {option}
                                      </Label>
                                    </div>
                                  ))}
                                </RadioGroup>
                              </div>
                            )}

                            {followup.answer_type === "photo_upload" && (
                              <div className="space-y-2">
                                <Label>رفع الصور</Label>
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handlePhotoUpload(followup.id, file);
                                      }}
                                      className="hidden"
                                      id={`photo-upload-${followup.id}`}
                                    />
                                    <Label
                                      htmlFor={`photo-upload-${followup.id}`}
                                      className="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-slate-50"
                                    >
                                      <Upload className="w-4 h-4" />
                                      رفع صورة
                                    </Label>
                                  </div>
                                  {uploadedPhotos[followup.id] && uploadedPhotos[followup.id].length > 0 && (
                                    <div className="grid grid-cols-2 gap-2">
                                      {uploadedPhotos[followup.id].map((photo, photoIndex) => (
                                        <div key={photoIndex} className="relative">
                                          <img
                                            src={photo}
                                            alt={`Uploaded ${photoIndex + 1}`}
                                            className="w-full h-24 object-cover rounded-lg"
                                          />
                                          <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-1 left-1 h-6 w-6"
                                            onClick={() => removePhoto(followup.id, photoIndex)}
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            <Button
                              onClick={() => handleSubmitAnswer(followup)}
                              disabled={submitAnswerMutation.isPending}
                              className="w-full bg-amber-600 hover:bg-amber-700"
                            >
                              {submitAnswerMutation.isPending ? (
                                <Loader2 className="animate-spin ml-2" />
                              ) : (
                                <Check className="ml-2" />
                              )}
                              إرسال الإجابة
                            </Button>
                          </div>
                        )}

                        {/* Show Answer if Already Answered - Case Level */}
                        {!isKidLevel && isCaseLevelAnswered && (
                          <div className="mt-4 pt-4 border-t border-green-200">
                            {followup.answer_type === "text_area" && followup.answer_text && (
                              <div className="bg-green-50 rounded-lg p-3">
                                <p className="text-sm font-medium text-green-900 mb-1">إجابتك:</p>
                                <p className="text-green-800 whitespace-pre-wrap">{followup.answer_text}</p>
                              </div>
                            )}
                            {followup.answer_type === "multi_choice" && followup.answer_multi_choice && (
                              <div className="bg-green-50 rounded-lg p-3">
                                <p className="text-sm font-medium text-green-900 mb-1">إجابتك:</p>
                                <p className="text-green-800">{followup.answer_multi_choice}</p>
                              </div>
                            )}
                            {followup.answer_type === "photo_upload" && followup.answer_photos && followup.answer_photos.length > 0 && (
                              <div className="bg-green-50 rounded-lg p-3">
                                <p className="text-sm font-medium text-green-900 mb-2">الصور المرفوعة:</p>
                                <div className="grid grid-cols-2 gap-2">
                                  {followup.answer_photos.map((photo, photoIndex) => (
                                    <img
                                      key={photoIndex}
                                      src={photo}
                                      alt={`Answer ${photoIndex + 1}`}
                                      className="w-full h-24 object-cover rounded-lg"
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Kid-Level Tasks - Show separate forms for each kid */}
                        {isKidLevel && followup.kids && followup.kids.length > 0 && (
                          <div className="space-y-4 mt-4 pt-4 border-t border-slate-200">
                            {followup.kids.map((kid) => {
                              const kidAnswer = kidAnswers[kid.id];
                              const isKidAnswered = !!kidAnswer;
                              const kidAnswerKey = `${followup.id}_${kid.id}`;
                              
                              return (
                                <div key={kid.id} className={`p-4 rounded-lg border-2 ${
                                  isKidAnswered ? "border-green-200 bg-green-50/30" : "border-slate-200 bg-slate-50"
                                }`}>
                                  <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-semibold text-slate-800">
                                      {kid.name} ({kid.age} سنة)
                                    </h4>
                                    {isKidAnswered && (
                                      <span className="text-xs text-green-600 font-medium">✓ تم الإجابة</span>
                                    )}
                                  </div>

                                  {!isKidAnswered && followup.answer_type && (
                                    <div className="space-y-3">
                                      {followup.answer_type === "text_area" && (
                                        <div className="space-y-2">
                                          <Label className="text-sm">الإجابة</Label>
                                          <Textarea
                                            placeholder="اكتب إجابتك هنا..."
                                            rows={3}
                                            value={kidTaskAnswers[followup.id]?.[kid.id]?.text || ""}
                                            onChange={(e) => {
                                              setKidTaskAnswers({
                                                ...kidTaskAnswers,
                                                [followup.id]: {
                                                  ...(kidTaskAnswers[followup.id] || {}),
                                                  [kid.id]: { ...(kidTaskAnswers[followup.id]?.[kid.id] || {}), text: e.target.value }
                                                }
                                              });
                                            }}
                                            className="resize-none"
                                          />
                                        </div>
                                      )}

                                      {followup.answer_type === "multi_choice" && followup.answer_options && (
                                        <div className="space-y-2">
                                          <Label className="text-sm">اختر الإجابة</Label>
                                          <RadioGroup
                                            value={kidTaskAnswers[followup.id]?.[kid.id]?.choice || ""}
                                            onValueChange={(value) => {
                                              setKidTaskAnswers({
                                                ...kidTaskAnswers,
                                                [followup.id]: {
                                                  ...(kidTaskAnswers[followup.id] || {}),
                                                  [kid.id]: { ...(kidTaskAnswers[followup.id]?.[kid.id] || {}), choice: value }
                                                }
                                              });
                                            }}
                                          >
                                            {followup.answer_options.map((option, optIndex) => (
                                              <div key={optIndex} className="flex items-center space-x-2 space-y-0">
                                                <RadioGroupItem value={option} id={`option-${kidAnswerKey}-${optIndex}`} />
                                                <Label htmlFor={`option-${kidAnswerKey}-${optIndex}`} className="font-normal cursor-pointer text-sm">
                                                  {option}
                                                </Label>
                                              </div>
                                            ))}
                                          </RadioGroup>
                                        </div>
                                      )}

                                      {followup.answer_type === "photo_upload" && (
                                        <div className="space-y-2">
                                          <Label className="text-sm">رفع الصور</Label>
                                          <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                              <Input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                  const file = e.target.files?.[0];
                                                  if (file) handlePhotoUpload(followup.id, file, kid.id);
                                                }}
                                                className="hidden"
                                                id={`photo-upload-${kidAnswerKey}`}
                                              />
                                              <Label
                                                htmlFor={`photo-upload-${kidAnswerKey}`}
                                                className="flex items-center gap-2 px-3 py-1.5 border rounded-lg cursor-pointer hover:bg-slate-50 text-sm"
                                              >
                                                <Upload className="w-3 h-3" />
                                                رفع صورة
                                              </Label>
                                            </div>
                                            {kidUploadedPhotos[followup.id]?.[kid.id] && kidUploadedPhotos[followup.id][kid.id].length > 0 && (
                                              <div className="grid grid-cols-2 gap-2">
                                                {kidUploadedPhotos[followup.id][kid.id].map((photo, photoIndex) => (
                                                  <div key={photoIndex} className="relative">
                                                    <img
                                                      src={photo}
                                                      alt={`Uploaded ${photoIndex + 1}`}
                                                      className="w-full h-20 object-cover rounded-lg"
                                                    />
                                                    <Button
                                                      type="button"
                                                      variant="destructive"
                                                      size="icon"
                                                      className="absolute top-1 left-1 h-5 w-5"
                                                      onClick={() => removePhoto(followup.id, photoIndex, kid.id)}
                                                    >
                                                      <X className="h-2.5 w-2.5" />
                                                    </Button>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}

                                      <Button
                                        onClick={() => handleSubmitAnswer(followup, kid.id)}
                                        disabled={submitAnswerMutation.isPending}
                                        className="w-full bg-amber-600 hover:bg-amber-700 text-sm"
                                        size="sm"
                                      >
                                        {submitAnswerMutation.isPending ? (
                                          <Loader2 className="animate-spin ml-2 h-3 w-3" />
                                        ) : (
                                          <Check className="ml-2 h-3 w-3" />
                                        )}
                                        إرسال إجابة {kid.name}
                                      </Button>
                                    </div>
                                  )}

                                  {isKidAnswered && (
                                    <div className="mt-3 pt-3 border-t border-green-200">
                                      {kidAnswer.answer_text && (
                                        <div className="bg-green-50 rounded-lg p-2">
                                          <p className="text-xs font-medium text-green-900 mb-1">الإجابة:</p>
                                          <p className="text-green-800 text-sm whitespace-pre-wrap">{kidAnswer.answer_text}</p>
                                        </div>
                                      )}
                                      {kidAnswer.answer_multi_choice && (
                                        <div className="bg-green-50 rounded-lg p-2">
                                          <p className="text-xs font-medium text-green-900 mb-1">الإجابة:</p>
                                          <p className="text-green-800 text-sm">{kidAnswer.answer_multi_choice}</p>
                                        </div>
                                      )}
                                      {kidAnswer.answer_photos && Array.isArray(kidAnswer.answer_photos) && kidAnswer.answer_photos.length > 0 && (
                                        <div className="bg-green-50 rounded-lg p-2">
                                          <p className="text-xs font-medium text-green-900 mb-2">الصور:</p>
                                          <div className="grid grid-cols-2 gap-2">
                                            {kidAnswer.answer_photos.map((photo: string, photoIndex: number) => (
                                              <img
                                                key={photoIndex}
                                                src={photo}
                                                alt={`Answer ${photoIndex + 1}`}
                                                className="w-full h-20 object-cover rounded-lg"
                                              />
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Footer */}
              <div className="mt-auto pt-4 border-t border-slate-100">
                <p className="text-center text-slate-400 mb-4">
                  لو عندك أي استفسار تواصلي معنا
                </p>
                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => {
                    setStep("phone");
                    setPhoneNumber("");
                    setCaseId(null);
                  }}
                >
                  <ArrowRight className="ml-2 w-4 h-4" /> خروج / تغيير الرقم
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
