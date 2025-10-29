import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Calendar, ChevronLeft, ChevronRight, Edit2, Plus } from "lucide-react";
import { format } from "date-fns";

interface HandoverData {
  id?: string;
  amount: number;
  date: string;
  notes?: string;
}

interface Donation {
  id: string;
  donor_name: string;
  amount: number;
  total_handed_over: number;
  remaining: number;
}

interface CaseSpecificCalendarProps {
  caseId: string;
  caseTitle: string;
  caseTitleAr: string;
  monthlyCost: number;
}

export default function CaseSpecificCalendar({ 
  caseId, 
  caseTitle, 
  caseTitleAr, 
  monthlyCost 
}: CaseSpecificCalendarProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    month: number;
    year: number;
    existingHandover?: HandoverData;
  } | null>(null);
  const [editForm, setEditForm] = useState({ 
    amount: "", 
    notes: "", 
    selectedDonationId: "" 
  });
  const [availableDonations, setAvailableDonations] = useState<Donation[]>([]);

  const months = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
  ];

  const { data: caseHandovers, isLoading } = useQuery({
    queryKey: ["case-specific-calendar", caseId, selectedYear],
    queryFn: async () => {
      const startDate = new Date(selectedYear, 0, 1);
      const endDate = new Date(selectedYear, 11, 31, 23, 59, 59);

      const { data: handovers, error: handoversError } = await supabase
        .from("donation_handovers")
        .select("id, case_id, handover_amount, handover_date, handover_notes")
        .eq("case_id", caseId)
        .gte("handover_date", startDate.toISOString())
        .lte("handover_date", endDate.toISOString());

      if (handoversError) throw handoversError;

      const handoversByMonth: Record<string, HandoverData[]> = {};

      handovers.forEach(handover => {
        const date = new Date(handover.handover_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!handoversByMonth[monthKey]) {
          handoversByMonth[monthKey] = [];
        }

        handoversByMonth[monthKey].push({
          id: handover.id,
          amount: handover.handover_amount,
          date: handover.handover_date,
          notes: handover.handover_notes || undefined,
        });
      });

      return {
        caseId,
        caseTitle,
        caseTitleAr,
        monthlyCost,
        handoversByMonth,
      };
    },
  });

  // Fetch available donations when dialog opens
  const fetchAvailableDonations = async () => {
    const { data, error } = await supabase
      .from("donations")
      .select("id, donor_name, amount, total_handed_over")
      .eq("case_id", caseId)
      .eq("status", "confirmed")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحميل التبرعات المتاحة",
        variant: "destructive",
      });
      return [];
    }

    return (data || []).map(d => ({
      id: d.id,
      donor_name: d.donor_name || "متبرع مجهول",
      amount: Number(d.amount),
      total_handed_over: Number(d.total_handed_over || 0),
      remaining: Number(d.amount) - Number(d.total_handed_over || 0),
    })).filter(d => d.remaining > 0);
  };

  const saveMutation = useMutation({
    mutationFn: async (data: {
      donationId: string;
      month: number;
      year: number;
      amount: number;
      notes?: string;
      handoverId?: string;
    }) => {
      const handoverDate = new Date(data.year, data.month, 15);
      const preciseAmount = Number(Number(data.amount).toFixed(2));

      if (data.handoverId) {
        const { error } = await supabase
          .from("donation_handovers")
          .update({
            handover_amount: preciseAmount,
            handover_notes: data.notes || null,
          })
          .eq("id", data.handoverId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("donation_handovers")
          .insert({
            case_id: caseId,
            donation_id: data.donationId,
            handover_amount: preciseAmount,
            handover_date: handoverDate.toISOString(),
            handover_notes: data.notes || null,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case-specific-calendar", caseId] });
      queryClient.invalidateQueries({ queryKey: ["donation-audit"] });
      setEditDialog(null);
      setEditForm({ amount: "", notes: "", selectedDonationId: "" });
      toast({
        title: "تم الحفظ",
        description: "تم حفظ التسليم بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء الحفظ",
        variant: "destructive",
      });
    },
  });

  const handleEdit = async (month: number, year: number, existingHandover?: HandoverData) => {
    const donations = await fetchAvailableDonations();
    setAvailableDonations(donations);
    
    setEditDialog({
      open: true,
      month,
      year,
      existingHandover,
    });
    
    if (existingHandover) {
      setEditForm({
        amount: existingHandover.amount.toString(),
        notes: existingHandover.notes || "",
        selectedDonationId: "",
      });
    } else {
      setEditForm({
        amount: "",
        notes: "",
        selectedDonationId: donations[0]?.id || "",
      });
    }
  };

  const handleSave = () => {
    if (!editForm.amount || !editForm.selectedDonationId) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    saveMutation.mutate({
      donationId: editForm.selectedDonationId,
      month: editDialog!.month,
      year: editDialog!.year,
      amount: Number(editForm.amount),
      notes: editForm.notes,
      handoverId: editDialog!.existingHandover?.id,
    });
  };

  if (isLoading) {
    return <div className="text-center py-8">جار التحميل...</div>;
  }

  const totalHandedOver = Object.values(caseHandovers?.handoversByMonth || {})
    .flat()
    .reduce((sum, h) => sum + h.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{caseTitleAr}</h3>
          <p className="text-sm text-muted-foreground">
            إجمالي المسلم: {totalHandedOver.toLocaleString()} ج.م
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedYear(selectedYear - 1)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-lg font-semibold min-w-[100px] text-center">
            {selectedYear}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedYear(selectedYear + 1)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {months.map((monthName, monthIndex) => {
          const monthKey = `${selectedYear}-${String(monthIndex + 1).padStart(2, '0')}`;
          const monthHandovers = caseHandovers?.handoversByMonth[monthKey] || [];
          const monthTotal = monthHandovers.reduce((sum, h) => sum + h.amount, 0);

          return (
            <Card key={monthIndex} className="relative">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{monthName}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(monthIndex, selectedYear)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-primary">
                    {monthTotal.toLocaleString()} ج.م
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {monthHandovers.length} تسليم
                  </div>
                  
                  {monthHandovers.length > 0 && (
                    <div className="space-y-1">
                      {monthHandovers.map((handover, index) => (
                        <div key={index} className="flex items-center justify-between text-xs">
                          <span>{format(new Date(handover.date), 'dd/MM')}</span>
                          <span className="font-medium">{handover.amount.toLocaleString()} ج.م</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(monthIndex, selectedYear, handover)}
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialog?.open || false} onOpenChange={() => setEditDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editDialog?.existingHandover ? "تعديل التسليم" : "إضافة تسليم جديد"}
            </DialogTitle>
            <DialogDescription>
              {editDialog && `${months[editDialog.month]} ${editDialog.year}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="donation">التبرع</Label>
              <Select
                value={editForm.selectedDonationId}
                onValueChange={(value) => setEditForm(prev => ({ ...prev, selectedDonationId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر التبرع" />
                </SelectTrigger>
                <SelectContent>
                  {availableDonations.map((donation) => (
                    <SelectItem key={donation.id} value={donation.id}>
                      {donation.donor_name} - {donation.remaining.toLocaleString()} ج.م متبقي
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="amount">المبلغ</Label>
              <Input
                id="amount"
                type="number"
                value={editForm.amount}
                onChange={(e) => setEditForm(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="أدخل المبلغ"
              />
            </div>

            <div>
              <Label htmlFor="notes">ملاحظات (اختياري)</Label>
              <Textarea
                id="notes"
                value={editForm.notes}
                onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="أدخل ملاحظات التسليم"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(null)}>
              إلغاء
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
