import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Calendar, ChevronLeft, ChevronRight, Edit2, Plus } from "lucide-react";
import { format } from "date-fns";

interface HandoverData {
  id?: string;
  amount: number;
  date: string;
  notes?: string;
}

interface CaseHandovers {
  caseId: string;
  caseTitle: string;
  handoversByMonth: Record<string, HandoverData[]>;
}

export default function CaseHandoverCalendar() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    caseId: string;
    caseTitle: string;
    month: number;
    year: number;
    existingHandover?: HandoverData;
  } | null>(null);
  const [editForm, setEditForm] = useState({ amount: "", notes: "" });

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const { data: casesWithHandovers, isLoading } = useQuery({
    queryKey: ["case-handover-calendar", selectedYear],
    queryFn: async () => {
      const { data: cases, error: casesError } = await supabase
        .from("cases")
        .select("id, title")
        .eq("is_published", true)
        .order("title");

      if (casesError) throw casesError;

      const startDate = new Date(selectedYear, 0, 1);
      const endDate = new Date(selectedYear, 11, 31, 23, 59, 59);

      const { data: handovers, error: handoversError } = await supabase
        .from("donation_handovers")
        .select("id, case_id, handover_amount, handover_date, handover_notes")
        .gte("handover_date", startDate.toISOString())
        .lte("handover_date", endDate.toISOString());

      if (handoversError) throw handoversError;

      const result: CaseHandovers[] = cases.map(caseItem => {
        const caseHandovers = handovers.filter(h => h.case_id === caseItem.id);
        const handoversByMonth: Record<string, HandoverData[]> = {};

        caseHandovers.forEach(handover => {
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
          caseId: caseItem.id,
          caseTitle: caseItem.title,
          handoversByMonth,
        };
      });

      return result;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: {
      caseId: string;
      month: number;
      year: number;
      amount: number;
      notes?: string;
      handoverId?: string;
    }) => {
      const handoverDate = new Date(data.year, data.month, 15);

      if (data.handoverId) {
        const { error } = await supabase
          .from("donation_handovers")
          .update({
            handover_amount: data.amount,
            handover_notes: data.notes,
            updated_at: new Date().toISOString(),
          })
          .eq("id", data.handoverId);

        if (error) throw error;
      } else {
        const { data: donations } = await supabase
          .from("donations")
          .select("id")
          .eq("case_id", data.caseId)
          .eq("status", "confirmed")
          .limit(1);

        const donationId = donations?.[0]?.id || null;

        if (!donationId) {
          throw new Error("No confirmed donation found for this case");
        }

        const { error } = await supabase
          .from("donation_handovers")
          .insert({
            case_id: data.caseId,
            donation_id: donationId,
            handover_amount: data.amount,
            handover_date: handoverDate.toISOString(),
            handover_notes: data.notes,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case-handover-calendar"] });
      toast({
        title: "Success",
        description: "Handover saved successfully",
      });
      setEditDialog(null);
      setEditForm({ amount: "", notes: "" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const openEditDialog = (
    caseId: string,
    caseTitle: string,
    month: number,
    existingHandovers?: HandoverData[]
  ) => {
    const existingHandover = existingHandovers?.[0];
    setEditForm({
      amount: existingHandover?.amount.toString() || "",
      notes: existingHandover?.notes || "",
    });
    setEditDialog({
      open: true,
      caseId,
      caseTitle,
      month,
      year: selectedYear,
      existingHandover,
    });
  };

  const handleSave = () => {
    if (!editDialog) return;

    const amount = parseFloat(editForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    saveMutation.mutate({
      caseId: editDialog.caseId,
      month: editDialog.month,
      year: editDialog.year,
      amount,
      notes: editForm.notes,
      handoverId: editDialog.existingHandover?.id,
    });
  };

  const getMonthTotal = (handovers?: HandoverData[]) => {
    if (!handovers || handovers.length === 0) return 0;
    return handovers.reduce((sum, h) => sum + h.amount, 0);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading calendar...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="w-8 h-8" />
            Case Handover Calendar
          </h1>
          <p className="text-muted-foreground mt-1">
            Track monthly handovers for each case
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSelectedYear(selectedYear - 1)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="text-xl font-semibold min-w-[100px] text-center">
            {selectedYear}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSelectedYear(selectedYear + 1)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {casesWithHandovers?.map((caseData) => (
          <Card key={caseData.caseId}>
            <CardHeader>
              <CardTitle>{caseData.caseTitle}</CardTitle>
              <CardDescription>Monthly handover tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                {months.map((monthName, monthIndex) => {
                  const monthKey = `${selectedYear}-${String(monthIndex + 1).padStart(2, '0')}`;
                  const handovers = caseData.handoversByMonth[monthKey];
                  const total = getMonthTotal(handovers);
                  const hasHandover = handovers && handovers.length > 0;

                  return (
                    <div
                      key={monthIndex}
                      className={`relative border rounded-lg p-4 transition-all hover:shadow-md cursor-pointer ${
                        hasHandover
                          ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                          : "border-border hover:border-primary"
                      }`}
                      onClick={() => openEditDialog(caseData.caseId, caseData.caseTitle, monthIndex, handovers)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium">{monthName.slice(0, 3)}</div>
                        {hasHandover ? (
                          <Edit2 className="w-3 h-3 text-green-600" />
                        ) : (
                          <Plus className="w-3 h-3 text-muted-foreground" />
                        )}
                      </div>
                      {hasHandover ? (
                        <div className="space-y-1">
                          <div className="text-lg font-bold text-green-700 dark:text-green-400">
                            {total.toLocaleString()} EGP
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {handovers.length} handover{handovers.length > 1 ? 's' : ''}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">No handover</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={editDialog?.open || false} onOpenChange={(open) => !open && setEditDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editDialog?.existingHandover ? "Edit" : "Add"} Handover
            </DialogTitle>
            <DialogDescription>
              {editDialog?.caseTitle} - {months[editDialog?.month || 0]} {editDialog?.year}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (EGP)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={editForm.amount}
                onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this handover"
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
