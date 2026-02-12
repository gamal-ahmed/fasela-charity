import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, User, Calendar, CreditCard, Check, X, Package, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useOrgQueryOptions } from "@/hooks/useOrgQuery";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Donation {
  id: string;
  case_id: string;
  donor_name: string | null;
  donor_email: string | null;
  amount: number;
  months_pledged: number;
  payment_code: string;
  status: string;
  donation_type: string;
  payment_reference: string | null;
  admin_notes: string | null;
  created_at: string;
  confirmed_at: string | null;
  total_handed_over: number;
  handover_status: string;
}

interface HandoverRecord {
  id: string;
  donation_id: string;
  handover_amount: number;
  handover_date: string;
  handover_notes: string | null;
  handed_over_by: string | null;
}

interface CaseWithDonations {
  id: string;
  title: string;
  title_ar: string;
  monthly_cost: number;
  total_secured_money: number;
  months_covered: number;
  status: string;
  donations: Donation[];
}

export const DonationsByCaseView = () => {
  const [openCases, setOpenCases] = useState<Set<string>>(new Set());
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [paymentReference, setPaymentReference] = useState("");
  const [newPaymentReference, setNewPaymentReference] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [handoverAmount, setHandoverAmount] = useState("");
  const [handoverNotes, setHandoverNotes] = useState("");
  const [showHandoverDialog, setShowHandoverDialog] = useState(false);
  const [selectedTargetCaseId, setSelectedTargetCaseId] = useState("");
  const [createReport, setCreateReport] = useState(true); // New state for checkbox
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { orgId, enabled: orgReady } = useOrgQueryOptions();

  const { data: paymentReferences } = useQuery({
    queryKey: ["payment-references", orgId],
    queryFn: async () => {
      // Scope to org's cases
      const casesQuery = supabase.from("cases").select("id");
      if (orgId) casesQuery.eq("organization_id", orgId);
      const { data: casesForOrg } = await casesQuery;
      const caseIds = (casesForOrg || []).map((c: any) => c.id);
      if (caseIds.length === 0) return [];

      const { data, error } = await supabase
        .from("donations")
        .select("payment_reference")
        .not("payment_reference", "is", null)
        .neq("payment_reference", "")
        .in("case_id", caseIds as any);

      if (error) throw error;

      // Get unique payment references
      const uniqueRefs = [...new Set(data.map(d => d.payment_reference))];
      return uniqueRefs.filter(Boolean);
    },
    enabled: orgReady,
  });

  const { data: casesWithDonations, isLoading } = useQuery({
    queryKey: ["donations-by-case", orgId],
    queryFn: async () => {
      // First get cases (org-scoped)
      const casesQuery = supabase.from("cases").select("id, title, title_ar, monthly_cost, total_secured_money, months_covered, status").order("title_ar", { ascending: true });
      if (orgId) casesQuery.eq("organization_id", orgId);

      const { data: cases, error: casesError } = await casesQuery;

      if (casesError) throw casesError;

      // Then get all donations for these cases with handover status
      const { data: donations, error: donationsError } = await supabase
        .from("donations")
        .select("*, total_handed_over, handover_status")
        .in("case_id", cases.map((c: any) => c.id))
        .order("created_at", { ascending: false });

      if (donationsError) throw donationsError;

      // Group donations by case
      const casesWithDonations: CaseWithDonations[] = cases.map(caseItem => ({
        ...caseItem,
        donations: donations.filter(d => d.case_id === caseItem.id)
      }));

      return casesWithDonations;
    },
    enabled: orgReady,
  });

  const { data: handoverRecords } = useQuery({
    queryKey: ["handover-records", selectedDonation?.id],
    queryFn: async () => {
      if (!selectedDonation?.id) return [];
      
      const { data, error } = await supabase
        .from("donation_handovers")
        .select("*")
        .eq("donation_id", selectedDonation.id)
        .order("handover_date", { ascending: false });

      if (error) throw error;
      return data as HandoverRecord[];
    },
    enabled: !!selectedDonation?.id
  });

  const confirmDonationMutation = useMutation({
    mutationFn: async ({ id, paymentRef, notes }: { id: string; paymentRef: string; notes: string }) => {
      const { error } = await supabase
        .from("donations")
        .update({
          status: "confirmed",
          payment_reference: paymentRef,
          admin_notes: notes,
          confirmed_at: new Date().toISOString(),
          confirmed_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donations-by-case"] });
      toast({
        title: "تم تأكيد التبرع",
        description: "تم تأكيد التبرع بنجاح وتحديث إجمالي الحالة."
      });
      setSelectedDonation(null);
      setPaymentReference("");
      setNewPaymentReference("");
      setAdminNotes("");
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ في تأكيد التبرع",
        variant: "destructive"
      });
    }
  });

  const redeemDonationMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase
        .from("donations")
        .update({
          status: "redeemed",
          admin_notes: notes
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donations-by-case"] });
      toast({
        title: "تم تسليم التبرع",
        description: "تم تسليم التبرع للعائلة بنجاح."
      });
      setSelectedDonation(null);
      setAdminNotes("");
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ في تسليم التبرع",
        variant: "destructive"
      });
    }
  });

  const cancelDonationMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase
        .from("donations")
        .update({
          status: "cancelled",
          admin_notes: notes
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donations-by-case"] });
      toast({
        title: "تم إلغاء التبرع",
        description: "تم إلغاء التبرع بنجاح."
      });
      setSelectedDonation(null);
      setAdminNotes("");
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ في إلغاء التبرع",
        variant: "destructive"
      });
    }
  });

  const handoverDonationMutation = useMutation({
    mutationFn: async ({ donationId, caseId, originalCaseId, amount, notes, shouldCreateReport }: { 
      donationId: string; 
      caseId: string; 
      originalCaseId: string;
      amount: number; 
      notes: string;
      shouldCreateReport: boolean;
    }) => {
      try {
        // Insert handover record with original case tracking for audit
        const { error: handoverError } = await supabase
          .from("donation_handovers")
          .insert({
            donation_id: donationId,
            case_id: caseId,
            original_case_id: originalCaseId,
            handover_amount: amount,
            handover_notes: notes,
            handed_over_by: (await supabase.auth.getUser()).data.user?.id
          } as any);

        if (handoverError) throw handoverError;

        // Note: total_handed_over is automatically updated by database trigger
        // when donation_handovers record is inserted

        // Only create report if checkbox is checked
        if (shouldCreateReport) {
          // Get donation details for report
          const { data: donationData, error: donationError } = await supabase
            .from("donations")
            .select("donor_name, amount, payment_code")
            .eq("id", donationId)
            .single();

          if (donationError) throw donationError;

          // Get case details for report
          const { data: caseData, error: caseError } = await supabase
            .from("cases")
            .select("title, title_ar")
            .eq("id", caseId)
            .single();

          if (caseError) throw caseError;

          // Create automatic report
          const reportTitle = `تسليم تبرع بقيمة ${amount.toLocaleString()} ج.م`;
          const reportDescription = `تم تسليم مبلغ ${amount.toLocaleString()} ج.م من التبرع رقم ${donationData.payment_code}${donationData.donor_name ? ` من المتبرع ${donationData.donor_name}` : ''} إلى الحالة ${caseData.title_ar || caseData.title}.${notes ? `\n\nملاحظات التسليم:\n${notes}` : ''}`;

          const { error: reportError } = await supabase
            .from("monthly_reports")
            .insert({
              case_id: caseId,
              title: reportTitle,
              description: reportDescription,
              report_date: new Date().toISOString().split('T')[0],
              status: 'completed',
              category: 'handover'
            } as any);

          if (reportError) throw reportError;
        }
        
        return { success: true };
      } catch (error) {
        console.error("Handover mutation error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donations-by-case"] });
      queryClient.invalidateQueries({ queryKey: ["handover-records"] });
      toast({
        title: "تم تسليم التبرع",
        description: "تم تسليم المبلغ للعائلة بنجاح."
      });
      setShowHandoverDialog(false);
      setHandoverAmount("");
      setHandoverNotes("");
      setSelectedDonation(null);
      setSelectedTargetCaseId("");
      setCreateReport(true); // Reset checkbox to checked by default
    },
    onError: (error: any) => {
      console.error("Handover error:", error);
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ في تسليم التبرع",
        variant: "destructive"
      });
    }
  });

  const handleConfirmDonation = () => {
    if (!selectedDonation) return;
    const finalPaymentRef = paymentReference === 'new' ? newPaymentReference : paymentReference;
    confirmDonationMutation.mutate({
      id: selectedDonation.id,
      paymentRef: finalPaymentRef,
      notes: adminNotes
    });
  };

  const handleRedeemDonation = () => {
    if (!selectedDonation) return;
    redeemDonationMutation.mutate({
      id: selectedDonation.id,
      notes: adminNotes
    });
  };

  const handleHandoverDonation = () => {
    if (!selectedDonation || !handoverAmount) return;
    
    const amount = parseFloat(handoverAmount);
    const targetCaseId = selectedTargetCaseId || selectedDonation.case_id;
    
    // If transferring to same case, check remaining amount
    if (targetCaseId === selectedDonation.case_id) {
      const remainingAmount = selectedDonation.amount - (selectedDonation.total_handed_over || 0);
      
      if (amount <= 0 || amount > remainingAmount) {
        toast({
          title: "خطأ",
          description: `المبلغ يجب أن يكون بين 1 و ${remainingAmount} جنيه`,
          variant: "destructive"
        });
        return;
      }
    } else {
      // If transferring to different case, allow full donation amount
      if (amount <= 0 || amount > selectedDonation.amount) {
        toast({
          title: "خطأ",
          description: `المبلغ يجب أن يكون بين 1 و ${selectedDonation.amount} جنيه`,
          variant: "destructive"
        });
        return;
      }
    }

    handoverDonationMutation.mutate({
      donationId: selectedDonation.id,
      caseId: targetCaseId,
      originalCaseId: selectedDonation.case_id,
      amount: amount,
      notes: handoverNotes,
      shouldCreateReport: createReport
    });
  };

  const handleOpenHandoverDialog = (donation: Donation) => {
    setSelectedDonation(donation);
    setShowHandoverDialog(true);
    setHandoverAmount("");
    setHandoverNotes("");
    setSelectedTargetCaseId("");
  };

  const handleCancelDonation = () => {
    if (!selectedDonation) return;
    cancelDonationMutation.mutate({
      id: selectedDonation.id,
      notes: adminNotes
    });
  };

  const toggleCase = (caseId: string) => {
    const newOpenCases = new Set(openCases);
    if (newOpenCases.has(caseId)) {
      newOpenCases.delete(caseId);
    } else {
      newOpenCases.add(caseId);
    }
    setOpenCases(newOpenCases);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">في الانتظار</Badge>;
      case 'confirmed':
        return <Badge variant="outline" className="bg-green-50 text-green-700">مؤكد</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-700">ملغي</Badge>;
      case 'redeemed':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">تم التسليم</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getHandoverStatusBadge = (donation: Donation) => {
    const status = donation.handover_status || 'none';
    const handedOver = donation.total_handed_over || 0;
    
    switch (status) {
      case 'none':
        return handedOver === 0 ? null : <Badge variant="outline" className="bg-gray-50 text-gray-700">لم يتم التسليم</Badge>;
      case 'partial':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700">تسليم جزئي: {handedOver.toLocaleString()} ج.م</Badge>;
      case 'full':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">تم التسليم بالكامل</Badge>;
      default:
        return null;
    }
  };

  const getDonationStats = (donations: Donation[]) => {
    const stats = {
      total: donations.length,
      pending: donations.filter(d => d.status === 'pending').length,
      confirmed: donations.filter(d => d.status === 'confirmed').length,
      redeemed: donations.filter(d => d.status === 'redeemed').length,
      cancelled: donations.filter(d => d.status === 'cancelled').length,
      totalAmount: donations.reduce((sum, d) => sum + d.amount, 0),
      confirmedAmount: donations.filter(d => d.status === 'confirmed').reduce((sum, d) => sum + d.amount, 0),
      redeemedAmount: donations.filter(d => d.status === 'redeemed').reduce((sum, d) => sum + d.amount, 0),
      totalHandedOver: donations.reduce((sum, d) => sum + (d.total_handed_over || 0), 0),
      totalConfirmed: donations.filter(d => d.status === 'confirmed').length,
      totalHandedOverAmount: donations.reduce((sum, d) => sum + (d.total_handed_over || 0), 0),
    };
    return stats;
  };

  if (isLoading) {
    return <div className="text-center py-8">جار التحميل...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">التبرعات حسب الحالة</h2>
          <div className="mt-2 p-4 bg-primary/10 rounded-lg border-2 border-primary/20">
            <div className="text-lg font-bold text-primary">
              إجمالي التبرعات المسلمة: {casesWithDonations?.reduce((total, caseItem) => 
                total + getDonationStats(caseItem.donations).redeemedAmount, 0)?.toLocaleString() || 0} جنيه
            </div>
            <div className="text-sm text-muted-foreground">
              من {casesWithDonations?.reduce((total, caseItem) => 
                total + getDonationStats(caseItem.donations).redeemed, 0) || 0} تبرع مسلم
            </div>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {casesWithDonations?.length || 0} حالة
        </div>
      </div>

      <div className="space-y-4">
        {casesWithDonations?.map((caseItem) => {
          const stats = getDonationStats(caseItem.donations);
          const isOpen = openCases.has(caseItem.id);
          
          return (
            <Card key={caseItem.id} className="overflow-hidden">
              <Collapsible>
                <CollapsibleTrigger 
                  className="w-full" 
                  onClick={() => toggleCase(caseItem.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 text-right">
                        <CardTitle className="text-base sm:text-lg">
                          {caseItem.title_ar}
                        </CardTitle>
                        <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground">
                          <span>التكلفة الشهرية: {caseItem.monthly_cost?.toLocaleString()} ج.م</span>
                          <span>•</span>
                          <span>المؤمن: {caseItem.total_secured_money?.toLocaleString()} ج.م</span>
                          <span>•</span>
                          <span>الأشهر المغطاة: {caseItem.months_covered || 0}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {stats.total} تبرع
                          </div>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div>مؤكد: {stats.totalConfirmed} ({stats.confirmedAmount.toLocaleString()} ج.م)</div>
                            <div>مسلم: {stats.totalHandedOverAmount.toLocaleString()} ج.م</div>
                          </div>
                        </div>
                        <ChevronDown 
                          className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
                        />
                      </div>
                    </div>
                    
                    {stats.total > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {stats.pending > 0 && (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                            في الانتظار: {stats.pending}
                          </Badge>
                        )}
                        {stats.confirmed > 0 && (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            مؤكد: {stats.confirmed} ({stats.confirmedAmount.toLocaleString()} ج.م)
                          </Badge>
                        )}
                        {stats.totalHandedOverAmount > 0 && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            مسلم: {stats.totalHandedOverAmount.toLocaleString()} ج.م
                          </Badge>
                        )}
                        {stats.redeemed > 0 && (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700">
                            مسلم بالكامل: {stats.redeemed}
                          </Badge>
                        )}
                        {stats.cancelled > 0 && (
                          <Badge variant="outline" className="bg-red-50 text-red-700">
                            ملغي: {stats.cancelled}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0">
                    {caseItem.donations.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        لا توجد تبرعات لهذه الحالة
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                           <TableRow>
                             <TableHead className="text-right">المتبرع</TableHead>
                             <TableHead className="text-right">المبلغ</TableHead>
                             <TableHead className="text-right">النوع</TableHead>
                             <TableHead className="text-right">كود الدفع</TableHead>
                             <TableHead className="text-right">الحالة</TableHead>
                             <TableHead className="text-right">حالة التسليم</TableHead>
                             <TableHead className="text-right">المسلم</TableHead>
                             <TableHead className="text-right">تاريخ التبرع</TableHead>
                             <TableHead className="text-right">تاريخ التأكيد</TableHead>
                             <TableHead className="text-right">التفاصيل والملاحظات</TableHead>
                             <TableHead className="text-right">إجراءات</TableHead>
                           </TableRow>
                          </TableHeader>
                          <TableBody>
                            {caseItem.donations.map((donation) => (
                              <TableRow key={donation.id}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    <div>
                                      <div className="font-medium">
                                        {donation.donor_name || 'متبرع مجهول'}
                                      </div>
                                      {donation.donor_email && (
                                        <div className="text-xs text-muted-foreground">
                                          {donation.donor_email}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="font-medium">
                                    {donation.amount.toLocaleString()} ج.م
                                  </div>
                                  {donation.donation_type === 'monthly' && (
                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {donation.months_pledged} شهر
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {donation.donation_type === 'monthly' ? 'شهري' : 'مخصص'}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <CreditCard className="w-3 h-3" />
                                    <span className="font-mono text-sm">
                                      {donation.payment_code}
                                    </span>
                                  </div>
                                </TableCell>
                                 <TableCell>
                                   <div className="flex flex-col gap-1">
                                     {getStatusBadge(donation.status)}
                                     {donation.status === 'confirmed' && (
                                       <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
                                         ✓ مؤكد
                                       </Badge>
                                     )}
                                   </div>
                                 </TableCell>
                                 <TableCell>
                                   <div className="flex flex-col gap-1">
                                     {getHandoverStatusBadge(donation)}
                                     {donation.total_handed_over && donation.total_handed_over > 0 && (
                                       <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">
                                         ✓ مسلم: {donation.total_handed_over.toLocaleString()} ج.م
                                       </Badge>
                                     )}
                                   </div>
                                 </TableCell>
                                 <TableCell>
                                   <div className="font-medium">
                                     {donation.total_handed_over?.toLocaleString() || 0} ج.م
                                   </div>
                                   {donation.total_handed_over && donation.amount && (
                                     <div className="text-xs text-muted-foreground">
                                       من {donation.amount.toLocaleString()} ج.م
                                     </div>
                                   )}
                                 </TableCell>
                                 <TableCell>
                                   {new Date(donation.created_at).toLocaleDateString('ar-SA')}
                                 </TableCell>
                               <TableCell>
                                 {donation.confirmed_at 
                                   ? new Date(donation.confirmed_at).toLocaleDateString('ar-SA')
                                   : '-'
                                 }
                               </TableCell>
                               <TableCell>
                                 <div className="space-y-1 max-w-xs">
                                   {donation.admin_notes && (
                                     <div className="text-xs">
                                       <span className="font-medium">ملاحظات:</span>
                                       <p className="text-muted-foreground mt-1 whitespace-pre-wrap">
                                         {donation.admin_notes}
                                       </p>
                                     </div>
                                   )}
                                   {donation.payment_reference && (
                                     <div className="text-xs">
                                       <span className="font-medium">مرجع الدفع:</span>
                                       <p className="text-muted-foreground">{donation.payment_reference}</p>
                                     </div>
                                   )}
                                   {!donation.admin_notes && !donation.payment_reference && (
                                     <span className="text-xs text-muted-foreground">-</span>
                                   )}
                                 </div>
                               </TableCell>
                               <TableCell>
                                 <div className="flex gap-1 flex-wrap">
                                   <Button
                                     variant="outline"
                                     size="sm"
                                     onClick={() => {
                                      setSelectedDonation(donation);
                                      setPaymentReference(donation.payment_reference || "");
                                      setAdminNotes(donation.admin_notes || "");
                                    }}
                                  >
                                    <Eye className="w-3 h-3" />
                                  </Button>
                                  {donation.status === 'pending' && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-green-600 hover:text-green-700"
                                      onClick={() => {
                                        setSelectedDonation(donation);
                                        setPaymentReference("");
                                        setAdminNotes("");
                                      }}
                                    >
                                      <Check className="w-3 h-3" />
                                    </Button>
                                  )}
                                   {donation.status === 'confirmed' && (
                                     <>
                                       <Button
                                         variant="outline"
                                         size="sm"
                                         className="text-blue-600 hover:text-blue-700"
                                         onClick={() => {
                                           setSelectedDonation(donation);
                                           setAdminNotes("");
                                         }}
                                       >
                                         <Package className="w-3 h-3" />
                                       </Button>
                                       <Button
                                         variant="outline"
                                         size="sm"
                                          className="text-purple-600 hover:text-purple-700"
                                          onClick={() => handleOpenHandoverDialog(donation)}
                                        >
                                          تسليم {donation.handover_status === 'partial' ? 'إضافي' : 'للعائلة'}
                                        </Button>
                                     </>
                                   )}
                                   {(donation.status === 'pending' || donation.status === 'confirmed') && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-red-600 hover:text-red-700"
                                      onClick={() => {
                                        setSelectedDonation(donation);
                                        setAdminNotes("");
                                      }}
                                    >
                                      <X className="w-3 h-3" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>

      {/* Management Dialog */}
      <Dialog open={!!selectedDonation} onOpenChange={(open) => !open && setSelectedDonation(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إدارة التبرع</DialogTitle>
            <DialogDescription>
              {selectedDonation && (
                <div className="space-y-2 mt-4">
                  <div>المتبرع: {selectedDonation.donor_name || 'متبرع مجهول'}</div>
                  <div>المبلغ: {selectedDonation.amount.toLocaleString()} ج.م</div>
                  <div>كود الدفع: {selectedDonation.payment_code}</div>
                  <div>الحالة الحالية: {getStatusBadge(selectedDonation.status)}</div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedDonation?.status === 'pending' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">رقم العملية/المرجع</label>
                <Select value={paymentReference} onValueChange={setPaymentReference}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر مرجع الدفع أو أدخل جديد" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">إدخال مرجع جديد</SelectItem>
                    {paymentReferences?.map((ref) => (
                      <SelectItem key={ref} value={ref}>
                        {ref}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {paymentReference === 'new' && (
                  <Input
                    value={newPaymentReference}
                    onChange={(e) => setNewPaymentReference(e.target.value)}
                    placeholder="أدخل مرجع الدفع الجديد"
                    autoFocus
                  />
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium">ملاحظات الإدارة</label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="أضف ملاحظات..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            {selectedDonation?.status === 'pending' && (
              <>
                <Button
                  onClick={handleConfirmDonation}
                  disabled={confirmDonationMutation.isPending || 
                    (!paymentReference.trim() || (paymentReference === 'new' && !newPaymentReference.trim()))}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4 ml-1" />
                  تأكيد
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleCancelDonation}
                  disabled={cancelDonationMutation.isPending}
                >
                  <X className="w-4 h-4 ml-1" />
                  إلغاء
                </Button>
              </>
            )}
            
            {selectedDonation?.status === 'confirmed' && (
              <>
                <Button
                  onClick={handleRedeemDonation}
                  disabled={redeemDonationMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Package className="w-4 h-4 ml-1" />
                  تسليم للعائلة
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleCancelDonation}
                  disabled={cancelDonationMutation.isPending}
                >
                  <X className="w-4 h-4 ml-1" />
                  إلغاء
                </Button>
              </>
            )}
            
            <Button variant="outline" onClick={() => setSelectedDonation(null)}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Handover Dialog */}
      <Dialog open={showHandoverDialog} onOpenChange={setShowHandoverDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تسليم جزئي من التبرع</DialogTitle>
            <DialogDescription>
              {selectedDonation && (
                <div className="space-y-2 mt-4">
                  <div>المتبرع: {selectedDonation.donor_name || 'متبرع مجهول'}</div>
                  <div>إجمالي التبرع: {selectedDonation.amount.toLocaleString()} ج.م</div>
                  <div>تم تسليمه مسبقاً: {(selectedDonation.total_handed_over || 0).toLocaleString()} ج.م</div>
                  <div>المبلغ المتبقي: {(selectedDonation.amount - (selectedDonation.total_handed_over || 0)).toLocaleString()} ج.م</div>
                  
                  {handoverRecords && handoverRecords.length > 0 && (
                    <div className="mt-4">
                      <div className="text-sm font-medium mb-2">سجل التسليم السابق:</div>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {handoverRecords.map((record) => (
                          <div key={record.id} className="text-xs bg-gray-50 p-2 rounded">
                            <div>المبلغ: {record.handover_amount.toLocaleString()} ج.م</div>
                            <div>التاريخ: {new Date(record.handover_date).toLocaleDateString('ar-SA')}</div>
                            {record.handover_notes && (
                              <div className="text-muted-foreground">الملاحظات: {record.handover_notes}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">المبلغ المراد تسليمه</label>
              <Input
                type="number"
                value={handoverAmount}
                onChange={(e) => setHandoverAmount(e.target.value)}
                placeholder="أدخل المبلغ"
                max={selectedDonation ? selectedDonation.amount : 0}
                min="1"
              />
              {selectedDonation && handoverAmount && (
                <div className="text-xs text-muted-foreground">
                  {selectedTargetCaseId && selectedTargetCaseId !== selectedDonation.case_id ? (
                    <span className="text-blue-600">سيتم تحويل {parseFloat(handoverAmount || '0').toLocaleString()} ج.م إلى حالة أخرى</span>
                  ) : (
                    <span>سيتبقى من التبرع: {(selectedDonation.amount - (selectedDonation.total_handed_over || 0) - parseFloat(handoverAmount || '0')).toLocaleString()} ج.م</span>
                  )}
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">تسليم إلى حالة أخرى (اختياري)</label>
              <Select value={selectedTargetCaseId} onValueChange={setSelectedTargetCaseId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر حالة أخرى أو اتركها فارغة للتسليم للحالة الأصلية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="original">الحالة الأصلية</SelectItem>
                  {casesWithDonations?.filter(c => c.id !== selectedDonation?.case_id).map((caseItem) => (
                    <SelectItem key={caseItem.id} value={caseItem.id}>
                      {caseItem.title_ar} - {caseItem.title}
                      {caseItem.status === "active" ? " (نشطة)" : " (مكتملة)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTargetCaseId && (
                <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                  سيتم تسليم المبلغ إلى حالة أخرى غير الحالة الأصلية للتبرع
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">ملاحظات التسليم</label>
              <Textarea
                value={handoverNotes}
                onChange={(e) => setHandoverNotes(e.target.value)}
                placeholder="ملاحظات حول عملية التسليم..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="create-report-handover" 
                checked={createReport}
                onCheckedChange={(checked) => setCreateReport(checked as boolean)}
              />
              <label htmlFor="create-report-handover" className="text-sm">
                إنشاء تقرير تلقائي للحالة
              </label>
            </div>
          </div>

          <DialogFooter className="gap-2">
            {selectedDonation && selectedTargetCaseId && selectedTargetCaseId !== selectedDonation.case_id && (
              <Button
                onClick={() => {
                  const remainingAmount = selectedDonation.amount - (selectedDonation.total_handed_over || 0);
                  setHandoverAmount(remainingAmount.toString());
                }}
                variant="secondary"
                size="sm"
                disabled={handoverDonationMutation.isPending}
              >
                تحويل المتبقي كاملاً
              </Button>
            )}
            <Button
              onClick={handleHandoverDonation}
              disabled={handoverDonationMutation.isPending || !handoverAmount || parseFloat(handoverAmount) <= 0}
              className="bg-purple-600 hover:bg-purple-700"
            >
              تسليم المبلغ
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowHandoverDialog(false)}
            >
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};