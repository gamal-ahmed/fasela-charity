import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Edit2, Plus, Search, ImageIcon, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import { useOrganization } from "@/contexts/OrganizationContext";

interface HandoverData {
  id?: string;
  amount: number;
  date: string;
  notes?: string;
  is_report_checkpoint?: boolean;
  report_image_url?: string;
  donation_id?: string;
}

interface CaseHandovers {
  caseId: string;
  caseTitle: string;
  caseTitleAr: string;
  monthlyCost: number;
  handoversByMonth: Record<string, HandoverData[]>;
}

interface Donation {
  id: string;
  donor_name: string;
  amount: number;
  total_handed_over: number;
  remaining: number;
}

export default function CaseHandoverCalendar() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentOrg } = useOrganization();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState("");
  const [sortByRecent, setSortByRecent] = useState(true);
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    caseId: string;
    caseTitle: string;
    caseTitleAr: string;
    monthlyCost: number;
    month: number;
    year: number;
    existingHandover?: HandoverData;
  } | null>(null);
  const [editForm, setEditForm] = useState({
    amount: "",
    notes: "",
    selectedDonationId: "",
    isReportCheckpoint: false
  });
  const [availableDonations, setAvailableDonations] = useState<Donation[]>([]);
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const months = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
  ];

  const { data: casesWithHandovers, isLoading } = useQuery({
    queryKey: ["case-handover-calendar", selectedYear, currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return [];

      const { data: cases, error: casesError } = await supabase
        .from("cases")
        .select("id, title, title_ar, monthly_cost")
        .eq("organization_id", currentOrg.id)
        .eq("is_published", true)
        .order("title_ar");

      if (casesError) throw casesError;

      const startDate = new Date(selectedYear, 0, 1);
      const endDate = new Date(selectedYear, 11, 31, 23, 59, 59);

      const { data: handovers, error: handoversError } = await supabase
        .from("donation_handovers")
        .select("id, case_id, handover_amount, handover_date, handover_notes, donation_id")
        .eq("organization_id", currentOrg.id)
        .gte("handover_date", startDate.toISOString())
        .lte("handover_date", endDate.toISOString());

      if (handoversError) throw handoversError;

      const { data: reports, error: reportsError } = await supabase
        .from("monthly_reports")
        .select("id, case_id, report_date, images")
        .gte("report_date", startDate.toISOString())
        .lte("report_date", endDate.toISOString());

      if (reportsError) throw reportsError;

      const result: CaseHandovers[] = cases.map(caseItem => {
        const caseHandovers = handovers.filter(h => h.case_id === caseItem.id);
        const caseReports = reports?.filter(r => r.case_id === caseItem.id) || [];
        const handoversByMonth: Record<string, HandoverData[]> = {};

        caseHandovers.forEach(handover => {
          const date = new Date(handover.handover_date);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

          const monthReport = caseReports.find(r => {
            const rDate = new Date(r.report_date);
            return `${rDate.getFullYear()}-${String(rDate.getMonth() + 1).padStart(2, '0')}` === monthKey;
          });

          let reportImageUrl = undefined;
          if (monthReport && monthReport.images && Array.isArray(monthReport.images) && monthReport.images.length > 0) {
            reportImageUrl = monthReport.images[0] as string;
          }

          if (!handoversByMonth[monthKey]) {
            handoversByMonth[monthKey] = [];
          }

          handoversByMonth[monthKey].push({
            id: handover.id,
            amount: handover.handover_amount,
            date: handover.handover_date,
            notes: handover.handover_notes || undefined,
            report_image_url: reportImageUrl,
            donation_id: handover.donation_id,
          });
        });

        return {
          caseId: caseItem.id,
          caseTitle: caseItem.title,
          caseTitleAr: caseItem.title_ar || caseItem.title,
          monthlyCost: caseItem.monthly_cost || 0,
          handoversByMonth,
        };
      });

      return result;
    },
    enabled: !!currentOrg?.id,
  });

  const fetchAvailableDonations = async (caseId: string) => {
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
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReportFile(e.target.files[0]);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (data: {
      caseId: string;
      donationId: string;
      month: number;
      year: number;
      amount: number;
      notes?: string;
      handoverId?: string;
      isReportCheckpoint: boolean;
      reportFile?: File | null;
    }) => {
      if (!currentOrg?.id) throw new Error("No organization selected");

      const handoverDate = new Date(data.year, data.month, 15);
      const preciseAmount = Number(Number(data.amount).toFixed(2));
      let reportImageUrl = null;

      if (data.isReportCheckpoint && data.reportFile) {
        setIsUploading(true);
        const fileExt = data.reportFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `reports/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('case-images')
          .upload(filePath, data.reportFile);

        if (uploadError) {
          setIsUploading(false);
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('case-images')
          .getPublicUrl(filePath);

        reportImageUrl = publicUrl;
        setIsUploading(false);
      }

      if (data.isReportCheckpoint && reportImageUrl) {
        const startDate = new Date(data.year, data.month, 1).toISOString();
        const endDate = new Date(data.year, data.month + 1, 0).toISOString();

        const { data: existingReports } = await supabase
          .from("monthly_reports")
          .select("*")
          .eq("case_id", data.caseId)
          .gte("report_date", startDate)
          .lte("report_date", endDate);

        const existingReport = existingReports?.[0];

        if (existingReport) {
          const currentImages = Array.isArray(existingReport.images) ? existingReport.images : [];
          const newImages = [...currentImages, reportImageUrl];

          await supabase
            .from("monthly_reports")
            .update({ images: newImages })
            .eq("id", existingReport.id);
        } else {
          await supabase
            .from("monthly_reports")
            .insert({
              case_id: data.caseId,
              title: `تقرير تسليم - ${months[data.month]} ${data.year}`,
              description: data.notes || "تم التسليم بنجاح",
              report_date: handoverDate.toISOString(),
              status: 'completed',
              category: 'general',
              images: [reportImageUrl]
            } as any);
        }
      }

      if (data.handoverId) {
        const { error } = await supabase
          .from("donation_handovers")
          .update({
            handover_amount: preciseAmount,
            handover_notes: data.notes,
            donation_id: data.donationId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", data.handoverId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("donation_handovers")
          .insert({
            case_id: data.caseId,
            donation_id: data.donationId,
            organization_id: currentOrg.id,
            handover_amount: preciseAmount,
            handover_date: handoverDate.toISOString(),
            handover_notes: data.notes,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case-handover-calendar"] });
      toast({
        title: "نجح",
        description: "تم حفظ التسليم بنجاح",
      });
      setEditDialog(null);
      setEditForm({ amount: "", notes: "", selectedDonationId: "", isReportCheckpoint: false });
      setReportFile(null);
      setAvailableDonations([]);
    },
    onError: (error: Error) => {
      setIsUploading(false);
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const openEditDialog = async (
    caseId: string,
    caseTitle: string,
    caseTitleAr: string,
    monthlyCost: number,
    month: number,
    existingHandovers?: HandoverData[]
  ) => {
    const existingHandover = existingHandovers?.[0];

    const donations = await fetchAvailableDonations(caseId);
    setAvailableDonations(donations);

    setEditForm({
      amount: existingHandover?.amount.toString() || monthlyCost.toString(),
      notes: existingHandover?.notes || "",
      selectedDonationId: existingHandover?.donation_id || "",
      isReportCheckpoint: existingHandover?.is_report_checkpoint || false,
    });

    setEditDialog({
      open: true,
      caseId,
      caseTitle,
      caseTitleAr,
      monthlyCost,
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
        title: "مبلغ غير صالح",
        description: "الرجاء إدخال مبلغ صحيح",
        variant: "destructive",
      });
      return;
    }

    if (!editForm.selectedDonationId) {
      toast({
        title: "تبرع غير محدد",
        description: "الرجاء اختيار التبرع الذي سيتم الخصم منه",
        variant: "destructive",
      });
      return;
    }

    const selectedDonation = availableDonations.find(d => d.id === editForm.selectedDonationId);
    if (selectedDonation && amount > selectedDonation.remaining) {
      toast({
        title: "مبلغ غير صالح",
        description: `المبلغ المتبقي في التبرع: ${selectedDonation.remaining.toFixed(2)} جنيه`,
        variant: "destructive",
      });
      return;
    }

    if (editForm.isReportCheckpoint && !reportFile && !editDialog.existingHandover?.report_image_url) {
      toast({
        title: "صورة التقرير مطلوبة",
        description: "لقد قمت بتحديد نقطة مراجعة التقرير، يرجى رفع صورة التقرير",
        variant: "destructive",
      });
      return;
    }

    saveMutation.mutate({
      caseId: editDialog.caseId,
      donationId: editForm.selectedDonationId,
      month: editDialog.month,
      year: editDialog.year,
      amount,
      notes: editForm.notes,
      handoverId: editDialog.existingHandover?.id,
      isReportCheckpoint: editForm.isReportCheckpoint,
      reportFile: reportFile,
    });
  };

  const getMonthTotal = (handoversByMonth: Record<string, HandoverData[]>, monthIndex: number) => {
    const monthKey = `${selectedYear}-${String(monthIndex + 1).padStart(2, '0')}`;
    const monthHandovers = handoversByMonth[monthKey] || [];
    return monthHandovers.reduce((sum, h) => sum + h.amount, 0);
  };

  // Get the most recent month with handover for sorting
  const getMostRecentHandoverMonth = (handoversByMonth: Record<string, HandoverData[]>) => {
    const monthKeys = Object.keys(handoversByMonth).filter(key => key.startsWith(`${selectedYear}-`));
    if (monthKeys.length === 0) return -1;
    const sortedKeys = monthKeys.sort((a, b) => b.localeCompare(a)); // descending
    const mostRecent = sortedKeys[0];
    return parseInt(mostRecent.split('-')[1], 10);
  };

  const filteredAndSortedCases = useMemo(() => {
    let cases = (casesWithHandovers || []).filter(c =>
      c.caseTitleAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.caseTitle.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (sortByRecent) {
      cases = [...cases].sort((a, b) => {
        const aRecent = getMostRecentHandoverMonth(a.handoversByMonth);
        const bRecent = getMostRecentHandoverMonth(b.handoversByMonth);
        // Cases with recent handovers first, then by month (descending)
        if (aRecent === -1 && bRecent === -1) return 0;
        if (aRecent === -1) return 1;
        if (bRecent === -1) return -1;
        return bRecent - aRecent;
      });
    }

    return cases;
  }, [casesWithHandovers, searchQuery, sortByRecent, selectedYear]);

  if (!currentOrg) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">يرجى اختيار منظمة</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">تقويم التسليم الشهري</h2>
          <p className="text-muted-foreground">
            تتبع التسليمات الشهرية لجميع الحالات
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث عن حالة..."
              className="pr-9 w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant={sortByRecent ? "default" : "outline"}
            size="sm"
            onClick={() => setSortByRecent(!sortByRecent)}
            className="gap-2"
          >
            <ArrowUpDown className="h-4 w-4" />
            {sortByRecent ? "الأحدث أولاً" : "ترتيب أبجدي"}
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSelectedYear(selectedYear - 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="text-lg font-semibold min-w-[60px] text-center">
              {selectedYear}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSelectedYear(selectedYear + 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Cases List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <span className="text-muted-foreground">جار التحميل...</span>
        </div>
      ) : filteredAndSortedCases.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <span className="text-muted-foreground">لا توجد حالات</span>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredAndSortedCases.map((caseItem) => (
            <Card key={caseItem.caseId}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span>{caseItem.caseTitleAr}</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    التكلفة الشهرية: {caseItem.monthlyCost.toLocaleString()} ج.م
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12 gap-2">
                  {months.map((monthName, monthIndex) => {
                    const monthKey = `${selectedYear}-${String(monthIndex + 1).padStart(2, '0')}`;
                    const monthHandovers = caseItem.handoversByMonth[monthKey] || [];
                    const monthTotal = getMonthTotal(caseItem.handoversByMonth, monthIndex);
                    const hasHandover = monthHandovers.length > 0;
                    const hasReport = monthHandovers.some(h => h.report_image_url);

                    return (
                      <button
                        key={monthIndex}
                        onClick={() => openEditDialog(
                          caseItem.caseId,
                          caseItem.caseTitle,
                          caseItem.caseTitleAr,
                          caseItem.monthlyCost,
                          monthIndex,
                          monthHandovers
                        )}
                        className={`
                          relative p-3 rounded-lg border text-center transition-all
                          hover:border-primary hover:shadow-sm
                          ${hasHandover
                            ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                            : 'bg-muted/30 border-border'
                          }
                        `}
                      >
                        <div className="text-xs font-medium text-muted-foreground mb-1">
                          {monthName}
                        </div>
                        {hasHandover ? (
                          <>
                            <div className="text-sm font-bold text-green-700 dark:text-green-300">
                              {monthTotal.toLocaleString()}
                            </div>
                            {hasReport && (
                              <ImageIcon className="absolute top-1 left-1 h-3 w-3 text-blue-500" />
                            )}
                          </>
                        ) : (
                          <Plus className="h-4 w-4 mx-auto text-muted-foreground" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialog?.open || false} onOpenChange={(open) => {
        if (!open) {
          setEditDialog(null);
          setAvailableDonations([]);
          setEditForm({ amount: "", notes: "", selectedDonationId: "", isReportCheckpoint: false });
          setReportFile(null);
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {editDialog?.existingHandover ? "تعديل" : "إضافة"} تسليم شهري
            </DialogTitle>
            <DialogDescription className="space-y-1">
              <div className="font-semibold">{editDialog?.caseTitleAr}</div>
              <div className="text-sm">{months[editDialog?.month || 0]} {editDialog?.year}</div>
              <div className="text-sm">التكلفة الشهرية: {editDialog?.monthlyCost.toLocaleString()} جنيه</div>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="donation">اختر التبرع *</Label>
              <Select
                value={editForm.selectedDonationId}
                onValueChange={(value) => setEditForm({ ...editForm, selectedDonationId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر التبرع الذي سيتم الخصم منه" />
                </SelectTrigger>
                <SelectContent>
                  {availableDonations.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      لا توجد تبرعات متاحة لهذه الحالة
                    </div>
                  ) : (
                    availableDonations.map((donation) => (
                      <SelectItem key={donation.id} value={donation.id}>
                        {donation.donor_name} - متبقي: {donation.remaining.toLocaleString()} ج.م
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">المبلغ *</Label>
              <Input
                id="amount"
                type="number"
                placeholder="أدخل مبلغ التسليم"
                value={editForm.amount}
                onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات (اختياري)</Label>
              <Textarea
                id="notes"
                placeholder="أضف أي ملاحظات عن هذا التسليم"
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2 space-x-reverse">
              <input
                type="checkbox"
                id="reportCheckpoint"
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                checked={editForm.isReportCheckpoint}
                onChange={(e) => setEditForm({ ...editForm, isReportCheckpoint: e.target.checked })}
              />
              <Label htmlFor="reportCheckpoint" className="cursor-pointer">
                تحديد كنقطة تقرير (يتطلب رفع صورة)
              </Label>
            </div>

            {editForm.isReportCheckpoint && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <Label htmlFor="reportImage">صورة التقرير *</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="reportImage"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                </div>
                {editDialog?.existingHandover?.report_image_url && (
                  <div className="text-sm text-green-600">
                    يوجد صورة تقرير محفوظة بالفعل. قم بالرفع لاستبدالها.
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditDialog(null);
              setAvailableDonations([]);
            }}>
              إلغاء
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending || isUploading}>
              {isUploading ? "جاري الرفع..." : saveMutation.isPending ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
