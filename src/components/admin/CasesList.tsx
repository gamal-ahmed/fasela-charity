import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

const CasesList = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: cases, refetch } = useQuery({
    queryKey: ["admin-cases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cases")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const togglePublished = async (caseId: string, currentStatus: boolean) => {
    setLoading(caseId);
    try {
      const { error } = await supabase
        .from("cases")
        .update({ is_published: !currentStatus })
        .eq("id", caseId);

      if (error) throw error;

      toast({
        title: "تم التحديث",
        description: `تم ${!currentStatus ? "نشر" : "إخفاء"} الحالة بنجاح`,
      });

      refetch();
    } catch (error) {
      console.error("Error updating case:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث الحالة",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const deleteCase = async (caseId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الحالة؟ سيتم حذف جميع البيانات المرتبطة بها.")) {
      return;
    }

    setLoading(caseId);
    try {
      // Delete related data first
      await supabase.from("monthly_needs").delete().eq("case_id", caseId);
      await supabase.from("monthly_reports").delete().eq("case_id", caseId);
      await supabase.from("pledges").delete().eq("case_id", caseId);
      
      // Then delete the case
      const { error } = await supabase
        .from("cases")
        .delete()
        .eq("id", caseId);

      if (error) throw error;

      toast({
        title: "تم الحذف",
        description: "تم حذف الحالة بنجاح",
      });

      refetch();
    } catch (error) {
      console.error("Error deleting case:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف الحالة",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  if (!cases) {
    return <div className="text-center py-8">جار التحميل...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">إدارة الحالات</h2>
        <div className="text-sm text-muted-foreground">
          إجمالي الحالات: {cases.length}
        </div>
      </div>

      <div className="grid gap-4">
        {cases.map((caseItem) => (
          <Card key={caseItem.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {caseItem.title_ar || caseItem.title}
                  </CardTitle>
                  <p className="text-muted-foreground mt-1">
                    {caseItem.short_description_ar || caseItem.short_description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={caseItem.is_published ? "default" : "secondary"}>
                    {caseItem.is_published ? "منشورة" : "مخفية"}
                  </Badge>
                  <Badge variant="outline">
                    {caseItem.status === "active" ? "نشطة" : "مكتملة"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div className="text-sm">
                  <span className="font-medium">التكلفة الشهرية:</span>
                  <br />
                  {caseItem.monthly_cost?.toLocaleString()} جنيه
                </div>
                <div className="text-sm">
                  <span className="font-medium">التقدم:</span>
                  <br />
                  {caseItem.months_covered} من {caseItem.months_needed} شهر
                </div>
                <div className="text-sm">
                  <span className="font-medium">المبلغ المجمع:</span>
                  <br />
                  {caseItem.total_secured_money?.toLocaleString() || 0} جنيه
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button size="sm" asChild>
                  <Link to={`/case/${caseItem.id}`}>
                    <Eye className="w-4 h-4 ml-1" />
                    عرض
                  </Link>
                </Button>
                
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => togglePublished(caseItem.id, caseItem.is_published)}
                  disabled={loading === caseItem.id}
                >
                  {caseItem.is_published ? (
                    <ToggleRight className="w-4 h-4 ml-1" />
                  ) : (
                    <ToggleLeft className="w-4 h-4 ml-1" />
                  )}
                  {caseItem.is_published ? "إخفاء" : "نشر"}
                </Button>

                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => deleteCase(caseItem.id)}
                  disabled={loading === caseItem.id}
                >
                  <Trash2 className="w-4 h-4 ml-1" />
                  حذف
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {cases.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">لا توجد حالات بعد</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CasesList;