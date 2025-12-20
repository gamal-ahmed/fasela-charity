import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Heart, GraduationCap, BookOpen, Calendar, Award, Edit2, Save, Plus, X, TrendingUp, Palette, PenTool, FileText, CheckCircle2, Clock } from "lucide-react";
import { useParams, Link } from "react-router-dom";
import React, { useState } from "react";
import { toast } from "sonner";

interface Kid {
  id: string;
  name: string;
  age: number;
  gender: string;
  description?: string;
  health_state?: string;
  current_grade?: string;
  school_name?: string;
  education_progress?: Array<{ year: string; description: string; grade?: string }>;
  certificates?: Array<{ name: string; date?: string; issuer?: string }>;
  ongoing_courses?: Array<{ name: string; startDate?: string; description?: string }>;
  hobbies?: string[];
  case_id: string;
  cases?: {
    title: string;
    title_ar: string;
  };
}

const KidProfile = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editedKid, setEditedKid] = useState<Partial<Kid>>({});
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin
  React.useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .single();
        setIsAdmin(data?.role === "admin");
      }
    };
    checkAdmin();
  }, []);

  const { data: kid, isLoading } = useQuery({
    queryKey: ["kid", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("case_kids")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      // Fetch case details
      const { data: caseData } = await supabase
        .from("cases")
        .select("id, title, title_ar")
        .eq("id", data.case_id)
        .single();

      return {
        ...data,
        cases: caseData,
        education_progress: (data.education_progress || []) as Array<{ year: string; description: string; grade?: string }>,
        certificates: (data.certificates || []) as Array<{ name: string; date?: string; issuer?: string }>,
        ongoing_courses: (data.ongoing_courses || []) as Array<{ name: string; startDate?: string; description?: string }>
      } as Kid;
    },
  });

  // Fetch kid-level tasks for this kid
  const { data: kidTasks } = useQuery({
    queryKey: ["kid-tasks", id],
    queryFn: async () => {
      if (!id) return [];
      
      // Fetch tasks where this kid is included in kid_ids
      const { data: tasks, error } = await supabase
        .from("followup_actions")
        .select("id, title, description, action_date, status, answer_type, answer_options, task_level, kid_ids")
        .eq("task_level", "kid_level")
        .eq("status", "pending")
        .eq("requires_case_action", true);

      if (error) throw error;

      // Filter tasks that include this kid
      const kidTasks = (tasks || []).filter((task: any) => {
        if (!task.kid_ids) return false;
        const kidIds = typeof task.kid_ids === 'string' ? JSON.parse(task.kid_ids) : task.kid_ids;
        return Array.isArray(kidIds) && kidIds.includes(id);
      });

      // Fetch answers for these tasks
      if (kidTasks.length > 0) {
        const taskIds = kidTasks.map((t: any) => t.id);
        const { data: answers } = await supabase
          .from("followup_action_kid_answers" as any)
          .select("*")
          .in("followup_action_id", taskIds)
          .eq("kid_id", id);

        // Attach answers to tasks
        const answersMap = new Map((answers || []).map((a: any) => [a.followup_action_id, a]));
        kidTasks.forEach((task: any) => {
          task.answer = answersMap.get(task.id);
        });
      }

      return kidTasks;
    },
    enabled: !!id,
  });

  const getGenderIcon = (gender: string) => {
    return gender === "male" ? "👦" : "👧";
  };

  const getGenderText = (gender: string) => {
    return gender === "male" ? "ذكر" : "أنثى";
  };

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<Kid>) => {
      const { error } = await supabase
        .from("case_kids")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kid", id] });
      toast.success("تم تحديث البيانات بنجاح");
      setIsEditing(false);
    },
    onError: () => {
      toast.error("حدث خطأ أثناء التحديث");
    },
  });

  const handleSave = () => {
    updateMutation.mutate(editedKid);
  };

  const handleEdit = () => {
    setEditedKid({
      health_state: kid?.health_state || "",
      current_grade: kid?.current_grade || "",
      school_name: kid?.school_name || "",
      education_progress: kid?.education_progress || [],
      certificates: kid?.certificates || [],
      ongoing_courses: kid?.ongoing_courses || [],
    });
    setIsEditing(true);
  };

  const addEducationProgress = () => {
    setEditedKid({
      ...editedKid,
      education_progress: [
        ...(editedKid.education_progress || []),
        { year: "", description: "", grade: "" }
      ]
    });
  };

  const addCertificate = () => {
    setEditedKid({
      ...editedKid,
      certificates: [
        ...(editedKid.certificates || []),
        { name: "", date: "", issuer: "" }
      ]
    });
  };

  const addCourse = () => {
    setEditedKid({
      ...editedKid,
      ongoing_courses: [
        ...(editedKid.ongoing_courses || []),
        { name: "", startDate: "", description: "" }
      ]
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">

        <main className="container mx-auto px-4 py-8">
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  if (!kid) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">

        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-xl text-muted-foreground">لم يتم العثور على ملف الطفل</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header Card */}
        <Card className="mb-6 animate-fade-in">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-5xl">{getGenderIcon(kid.gender)}</div>
                <div>
                  <CardTitle className="text-3xl mb-2">{kid.name}</CardTitle>
                  <Link
                    to={`/case/${kid.case_id}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {kid.cases?.title_ar || kid.cases?.title}
                  </Link>
                </div>
              </div>
              {isAdmin && (
                <Button
                  onClick={isEditing ? handleSave : handleEdit}
                  variant={isEditing ? "default" : "outline"}
                  size="lg"
                >
                  {isEditing ? (
                    <>
                      <Save className="w-4 h-4 ml-2" />
                      حفظ
                    </>
                  ) : (
                    <>
                      <Edit2 className="w-4 h-4 ml-2" />
                      تعديل
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-sm">
                {kid.age} سنة
              </Badge>
              <Badge variant="secondary" className="text-sm">
                {getGenderText(kid.gender)}
              </Badge>
            </div>

            {kid.description && (
              <div className="bg-muted/30 p-4 rounded-lg border border-border">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-primary" />
                  ملاحظات / نبذة
                </h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{kid.description}</p>
              </div>
            )}

            {/* Hobbies Section */}
            {kid.hobbies && kid.hobbies.length > 0 && (
              <div className="bg-white p-4 rounded-lg border border-border shadow-sm">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-lg">
                  <Palette className="w-5 h-5 text-purple-600" />
                  الهوايات والاهتمامات
                </h3>
                <div className="flex flex-wrap gap-2">
                  {kid.hobbies.map((hobby, idx) => (
                    <Badge key={idx} variant="secondary" className="text-base py-1 px-3 bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200">
                      {hobby}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Health Section */}
            <Card className="border-l-4 border-l-red-500 animate-fade-in">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    <CardTitle className="text-lg">الحالة الصحية</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={editedKid.health_state || ""}
                    onChange={(e) => setEditedKid({ ...editedKid, health_state: e.target.value })}
                    placeholder="أدخل الحالة الصحية..."
                    className="min-h-[100px]"
                  />
                ) : (
                  <p className="text-muted-foreground">
                    {kid.health_state || "لم يتم إضافة معلومات صحية"}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Education Info Section */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="border-l-4 border-l-blue-500 animate-fade-in">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-blue-500" />
                    <CardTitle className="text-lg">الصف الدراسي</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <Input
                      value={editedKid.current_grade || ""}
                      onChange={(e) => setEditedKid({ ...editedKid, current_grade: e.target.value })}
                      placeholder="مثال: الصف الخامس الابتدائي"
                    />
                  ) : (
                    <p className="text-muted-foreground">
                      {kid.current_grade || "لم يتم تحديد الصف"}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500 animate-fade-in">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-green-500" />
                    <CardTitle className="text-lg">المدرسة</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <Input
                      value={editedKid.school_name || ""}
                      onChange={(e) => setEditedKid({ ...editedKid, school_name: e.target.value })}
                      placeholder="اسم المدرسة"
                    />
                  ) : (
                    <p className="text-muted-foreground">
                      {kid.school_name || "لم يتم تحديد المدرسة"}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Ongoing Courses & Study Needs */}
            <Card className="border-l-4 border-l-purple-500 animate-fade-in">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-500" />
                    <CardTitle className="text-lg">الدورات والاحتياجات الدراسية</CardTitle>
                  </div>
                  {isEditing && (
                    <Button onClick={addCourse} size="sm" variant="outline">
                      <Plus className="w-4 h-4 ml-2" />
                      إضافة دورة
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-4">
                    {editedKid.ongoing_courses?.map((course, index) => (
                      <div key={index} className="p-4 border rounded-lg space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 space-y-3">
                            <Input
                              placeholder="اسم الدورة أو الاحتياج"
                              value={course.name}
                              onChange={(e) => {
                                const updated = [...(editedKid.ongoing_courses || [])];
                                updated[index].name = e.target.value;
                                setEditedKid({ ...editedKid, ongoing_courses: updated });
                              }}
                            />
                            <Input
                              placeholder="تاريخ البدء"
                              type="date"
                              value={course.startDate}
                              onChange={(e) => {
                                const updated = [...(editedKid.ongoing_courses || [])];
                                updated[index].startDate = e.target.value;
                                setEditedKid({ ...editedKid, ongoing_courses: updated });
                              }}
                            />
                            <Textarea
                              placeholder="وصف الدورة أو التفاصيل"
                              value={course.description}
                              onChange={(e) => {
                                const updated = [...(editedKid.ongoing_courses || [])];
                                updated[index].description = e.target.value;
                                setEditedKid({ ...editedKid, ongoing_courses: updated });
                              }}
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const updated = editedKid.ongoing_courses?.filter((_, i) => i !== index);
                              setEditedKid({ ...editedKid, ongoing_courses: updated });
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {kid.ongoing_courses && kid.ongoing_courses.length > 0 ? (
                      kid.ongoing_courses.map((course: any, index: number) => (
                        <div key={index} className="p-4 bg-muted rounded-lg space-y-2">
                          <h4 className="font-semibold">
                            {typeof course === 'string' ? course : course.name || 'دورة'}
                          </h4>
                          {course.startDate && (
                            <p className="text-sm text-muted-foreground">
                              تاريخ البدء: {course.startDate}
                            </p>
                          )}
                          {course.description && (
                            <p className="text-sm text-muted-foreground">{course.description}</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-4">
                        لا توجد دورات أو احتياجات دراسية مسجلة
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Certificates & Achievements */}
            <Card className="border-l-4 border-l-yellow-500 animate-fade-in">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-yellow-500" />
                    <CardTitle className="text-lg">الشهادات والإنجازات</CardTitle>
                  </div>
                  {isEditing && (
                    <Button onClick={addCertificate} size="sm" variant="outline">
                      <Plus className="w-4 h-4 ml-2" />
                      إضافة شهادة
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-4">
                    {editedKid.certificates?.map((cert, index) => (
                      <div key={index} className="p-4 border rounded-lg space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 space-y-3">
                            <Input
                              placeholder="اسم الشهادة أو الإنجاز"
                              value={cert.name}
                              onChange={(e) => {
                                const updated = [...(editedKid.certificates || [])];
                                updated[index].name = e.target.value;
                                setEditedKid({ ...editedKid, certificates: updated });
                              }}
                            />
                            <Input
                              placeholder="التاريخ"
                              type="date"
                              value={cert.date}
                              onChange={(e) => {
                                const updated = [...(editedKid.certificates || [])];
                                updated[index].date = e.target.value;
                                setEditedKid({ ...editedKid, certificates: updated });
                              }}
                            />
                            <Input
                              placeholder="الجهة المانحة"
                              value={cert.issuer}
                              onChange={(e) => {
                                const updated = [...(editedKid.certificates || [])];
                                updated[index].issuer = e.target.value;
                                setEditedKid({ ...editedKid, certificates: updated });
                              }}
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const updated = editedKid.certificates?.filter((_, i) => i !== index);
                              setEditedKid({ ...editedKid, certificates: updated });
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-3">
                    {kid.certificates && kid.certificates.length > 0 ? (
                      kid.certificates.map((cert: any, index: number) => (
                        <div key={index} className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
                          <div className="flex items-start gap-3">
                            <Award className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-1" />
                            <div className="flex-1">
                              <h4 className="font-semibold text-yellow-900 dark:text-yellow-100">
                                {typeof cert === 'string' ? cert : cert.name || 'شهادة'}
                              </h4>
                              {cert.date && (
                                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                                  {cert.date}
                                </p>
                              )}
                              {cert.issuer && (
                                <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                                  {cert.issuer}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-4 col-span-2">
                        لا توجد شهادات مسجلة
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Education Progress Year by Year */}
            <Card className="border-l-4 border-l-indigo-500 animate-fade-in">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-500" />
                    <CardTitle className="text-lg">التقدم التعليمي (سنة بعد سنة)</CardTitle>
                  </div>
                  {isEditing && (
                    <Button onClick={addEducationProgress} size="sm" variant="outline">
                      <Plus className="w-4 h-4 ml-2" />
                      إضافة سنة
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-4">
                    {editedKid.education_progress?.map((progress, index) => (
                      <div key={index} className="p-4 border rounded-lg space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 space-y-3">
                            <Input
                              placeholder="السنة (مثال: 2023-2024)"
                              value={progress.year}
                              onChange={(e) => {
                                const updated = [...(editedKid.education_progress || [])];
                                updated[index].year = e.target.value;
                                setEditedKid({ ...editedKid, education_progress: updated });
                              }}
                            />
                            <Input
                              placeholder="الدرجة أو التقدير"
                              value={progress.grade}
                              onChange={(e) => {
                                const updated = [...(editedKid.education_progress || [])];
                                updated[index].grade = e.target.value;
                                setEditedKid({ ...editedKid, education_progress: updated });
                              }}
                            />
                            <Textarea
                              placeholder="وصف التقدم والإنجازات"
                              value={progress.description}
                              onChange={(e) => {
                                const updated = [...(editedKid.education_progress || [])];
                                updated[index].description = e.target.value;
                                setEditedKid({ ...editedKid, education_progress: updated });
                              }}
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const updated = editedKid.education_progress?.filter((_, i) => i !== index);
                              setEditedKid({ ...editedKid, education_progress: updated });
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {kid.education_progress && kid.education_progress.length > 0 ? (
                      <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute right-6 top-0 bottom-0 w-0.5 bg-border" />

                        {kid.education_progress.map((progress: any, index: number) => (
                          <div key={index} className="relative pr-12 pb-8 last:pb-0">
                            {/* Timeline dot */}
                            <div className="absolute right-4 top-2 w-4 h-4 rounded-full bg-indigo-500 border-4 border-background" />

                            <div className="p-4 bg-muted rounded-lg space-y-2">
                              <div className="flex items-center justify-between">
                                <h4 className="font-bold text-lg">
                                  {typeof progress === 'string' ? progress : progress.year || 'سنة دراسية'}
                                </h4>
                                {progress.grade && (
                                  <Badge variant="secondary" className="text-sm">
                                    {progress.grade}
                                  </Badge>
                                )}
                              </div>
                              {progress.description && (
                                <p className="text-sm text-muted-foreground">{progress.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">
                        لم يتم تسجيل تقدم تعليمي
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Follow-up Tasks Section */}
            <Card className="border-l-4 border-l-blue-500 animate-fade-in">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <CardTitle className="text-lg">مهام المتابعة</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {kidTasks && kidTasks.length > 0 ? (
                  <div className="space-y-4">
                    {kidTasks.map((task: any) => {
                      const isAnswered = !!task.answer;
                      const formatDate = (dateStr: string) => {
                        const date = new Date(dateStr);
                        return date.toLocaleDateString("ar-EG", {
                          year: "numeric",
                          month: "long",
                          day: "numeric"
                        });
                      };

                      return (
                        <div
                          key={task.id}
                          className={`p-4 rounded-lg border-2 ${
                            isAnswered
                              ? "border-green-200 bg-green-50/30"
                              : "border-amber-200 bg-amber-50/30"
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg">{task.title}</h4>
                              {task.description && (
                                <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                              )}
                            </div>
                            {isAnswered ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                            ) : (
                              <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                            <Calendar className="w-4 h-4" />
                            <span>التاريخ: {formatDate(task.action_date)}</span>
                          </div>

                          {isAnswered && task.answer && (
                            <div className="mt-3 pt-3 border-t border-green-200">
                              <p className="text-sm font-medium text-green-900 mb-2">الإجابة:</p>
                              {task.answer.answer_text && (
                                <p className="text-sm text-green-800 whitespace-pre-wrap mb-2">
                                  {task.answer.answer_text}
                                </p>
                              )}
                              {task.answer.answer_multi_choice && (
                                <p className="text-sm text-green-800 mb-2">
                                  {task.answer.answer_multi_choice}
                                </p>
                              )}
                              {task.answer.answer_photos && Array.isArray(task.answer.answer_photos) && task.answer.answer_photos.length > 0 && (
                                <div className="grid grid-cols-3 gap-2 mt-2">
                                  {task.answer.answer_photos.map((photo: string, idx: number) => (
                                    <img
                                      key={idx}
                                      src={photo}
                                      alt={`Answer ${idx + 1}`}
                                      className="w-full h-20 object-cover rounded-lg"
                                    />
                                  ))}
                                </div>
                              )}
                              <p className="text-xs text-green-700 mt-2">
                                تم الإجابة في: {new Date(task.answer.answered_at).toLocaleDateString("ar-EG")}
                              </p>
                            </div>
                          )}

                          {!isAnswered && (
                            <div className="mt-3 pt-3 border-t border-amber-200">
                              <Link
                                to={`/case-followups`}
                                className="text-sm text-amber-700 hover:text-amber-900 underline"
                              >
                                اضغطي هنا للإجابة على هذه المهمة
                              </Link>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    لا توجد مهام متابعة حالياً
                  </p>
                )}
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default KidProfile;
