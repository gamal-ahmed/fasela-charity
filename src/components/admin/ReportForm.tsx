import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Upload, X, Link } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReportFormData {
  case_id: string;
  title: string;
  description: string;
  report_date: string;
  status: string;
  category: string;
}

const ReportForm = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ReportFormData>();
  const { toast } = useToast();

  const { data: cases } = useQuery({
    queryKey: ["cases-for-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cases")
        .select("id, title_ar, title")
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `case-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('case-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('case-images')
        .getPublicUrl(filePath);

      setUploadedImages(prev => [...prev, publicUrl]);

      toast({
        title: "تم بنجاح",
        description: "تم رفع الصورة بنجاح",
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء رفع الصورة",
        variant: "destructive",
      });
    }
  };

  const handleImageFromUrl = () => {
    if (imageUrlInput.trim()) {
      setUploadedImages(prev => [...prev, imageUrlInput.trim()]);
      setImageUrlInput("");
      toast({
        title: "تم بنجاح",
        description: "تم إضافة الصورة بنجاح",
      });
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ReportFormData) => {
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from("monthly_reports")
        .insert({
          case_id: data.case_id,
          title: data.title,
          description: data.description,
          report_date: data.report_date,
          status: data.status,
          category: data.category,
          images: uploadedImages
        } as any);

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم إضافة التقرير بنجاح",
      });

      reset();
      setUploadedImages([]);
      setImageUrlInput("");
      setOpen(false);
    } catch (error) {
      console.error("Error creating report:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إضافة التقرير",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 ml-1" />
          إضافة تقرير
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>إضافة تقرير شهري جديد</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>الحالة <span className="text-destructive me-1">*</span></Label>
            <Select onValueChange={(value) => setValue("case_id", value)}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الحالة" />
              </SelectTrigger>
              <SelectContent>
                {cases?.map((caseItem) => (
                  <SelectItem key={caseItem.id} value={caseItem.id}>
                    {caseItem.title_ar || caseItem.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">عنوان التقرير <span className="text-destructive me-1">*</span></Label>
            <Input
              id="title"
              {...register("title", { required: "عنوان التقرير مطلوب" })}
              placeholder="زيارة ميدانية وتوزيع المساعدات"
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">وصف التقرير</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="تفاصيل الزيارة والأنشطة المنجزة"
              rows={4}
            />
          </div>

          {/* صور التقرير */}
          <div className="space-y-4">
            <Label>صور التقرير</Label>
            
            <div className="space-y-3">
              {/* أزرار الرفع */}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('report-image-upload')?.click()}
                >
                  <Upload className="w-4 h-4 ml-1" />
                  رفع صورة
                </Button>
                <input
                  id="report-image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              
              {/* إدخال رابط الصورة */}
              <div className="flex gap-2">
                <Input
                  placeholder="أو الصق رابط الصورة هنا"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleImageFromUrl}
                  disabled={!imageUrlInput.trim()}
                >
                  <Link className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* معاينة الصور المرفوعة */}
            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {uploadedImages.map((imageUrl, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={imageUrl}
                      alt={`صورة التقرير ${index + 1}`}
                      className="w-full h-20 object-cover rounded-md border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="report_date">تاريخ التقرير <span className="text-destructive me-1">*</span></Label>
            <Input
              id="report_date"
              type="date"
              {...register("report_date", { required: "تاريخ التقرير مطلوب" })}
            />
            {errors.report_date && (
              <p className="text-sm text-destructive">{errors.report_date.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>الحالة</Label>
              <Select onValueChange={(value) => setValue("status", value)} defaultValue="completed">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">مكتمل</SelectItem>
                  <SelectItem value="pending">قيد التنفيذ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>التصنيف</Label>
              <Select onValueChange={(value) => setValue("category", value)} defaultValue="general">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="food">طعام</SelectItem>
                  <SelectItem value="housing">سكن</SelectItem>
                  <SelectItem value="general">عام</SelectItem>
                  <SelectItem value="education">تعليم</SelectItem>
                  <SelectItem value="health">صحة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "جار الحفظ..." : "حفظ التقرير"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReportForm;