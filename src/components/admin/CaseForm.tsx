import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CaseFormData {
  title_ar: string;
  title?: string;
  short_description_ar: string;
  short_description?: string;
  description_ar: string;
  description?: string;
  monthly_cost: number;
  months_needed: number;
  photo_url?: string;
  is_published: boolean;
  city?: string;
  area?: string;
  deserve_zakkah: boolean;
}

interface MonthlyNeed {
  category: string;
  amount: number;
  description: string;
  icon: string;
  color: string;
}

interface CaseFormProps {
  caseId?: string;
}

const CaseForm = ({ caseId }: CaseFormProps) => {
  const [loading, setLoading] = useState(false);
  const [loadingCase, setLoadingCase] = useState(false);
  const [monthlyNeeds, setMonthlyNeeds] = useState<MonthlyNeed[]>([
    { category: "", amount: 0, description: "", icon: "💰", color: "bg-blue-500" }
  ]);
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CaseFormData>();
  const { toast } = useToast();
  const isEditMode = !!caseId;

  // Load case data when in edit mode
  useEffect(() => {
    if (isEditMode && caseId) {
      loadCaseData();
    }
  }, [caseId, isEditMode]);

  const loadCaseData = async () => {
    if (!caseId) return;
    
    setLoadingCase(true);
    try {
      // Load case data
      const { data: caseData, error: caseError } = await supabase
        .from("cases")
        .select("*")
        .eq("id", caseId)
        .single();

      if (caseError) throw caseError;

      // Load monthly needs
      const { data: needsData, error: needsError } = await supabase
        .from("monthly_needs")
        .select("*")
        .eq("case_id", caseId);

      if (needsError) throw needsError;

      // Populate form fields
      if (caseData) {
        setValue("title_ar", caseData.title_ar);
        setValue("title", caseData.title || "");
        setValue("short_description_ar", caseData.short_description_ar);
        setValue("short_description", caseData.short_description || "");
        setValue("description_ar", caseData.description_ar);
        setValue("description", caseData.description || "");
        setValue("monthly_cost", caseData.monthly_cost);
        setValue("months_needed", caseData.months_needed);
        setValue("photo_url", caseData.photo_url || "");
        setValue("is_published", caseData.is_published);
        setValue("city", caseData.city || "");
        setValue("area", caseData.area || "");
        setValue("deserve_zakkah", caseData.deserve_zakkah || false);
      }

      // Populate monthly needs
      if (needsData && needsData.length > 0) {
        setMonthlyNeeds(needsData.map(need => ({
          category: need.category,
          amount: need.amount,
          description: need.description || "",
          icon: need.icon || "💰",
          color: need.color || "bg-blue-500"
        })));
      }

    } catch (error) {
      console.error("Error loading case data:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحميل بيانات الحالة",
        variant: "destructive",
      });
    } finally {
      setLoadingCase(false);
    }
  };

  const getDefaultImage = () => {
    return "/images/default-case-image.jpg";
  };

  const addMonthlyNeed = () => {
    setMonthlyNeeds([...monthlyNeeds, { 
      category: "", 
      amount: 0, 
      description: "", 
      icon: "💰", 
      color: "bg-blue-500" 
    }]);
  };

  const removeMonthlyNeed = (index: number) => {
    if (monthlyNeeds.length > 1) {
      setMonthlyNeeds(monthlyNeeds.filter((_, i) => i !== index));
    }
  };

  const updateMonthlyNeed = (index: number, field: keyof MonthlyNeed, value: string | number) => {
    const updated = [...monthlyNeeds];
    updated[index] = { ...updated[index], [field]: value };
    setMonthlyNeeds(updated);
  };

  const onSubmit = async (data: CaseFormData) => {
    setLoading(true);
    
    try {
      if (isEditMode && caseId) {
        // Update existing case
        const { error: caseError } = await supabase
          .from("cases")
          .update({
            title_ar: data.title_ar,
            title: data.title || "",
            short_description_ar: data.short_description_ar,
            short_description: data.short_description || "",
            description_ar: data.description_ar,
            description: data.description || "",
            monthly_cost: data.monthly_cost,
            months_needed: data.months_needed,
            photo_url: data.photo_url || getDefaultImage(),
            is_published: data.is_published,
            city: data.city || null,
            area: data.area || null,
            deserve_zakkah: data.deserve_zakkah || false,
            updated_at: new Date().toISOString()
          })
          .eq("id", caseId);

        if (caseError) throw caseError;

        // Delete existing monthly needs and insert new ones
        const { error: deleteError } = await supabase
          .from("monthly_needs")
          .delete()
          .eq("case_id", caseId);

        if (deleteError) throw deleteError;

        // Insert updated monthly needs
        if (monthlyNeeds.some(need => need.category.trim())) {
          const validNeeds = monthlyNeeds.filter(need => need.category.trim());
          const needsToInsert = validNeeds.map(need => ({
            case_id: caseId,
            category: need.category,
            amount: need.amount,
            description: need.description,
            icon: need.icon,
            color: need.color
          }));

          const { error: needsError } = await supabase
            .from("monthly_needs")
            .insert(needsToInsert);

          if (needsError) throw needsError;
        }

        toast({
          title: "تم بنجاح",
          description: "تم تحديث الحالة والاحتياجات الشهرية بنجاح",
        });

      } else {
        // Create new case
        const { data: caseData, error: caseError } = await supabase
          .from("cases")
          .insert({
            title_ar: data.title_ar,
            title: data.title || "",
            short_description_ar: data.short_description_ar,
            short_description: data.short_description || "",
            description_ar: data.description_ar,
            description: data.description || "",
            monthly_cost: data.monthly_cost,
            months_needed: data.months_needed,
            photo_url: data.photo_url || getDefaultImage(),
            is_published: data.is_published,
            city: data.city || null,
            area: data.area || null,
            deserve_zakkah: data.deserve_zakkah || false,
            months_covered: 0,
            total_secured_money: 0
          })
          .select()
          .single();

        if (caseError) throw caseError;

        // Insert monthly needs
        if (caseData && monthlyNeeds.some(need => need.category.trim())) {
          const validNeeds = monthlyNeeds.filter(need => need.category.trim());
          const needsToInsert = validNeeds.map(need => ({
            case_id: caseData.id,
            category: need.category,
            amount: need.amount,
            description: need.description,
            icon: need.icon,
            color: need.color
          }));

          const { error: needsError } = await supabase
            .from("monthly_needs")
            .insert(needsToInsert);

          if (needsError) throw needsError;
        }

        toast({
          title: "تم بنجاح",
          description: "تم إضافة الحالة والاحتياجات الشهرية بنجاح",
        });

        // Reset form only for new cases
        reset();
        setMonthlyNeeds([{ category: "", amount: 0, description: "", icon: "💰", color: "bg-blue-500" }]);
      }

    } catch (error) {
      console.error("Error saving case:", error);
      toast({
        title: "خطأ",
        description: isEditMode ? "حدث خطأ أثناء تحديث الحالة" : "حدث خطأ أثناء إضافة الحالة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingCase) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="text-lg">جار تحميل بيانات الحالة...</div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>بيانات الحالة الأساسية</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title_ar">العنوان (عربي)</Label>
              <Input
                id="title_ar"
                {...register("title_ar", { required: "العنوان العربي مطلوب" })}
                placeholder="اسم العائلة أو الحالة"
              />
              {errors.title_ar && (
                <p className="text-sm text-destructive">{errors.title_ar.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">العنوان (إنجليزي) - اختياري</Label>
              <Input
                id="title"
                {...register("title")}
                placeholder="Family name or case title"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="short_description_ar">الوصف المختصر (عربي)</Label>
              <Textarea
                id="short_description_ar"
                {...register("short_description_ar", { required: "الوصف المختصر العربي مطلوب" })}
                placeholder="وصف مختصر للحالة"
                rows={3}
              />
              {errors.short_description_ar && (
                <p className="text-sm text-destructive">{errors.short_description_ar.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="short_description">الوصف المختصر (إنجليزي) - اختياري</Label>
              <Textarea
                id="short_description"
                {...register("short_description")}
                placeholder="Brief case description"
                rows={3}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="description_ar">الوصف الكامل (عربي)</Label>
              <Textarea
                id="description_ar"
                {...register("description_ar", { required: "الوصف الكامل العربي مطلوب" })}
                placeholder="قصة الحالة والظروف الخاصة"
                rows={5}
              />
              {errors.description_ar && (
                <p className="text-sm text-destructive">{errors.description_ar.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">الوصف الكامل (إنجليزي) - اختياري</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Full case story and circumstances"
                rows={5}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monthly_cost">التكلفة الشهرية (جنيه)</Label>
              <Input
                id="monthly_cost"
                type="number"
                {...register("monthly_cost", { 
                  required: "التكلفة الشهرية مطلوبة",
                  min: { value: 1, message: "يجب أن تكون التكلفة أكبر من صفر" }
                })}
                placeholder="2700"
              />
              {errors.monthly_cost && (
                <p className="text-sm text-destructive">{errors.monthly_cost.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="months_needed">عدد الأشهر المطلوبة</Label>
              <Input
                id="months_needed"
                type="number"
                {...register("months_needed", { 
                  required: "عدد الأشهر مطلوب",
                  min: { value: 1, message: "يجب أن يكون عدد الأشهر أكبر من صفر" }
                })}
                placeholder="12"
              />
              {errors.months_needed && (
                <p className="text-sm text-destructive">{errors.months_needed.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="photo_url">رابط الصورة</Label>
              <Input
                id="photo_url"
                {...register("photo_url")}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">المحافظة</Label>
              <Select onValueChange={(value) => setValue("city", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المحافظة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="القاهرة">القاهرة</SelectItem>
                  <SelectItem value="الإسكندرية">الإسكندرية</SelectItem>
                  <SelectItem value="الجيزة">الجيزة</SelectItem>
                  <SelectItem value="الدقهلية">الدقهلية</SelectItem>
                  <SelectItem value="البحيرة">البحيرة</SelectItem>
                  <SelectItem value="المنوفية">المنوفية</SelectItem>
                  <SelectItem value="الغربية">الغربية</SelectItem>
                  <SelectItem value="كفر الشيخ">كفر الشيخ</SelectItem>
                  <SelectItem value="الشرقية">الشرقية</SelectItem>
                  <SelectItem value="القليوبية">القليوبية</SelectItem>
                  <SelectItem value="الإسماعيلية">الإسماعيلية</SelectItem>
                  <SelectItem value="بورسعيد">بورسعيد</SelectItem>
                  <SelectItem value="السويس">السويس</SelectItem>
                  <SelectItem value="شمال سيناء">شمال سيناء</SelectItem>
                  <SelectItem value="جنوب سيناء">جنوب سيناء</SelectItem>
                  <SelectItem value="الفيوم">الفيوم</SelectItem>
                  <SelectItem value="بني سويف">بني سويف</SelectItem>
                  <SelectItem value="المنيا">المنيا</SelectItem>
                  <SelectItem value="أسيوط">أسيوط</SelectItem>
                  <SelectItem value="سوهاج">سوهاج</SelectItem>
                  <SelectItem value="قنا">قنا</SelectItem>
                  <SelectItem value="الأقصر">الأقصر</SelectItem>
                  <SelectItem value="أسوان">أسوان</SelectItem>
                  <SelectItem value="البحر الأحمر">البحر الأحمر</SelectItem>
                  <SelectItem value="الوادي الجديد">الوادي الجديد</SelectItem>
                  <SelectItem value="مطروح">مطروح</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="area">المنطقة</Label>
              <Input
                id="area"
                {...register("area")}
                placeholder="حدد المنطقة أو الحي"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deserve_zakkah" className="flex items-center gap-2">
                مستحق للزكاة
              </Label>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Switch
                  id="deserve_zakkah"
                  {...register("deserve_zakkah")}
                />
                <Label htmlFor="deserve_zakkah" className="text-sm text-muted-foreground">
                  الحالة مستحقة للزكاة
                </Label>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 space-x-reverse">
            <Switch
              id="is_published"
              {...register("is_published")}
            />
            <Label htmlFor="is_published">نشر الحالة فوراً</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            الاحتياجات الشهرية
            <Button type="button" onClick={addMonthlyNeed} size="sm">
              <Plus className="w-4 h-4 ml-1" />
              إضافة احتياج
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {monthlyNeeds.map((need, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">احتياج {index + 1}</h4>
                {monthlyNeeds.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeMonthlyNeed(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>الفئة</Label>
                  <Select onValueChange={(value) => updateMonthlyNeed(index, "category", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الفئة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="الطعام والمواد الغذائية">الطعام والمواد الغذائية</SelectItem>
                      <SelectItem value="الإيجار والسكن">الإيجار والسكن</SelectItem>
                      <SelectItem value="المرافق والكهرباء">المرافق والكهرباء</SelectItem>
                      <SelectItem value="العلاج والأدوية">العلاج والأدوية</SelectItem>
                      <SelectItem value="التعليم والدراسة">التعليم والدراسة</SelectItem>
                      <SelectItem value="المواصلات">المواصلات</SelectItem>
                      <SelectItem value="الملابس">الملابس</SelectItem>
                      <SelectItem value="احتياجات الأطفال">احتياجات الأطفال</SelectItem>
                      <SelectItem value="احتياجات كبار السن">احتياجات كبار السن</SelectItem>
                      <SelectItem value="أخرى">أخرى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>المبلغ (جنيه)</Label>
                  <Input
                    type="number"
                    value={need.amount}
                    onChange={(e) => updateMonthlyNeed(index, "amount", Number(e.target.value))}
                    placeholder="1200"
                  />
                </div>

                <div className="space-y-2">
                  <Label>الرمز التعبيري</Label>
                  <Input
                    value={need.icon}
                    onChange={(e) => updateMonthlyNeed(index, "icon", e.target.value)}
                    placeholder="🍽️"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الوصف</Label>
                  <Textarea
                    value={need.description}
                    onChange={(e) => updateMonthlyNeed(index, "description", e.target.value)}
                    placeholder="مواد غذائية أساسية شهرية للعائلة"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>لون التصنيف</Label>
                  <select
                    value={need.color}
                    onChange={(e) => updateMonthlyNeed(index, "color", e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="bg-orange-500">برتقالي</option>
                    <option value="bg-blue-500">أزرق</option>
                    <option value="bg-green-500">أخضر</option>
                    <option value="bg-red-500">أحمر</option>
                    <option value="bg-purple-500">بنفسجي</option>
                    <option value="bg-yellow-500">أصفر</option>
                    <option value="bg-pink-500">وردي</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading} size="lg">
          {loading 
            ? (isEditMode ? "جار التحديث..." : "جار الحفظ...")
            : (isEditMode ? "تحديث الحالة" : "حفظ الحالة")
          }
        </Button>
      </div>
    </form>
  );
};

export default CaseForm;