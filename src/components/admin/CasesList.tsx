import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Eye, Edit, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import CaseForm from "./CaseForm";

const CasesList = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const [editingCase, setEditingCase] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: cases, refetch } = useQuery({
    queryKey: ["admin-cases"],
    queryFn: async () => {
      const { data: casesData, error: casesError } = await supabase
        .from("cases")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (casesError) throw casesError;
      
      // Get confirmed donations for each case
      const { data: confirmedDonations, error: confirmedError } = await supabase
        .from("donations")
        .select("case_id, amount")
        .eq("status", "confirmed");
      
      if (confirmedError) throw confirmedError;
      
      // Get legacy redeemed donations for each case
      const { data: redeemedDonations, error: redeemedError } = await supabase
        .from("donations")
        .select("case_id, amount")
        .eq("status", "redeemed");
      
      if (redeemedError) throw redeemedError;
      
      // Get new handover amounts from donation_handovers table
      const { data: handovers, error: handoversError } = await supabase
        .from("donation_handovers")
        .select("case_id, handover_amount");
      
      if (handoversError) throw handoversError;
      
      // Calculate totals for each case
      const casesWithFinancials = casesData.map(caseItem => {
        const confirmedAmount = confirmedDonations
          .filter(donation => donation.case_id === caseItem.id)
          .reduce((sum, donation) => sum + donation.amount, 0);
          
        const redeemedAmount = redeemedDonations
          .filter(donation => donation.case_id === caseItem.id)
          .reduce((sum, donation) => sum + donation.amount, 0);
          
        const handoverAmount = handovers
          .filter(handover => handover.case_id === caseItem.id)
          .reduce((sum, handover) => sum + handover.handover_amount, 0);
        
        const totalHandedOver = redeemedAmount + handoverAmount;
        const remainingAmount = confirmedAmount - totalHandedOver;
        
        return {
          ...caseItem,
          confirmed_amount: confirmedAmount,
          handed_over_amount: totalHandedOver,
          remaining_amount: remainingAmount
        };
      });
      
      return casesWithFinancials;
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
              <div className="grid md:grid-cols-5 gap-4 mb-4">
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
                  <span className="font-medium">التبرعات المؤكدة:</span>
                  <br />
                  <span className="text-green-600 font-semibold">
                    {caseItem.confirmed_amount?.toLocaleString() || 0} جنيه
                  </span>
                </div>
                <div className="text-sm">
                  <span className="font-medium">المسلم للعائلة:</span>
                  <br />
                  <span className="text-blue-600 font-semibold">
                    {caseItem.handed_over_amount?.toLocaleString() || 0} جنيه
                  </span>
                </div>
                <div className="text-sm">
                  <span className="font-medium">المتبقي للتسليم:</span>
                  <br />
                  <span className={`font-semibold ${
                    (caseItem.remaining_amount || 0) > 0 ? 'text-orange-600' : 'text-gray-500'
                  }`}>
                    {caseItem.remaining_amount?.toLocaleString() || 0} جنيه
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button size="sm" asChild>
                  <Link to={`/case/${caseItem.id}`}>
                    <Eye className="w-4 h-4 ml-1" />
                    عرض
                  </Link>
                </Button>

                <Dialog open={editingCase === caseItem.id} onOpenChange={(open) => setEditingCase(open ? caseItem.id : null)}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Edit className="w-4 h-4 ml-1" />
                      تعديل
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>تعديل الحالة</DialogTitle>
                    </DialogHeader>
                    <CaseForm 
                      caseId={caseItem.id} 
                      onSuccess={() => {
                        setEditingCase(null);
                        refetch();
                      }} 
                    />
                  </DialogContent>
                </Dialog>
                
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